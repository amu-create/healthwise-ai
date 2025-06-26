import React, { useState, useEffect, useRef } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Avatar,
  Typography,
  Box,
  Divider,
  Button,
  Chip,
  Snackbar,
  Alert,
  Slide,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Notifications,
  NotificationsActive,
  EmojiEvents,
  FitnessCenter,
  Restaurant,
  PersonAdd,
  Favorite,
  Comment,
  CheckCircle,
  Star,
  TrendingUp,
  Close,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

interface Notification {
  id: number;
  type: 'achievement' | 'social' | 'workout' | 'nutrition' | 'system';
  title: string;
  title_en?: string;
  title_es?: string;
  message: string;
  message_en?: string;
  message_es?: string;
  is_read: boolean;
  created_at: string;
  metadata?: any;
  icon?: string;
  action_url?: string;
}

interface AchievementNotification {
  type: 'achievement_unlocked';
  achievement: {
    name: string;
    name_en?: string;
    name_es?: string;
    badge_level: string;
    points: number;
  };
}

interface LevelUpNotification {
  type: 'level_up';
  level: number;
  title: string;
}

const notificationIcons: { [key: string]: React.ReactElement } = {
  achievement: <EmojiEvents />,
  social: <PersonAdd />,
  workout: <FitnessCenter />,
  nutrition: <Restaurant />,
  like: <Favorite />,
  comment: <Comment />,
  follow: <PersonAdd />,
  level_up: <TrendingUp />,
};

