import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  useTheme,
  useMediaQuery,
  Collapse,
} from '@mui/material';
import ProfileAvatar from './ProfileAvatar';
import NotificationDropdown from './notifications/NotificationDropdown';
import { Button } from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  FitnessCenter,
  Restaurant,
  Map,
  MusicNote,
  Chat,
  Person,
  Logout,
  Language,
  Psychology,
  BrunchDining,
  Login as LoginIcon,
  PersonAdd as RegisterIcon,
  Refresh as RefreshIcon,
  EmojiEvents,
  ExpandLess,
  ExpandMore,
  OndemandVideo,
  LocationOn,
  Assessment,
  People,
  CameraAlt,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { guestLimitsService } from '../services/guestLimitsService';
import { useNotificationWebSocket } from '../services/websocket/useWebSocket';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const drawerWidth = 240;

const Layout: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [langAnchorEl, setLangAnchorEl] = useState<null | HTMLElement>(null);
  const [exerciseOpen, setExerciseOpen] = useState(false);
  const [nutritionOpen, setNutritionOpen] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  const { t, i18n } = useTranslation();
  const { user, logout, isGuest } = useAuth();
  
  // WebSocket 알림 훅 사용
  const { unreadCount } = useNotificationWebSocket();

  // 디버깅을 위한 로그
  useEffect(() => {
    console.log('Layout - isGuest:', isGuest);
    console.log('Layout - user:', user);
  }, [isGuest, user]);

  const [profileImageKey, setProfileImageKey] = useState(0);

  useEffect(() => {
    // 프로필 이미지 업데이트 이벤트 리스너
    const handleProfileImageUpdate = () => {
      setProfileImageKey(prev => prev + 1);
    };
    
    window.addEventListener('profileImageUpdated', handleProfileImageUpdate);
    
    return () => {
      window.removeEventListener('profileImageUpdated', handleProfileImageUpdate);
    };
  }, []);

  // 현재 경로가 특정 카테고리에 속하는지 확인
  useEffect(() => {
    const path = location.pathname;
    if (['/ai-workout', '/exercise', '/map', '/music', '/pose-analysis'].includes(path)) {
      setExerciseOpen(true);
    } else if (['/ai-nutrition', '/nutrition'].includes(path)) {
      setNutritionOpen(true);
    }
  }, [location.pathname]);

  const getProfileImageUrl = () => {
    if (user?.profile?.profile_image) {
      return user.profile.profile_image;
    }
    return '';
  };

  // 메뉴 구조 재구성
  const menuStructure = [
    { 
      text: t('navigation.dashboard'), 
      icon: <Dashboard />, 
      path: '/dashboard',
      guestAccess: true 
    },
    {
      text: t('navigation.exercise'),
      icon: <FitnessCenter />,
      isCategory: true,
      guestAccess: true,  // 카테고리도 게스트 접근 가능
      open: exerciseOpen,
      onClick: () => setExerciseOpen(!exerciseOpen),
      subItems: [
        { 
          text: t('pages.aiWorkout.title'), 
          icon: <Psychology />, 
          path: '/ai-workout',
          guestAccess: true 
        },
        { 
          text: t('pose_analysis.title'), 
          icon: <CameraAlt />, 
          path: '/pose-analysis',
          guestAccess: false 
        },
        { 
          text: t('navigation.exerciseVideo'), 
          icon: <OndemandVideo />, 
          path: '/exercise',
          guestAccess: false 
        },
        { 
          text: t('navigation.exerciseLocation'), 
          icon: <LocationOn />, 
          path: '/map',
          guestAccess: true 
        },
        { 
          text: t('navigation.aiMusicRecommend'), 
          icon: <MusicNote />, 
          path: '/music',
          guestAccess: true 
        },
      ]
    },
    {
      text: t('navigation.nutrition'),
      icon: <Restaurant />,
      isCategory: true,
      guestAccess: true,  // 카테고리는 게스트도 볼 수 있지만 하위 항목 중 일부만 접근 가능
      open: nutritionOpen,
      onClick: () => setNutritionOpen(!nutritionOpen),
      subItems: [
        { 
          text: t('pages.aiNutrition.title'), 
          icon: <BrunchDining />, 
          path: '/ai-nutrition',
          guestAccess: false 
        },
        { 
          text: t('navigation.nutritionManagement'), 
          icon: <Assessment />, 
          path: '/nutrition',
          guestAccess: false 
        },
      ]
    },
    { 
      text: t('pages.achievements.title'), 
      icon: <EmojiEvents />, 
      path: '/achievements',
      guestAccess: false 
    },
    { 
      text: t('navigation.social'), 
      icon: <People />, 
      path: '/social',
      guestAccess: false 
    },
    { 
      text: t('navigation.chat'), 
      icon: <Chat />, 
      path: '/chat',
      guestAccess: true 
    },
  ];

  const languages = [
    { code: 'ko', name: t('languages.korean'), flag: '🇰🇷' },
    { code: 'en', name: t('languages.english'), flag: '🇺🇸' },
    { code: 'es', name: t('languages.spanish'), flag: '🇪🇸' },
  ];

  const getCurrentLanguage = () => {
    return languages.find(lang => lang.code === i18n.language) || languages[0];
  };

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLanguageMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setLangAnchorEl(event.currentTarget);
  };

  const handleLanguageMenuClose = () => {
    setLangAnchorEl(null);
  };

  const handleLanguageChange = (language: string) => {
    i18n.changeLanguage(language);
    handleLanguageMenuClose();
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const renderMenuItem = (item: any, level: number = 0) => {
    // 게스트 접근 제한 확인
    if (item.isCategory && isGuest) {
      // 카테고리인 경우, 하위 항목 중 하나라도 게스트가 접근 가능한 것이 있는지 확인
      const hasAccessibleSubItems = item.subItems?.some((subItem: any) => subItem.guestAccess);
      if (!hasAccessibleSubItems) {
        return null;
      }
    } else if (!item.isCategory && !item.guestAccess && isGuest) {
      // 일반 메뉴 항목인 경우
      return null;
    }

    if (item.isCategory) {
      return (
        <React.Fragment key={item.text}>
          <ListItem disablePadding>
            <ListItemButton onClick={item.onClick} sx={{ pl: level * 2 + 2 }}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
              {item.open ? <ExpandLess /> : <ExpandMore />}
            </ListItemButton>
          </ListItem>
          <Collapse in={item.open} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.subItems?.map((subItem: any) => renderMenuItem(subItem, level + 1))}
            </List>
          </Collapse>
        </React.Fragment>
      );
    }

    return (
      <ListItem key={item.path} disablePadding>
        <ListItemButton
          selected={location.pathname === item.path}
          onClick={() => {
            navigate(item.path);
            if (isMobile) {
              setMobileOpen(false);
            }
          }}
          sx={{
            pl: level * 2 + 2,
            '&.Mui-selected': {
              backgroundColor: 'rgba(0, 212, 255, 0.1)',
              '& .MuiListItemIcon-root': {
                color: 'primary.main',
              },
            },
          }}
        >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.text} />
        </ListItemButton>
      </ListItem>
    );
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div" sx={{ 
          background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 900,
        }}>
          {t('common.appName')}
        </Typography>
      </Toolbar>
      <Divider />
      <List>
        {menuStructure.map((item) => renderMenuItem(item))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Box sx={{ flexGrow: 1 }} />
          
          {/* Test Reset Button for Guest */}
          {isGuest && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={async () => {
                try {
                  // 프론트엔드 사용 횟수 초기화
                  guestLimitsService.resetAllUsage();
                  
                  // 백엔드 캠시도 리셋
                  const response = await fetch('http://localhost:8000/api/guest/reset-limits/', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                  });
                  
                  if (response.ok) {
                    const data = await response.json();
                    alert(t('common.testResetSuccess', { resetCount: data.reset_count }));
                  } else {
                    alert(t('common.testResetPartial'));
                  }
                  
                  // 페이지 새로고침으로 현재 페이지에 적용
                  window.location.reload();
                } catch (error) {
                  console.error('Failed to reset guest limits:', error);
                  // 프론트엔드만 리셋
                  guestLimitsService.resetAllUsage();
                  alert(t('common.testResetFrontendOnly'));
                  window.location.reload();
                }
              }}
              sx={{
                color: '#FF6B6B',
                borderColor: '#FF6B6B',
                mr: 2,
                '&:hover': {
                  backgroundColor: 'rgba(255, 107, 107, 0.1)',
                  borderColor: '#FF6B6B',
                },
              }}
            >
              {t('common.testResetUsage')}
            </Button>
          )}
          
          {/* Language Selector */}
          <Button
            color="inherit"
            startIcon={<Language />}
            onClick={handleLanguageMenuOpen}
            endIcon={
              <Box display="flex" alignItems="center" gap={0.5}>
                <Typography variant="caption">
                  {getCurrentLanguage().flag}
                </Typography>
                <Typography variant="caption">
                  {getCurrentLanguage().name}
                </Typography>
              </Box>
            }
            sx={{ 
              textTransform: 'none',
              mr: 2,
            }}
          >
          </Button>
          
          {/* Notification Dropdown for logged in users */}
          {user && !isGuest && (
            <NotificationDropdown />
          )}
          
          {/* Auth Buttons for Non-Guest Users */}
          {!user && !isGuest && (
            <>
              <Button
                color="inherit"
                startIcon={<LoginIcon />}
                onClick={() => navigate('/login')}
                sx={{ mx: 1 }}
              >
                {t('auth.login')}
              </Button>
              <Button
                variant="contained"
                startIcon={<RegisterIcon />}
                onClick={() => navigate('/register')}
                sx={{
                  background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
                  color: '#000',
                  fontWeight: 600,
                  '&:hover': {
                    boxShadow: '0 5px 20px rgba(0, 212, 255, 0.4)',
                  },
                }}
              >
                {t('auth.register')}
              </Button>
            </>
          )}
          
          {/* User Menu */}
          <IconButton onClick={handleProfileMenuOpen} sx={{ ml: 2 }}>
            <ProfileAvatar
              key={profileImageKey}
              src={user ? getProfileImageUrl() : ""}
              name={user?.username || (isGuest ? t('common.guest') : t('common.user'))}
              size={40}
            />
          </IconButton>
          
          <Menu
            anchorEl={langAnchorEl}
            open={Boolean(langAnchorEl)}
            onClose={handleLanguageMenuClose}
          >
            {languages.map((lang) => (
              <MenuItem 
                key={lang.code}
                onClick={() => handleLanguageChange(lang.code)}
                selected={i18n.language === lang.code}
              >
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography>{lang.flag}</Typography>
                  <Typography>{lang.name}</Typography>
                </Box>
              </MenuItem>
            ))}
          </Menu>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
          >
            {user ? [
              <MenuItem key="profile" onClick={() => {
                navigate('/profile');
                handleProfileMenuClose();
              }}>
                <ListItemIcon>
                  <Person fontSize="small" />
                </ListItemIcon>
                {t('navigation.profile')}
              </MenuItem>,
              <MenuItem key="logout" onClick={handleLogout}>
                <ListItemIcon>
                  <Logout fontSize="small" />
                </ListItemIcon>
                {t('auth.logout')}
              </MenuItem>
            ] : isGuest ? [
              <MenuItem key="login" onClick={() => {
                navigate('/login');
                handleProfileMenuClose();
              }}>
                <ListItemIcon>
                  <LoginIcon fontSize="small" />
                </ListItemIcon>
                {t('auth.login')}
              </MenuItem>,
              <MenuItem key="register" onClick={() => {
                navigate('/register');
                handleProfileMenuClose();
              }}>
                <ListItemIcon>
                  <RegisterIcon fontSize="small" />
                </ListItemIcon>
                {t('auth.register')}
              </MenuItem>
            ] : [
              <MenuItem key="login" onClick={() => {
                navigate('/login');
                handleProfileMenuClose();
              }}>
                <ListItemIcon>
                  <LoginIcon fontSize="small" />
                </ListItemIcon>
                {t('auth.login')}
              </MenuItem>,
              <MenuItem key="register" onClick={() => {
                navigate('/register');
                handleProfileMenuClose();
              }}>
                <ListItemIcon>
                  <RegisterIcon fontSize="small" />
                </ListItemIcon>
                {t('auth.register')}
              </MenuItem>
            ]}
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              backgroundColor: 'background.paper',
              borderRight: '1px solid rgba(255, 255, 255, 0.05)',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          minHeight: '100vh',
          backgroundColor: 'background.default',
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
      
      {/* Toast Container for notifications */}
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme={theme.palette.mode}
        style={{
          top: '80px', // AppBar 아래에 표시
        }}
      />
    </Box>
  );
};

export default Layout;
