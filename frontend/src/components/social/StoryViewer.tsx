import React, { useState, useEffect } from 'react';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  LinearProgress,
  Dialog,
  DialogContent,
  TextField,
  Button,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Pause as PauseIcon,
  PlayArrow as PlayIcon,
  NavigateBefore as PrevIcon,
  NavigateNext as NextIcon,
  Send as SendIcon,
  FavoriteBorder as HeartIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

interface Story {
  id: number;
  user: {
    id: number;
    username: string;
    profile?: {
      profile_image?: string;
    };
  };
  media_file: string;
  media_type: 'image' | 'video';
  caption?: string;
  created_at: string;
  expires_at: string;
  time_remaining: number;
  is_expired: boolean;
  has_viewed: boolean;
  views_count: number;
  reactions_count: number;
  viewers?: Array<{
    id: number;
    viewer: {
      id: number;
      username: string;
      profile?: {
        profile_image?: string;
      };
    };
    viewed_at: string;
  }>;
}

interface StoryViewerProps {
  open: boolean;
  onClose: () => void;
  stories: Story[];
  initialStoryIndex?: number;
  onStoryViewed?: (storyId: number) => void;
  currentUserId?: number;
}

const StoryViewer: React.FC<StoryViewerProps> = ({
  open,
  onClose,
  stories,
  initialStoryIndex = 0,
  onStoryViewed,
  currentUserId,
}) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [reactionText, setReactionText] = useState('');
  const [showViewers, setShowViewers] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const currentStory = stories[currentIndex];
  const isOwnStory = currentStory?.user.id === currentUserId;

  // 스토리 표시 시간 (이미지: 5초, 비디오: 최대 15초)
  const storyDuration = currentStory?.media_type === 'video' ? 15000 : 5000;

  useEffect(() => {
    if (!open || !currentStory || isPaused) return;

    // 스토리 조회 기록
    if (!currentStory.has_viewed && onStoryViewed) {
      onStoryViewed(currentStory.id);
      markStoryAsViewed(currentStory.id);
    }

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          handleNext();
          return 0;
        }
        return prev + (100 / storyDuration) * 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentIndex, open, isPaused, currentStory]);

  const markStoryAsViewed = async (storyId: number) => {
    try {
      await api.post(`/api/social/stories/${storyId}/view/`);
    } catch (error) {
      console.error('Error marking story as viewed:', error);
    }
  };

  const handleNext = () => {
    if (currentIndex < stories.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
  };

  const handleReaction = async () => {
    if (!reactionText.trim()) return;

    setIsLoading(true);
    try {
      await api.post(`/api/social/stories/${currentStory.id}/react/`, {
        message: reactionText,
      });
      setReactionText('');
      // 성공 메시지 표시 (옵션)
    } catch (error) {
      console.error('Error sending reaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmojiReaction = async (emoji: string) => {
    setIsLoading(true);
    try {
      await api.post(`/api/social/stories/${currentStory.id}/react/`, {
        emoji: emoji,
      });
      // 성공 애니메이션 표시 (옵션)
    } catch (error) {
      console.error('Error sending emoji reaction:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchViewers = async () => {
    if (!isOwnStory) return;

    try {
      const response = await api.get(
        `/api/social/stories/${currentStory.id}/viewers/`
      );
      // 뷰어 목록 업데이트 로직
      setShowViewers(true);
    } catch (error) {
      console.error('Error fetching viewers:', error);
    }
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
          position: 'relative',
        },
      }}
    >
      <Box sx={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
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
          {stories.map((_, index) => (
            <LinearProgress
              key={index}
              variant="determinate"
              value={index === currentIndex ? progress : index < currentIndex ? 100 : 0}
              sx={{
                flex: 1,
                height: 3,
                bgcolor: 'rgba(255,255,255,0.3)',
                '& .MuiLinearProgress-bar': {
                  bgcolor: 'white',
                },
              }}
            />
          ))}
        </Box>

        {/* Header */}
        <Box
          sx={{
            position: 'absolute',
            top: 20,
            left: 0,
            right: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            p: 2,
            zIndex: 2,
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), transparent)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Avatar
              src={currentStory.user.profile?.profile_image}
              sx={{ width: 40, height: 40, border: '2px solid white' }}
            >
              {currentStory.user.username[0].toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="body2" sx={{ color: 'white', fontWeight: 'bold' }}>
                {currentStory.user.username}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>
                {format(new Date(currentStory.created_at), 'HH:mm', { locale: ko })}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <IconButton onClick={() => setIsPaused(!isPaused)} sx={{ color: 'white' }}>
              {isPaused ? <PlayIcon /> : <PauseIcon />}
            </IconButton>
            <IconButton onClick={onClose} sx={{ color: 'white' }}>
              <CloseIcon />
            </IconButton>
          </Box>
        </Box>

        {/* Story content */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const width = rect.width;
            
            if (x < width / 3) {
              handlePrev();
            } else if (x > (width * 2) / 3) {
              handleNext();
            }
          }}
        >
          {currentStory.media_type === 'image' ? (
            <img
              src={currentStory.media_file}
              alt="Story"
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          ) : (
            <video
              src={currentStory.media_file}
              autoPlay
              muted
              loop
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
              }}
            />
          )}
        </Box>

        {/* Caption */}
        {currentStory.caption && (
          <Box
            sx={{
              position: 'absolute',
              bottom: 100,
              left: 0,
              right: 0,
              p: 3,
              background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)',
            }}
          >
            <Typography
              variant="body1"
              sx={{
                color: 'white',
                textAlign: 'center',
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              }}
            >
              {currentStory.caption}
            </Typography>
          </Box>
        )}

        {/* Footer actions */}
        <Box
          sx={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            p: 2,
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)',
          }}
        >
          {isOwnStory ? (
            <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Chip
                icon={<ViewIcon />}
                label={`${currentStory.views_count} ${t('social.story.views')}`}
                onClick={fetchViewers}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' },
                }}
              />
              <Chip
                icon={<HeartIcon />}
                label={`${currentStory.reactions_count} ${t('social.story.reactions')}`}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                }}
              />
            </Box>
          ) : (
            <>
              {/* Emoji reactions */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {['❤️', '😍', '👏', '🔥', '😂'].map((emoji) => (
                  <IconButton
                    key={emoji}
                    onClick={() => handleEmojiReaction(emoji)}
                    disabled={isLoading}
                    sx={{
                      fontSize: '1.5rem',
                      p: 0.5,
                      '&:hover': { transform: 'scale(1.2)' },
                    }}
                  >
                    {emoji}
                  </IconButton>
                ))}
              </Box>
              {/* Text reaction */}
              <TextField
                value={reactionText}
                onChange={(e) => setReactionText(e.target.value)}
                placeholder={t('social.story.sendMessage')}
                variant="outlined"
                size="small"
                fullWidth
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleReaction();
                  }
                }}
                sx={{
                  flex: 1,
                  '& .MuiOutlinedInput-root': {
                    color: 'white',
                    '& fieldset': {
                      borderColor: 'rgba(255,255,255,0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255,255,255,0.5)',
                    },
                  },
                  '& .MuiInputBase-input::placeholder': {
                    color: 'rgba(255,255,255,0.5)',
                  },
                }}
              />
              <IconButton
                onClick={handleReaction}
                disabled={!reactionText.trim() || isLoading}
                sx={{ color: 'white' }}
              >
                <SendIcon />
              </IconButton>
            </>
          )}
        </Box>

        {/* Viewers dialog */}
        <Dialog
          open={showViewers}
          onClose={() => setShowViewers(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogContent>
            <Typography variant="h6" gutterBottom>
              {t('social.story.viewers')}
            </Typography>
            <List>
              {currentStory.viewers?.map((view) => (
                <ListItem key={view.id}>
                  <ListItemAvatar>
                    <Avatar src={view.viewer.profile?.profile_image}>
                      {view.viewer.username[0].toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={view.viewer.username}
                    secondary={format(
                      new Date(view.viewed_at),
                      'MMM d, HH:mm',
                      { locale: ko }
                    )}
                  />
                </ListItem>
              ))}
            </List>
          </DialogContent>
        </Dialog>
      </Box>
    </Dialog>
  );
};

export default StoryViewer;
