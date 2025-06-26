import React, { useEffect, useState } from 'react';
import {
  Snackbar,
  Alert,
  AlertTitle,
  Box,
  Avatar,
  Typography,
  IconButton,
  Slide,
  SlideProps,
} from '@mui/material';
import { Close, FitnessCenter, Restaurant, EmojiEvents, People, Psychology, Favorite, SystemUpdate } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface NotificationToastProps {
  notification: {
    id: string;
    type: string;
    title: string;
    title_en?: string;
    title_es?: string;
    message: string;
    message_en?: string;
    message_es?: string;
    metadata?: any;
    action_url?: string;
  } | null;
  onClose: () => void;
  onClick?: () => void;
}

function SlideTransition(props: SlideProps) {
  return <Slide {...props} direction="down" />;
}

export default function NotificationToast({ notification, onClose, onClick }: NotificationToastProps) {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (notification) {
      setOpen(true);
    }
  }, [notification]);

  const handleClose = (event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
    setTimeout(onClose, 300);
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    }
    handleClose();
  };

  if (!notification) return null;

  const getIcon = () => {
    switch (notification.type) {
      case 'workout':
        return <FitnessCenter />;
      case 'nutrition':
        return <Restaurant />;
      case 'achievement':
        return <EmojiEvents />;
      case 'social':
        return <People />;
      case 'ai':
        return <Psychology />;
      case 'health':
        return <Favorite />;
      case 'system':
        return <SystemUpdate />;
      default:
        return null;
    }
  };

  const getSeverity = () => {
    switch (notification.type) {
      case 'warning':
        return 'warning';
      case 'error':
      case 'security':
        return 'error';
      case 'achievement':
      case 'celebration':
        return 'success';
      default:
        return 'info';
    }
  };

  const getTitle = () => {
    const lang = i18n.language;
    if (lang === 'en' && notification.title_en) return notification.title_en;
    if (lang === 'es' && notification.title_es) return notification.title_es;
    return notification.title;
  };

  const getMessage = () => {
    const lang = i18n.language;
    if (lang === 'en' && notification.message_en) return notification.message_en;
    if (lang === 'es' && notification.message_es) return notification.message_es;
    return notification.message;
  };

  return (
    <Snackbar
      open={open}
      autoHideDuration={6000}
      onClose={handleClose}
      TransitionComponent={SlideTransition}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ mt: 8 }}
    >
      <Alert
        severity={getSeverity()}
        onClose={handleClose}
        sx={{
          minWidth: 350,
          maxWidth: 450,
          cursor: onClick ? 'pointer' : 'default',
          boxShadow: 3,
          '& .MuiAlert-message': {
            width: '100%',
          }
        }}
        onClick={handleClick}
        icon={
          notification.metadata?.profile_picture ? (
            <Avatar 
              src={notification.metadata.profile_picture} 
              sx={{ width: 40, height: 40 }}
            />
          ) : (
            getIcon()
          )
        }
        action={
          <IconButton
            aria-label="close"
            color="inherit"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleClose();
            }}
          >
            <Close fontSize="inherit" />
          </IconButton>
        }
      >
        <AlertTitle sx={{ fontWeight: 600 }}>
          {getTitle()}
        </AlertTitle>
        <Typography variant="body2">
          {getMessage()}
        </Typography>
        
        {/* 특별한 메타데이터 표시 */}
        {notification.metadata?.badge_level && (
          <Box mt={1}>
            <Typography variant="caption" color="text.secondary">
              {notification.metadata.badge_level === 'gold' && '🥇'}
              {notification.metadata.badge_level === 'silver' && '🥈'}
              {notification.metadata.badge_level === 'bronze' && '🥉'}
              {' '}{notification.metadata.points && `+${notification.metadata.points}점`}
            </Typography>
          </Box>
        )}
      </Alert>
    </Snackbar>
  );
}
