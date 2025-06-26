import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Firebase 설정 (환경 변수에서 가져오기)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// FCM 토큰 획득
export const getFCMToken = async (): Promise<string | null> => {
  try {
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.REACT_APP_FIREBASE_VAPID_KEY
    });
    
    if (currentToken) {
      console.log('FCM 토큰:', currentToken);
      return currentToken;
    } else {
      console.log('FCM 토큰을 가져올 수 없습니다.');
      return null;
    }
  } catch (error) {
    console.error('FCM 토큰 획득 오류:', error);
    return null;
  }
};

// 알림 권한 요청
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('알림 권한이 허용되었습니다.');
      return true;
    } else {
      console.log('알림 권한이 거부되었습니다.');
      return false;
    }
  } catch (error) {
    console.error('알림 권한 요청 오류:', error);
    return false;
  }
};

// 포그라운드 메시지 수신
export const onForegroundMessage = (callback: (payload: any) => void) => {
  onMessage(messaging, (payload) => {
    console.log('포그라운드 메시지 수신:', payload);
    callback(payload);
  });
};

export { app, messaging };
