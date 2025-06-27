import React, { useState, useEffect } from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  IconButton,
  Chip,
  CircularProgress,
  Paper,
  Divider,
  Button,
} from '@mui/material';
import {
  FavoriteBorder,
  Comment,
  PersonAdd,
  EmojiEvents,
  MarkEmailRead,
  Delete,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { toast } from 'react-toastify';

interface Notification {
  id: number;
  type: 'like' | 'comment' | 'follow' | 'friend_request' | 'achievement' | 'level_up';
  title: string;
  message: string;
  from_user?: {
    id: number;
    username: string;
    profile_picture_url?: string;
  };
  post?: {
    id: number;
    content: string;
  };
  is_read: boolean;
  created_at: string;
}

interface NotificationListProps {
  onUpdate?: () => void;
}

export default function NotificationList({ onUpdate }: NotificationListProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async (loadMore = false) => {
    try {
      const currentPage = loadMore ? page + 1 : 1;
      const response = await api.get(`/social/notifications/?page=${currentPage}`);
      
      if (loadMore) {
        setNotifications(prev => [...prev, ...response.data.results]);
      } else {
        setNotifications(response.data.results);
      }
      
      setHasMore(!!response.data.next);
      setPage(currentPage);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      toast.error(t('notifications.errorFetching'));
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await api.post(`/social/notifications/${notificationId}/mark_as_read/`);
      setNotifications(prev =>
        prev.map(notif =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      onUpdate?.();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.post('/social/notifications/mark_all_as_read/');
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, is_read: true }))
      );
      onUpdate?.();
      toast.success(t('notifications.allMarkedAsRead'));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      toast.error(t('notifications.errorMarkingAsRead'));
    }
  };

  const deleteNotification = async (notificationId: number) => {
    try {
      await api.delete(`/social/notifications/${notificationId}/`);
      setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
      onUpdate?.();
    } catch (error) {
      console.error('Failed to delete notification:', error);
      toast.error(t('notifications.errorDeleting'));
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
      case 'achievement':
      case 'level_up':
        return <EmojiEvents color="warning" />;
      default:
        return null;
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // 읽음 처리
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // 관련 페이지로 이동
    if (notification.post) {
      navigate(`/social?postId=${notification.post.id}`);
    } else if (notification.from_user) {
      navigate(`/profile/${notification.from_user.id}`);
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

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {notifications.length > 0 && (
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Button
            startIcon={<MarkEmailRead />}
            onClick={markAllAsRead}
            size="small"
          >
            {t('notifications.markAllAsRead')}
          </Button>
        </Box>
      )}

      {notifications.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            {t('notifications.noNotifications')}
          </Typography>
        </Paper>
      ) : (
        <List sx={{ bgcolor: 'background.paper' }}>
          {notifications.map((notification, index) => (
            <React.Fragment key={notification.id}>
              <ListItem
                alignItems="flex-start"
                onClick={() => handleNotificationClick(notification)}
                secondaryAction={
                  <IconButton
                    edge="end"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteNotification(notification.id);
                    }}
                  >
                    <Delete />
                  </IconButton>
                }
                sx={{
                  cursor: 'pointer',
                  backgroundColor: notification.is_read ? 'transparent' : 'action.hover',
                  '&:hover': {
                    backgroundColor: 'action.hover',
                  },
                }}
              >
                <ListItemAvatar>
                  {notification.from_user ? (
                    <Avatar src={notification.from_user.profile_picture_url}>
                      {notification.from_user.username[0].toUpperCase()}
                    </Avatar>
                  ) : (
                    <Avatar>{getNotificationIcon(notification.type)}</Avatar>
                  )}
                </ListItemAvatar>
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle2">
                        {notification.title}
                      </Typography>
                      {!notification.is_read && (
                        <Chip
                          label={t('notifications.new')}
                          color="primary"
                          size="small"
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <>
                      <Typography
                        component="span"
                        variant="body2"
                        color="text.primary"
                      >
                        {notification.message}
                      </Typography>
                      <Typography
                        component="span"
                        variant="caption"
                        color="text.secondary"
                        display="block"
                      >
                        {formatTime(notification.created_at)}
                      </Typography>
                    </>
                  }
                />
              </ListItem>
              {index < notifications.length - 1 && <Divider variant="inset" component="li" />}
            </React.Fragment>
          ))}
        </List>
      )}

      {hasMore && (
        <Box display="flex" justifyContent="center" mt={2}>
          <Button onClick={() => fetchNotifications(true)}>
            {t('common.loadMore')}
          </Button>
        </Box>
      )}
    </Box>
  );
}
