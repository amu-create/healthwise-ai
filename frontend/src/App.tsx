import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider, useNotification } from './contexts/NotificationContext';
import api from './services/api';
import achievementService from './services/achievementService';
import './i18n';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Exercise from './pages/Exercise';
import Nutrition from './pages/Nutrition';
// import HealthCheck from './pages/HealthCheck'; // 삭제됨
import Map from './pages/Map';
import MusicRecommendation from './pages/Music';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import AIWorkout from './pages/AIWorkout';
import AINutrition from './pages/AINutrition';
// import Achievements from './pages/Achievements';
// import FollowingAchievements from './pages/FollowingAchievements';
import Social from './pages/Social';
import NotificationCenterPage from './pages/NotificationCenterPage';
import NotificationSettingsPage from './pages/NotificationSettingsPage';
import PoseAnalysis from './pages/PoseAnalysis';

// Components
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import CursorTrail from './components/CursorTrail';
import FirebaseNotification from './components/FirebaseNotification';

// Theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00D4FF',
    },
    secondary: {
      main: '#00FFB3',
    },
    background: {
      default: '#000000',
      paper: '#111111',
    },
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontWeight: 900,
      letterSpacing: '-2px',
    },
    h2: {
      fontWeight: 900,
      letterSpacing: '-2px',
    },
  },
  shape: {
    borderRadius: 12,
  },
});

// 업적 알림 설정 컴포넌트
function AchievementNotificationSetup() {
  const { showAchievementNotification } = useNotification();

  useEffect(() => {
    // 업적 서비스에 알림 콜백 설정
    achievementService.setNotificationCallback(showAchievementNotification);
  }, [showAchievementNotification]);

  return null;
}

// 버전 정보 표시 컴포넌트
function VersionInfo() {
  const [versionInfo, setVersionInfo] = useState<any>(null);

  useEffect(() => {
    // 빌드 정보 확인
    const buildTime = process.env.REACT_APP_BUILD_TIME;
    const version = process.env.REACT_APP_VERSION;
    
    setVersionInfo({
      version: version || 'dev',
      buildTime: buildTime ? new Date(parseInt(buildTime) * 1000).toLocaleString() : 'development',
      loadTime: new Date().toLocaleString(),
    });

    // Service Worker 상태 확인
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        console.log('Active Service Workers:', registrations.length);
        registrations.forEach((reg, index) => {
          console.log(`SW ${index}:`, {
            scope: reg.scope,
            active: reg.active?.scriptURL,
            waiting: reg.waiting?.scriptURL,
            installing: reg.installing?.scriptURL,
          });
        });
      });
    }

    // 캐시 상태 확인
    if ('caches' in window) {
      caches.keys().then((names) => {
        console.log('Active Caches:', names);
      });
    }
  }, []);

  if (!versionInfo) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 10,
      right: 10,
      background: 'rgba(0,0,0,0.8)',
      color: '#00D4FF',
      padding: '5px 10px',
      borderRadius: '5px',
      fontSize: '10px',
      zIndex: 9999,
      fontFamily: 'monospace'
    }}>
      <div>v{versionInfo.version}</div>
      <div>Build: {versionInfo.buildTime}</div>
      <div>Load: {versionInfo.loadTime}</div>
    </div>
  );
}

function AppContent() {
  useEffect(() => {
    // CSRF 토큰 가져오기
    api.get('/auth/csrf/').catch(err => {
      console.error('Failed to get CSRF token:', err);
    });

    // 개발 환경에서 번역 캐시 유틸리티 로드
    if (process.env.NODE_ENV === 'development') {
      import('./utils/translationCache').then(() => {
        console.log('Translation cache utilities loaded');
      });
    }
  }, []);

  return (
    <>
      <AchievementNotificationSetup />
      <FirebaseNotification />
      {process.env.NODE_ENV === 'development' && <VersionInfo />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Public Dashboard Routes (with limitations for guests) */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/ai-workout" element={<AIWorkout />} />
          <Route path="/music" element={<MusicRecommendation />} />
          <Route path="/map" element={<Map />} />
          <Route path="/pose-analysis" element={<PoseAnalysis />} />
        </Route>

        {/* Private Routes */}
        <Route element={<PrivateRoute />}>
          <Route element={<Layout />}>
            <Route path="/exercise" element={<Exercise />} />
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/ai-nutrition" element={<AINutrition />} />
            {/* <Route path="/achievements" element={<Achievements />} />
            <Route path="/achievements/following" element={<FollowingAchievements />} /> */}
            <Route path="/social" element={<Social />} />
            <Route path="/notifications" element={<NotificationCenterPage />} />
            <Route path="/notifications/settings" element={<NotificationSettingsPage />} />
            {/* <Route path="/health-check" element={<HealthCheck />} /> 삭제됨 */}
            {/* <Route path="/map-test" element={<MapSimple />} />
            <Route path="/map-debug" element={<MapDebug />} /> */}
            <Route path="/profile" element={<Profile />} />
            <Route path="/profile/:userId" element={<Profile />} />
          </Route>
        </Route>

        {/* Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <CursorTrail />
      <AuthProvider>
        <Router>
          <NotificationProvider>
            <AppContent />
          </NotificationProvider>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
