// 인스타그램 스타일 스토리 컴포넌트
import React from 'react';
import { Box, Avatar, Typography, IconButton } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';

interface Story {
  id: number;
  user: {
    id: number;
    username: string;
    profile_image?: string;
    avatar_url?: string;
  };
  has_unviewed: boolean;
  media_url?: string;
  created_at: string;
}

interface StoryReelProps {
  stories: Story[];
  currentUser: any;
  onViewStory: (storyId: number) => void;
  onCreateStory: () => void;
}

const StoryReel: React.FC<StoryReelProps> = ({
  stories,
  currentUser,
  onViewStory,
  onCreateStory
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const currentUserStory = stories.find(s => s.user.id === currentUser?.id);
  const otherStories = stories.filter(s => s.user.id !== currentUser?.id);

  return (
    <Box sx={{ 
      p: 2, 
      borderBottom: '1px solid',
      borderColor: 'divider',
      backgroundColor: 'background.paper'
    }}>
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        overflowX: 'auto',
        '&::-webkit-scrollbar': { display: 'none' },
        msOverflowStyle: 'none',
        scrollbarWidth: 'none'
      }}>
        {/* Current User Story/Add Story */}
        <Box sx={{ textAlign: 'center', minWidth: 'fit-content' }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={currentUser?.profile_image || currentUser?.avatar_url}
              sx={{ 
                width: 56, 
                height: 56,
                border: currentUserStory ? '3px solid' : 'none',
                borderColor: currentUserStory?.has_unviewed ? 'primary.main' : 'grey.500',
                cursor: 'pointer'
              }}
              onClick={() => currentUserStory ? onViewStory(currentUserStory.id) : onCreateStory()}
            >
              {currentUser?.username?.charAt(0).toUpperCase()}
            </Avatar>
            {!currentUserStory && (
              <IconButton
                size="small"
                sx={{
                  position: 'absolute',
                  bottom: -4,
                  right: -4,
                  backgroundColor: 'primary.main',
                  color: 'white',
                  width: 24,
                  height: 24,
                  '&:hover': {
                    backgroundColor: 'primary.dark'
                  }
                }}
                onClick={onCreateStory}
              >
                <Add sx={{ fontSize: 16 }} />
              </IconButton>
            )}
          </Box>
          <Typography 
            variant="caption" 
            sx={{ 
              display: 'block',
              mt: 0.5,
              maxWidth: 64,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {currentUserStory ? t('social.yourStory') : t('social.addStory')}
          </Typography>
        </Box>

        {/* Other Users' Stories */}
        {otherStories.map((story) => (
          <Box key={story.id} sx={{ textAlign: 'center', minWidth: 'fit-content' }}>
            <Avatar
              src={story.user.profile_image || story.user.avatar_url}
              sx={{ 
                width: 56, 
                height: 56,
                border: '3px solid',
                borderColor: story.has_unviewed ? 'primary.main' : 'grey.500',
                cursor: 'pointer'
              }}
              onClick={() => onViewStory(story.id)}
            >
              {story.user.username.charAt(0).toUpperCase()}
            </Avatar>
            <Typography 
              variant="caption" 
              sx={{ 
                display: 'block',
                mt: 0.5,
                maxWidth: 64,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}
            >
              {story.user.username}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default StoryReel;
