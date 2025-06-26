import React, { useState, useEffect } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Divider,
  Button,
  Avatar,
} from '@mui/material';
import { Notifications, NotificationsNone } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

interface Notification {
  id: number;
  type: 'like' | 'comment' | 'follow' | 'mention';
  message: string;
  is_read: boolean;
  created_at: string;
  from_user?: {
    id: number;
    username: string;
    profile_picture_url?: string;
  };
  post?: number;
}

export default function NotificationDropdown() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState(false);
  const open = Boolean(anchorEl);
  
  // 인증 상태 확인
  const isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
  const userId = localStorage.getItem('userId');

  useEffect(() => {
    // 로그인한 사용자만 알림을 가져옴
    if (isAuthenticated && userId) {
      fetchNotifications();
      // 30초마다 알림 확인
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [isAuthenticated, userId]);

  const fetchNotifications = async () => {
    // 인증되지 않은 사용자는 API 호출하지 않음
    if (!isAuthenticated || !userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.get('/social/notifications/');
      const data = response.data.results || response.data || [];
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      // 401 에러인 경우 알림을 비움
      if ((error as any).response?.status === 401) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const markAllAsRead = async () => {
    if (!isAuthenticated || !userId) return;
    
    try {
      await api.post('/social/notifications/mark_all_as_read/');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    handleClose();
    if (notification.post) {
      navigate('/social'); // 게시물로 이동
    } else if (notification.from_user) {
      navigate('/social'); // 프로필로 이동 (추후 구현)
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return '❤️';
      case 'comment':
        return '💬';
      case 'follow':
        return '👤';
      case 'mention':
        return '@';
      default:
        return '🔔';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return t('social.justNow');
    if (diffMins < 60) return t('social.minutesAgo', { count: diffMins });
    if (diffHours < 24) return t('social.hoursAgo', { count: diffHours });
    if (diffDays < 7) return t('social.daysAgo', { count: diffDays });
    
    return date.toLocaleDateString();
  };

  return (
    <>
      <IconButton
        onClick={handleClick}
        sx={{ 
          color: 'text.primary',
          '&:hover': {
            bgcolor: 'action.hover',
          }
        }}
      >
        <Badge 
          badgeContent={unreadCount} 
          color="error"
          sx={{
            '& .MuiBadge-badge': {
              fontSize: '0.75rem',
              height: 20,
              minWidth: 20,
            }
          }}
        >
          {unreadCount > 0 ? <Notifications /> : <NotificationsNone />}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 380,
            maxHeight: 480,
            borderRadius: 2,
            mt: 1.5,
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          }
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box px={2} py={1.5}>
          <Typography variant="h6" fontWeight={600}>
            {t('social.notifications')}
          </Typography>
        </Box>
        <Divider />
        
        {loading ? (
          <Box p={4} textAlign="center">
            <Typography color="text.secondary">
              {t('common.loading')}...
            </Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box p={4} textAlign="center">
            <Typography color="text.secondary">
              {t('social.noNotifications')}
            </Typography>
          </Box>
        ) : (
          [
            <Box key="notifications-box" sx={{ maxHeight: 320, overflow: 'auto' }}>
              {notifications.map((notification) => (
                <MenuItem
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    py: 1.5,
                    px: 2,
                    bgcolor: notification.is_read ? 'inherit' : 'action.hover',
                    '&:hover': {
                      bgcolor: 'action.selected',
                    },
                    alignItems: 'flex-start',
                  }}
                >
                  <Box display="flex" gap={1.5} width="100%">
                    <Box>
                      {notification.from_user ? (
                        <Avatar
                          src={notification.from_user.profile_picture_url}
                          sx={{ width: 40, height: 40 }}
                        >
                          {notification.from_user.username[0].toUpperCase()}
                        </Avatar>
                      ) : (
                        <Avatar sx={{ width: 40, height: 40, bgcolor: 'primary.main' }}>
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      )}
                    </Box>
                    <Box flex={1}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: notification.is_read ? 400 : 600,
                          mb: 0.5,
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {formatTime(notification.created_at)}
                      </Typography>
                    </Box>
                  </Box>
                </MenuItem>
              ))}
            </Box>,
            
            <Divider key="divider" />,
            <Box key="view-all-box" p={1}>
              <Button
                fullWidth
                variant="text"
                onClick={() => {
                  handleClose();
                  navigate('/notifications');
                }}
                sx={{ textTransform: 'none' }}
              >
                {t('social.viewAllNotifications')}
              </Button>
            </Box>
          ]
        )}
      </Menu>
    </>
  );
}