const NotificationCenter: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, isAuthenticated } = useAuth();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [achievementPopup, setAchievementPopup] = useState<AchievementNotification | null>(null);
  const [levelUpPopup, setLevelUpPopup] = useState<LevelUpNotification | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      connectWebSocket();
      fetchNotifications();
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [isAuthenticated, user]);

  const connectWebSocket = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:8000/ws/notifications/`;
    
    wsRef.current = new WebSocket(wsUrl);

    wsRef.current.onopen = () => {
      console.log('WebSocket connected');
      setWsConnected(true);
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleWebSocketMessage(data);
    };

    wsRef.current.onclose = () => {
      console.log('WebSocket disconnected');
      setWsConnected(false);
      // 재연결 시도
      setTimeout(connectWebSocket, 5000);
    };

    wsRef.current.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'notification':
        // 새 알림 추가
        const newNotification = data.notification;
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // 사운드 재생 (옵션)
        playNotificationSound();
        break;
        
      case 'achievement_unlocked':
        // 업적 달성 팝업
        setAchievementPopup(data);
        setUnreadCount(prev => prev + 1);
        playAchievementSound();
        break;
        
      case 'level_up':
        // 레벨업 팝업
        setLevelUpPopup(data);
        setUnreadCount(prev => prev + 1);
        playLevelUpSound();
        break;
        
      case 'connection_established':
        setUnreadCount(data.unread_count);
        break;
    }
  };

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications/');
      setNotifications(response.data.results || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await api.post(`/notifications/${notificationId}/mark_read/`);
      
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // WebSocket으로도 전송
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'mark_read',
          notification_id: notificationId
        }));
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/notifications/mark_all_read/');
      
      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
      
      // WebSocket으로도 전송
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'mark_all_read'
        }));
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const playNotificationSound = () => {
    // 알림 사운드 재생 (옵션)
    const audio = new Audio('/sounds/notification.mp3');
    audio.play().catch(() => {});
  };

  const playAchievementSound = () => {
    const audio = new Audio('/sounds/achievement.mp3');
    audio.play().catch(() => {});
  };

  const playLevelUpSound = () => {
    const audio = new Audio('/sounds/levelup.mp3');
    audio.play().catch(() => {});
  };

  const getNotificationTitle = (notification: Notification) => {
    const lang = i18n.language;
    if (lang === 'en' && notification.title_en) return notification.title_en;
    if (lang === 'es' && notification.title_es) return notification.title_es;
    return notification.title;
  };

  const getNotificationMessage = (notification: Notification) => {
    const lang = i18n.language;
    if (lang === 'en' && notification.message_en) return notification.message_en;
    if (lang === 'es' && notification.message_es) return notification.message_es;
    return notification.message;
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('notifications.justNow');
    if (diffMins < 60) return t('notifications.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('notifications.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('notifications.daysAgo', { count: diffDays });
    
    return date.toLocaleDateString();
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    if (unreadCount > 0) {
      // 메뉴를 열면 자동으로 읽음 처리
      setTimeout(() => {
        markAllAsRead();
      }, 3000);
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton onClick={handleClick} color="inherit">
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? (
            <NotificationsActive />
          ) : (
            <Notifications />
          )}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box p={2} display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6" fontWeight="bold">
            {t('notifications.title')}
          </Typography>
          {wsConnected && (
            <Chip
              size="small"
              label={t('notifications.live')}
              color="success"
              icon={<CheckCircle />}
            />
          )}
        </Box>
        
        <Divider />
        
        {loading ? (
          <Box display="flex" justifyContent="center" p={4}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography color="text.secondary">
              {t('notifications.empty')}
            </Typography>
          </Box>
        ) : (
          <List sx={{ maxHeight: 400, overflow: 'auto' }}>
            {notifications.map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(notification.id);
                    }
                    if (notification.action_url) {
                      window.location.href = notification.action_url;
                    }
                  }}
                  sx={{
                    bgcolor: notification.is_read ? 'transparent' : 'action.hover',
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: notification.is_read ? 'grey.600' : 'primary.main' }}>
                      {notificationIcons[notification.metadata?.icon || notification.type]}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" fontWeight={notification.is_read ? 'normal' : 'bold'}>
                        {getNotificationTitle(notification)}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary">
                          {getNotificationMessage(notification)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatTime(notification.created_at)}
                        </Typography>
                      </>
                    }
                  />
                  {!notification.is_read && (
                    <ListItemSecondaryAction>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          bgcolor: 'primary.main',
                        }}
                      />
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
                {index < notifications.length - 1 && <Divider variant="inset" component="li" />}
              </React.Fragment>
            ))}
          </List>
        )}
        
        <Divider />
        
        <Box p={1} display="flex" justifyContent="space-between">
          <Button size="small" onClick={markAllAsRead} disabled={unreadCount === 0}>
            {t('notifications.markAllRead')}
          </Button>
          <Button size="small" href="/notifications">
            {t('notifications.viewAll')}
          </Button>
        </Box>
      </Menu>

      {/* 업적 달성 팝업 */}
      <AnimatePresence>
        {achievementPopup && (
          <Snackbar
            open={true}
            autoHideDuration={6000}
            onClose={() => setAchievementPopup(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            TransitionComponent={Slide}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
            >
              <Paper
                elevation={8}
                sx={{
                  p: 3,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  background: 'linear-gradient(135deg, #FFD700, #FFA500)',
                  color: '#000',
                }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <EmojiEvents sx={{ fontSize: 48 }} />
                </motion.div>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    {t('notifications.achievementUnlocked')}
                  </Typography>
                  <Typography variant="body1">
                    {achievementPopup.achievement.name}
                  </Typography>
                  <Typography variant="body2">
                    +{achievementPopup.achievement.points} {t('common.points')}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => setAchievementPopup(null)}
                  sx={{ ml: 'auto' }}
                >
                  <Close />
                </IconButton>
              </Paper>
            </motion.div>
          </Snackbar>
        )}
      </AnimatePresence>

      {/* 레벨업 팝업 */}
      <AnimatePresence>
        {levelUpPopup && (
          <Snackbar
            open={true}
            autoHideDuration={8000}
            onClose={() => setLevelUpPopup(null)}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            TransitionComponent={Slide}
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              exit={{ scale: 0, rotate: 180 }}
              transition={{ type: 'spring', stiffness: 150 }}
            >
              <Paper
                elevation={12}
                sx={{
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
                  color: '#000',
                  minWidth: 300,
                }}
              >
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatType: 'reverse',
                  }}
                >
                  <Star sx={{ fontSize: 64, color: '#FFD700' }} />
                </motion.div>
                <Typography variant="h4" fontWeight={900}>
                  LEVEL UP!
                </Typography>
                <Typography variant="h5" fontWeight="bold">
                  {t('notifications.levelReached', { level: levelUpPopup.level })}
                </Typography>
                <Typography variant="h6">
                  {levelUpPopup.title}
                </Typography>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ duration: 2, ease: 'easeOut' }}
                >
                  <Box
                    sx={{
                      height: 4,
                      background: 'linear-gradient(90deg, #FFD700, #FFA500)',
                      borderRadius: 2,
                    }}
                  />
                </motion.div>
              </Paper>
            </motion.div>
          </Snackbar>
        )}
      </AnimatePresence>
    </>
  );
};

export default NotificationCenter;
