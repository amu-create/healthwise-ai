import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Avatar,
  IconButton,
  Chip,
  Divider,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Badge,
  Menu,
  MenuItem,
  Skeleton,
} from '@mui/material';
import {
  FitnessCenter,
  Restaurant,
  EmojiEvents,
  People,
  Psychology,
  Favorite,
  SystemUpdate,
  MoreVert,
  CheckCircle,
  Delete,
  FilterList,
  Notifications,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { formatDistanceToNow } from 'date-fns';
import { ko, enUS, es } from 'date-fns/locale';

interface Notification {
  id: number;
  type: string;
  title: string;
  title_en?: string;
  title_es?: string;
  message: string;
  message_en?: string;
  message_es?: string;
  is_read: boolean;
  created_at: string;
  metadata?: any;
  action_url?: string;
}

export default function NotificationCenterPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedNotification, setSelectedNotification] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [filter, page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const params: any = { page, page_size: 20 };
      if (filter !== 'all') {
        params.type = filter;
      }

      const response = await api.get('/notifications/', { params });
      const newNotifications = response.data.results || [];
      
      if (page === 1) {
        setNotifications(newNotifications);
      } else {
        setNotifications(prev => [...prev, ...newNotifications]);
      }
      
      setHasMore(response.data.next !== null);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (event: React.MouseEvent<HTMLElement>, newFilter: string | null) => {
    if (newFilter !== null) {
      setFilter(newFilter);
      setPage(1);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await api.post(`/notifications/${notificationId}/mark-read/`);
      setNotifications(prev =>
        prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
      );
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/notifications/mark-all-read/');
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: number) => {
    try {
      await api.delete(`/notifications/${notificationId}/`);
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      handleMenuClose();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    if (notification.action_url) {
      navigate(notification.action_url);
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, notificationId: number) => {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
    setSelectedNotification(notificationId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedNotification(null);
  };

  const getIcon = (type: string) => {
    const iconProps = { sx: { fontSize: 24 } };
    switch (type) {
      case 'workout':
        return <FitnessCenter {...iconProps} />;
      case 'nutrition':
        return <Restaurant {...iconProps} />;
      case 'achievement':
        return <EmojiEvents {...iconProps} />;
      case 'social':
        return <People {...iconProps} />;
      case 'ai':
        return <Psychology {...iconProps} />;
      case 'health':
        return <Favorite {...iconProps} />;
      case 'system':
        return <SystemUpdate {...iconProps} />;
      default:
        return <Notifications {...iconProps} />;
    }
  };

  const getChipColor = (type: string): any => {
    switch (type) {
      case 'workout':
        return 'primary';
      case 'nutrition':
        return 'success';
      case 'achievement':
        return 'warning';
      case 'social':
        return 'info';
      case 'ai':
        return 'secondary';
      case 'health':
        return 'error';
      case 'system':
        return 'default';
      default:
        return 'default';
    }
  };

  const getLocale = () => {
    switch (i18n.language) {
      case 'ko':
        return ko;
      case 'es':
        return es;
      default:
        return enUS;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return formatDistanceToNow(date, { addSuffix: true, locale: getLocale() });
  };

  const getTitle = (notification: Notification) => {
    const lang = i18n.language;
    if (lang === 'en' && notification.title_en) return notification.title_en;
    if (lang === 'es' && notification.title_es) return notification.title_es;
    return notification.title;
  };

  const getMessage = (notification: Notification) => {
    const lang = i18n.language;
    if (lang === 'en' && notification.message_en) return notification.message_en;
    if (lang === 'es' && notification.message_es) return notification.message_es;
    return notification.message;
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {/* Header */}
        <Box sx={{ p: 3, bgcolor: 'background.default' }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h4" fontWeight="bold">
              {t('notifications.title')}
            </Typography>
            {unreadCount > 0 && (
              <Button
                variant="text"
                onClick={handleMarkAllAsRead}
                startIcon={<CheckCircle />}
              >
                {t('notifications.markAllAsRead')}
              </Button>
            )}
          </Box>

          {/* Filter */}
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={handleFilterChange}
            size="small"
            sx={{ flexWrap: 'wrap' }}
          >
            <ToggleButton value="all">
              {t('notifications.all')}
            </ToggleButton>
            <ToggleButton value="workout">
              <FitnessCenter sx={{ mr: 0.5, fontSize: 18 }} />
              {t('notifications.workout')}
            </ToggleButton>
            <ToggleButton value="nutrition">
              <Restaurant sx={{ mr: 0.5, fontSize: 18 }} />
              {t('notifications.nutrition')}
            </ToggleButton>
            <ToggleButton value="achievement">
              <EmojiEvents sx={{ mr: 0.5, fontSize: 18 }} />
              {t('notifications.achievement')}
            </ToggleButton>
            <ToggleButton value="social">
              <People sx={{ mr: 0.5, fontSize: 18 }} />
              {t('notifications.social')}
            </ToggleButton>
            <ToggleButton value="ai">
              <Psychology sx={{ mr: 0.5, fontSize: 18 }} />
              {t('notifications.ai')}
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        <Divider />

        {/* Notification List */}
        <List sx={{ p: 0 }}>
          {loading && page === 1 ? (
            // Loading skeletons
            [...Array(5)].map((_, index) => (
              <React.Fragment key={index}>
                <ListItem sx={{ py: 2 }}>
                  <ListItemAvatar>
                    <Skeleton variant="circular" width={40} height={40} />
                  </ListItemAvatar>
                  <ListItemText
                    primary={<Skeleton width="60%" />}
                    secondary={<Skeleton width="80%" />}
                  />
                </ListItem>
                {index < 4 && <Divider />}
              </React.Fragment>
            ))
          ) : notifications.length === 0 ? (
            <Box p={6} textAlign="center">
              <Notifications sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                {t('notifications.empty')}
              </Typography>
            </Box>
          ) : (
            <>
              {notifications.map((notification, index) => (
                <React.Fragment key={notification.id}>
                  <ListItem
                    disablePadding
                    secondaryAction={
                      <IconButton
                        edge="end"
                        onClick={(e) => handleMenuOpen(e, notification.id)}
                      >
                        <MoreVert />
                      </IconButton>
                    }
                  >
                    <ListItemButton
                      onClick={() => handleNotificationClick(notification)}
                      sx={{
                        py: 2,
                        bgcolor: notification.is_read ? 'inherit' : 'action.hover',
                        '&:hover': {
                          bgcolor: 'action.selected',
                        },
                      }}
                    >
                      <ListItemAvatar>
                        <Badge
                          invisible={notification.is_read}
                          variant="dot"
                          color="primary"
                          anchorOrigin={{ vertical: 'top', horizontal: 'left' }}
                        >
                          <Avatar
                            sx={{
                              bgcolor: `${getChipColor(notification.type)}.light`,
                              color: `${getChipColor(notification.type)}.main`,
                            }}
                          >
                            {getIcon(notification.type)}
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box display="flex" alignItems="center" gap={1}>
                            <Typography
                              variant="subtitle1"
                              fontWeight={notification.is_read ? 400 : 600}
                            >
                              {getTitle(notification)}
                            </Typography>
                            <Chip
                              label={t(`notifications.types.${notification.type}`)}
                              size="small"
                              color={getChipColor(notification.type)}
                              sx={{ height: 20 }}
                            />
                          </Box>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                              {getMessage(notification)}
                            </Typography>
                            <Typography variant="caption" color="text.disabled">
                              {formatTime(notification.created_at)}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                  </ListItem>
                  {index < notifications.length - 1 && <Divider />}
                </React.Fragment>
              ))}

              {/* Load More */}
              {hasMore && (
                <Box p={2} textAlign="center">
                  <Button
                    onClick={() => setPage(prev => prev + 1)}
                    disabled={loading}
                  >
                    {loading ? <CircularProgress size={24} /> : t('common.loadMore')}
                  </Button>
                </Box>
              )}
            </>
          )}
        </List>
      </Paper>

      {/* Context Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem
          onClick={() => {
            if (selectedNotification) {
              handleMarkAsRead(selectedNotification);
            }
            handleMenuClose();
          }}
        >
          <CheckCircle sx={{ mr: 1 }} fontSize="small" />
          {t('notifications.markAsRead')}
        </MenuItem>
        <MenuItem
          onClick={() => {
            if (selectedNotification) {
              handleDeleteNotification(selectedNotification);
            }
          }}
        >
          <Delete sx={{ mr: 1 }} fontSize="small" />
          {t('notifications.delete')}
        </MenuItem>
      </Menu>
    </Container>
  );
}
