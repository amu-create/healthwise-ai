import React, { useEffect, useState } from 'react';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported, Messaging } from 'firebase/messaging';
import { 
  Button, 
  Snackbar, 
  Alert, 
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Box
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import { useTranslation } from 'react-i18next';
import api from '../services/api';

// Firebase 설정 (환경 변수에서 가져오기)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Firebase 앱 초기화
const app = initializeApp(firebaseConfig);

interface NotificationData {
  title: string;
  body: string;
  data?: {
    deep_link?: string;
    [key: string]: any;
  };
}

const FirebaseNotification: React.FC = () => {
  const { t } = useTranslation();
  const [permission, setPermission] = useState(Notification.permission);
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [notification, setNotification] = useState<NotificationData | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isMessagingSupported, setIsMessagingSupported] = useState(false);
  const [messaging, setMessaging] = useState<Messaging | null>(null);

  useEffect(() => {
    // Firebase Messaging 지원 확인
    const checkMessagingSupport = async () => {
      try {
        const supported = await isSupported();
        setIsMessagingSupported(supported);
        
        if (supported) {
          const messagingInstance = getMessaging(app);
          setMessaging(messagingInstance);
          
          // Service Worker 등록
          if ('serviceWorker' in navigator) {
            // HTTPS 또는 localhost에서만 Service Worker 등록
            const isSecureContext = window.location.protocol === 'https:' || 
                                   window.location.hostname === 'localhost' || 
                                   window.location.hostname === '127.0.0.1';
            
            if (isSecureContext) {
              try {
                const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
                console.log('Service Worker registered:', registration);
                
                // 알림 권한이 이미 허용된 경우 토큰 요청
                if (permission === 'granted') {
                  requestNotificationPermission();
                }
              } catch (error) {
                console.error('Service Worker registration failed:', error);
                console.log('Running on:', window.location.hostname);
              }
            } else {
              console.warn('Service Worker requires HTTPS or localhost. Current protocol:', window.location.protocol);
              console.log('To use notifications over network, please use HTTPS or a tunneling service like ngrok.');
            }
          }
        } else {
          console.warn('Firebase Messaging is not supported in this browser/environment');
        }
      } catch (error) {
        console.error('Error checking messaging support:', error);
        setIsMessagingSupported(false);
      }
    };

    checkMessagingSupport();
  }, [permission]);

  useEffect(() => {
    if (!messaging || !isMessagingSupported) return;

    // 포그라운드 메시지 리스너
    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received. ', payload);
      setNotification({
        title: payload.notification?.title || '',
        body: payload.notification?.body || '',
        data: payload.data
      });
      setSnackbarOpen(true);
    });

    return () => unsubscribe();
  }, [messaging, isMessagingSupported]);

  const requestNotificationPermission = async () => {
    if (!isMessagingSupported || !messaging) {
      setNotification({
        title: t('notifications.notSupported.title'),
        body: t('notifications.notSupported.body'),
      });
      setSnackbarOpen(true);
      return;
    }

    setLoading(true);
    try {
      // 알림 권한 요청
      const permission = await Notification.requestPermission();
      setPermission(permission);

      if (permission === 'granted') {
        // Service Worker가 준비될 때까지 대기
        const registration = await navigator.serviceWorker.ready;
        
        // FCM 토큰 가져오기
        const token = await getToken(messaging, {
          vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY,
          serviceWorkerRegistration: registration
        });
        
        if (token) {
          console.log('FCM Token:', token);
          setFcmToken(token);
          
          // 서버에 토큰 등록
          await api.post('/notifications/register-token/', {
            fcm_token: token
          });
          
          setNotification({
            title: t('notifications.setupComplete.title'),
            body: t('notifications.setupComplete.body'),
          });
          setSnackbarOpen(true);
        }
      } else {
        setNotification({
          title: t('notifications.permissionDenied.title'),
          body: t('notifications.permissionDenied.body'),
        });
        setSnackbarOpen(true);
      }
    } catch (error) {
      console.error('Error getting notification permission:', error);
      setNotification({
        title: t('notifications.error.title'),
        body: t('notifications.error.body'),
      });
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
      setShowPermissionDialog(false);
    }
  };

  const sendTestNotification = async () => {
    try {
      await api.post('/notifications/test/');
      setNotification({
        title: t('notifications.test.sent'),
        body: t('notifications.test.body'),
      });
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error sending test notification:', error);
      setNotification({
        title: t('notifications.error.title'),
        body: t('notifications.test.error'),
      });
      setSnackbarOpen(true);
    }
  };

  const handleNotificationClick = () => {
    if (notification?.data?.deep_link) {
      window.location.href = notification.data.deep_link;
    }
    setSnackbarOpen(false);
  };

  // 알림 기능이 지원되지 않는 경우 아무것도 렌더링하지 않음
  if (!isMessagingSupported) {
    return null;
  }

  return (
    <>
      {permission !== 'granted' && (
        <Box sx={{ position: 'fixed', bottom: 20, right: 20, zIndex: 1000 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<NotificationsIcon />}
            onClick={() => setShowPermissionDialog(true)}
            sx={{
              borderRadius: '20px',
              boxShadow: 3,
              '&:hover': {
                boxShadow: 5,
              }
            }}
          >
            {t('notifications.enableButton')}
          </Button>
        </Box>
      )}

      {/* 알림 권한 요청 다이얼로그 */}
      <Dialog
        open={showPermissionDialog}
        onClose={() => setShowPermissionDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <NotificationsActiveIcon color="primary" />
            <Typography variant="h6">{t('notifications.dialog.title')}</Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" paragraph>
            {t('notifications.dialog.description')}
          </Typography>
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              {t('notifications.dialog.features.workout')}
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              {t('notifications.dialog.features.achievement')}
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              {t('notifications.dialog.features.social')}
            </Typography>
            <Typography component="li" variant="body2" sx={{ mb: 1 }}>
              {t('notifications.dialog.features.summary')}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 2, display: 'block' }}>
            {t('notifications.dialog.note')}
          </Typography>
          {window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && (
            <Alert severity="warning" sx={{ mt: 2 }}>
              {t('notifications.httpsWarning')}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowPermissionDialog(false)}>
            {t('notifications.dialog.later')}
          </Button>
          <Button 
            onClick={requestNotificationPermission} 
            variant="contained"
            disabled={loading}
          >
            {loading ? t('notifications.dialog.enabling') : t('notifications.dialog.allow')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 포그라운드 알림 스낵바 */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        onClick={handleNotificationClick}
        sx={{ cursor: notification?.data?.deep_link ? 'pointer' : 'default' }}
      >
        <Alert 
          onClose={() => setSnackbarOpen(false)} 
          severity="info" 
          sx={{ width: '100%' }}
          icon={<NotificationsActiveIcon />}
        >
          <Typography variant="subtitle2" fontWeight="bold">
            {notification?.title}
          </Typography>
          <Typography variant="body2">
            {notification?.body}
          </Typography>
        </Alert>
      </Snackbar>

      {/* 디버그용 테스트 버튼 (개발 환경에서만 표시) */}
      {process.env.NODE_ENV === 'development' && fcmToken && (
        <Box sx={{ position: 'fixed', bottom: 80, right: 20, zIndex: 1000 }}>
          <Button
            variant="outlined"
            size="small"
            onClick={sendTestNotification}
          >
            {t('notifications.testButton')}
          </Button>
        </Box>
      )}
    </>
  );
};

export default FirebaseNotification;
