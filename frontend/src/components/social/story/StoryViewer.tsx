import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  Box,
  Typography,
  Avatar,
  IconButton,
  LinearProgress,
  TextField,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Drawer,
} from '@mui/material';
import {
  Close,
  Visibility,
  ChevronLeft,
  ChevronRight,
  Send,
  Favorite,
  FavoriteBorder,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../../contexts/AuthContext';
import api from '../../../services/api';
import { format } from 'date-fns';
import { ko, enUS, es } from 'date-fns/locale';

interface Story {
  id: number;
  user: {
    id: number;
    username: string;
    profile_picture_url?: string;
  };
  media_file: string;
  media_type: 'image' | 'video' | 'gif';
  caption?: string;
  created_at: string;
  expires_at: string;
  views_count: number;
  has_viewed: boolean;
  viewers?: Array<{
    id: number;
    viewer: {
      id: number;
      username: string;
      profile_picture_url?: string;
    };
    viewed_at: string;
  }>;
}

interface UserStories {
  user: {
    id: number;
    username: string;
    profile_picture_url?: string;
  };
  stories: Story[];
}

interface StoryViewerProps {
  open: boolean;
  onClose: () => void;
  userStories: UserStories[];
  initialUserIndex: number;
  initialStoryIndex: number;
  onStoriesUpdate: () => void;
}

export default function StoryViewer({
  open,
  onClose,
  userStories,
  initialUserIndex,
  initialStoryIndex,
  onStoriesUpdate,
}: StoryViewerProps) {
  const { t, i18n } = useTranslation();
  const { user: currentUser } = useAuth();
  const [currentUserIndex, setCurrentUserIndex] = useState(initialUserIndex);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [reactionText, setReactionText] = useState('');
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const currentUserStories = userStories[currentUserIndex];
  const currentStory = currentUserStories?.stories[currentStoryIndex];
  const isOwnStory = currentStory?.user.id === currentUser?.id;

  // 로케일 설정
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

  useEffect(() => {
    if (!currentStory) return;

    // 스토리 조회 기록
    if (!currentStory.has_viewed) {
      api.post(`/social/stories/${currentStory.id}/view/`).catch(console.error);
    }

    // 진행 타이머 시작
    startProgress();

    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
      }
    };
  }, [currentUserIndex, currentStoryIndex]);

  const startProgress = () => {
    setProgress(0);
    
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }

    const duration = currentStory?.media_type === 'video' ? 15000 : 5000;
    const increment = 100 / (duration / 100);

    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 100;
        }
        return prev + increment;
      });
    }, 100);
  };

  const pauseProgress = () => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
    }
    setIsPaused(true);
  };

  const resumeProgress = () => {
    if (isPaused) {
      startProgress();
      setIsPaused(false);
    }
  };

  const handleNext = () => {
    if (currentStoryIndex < currentUserStories.stories.length - 1) {
      setCurrentStoryIndex(currentStoryIndex + 1);
    } else if (currentUserIndex < userStories.length - 1) {
      setCurrentUserIndex(currentUserIndex + 1);
      setCurrentStoryIndex(0);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(currentStoryIndex - 1);
    } else if (currentUserIndex > 0) {
      setCurrentUserIndex(currentUserIndex - 1);
      const prevUser = userStories[currentUserIndex - 1];
      setCurrentStoryIndex(prevUser.stories.length - 1);
    }
  };

  const handleSendReaction = async () => {
    if (!reactionText.trim() || !currentStory) return;

    try {
      await api.post(`/social/stories/${currentStory.id}/reaction/`, {
        message: reactionText,
      });
      setReactionText('');
      // 성공 피드백 표시 (토스트 등)
    } catch (error) {
      console.error('Failed to send reaction:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) {
      const minutes = Math.floor(diff / (1000 * 60));
      return t('social.minutesAgo', { count: minutes });
    }
    return t('social.hoursAgo', { count: hours });
  };

  if (!currentStory) return null;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullScreen
      sx={{
        '& .MuiDialog-paper': {
          bgcolor: 'black',
        },
      }}
    >
      <Box
        sx={{
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
        onMouseDown={pauseProgress}
        onMouseUp={resumeProgress}
        onTouchStart={pauseProgress}
        onTouchEnd={resumeProgress}
      >
        {/* Progress bars */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            display: 'flex',
            gap: 0.5,
            p: 1,
            zIndex: 2,
          }}
        >
          {currentUserStories.stories.map((_, index) => (
            <Box
              key={index}
              sx={{
                flex: 1,
                height: 3,
                bgcolor: 'rgba(255, 255, 255, 0.3)',
                borderRadius: 1,
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  width: index === currentStoryIndex ? `${progress}%` : index < currentStoryIndex ? '100%' : '0%',
                  height: '100%',
                  bgcolor: 'white',
                  transition: 'width 0.1s linear',
                }}
              />
            </Box>
          ))}
        </Box>

        {/* Header */}
        <Box
          sx={{
            position: 'absolute',
            top: 40,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            zIndex: 2,
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar src={currentStory.user.profile_picture_url} sx={{ width: 32, height: 32 }}>
              {currentStory.user.username[0].toUpperCase()}
            </Avatar>
            <Typography variant="body2" color="white" fontWeight="bold">
              {currentStory.user.username}
            </Typography>
            <Typography variant="caption" color="rgba(255, 255, 255, 0.7)">
              {formatTimeAgo(currentStory.created_at)}
            </Typography>
          </Box>
          
          <Box display="flex" alignItems="center" gap={1}>
            {isOwnStory && (
              <IconButton
                onClick={() => setShowViewers(true)}
                sx={{ color: 'white' }}
              >
                <Visibility />
                <Typography variant="caption" sx={{ ml: 0.5 }}>
                  {currentStory.views_count}
                </Typography>
              </IconButton>
            )}
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <Close />
            </IconButton>
          </Box>
        </Box>

        {/* Story content */}
        <Box
          sx={{
            flex: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            position: 'relative',
          }}
        >
          {/* Navigation areas */}
          <Box
            sx={{
              position: 'absolute',
              left: 0,
              top: 0,
              bottom: 0,
              width: '30%',
              cursor: 'pointer',
            }}
            onClick={handlePrevious}
          />
          <Box
            sx={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: '30%',
              cursor: 'pointer',
            }}
            onClick={handleNext}
          />

          {/* Media */}
          {currentStory.media_type === 'video' ? (
            <video
              ref={videoRef}
              src={currentStory.media_file}
              autoPlay
              muted
              loop
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
              onLoadedMetadata={() => {
                if (videoRef.current) {
                  videoRef.current.play();
                }
              }}
            />
          ) : (
            <img
              src={currentStory.media_file}
              alt="Story"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          )}
        </Box>

        {/* Caption and reaction input */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
          }}
        >
          {currentStory.caption && (
            <Typography variant="body1" color="white" sx={{ mb: 2 }}>
              {currentStory.caption}
            </Typography>
          )}
          
          {!isOwnStory && (
            <Box display="flex" gap={1} alignItems="center">
              <TextField
                fullWidth
                size="small"
                placeholder={t('social.replyToStory')}
                value={reactionText}
                onChange={(e) => setReactionText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleSendReaction();
                  }
                }}
                sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.1)',
                  borderRadius: 3,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.3)',
                    },
                  },
                }}
              />
              <IconButton
                onClick={handleSendReaction}
                disabled={!reactionText.trim()}
                sx={{ color: 'white' }}
              >
                <Send />
              </IconButton>
            </Box>
          )}
        </Box>
      </Box>

      {/* Viewers drawer */}
      <Drawer
        anchor="bottom"
        open={showViewers}
        onClose={() => setShowViewers(false)}
        sx={{
          '& .MuiDrawer-paper': {
            maxHeight: '70vh',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>
            {t('social.viewers')}
          </Typography>
          <List>
            {currentStory.viewers?.map((view) => (
              <ListItem key={view.id}>
                <ListItemAvatar>
                  <Avatar src={view.viewer.profile_picture_url}>
                    {view.viewer.username[0].toUpperCase()}
                  </Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={view.viewer.username}
                  secondary={format(new Date(view.viewed_at), 'PPp', { locale: getLocale() })}
                />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </Dialog>
  );
}
