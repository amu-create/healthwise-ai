import React, { useState, useEffect, useCallback } from 'react';
import {
  Container,
  Box,
  Typography,
  Tabs,
  Tab,
  Fab,
  CircularProgress,
  Paper,
  Skeleton,
  Card,
  CardContent,
  useMediaQuery,
  useTheme,
  Button,
  Snackbar,
  Alert,
  IconButton,
} from '@mui/material';
import { Add, Refresh } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// Components
import PostCard from '../components/social/PostCard';
import CreatePostDialog from '../components/social/CreatePostDialog';
import CommentDialog from '../components/social/CommentDialog';
import StorySection from '../components/social/story/StorySection';

// Types
import { Post } from '../types/social';

interface UserStory {
  user: {
    id: number;
    username: string;
    email: string;
    profile_picture_url?: string;
  };
  stories: Story[];
  has_unviewed: boolean;
  latest_story_time: string;
}

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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`social-tabpanel-${index}`}
      aria-labelledby={`social-tab-${index}`}
      {...other}
    >
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export default function SocialFeed() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const [tabValue, setTabValue] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchPosts();
  }, [tabValue]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      let response;
      
      switch (tabValue) {
        case 0: // 전체 게시물
          response = await api.get('/social/posts/feed/?feed_type=all');
          break;
        case 1: // 팔로잉
          response = await api.get('/social/posts/feed/?feed_type=following');
          break;
        case 2: // 인기
          response = await api.get('/social/posts/popular/');
          break;
        case 3: // 추천
          response = await api.get('/social/posts/recommended/');
          break;
        default:
          response = await api.get('/social/posts/feed/?feed_type=all');
      }
      
      const data = response.data.results || response.data || [];
      console.log('Fetched posts:', data); // 디버깅용
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
      setPosts([]);
      showSnackbar(t('errors.fetchFailed'), 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPosts();
  };

  const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCreatePost = async (data: {
    content: string;
    visibility: 'public' | 'followers' | 'private';
    media_file?: File;
  }) => {
    try {
      const formData = new FormData();
      formData.append('content', data.content);
      formData.append('visibility', data.visibility);
      if (data.media_file) {
        formData.append('media_file', data.media_file);
      }

      await api.post('/social/posts/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      showSnackbar(t('social.postCreated'), 'success');
      fetchPosts();
    } catch (error) {
      console.error('Failed to create post:', error);
      showSnackbar(t('errors.createPostFailed'), 'error');
    }
  };

  const handleLike = async (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isLiked = post.is_liked;
    
    // Optimistic update
    setPosts(posts.map(p => 
      p.id === postId 
        ? { 
            ...p, 
            is_liked: !isLiked,
            likes_count: isLiked ? p.likes_count - 1 : p.likes_count + 1,
            likes: isLiked 
              ? (post.likes || []).filter((like: any) => like.id !== user?.id)
              : [...(post.likes || []), { id: user?.id, username: user?.username }]
          }
        : p
    ));

    try {
      if (isLiked) {
        await api.post(`/social/posts/${postId}/unlike/`);
      } else {
        await api.post(`/social/posts/${postId}/like/`);
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Revert on error
      setPosts(posts.map(p => 
        p.id === postId 
          ? { 
              ...p, 
              is_liked: isLiked,
              likes_count: isLiked ? p.likes_count + 1 : p.likes_count - 1,
              likes: post.likes || []
            }
          : p
      ));
    }
  };

  const handleUnlike = handleLike; // Same function for unlike

  const handleComment = async (postId: number, content: string) => {
    try {
      await api.post('/social/comments/', {
        post: postId,
        content: content,
      });
      
      // Refresh posts to get updated comments
      fetchPosts();
      showSnackbar(t('social.commentAdded'), 'success');
    } catch (error) {
      console.error('Failed to add comment:', error);
      showSnackbar(t('errors.commentFailed'), 'error');
    }
  };

  const handleSave = async (postId: number) => {
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    const isSaved = post.is_saved;
    
    // Optimistic update
    setPosts(posts.map(p => 
      p.id === postId 
        ? { ...p, is_saved: !isSaved }
        : p
    ));

    try {
      if (isSaved) {
        await api.post(`/social/posts/${postId}/unsave/`);
      } else {
        await api.post(`/social/posts/${postId}/save/`);
      }
    } catch (error) {
      console.error('Failed to toggle save:', error);
      // Revert on error
      setPosts(posts.map(p => 
        p.id === postId 
          ? { ...p, is_saved: isSaved }
          : p
      ));
    }
  };

  const handleUnsave = handleSave; // Same function for unsave

  const handleDeletePost = async (postId: number) => {
    if (!window.confirm(t('social.confirmDelete'))) return;

    try {
      await api.delete(`/social/posts/${postId}/`);
      setPosts(posts.filter(post => post.id !== postId));
      showSnackbar(t('social.postDeleted'), 'success');
    } catch (error) {
      console.error('Failed to delete post:', error);
      showSnackbar(t('errors.deleteFailed'), 'error');
    }
  };

  const handleEditPost = (postId: number) => {
    // Navigate to edit page or open edit dialog
    navigate(`/social/edit/${postId}`);
  };



  const renderLoadingSkeleton = () => (
    <Box>
      {[1, 2, 3].map((i) => (
        <Card key={i} sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent>
            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <Skeleton variant="circular" width={40} height={40} />
              <Box flex={1}>
                <Skeleton variant="text" width="30%" height={20} />
                <Skeleton variant="text" width="20%" height={16} />
              </Box>
            </Box>
            <Skeleton variant="text" height={16} />
            <Skeleton variant="text" height={16} />
            <Skeleton variant="rectangular" height={300} sx={{ mt: 2, borderRadius: 1 }} />
          </CardContent>
        </Card>
      ))}
    </Box>
  );

  const renderEmptyState = (message: string, subMessage: string) => (
    <Paper sx={{ p: 6, textAlign: 'center', borderRadius: 2 }}>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        {message}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {subMessage}
      </Typography>
      {tabValue === 0 && (
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ mt: 3 }}
        >
          {t('social.createFirstPost')}
        </Button>
      )}
    </Paper>
  );

  return (
    <Container maxWidth="md" sx={{ mt: 2, mb: 4, px: { xs: 0, sm: 3 } }}>
      <Box sx={{ mb: 3, px: { xs: 2, sm: 0 } }}>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography 
            variant="h4" 
            sx={{ 
              fontWeight: 700,
              fontSize: { xs: '1.5rem', sm: '2rem' }
            }}
          >
            {t('social.title')}
          </Typography>
          <Box display="flex" gap={1}>
            <IconButton onClick={handleRefresh} disabled={refreshing}>
              <Refresh />
            </IconButton>
            <Fab
              color="primary"
              onClick={() => setCreateDialogOpen(true)}
              size={isMobile ? "small" : "medium"}
            >
              <Add />
            </Fab>
          </Box>
        </Box>
      </Box>

      {/* Stories */}
      {tabValue === 0 && <StorySection />}

      {/* Tabs */}
      <Paper 
        elevation={0}
        sx={{ 
          mb: 3,
          borderRadius: { xs: 0, sm: 2 },
          bgcolor: 'background.paper',
          borderTop: '1px solid',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant={isMobile ? "scrollable" : "fullWidth"}
          scrollButtons="auto"
          sx={{
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: { xs: '0.875rem', sm: '1rem' },
              py: 1.5,
            },
          }}
        >
          <Tab label={t('social.allPosts')} />
          <Tab label={t('social.following')} />
          <Tab label={t('social.popular')} />
          <Tab label={t('social.recommended')} />
        </Tabs>
      </Paper>

      {/* Posts */}
      {[0, 1, 2, 3].map((index) => (
        <TabPanel key={index} value={tabValue} index={index}>
          {loading ? (
            renderLoadingSkeleton()
          ) : posts.length === 0 ? (
            renderEmptyState(
              index === 0 ? t('social.noPostsYet') :
              index === 1 ? t('social.noFollowingPosts') :
              index === 2 ? t('social.noPopularPosts') :
              t('social.noRecommendedPosts'),
              index === 0 ? t('social.beTheFirst') :
              index === 1 ? t('social.followSomeone') :
              index === 2 ? t('social.checkBackLater') :
              t('social.likeMorePosts')
            )
          ) : (
            // posts가 유효한 배열인지 확인하고, 각 post와 user 속성이 있는지 확인
            posts
              .filter(post => post && post.user)
              .map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  currentUser={user}
                  onLike={handleLike}
                  onUnlike={handleUnlike}
                  onComment={handleComment}
                  onSave={handleSave}
                  onUnsave={handleUnsave}
                  onDelete={handleDeletePost}
                  onEdit={handleEditPost}
                />
            ))
          )}
        </TabPanel>
      ))}

      {/* Dialogs */}
      <CreatePostDialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        onSubmit={handleCreatePost}
      />

      <CommentDialog
        open={commentDialogOpen}
        onClose={() => setCommentDialogOpen(false)}
        post={selectedPost}
        onSubmit={async (content) => {
          if (selectedPost) {
            await handleComment(selectedPost.id, content);
          }
        }}
        formatDate={(date: string) => {
          const days = Math.floor((Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24));
          if (days === 0) return t('common.today');
          if (days === 1) return t('common.yesterday');
          return t('common.daysAgo', { days });
        }}
      />



      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}
