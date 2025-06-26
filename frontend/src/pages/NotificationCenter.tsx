import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Button,
  Divider,
  Chip,
  CircularProgress,
} from '@mui/material';
import {
  Notifications,
  CheckCircle,
  Delete,
  FavoriteBorder,
  Comment,
  PersonAdd,
  AlternateEmail,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

interface Notification {
  id: number;
  type: 'like' | 'comment' | 'follow' | 'mention' | 'friend_request';
  title: string;
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

export default function NotificationCenter() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  const fetchNotifications = async (loadMore = false) => {
    try {
      setLoading(true);
      const currentPage = loadMore ? page + 1 : 1;
      
      let endpoint = '/social/notifications/';
      if (activeTab === 1) {
        endpoint += '?is_read=false';
      } else if (activeTab === 2) {
        endpoint += '?is_read=true';
      }
      
      if (currentPage > 1) {
        endpoint += (endpoint.includes('?') ? '&' : '?') + `page=${currentPage}`;
      }

      const response = await api.get(endpoint);
      const data = response.data;
      
      if (loadMore) {
        setNotifications([...notifications, ...(data.results || data)]);
        setPage(currentPage);
      } else {
        setNotifications(data.results || data);
        setPage(1);
      }
      
      setHasMore(!!data.next);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await api.post(`/social/notifications/${notificationId}/mark_as_read/`);
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, is_read: true } : n
      ));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/social/notifications/mark_all_as_read/');
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    try {
      await api.delete(`/social/notifications/${notificationId}/`);
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    
    if (notification.post) {
      navigate('/social'); // Navigate to post
    } else if (notification.from_user && notification.type === 'follow') {
      navigate('/social'); // Navigate to user profile
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <FavoriteBorder color="error" />;
      case 'comment':
        return <Comment color="primary" />;
      case 'follow':
      case 'friend_request':
        return <PersonAdd color="success" />;
      case 'mention':
        return <AlternateEmail color="info" />;
      default:
        return <Notifications />;
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

  const filteredNotifications = activeTab === 0 
    ? notifications 
    : activeTab === 1 
      ? notifications.filter(n => !n.is_read)
      : notifications.filter(n => n.is_read);

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h5" fontWeight={600}>
            {t('social.notifications')}
          </Typography>
          {notifications.some(n => !n.is_read) && (
            <Button
              variant="outlined"
              startIcon={<CheckCircle />}
              onClick={handleMarkAllAsRead}
              size="small"
            >
              {t('notifications.markAllAsRead')}
            </Button>
          )}
        </Box>
        
        <Tabs
          value={activeTab}
          onChange={(e, value) => setActiveTab(value)}
          sx={{ px: 3, borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={t('notifications.all')} />
          <Tab label={t('notifications.unread')} />
          <Tab label={t('notifications.read')} />
        </Tabs>

        {loading && notifications.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <CircularProgress />
          </Box>
        ) : filteredNotifications.length === 0 ? (
          <Box sx={{ p: 8, textAlign: 'center' }}>
            <Typography color="text.secondary">
              {activeTab === 1 
                ? t('notifications.noUnread')
                : t('social.noNotifications')
              }
            </Typography>
          </Box>
        ) : (
          <>
            <List sx={{ p: 0 }}>
              {filteredNotifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    onClick={() => handleNotificationClick(notification)}
                    sx={{
                      cursor: 'pointer',
                      bgcolor: notification.is_read ? 'inherit' : 'action.hover',
                      '&:hover': {
                        bgcolor: 'action.selected',
                      },
                    }}
                    secondaryAction={
                      <IconButton 
                        edge="end" 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.id);
                        }}
                      >
                        <Delete />
                      </IconButton>
                    }
                  >
                    <ListItemAvatar>
                      {notification.from_user ? (
                        <Avatar
                          src={notification.from_user.profile_picture_url}
                          sx={{ width: 48, height: 48 }}
                        >
                          {notification.from_user.username[0].toUpperCase()}
                        </Avatar>
                      ) : (
                        <Avatar sx={{ width: 48, height: 48, bgcolor: 'primary.main' }}>
                          {getNotificationIcon(notification.type)}
                        </Avatar>
                      )}
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography
                            variant="body1"
                            sx={{ fontWeight: notification.is_read ? 400 : 600 }}
                          >
                            {notification.title}
                          </Typography>
                          {!notification.is_read && (
                            <Chip 
                              label={t('notifications.new')} 
                              size="small" 
                              color="primary"
                              sx={{ height: 20 }}
                            />
                          )}
                        </Box>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" color="text.primary" sx={{ mb: 0.5 }}>
                            {notification.message}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatTime(notification.created_at)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                </React.Fragment>
              ))}
            </List>

            {hasMore && (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Button
                  onClick={() => fetchNotifications(true)}
                  disabled={loading}
                >
                  {loading ? <CircularProgress size={24} /> : t('social.loadMore')}
                </Button>
              </Box>
            )}
          </>
        )}
      </Paper>
    </Container>
  );
}
