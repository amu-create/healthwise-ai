import React, { useState, useEffect } from 'react';
import {
  Box,
  Avatar,
  Typography,
  IconButton,
  CircularProgress,
  Skeleton,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';
import StoryUploader from './StoryUploader';
import StoryViewer from './StoryViewer';

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
  is_expired: boolean;
}

interface UserStories {
  user: {
    id: number;
    username: string;
    profile_picture_url?: string;
  };
  stories: Story[];
  has_unviewed: boolean;
  latest_story_time: string;
}

export default function StorySection() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [userStories, setUserStories] = useState<UserStories[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploaderOpen, setUploaderOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState(0);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const response = await api.get('/social/stories/');
      // API 응답이 배열인지 확인
      const stories = Array.isArray(response.data) ? response.data : [];
      setUserStories(stories);
    } catch (error) {
      console.error('Failed to fetch stories:', error);
      setUserStories([]); // 오류 시 빈 배열 설정
    } finally {
      setLoading(false);
    }
  };

  const handleStoryClick = (userIndex: number, storyIndex: number = 0) => {
    setSelectedUserIndex(userIndex);
    setSelectedStoryIndex(storyIndex);
    setViewerOpen(true);
  };

  const handleStoryUpload = async (file: File, caption: string) => {
    const formData = new FormData();
    formData.append('media_file', file);
    formData.append('caption', caption);

    try {
      await api.post('/social/stories/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploaderOpen(false);
      fetchStories(); // 새로고침
    } catch (error) {
      console.error('Failed to upload story:', error);
      throw error;
    }
  };

  const StoryAvatar = ({ userStory, index }: { userStory: UserStories; index: number }) => (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        minWidth: 80,
      }}
      onClick={() => handleStoryClick(index)}
    >
      <Box
        sx={{
          position: 'relative',
          p: 0.25,
          background: userStory.has_unviewed
            ? 'linear-gradient(45deg, #FF6B6B 30%, #4ECDC4 90%)'
            : 'transparent',
          borderRadius: '50%',
        }}
      >
        <Avatar
          src={userStory.user.profile_picture_url}
          sx={{
            width: 64,
            height: 64,
            border: '3px solid',
            borderColor: 'background.paper',
          }}
        >
          {userStory.user.username[0].toUpperCase()}
        </Avatar>
      </Box>
      <Typography
        variant="caption"
        sx={{
          mt: 0.5,
          textAlign: 'center',
          width: 80,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {userStory.user.username}
      </Typography>
    </Box>
  );

  return (
    <Box
      sx={{
        mb: 3,
        py: 2,
        px: 1,
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: 1,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          gap: 2,
          overflowX: 'auto',
          overflowY: 'hidden',
          '&::-webkit-scrollbar': {
            height: 6,
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'rgba(0,0,0,0.1)',
            borderRadius: 3,
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0,0,0,0.3)',
            borderRadius: 3,
            '&:hover': {
              backgroundColor: 'rgba(0,0,0,0.5)',
            },
          },
        }}
      >
        {/* Add Story Button */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            minWidth: 80,
          }}
        >
          <IconButton
            onClick={() => setUploaderOpen(true)}
            sx={{
              width: 64,
              height: 64,
              border: '2px dashed',
              borderColor: 'primary.main',
              bgcolor: 'background.default',
              '&:hover': {
                bgcolor: 'action.hover',
              },
            }}
          >
            <Add color="primary" />
          </IconButton>
          <Typography variant="caption" sx={{ mt: 0.5 }}>
            {t('social.addStory')}
          </Typography>
        </Box>

        {/* Stories */}
        {loading ? (
          // Loading skeletons
          Array.from({ length: 5 }).map((_, index) => (
            <Box
              key={index}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minWidth: 80,
              }}
            >
              <Skeleton variant="circular" width={64} height={64} />
              <Skeleton variant="text" width={60} sx={{ mt: 0.5 }} />
            </Box>
          ))
        ) : (
          userStories.map((userStory, index) => (
            <StoryAvatar key={userStory.user.id} userStory={userStory} index={index} />
          ))
        )}
      </Box>

      {/* Story Uploader Dialog */}
      <StoryUploader
        open={uploaderOpen}
        onClose={() => setUploaderOpen(false)}
        onUpload={handleStoryUpload}
      />

      {/* Story Viewer */}
      {viewerOpen && userStories.length > 0 && (
        <StoryViewer
          open={viewerOpen}
          onClose={() => setViewerOpen(false)}
          userStories={userStories}
          initialUserIndex={selectedUserIndex}
          initialStoryIndex={selectedStoryIndex}
          onStoriesUpdate={fetchStories}
        />
      )}
    </Box>
  );
}
