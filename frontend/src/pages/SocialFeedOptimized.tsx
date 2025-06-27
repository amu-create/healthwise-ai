import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container,
  Box,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  Typography,
  Avatar,
  IconButton,
  Button,
  TextField,
  Menu,
  MenuItem,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Tabs,
  Tab,
  Fab,
  Divider,
  CircularProgress,
  Paper,
  FormControl,
  InputLabel,
  Select,
  LinearProgress,
  Skeleton,
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Comment,
  Share,
  MoreVert,
  Add,
  Public,
  People,
  Lock,
  FitnessCenter,
  Schedule,
  Image,
  VideoCall,
  Gif,
  Close,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useInView } from 'react-intersection-observer';
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

// 타입 정의는 이전과 동일
interface User {
  id: number;
  username: string;
  profile_picture_url?: string;
  bio?: string;
  followers_count: number;
  following_count: number;
  is_following: boolean;
}

interface WorkoutInfo {
  date: string;
  duration: number;
  routine_name?: string;
}

interface Comment {
  id: number;
  user: User;
  content: string;
  parent?: number;
  replies_count: number;
  created_at: string;
  updated_at: string;
}

interface WorkoutPost {
  id: number;
  user: User;
  workout_log?: number;
  workout_info?: WorkoutInfo;
  content: string;
  image_url?: string;
  media_url?: string;
  media_type?: string;
  visibility: 'public' | 'followers' | 'private';
  visibility_display: string;
  likes_count: number;
  comments_count: number;
  is_liked: boolean;
  created_at: string;
  updated_at: string;
  comments?: Comment[];
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

const visibilityIcons = {
  public: <Public />,
  followers: <People />,
  private: <Lock />,
};

// 캐시 매니저
class PostCache {
  private cache: Map<string, WorkoutPost[]> = new Map();
  private pageCache: Map<string, number> = new Map();
  
  getKey(feedType: string): string {
    return `feed_${feedType}`;
  }
  
  getPosts(feedType: string): WorkoutPost[] | null {
    return this.cache.get(this.getKey(feedType)) || null;
  }
  
  setPosts(feedType: string, posts: WorkoutPost[]) {
    this.cache.set(this.getKey(feedType), posts);
  }
  
  appendPosts(feedType: string, newPosts: WorkoutPost[]) {
    const existing = this.getPosts(feedType) || [];
    const merged = [...existing, ...newPosts];
    // 중복 제거
    const unique = Array.from(new Map(merged.map(p => [p.id, p])).values());
    this.setPosts(feedType, unique);
  }
  
  updatePost(postId: number, updates: Partial<WorkoutPost>) {
    this.cache.forEach((posts, key) => {
      const index = posts.findIndex(p => p.id === postId);
      if (index !== -1) {
        posts[index] = { ...posts[index], ...updates };
        this.cache.set(key, [...posts]);
      }
    });
  }
  
  removePost(postId: number) {
    this.cache.forEach((posts, key) => {
      const filtered = posts.filter(p => p.id !== postId);
      this.cache.set(key, filtered);
    });
  }
  
  getPage(feedType: string): number {
    return this.pageCache.get(this.getKey(feedType)) || 1;
  }
  
  setPage(feedType: string, page: number) {
    this.pageCache.set(this.getKey(feedType), page);
  }
  
  clear() {
    this.cache.clear();
    this.pageCache.clear();
  }
}

const postCache = new PostCache();

export default function SocialFeed() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [posts, setPosts] = useState<WorkoutPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<WorkoutPost | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState({
    content: '',
    visibility: 'public' as 'public' | 'followers' | 'private',
    workout_log: null as number | null,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [newComment, setNewComment] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedPostMenu, setSelectedPostMenu] = useState<number | null>(null);
  
  const { ref: loadMoreRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  const getFeedType = () => {
    return tabValue === 0 ? 'all' : tabValue === 1 ? 'following' : 'my';
  };

  useEffect(() => {
    const feedType = getFeedType();
    const cachedPosts = postCache.getPosts(feedType);
    
    if (cachedPosts) {
      setPosts(cachedPosts);
      setLoading(false);
    } else {
      fetchPosts(true);
    }
  }, [tabValue]);

  useEffect(() => {
    if (inView && hasMore && !loading && !loadingMore) {
      fetchPosts(false);
    }
  }, [inView, hasMore, loading, loadingMore]);

  const fetchPosts = async (reset = false) => {
    if (reset) {
      setLoading(true);
      setHasMore(true);
    } else {
      setLoadingMore(true);
    }

    try {
      const feedType = getFeedType();
      const page = reset ? 1 : postCache.getPage(feedType) + 1;
      
      const response = await api.get(`/social/posts/feed/`, {
        params: {
          feed_type: feedType,
          page,
          page_size: 10,
        },
      });

      const newPosts = response.data.results || [];
      
      if (reset) {
        setPosts(newPosts);
        postCache.setPosts(feedType, newPosts);
      } else {
        setPosts(prev => [...prev, ...newPosts]);
        postCache.appendPosts(feedType, newPosts);
      }
      
      postCache.setPage(feedType, page);
      setHasMore(newPosts.length === 10);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleCreatePost = async () => {
    try {
      const formData = new FormData();
      formData.append('content', newPost.content);
      formData.append('visibility', newPost.visibility);
      if (newPost.workout_log) {
        formData.append('workout_log', newPost.workout_log.toString());
      }
      if (selectedFile) {
        formData.append('media', selectedFile);
      }

      const response = await api.post('/social/posts/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / (progressEvent.total || 1)
          );
          setUploadProgress(percentCompleted);
        },
      });
      
      // 캐시 초기화 및 새로고침
      postCache.clear();
      setCreateDialogOpen(false);
      setNewPost({ content: '', visibility: 'public', workout_log: null });
      setSelectedFile(null);
      setFilePreview(null);
      setUploadProgress(0);
      fetchPosts(true);
    } catch (error) {
      console.error('Failed to create post:', error);
    }
  };

  const handleLike = useCallback(async (postId: number, isLiked: boolean) => {
    // 낙관적 업데이트
    setPosts(prev =>
      prev.map(post =>
        post.id === postId
          ? {
              ...post,
              is_liked: !isLiked,
              likes_count: isLiked ? post.likes_count - 1 : post.likes_count + 1,
            }
          : post
      )
    );
    
    postCache.updatePost(postId, {
      is_liked: !isLiked,
      likes_count: posts.find(p => p.id === postId)?.likes_count || 0 + (isLiked ? -1 : 1),
    });

    try {
      if (isLiked) {
        await api.post(`/social/posts/${postId}/unlike/`);
      } else {
        await api.post(`/social/posts/${postId}/like/`);
      }
    } catch (error) {
      // 실패 시 롤백
      setPosts(prev =>
        prev.map(post =>
          post.id === postId
            ? {
                ...post,
                is_liked: isLiked,
                likes_count: isLiked ? post.likes_count + 1 : post.likes_count - 1,
              }
            : post
        )
      );
      console.error('Failed to toggle like:', error);
    }
  }, [posts]);

  const handleComment = async () => {
    if (!selectedPost || !newComment.trim()) return;

    try {
      await api.post(`/social/posts/${selectedPost.id}/comment/`, {
        content: newComment,
      });
      setNewComment('');
      setCommentDialogOpen(false);
      
      // 댓글 수 업데이트
      setPosts(prev =>
        prev.map(post =>
          post.id === selectedPost.id
            ? { ...post, comments_count: post.comments_count + 1 }
            : post
        )
      );
      postCache.updatePost(selectedPost.id, {
        comments_count: selectedPost.comments_count + 1,
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
    }
  };

  const handleFollow = useCallback(async (userId: number, isFollowing: boolean) => {
    // 낙관적 업데이트
    setPosts(prev =>
      prev.map(post =>
        post.user.id === userId
          ? { ...post, user: { ...post.user, is_following: !isFollowing } }
          : post
      )
    );

    try {
      if (isFollowing) {
        await api.post(`/social/profiles/${userId}/unfollow/`);
      } else {
        await api.post(`/social/profiles/${userId}/follow/`);
      }
    } catch (error) {
      // 실패 시 롤백
      setPosts(prev =>
        prev.map(post =>
          post.user.id === userId
            ? { ...post, user: { ...post.user, is_following: isFollowing } }
            : post
        )
      );
      console.error('Failed to toggle follow:', error);
    }
  }, []);

  const handleDeletePost = async (postId: number) => {
    try {
      await api.delete(`/social/posts/${postId}/`);
      setPosts(prev => prev.filter(post => post.id !== postId));
      postCache.removePost(postId);
      setAnchorEl(null);
    } catch (error) {
      console.error('Failed to delete post:', error);
    }
  };

  const formatDate = (dateString: string) => {
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

  const PostSkeleton = () => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <Skeleton variant="circular" width={40} height={40} />
          <Box flex={1}>
            <Skeleton variant="text" width="30%" />
            <Skeleton variant="text" width="20%" />
          </Box>
        </Box>
        <Skeleton variant="text" />
        <Skeleton variant="text" />
        <Skeleton variant="rectangular" height={200} sx={{ mt: 2 }} />
      </CardContent>
    </Card>
  );

  const renderPost = (post: WorkoutPost) => {
    return (
      <motion.div
        key={post.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        <Card sx={{ mb: 2 }}>
          <CardContent>
            {/* Post Header */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar src={post.user.profile_picture_url} alt={post.user.username}>
                  {post.user.username[0].toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {post.user.username}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(post.created_at)}
                    </Typography>
                    <Chip
                      icon={visibilityIcons[post.visibility]}
                      label={post.visibility_display}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Box>
              </Box>
              <Box>
                {user && user.id !== post.user.id && (
                  <Button
                    size="small"
                    variant={post.user.is_following ? "outlined" : "contained"}
                    onClick={() => handleFollow(post.user.id, post.user.is_following)}
                  >
                    {post.user.is_following ? t('social.unfollow') : t('social.follow')}
                  </Button>
                )}
                {user && user.id === post.user.id && (
                  <IconButton
                    onClick={(e) => {
                      setAnchorEl(e.currentTarget);
                      setSelectedPostMenu(post.id);
                    }}
                  >
                    <MoreVert />
                  </IconButton>
                )}
              </Box>
            </Box>

            {/* Workout Info */}
            {post.workout_info && (
              <Card variant="outlined" sx={{ mb: 2, p: 1.5, bgcolor: 'background.default' }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <FitnessCenter color="primary" />
                  <Box>
                    <Typography variant="body2" fontWeight="bold">
                      {post.workout_info.routine_name || t('social.workout')}
                    </Typography>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="caption" color="text.secondary">
                        <Schedule sx={{ fontSize: 14, mr: 0.5, verticalAlign: 'middle' }} />
                        {post.workout_info.duration} {t('common.minutes')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(post.workout_info.date).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Card>
            )}

            {/* Post Content */}
            <Typography variant="body1" paragraph>
              {post.content}
            </Typography>

            {/* Post Media with Lazy Loading */}
            {(post.media_url || post.image_url) && (
              <>
                {post.media_type === 'video' || 
                 (post.media_url || post.image_url)?.endsWith('.mp4') || 
                 (post.media_url || post.image_url)?.endsWith('.webm') ? (
                  <video
                    src={post.media_url || post.image_url}
                    controls
                    style={{ width: '100%', maxHeight: 400, borderRadius: 8 }}
                    preload="metadata"
                  />
                ) : (
                  <LazyLoadImage
                    src={post.media_url || post.image_url || ''}
                    alt="Post media"
                    effect="blur"
                    style={{
                      width: '100%',
                      maxHeight: 400,
                      objectFit: 'cover',
                      borderRadius: 8,
                      marginBottom: 16,
                    }}
                    placeholderSrc={`${post.media_url || post.image_url}?w=50&blur=10`}
                  />
                )}
              </>
            )}
          </CardContent>

          {/* Post Actions */}
          <Divider />
          <CardActions>
            <IconButton onClick={() => handleLike(post.id, post.is_liked)}>
              {post.is_liked ? <Favorite color="error" /> : <FavoriteBorder />}
            </IconButton>
            <Typography variant="body2" color="text.secondary">
              {post.likes_count}
            </Typography>
            
            <IconButton
              onClick={() => {
                setSelectedPost(post);
                setCommentDialogOpen(true);
              }}
            >
              <Comment />
            </IconButton>
            <Typography variant="body2" color="text.secondary">
              {post.comments_count}
            </Typography>
            
            <IconButton>
              <Share />
            </IconButton>
          </CardActions>
        </Card>
      </motion.div>
    );
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">{t('social.title')}</Typography>
        <Fab
          color="primary"
          onClick={() => setCreateDialogOpen(true)}
          size="medium"
        >
          <Add />
        </Fab>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label={t('social.allPosts')} />
          <Tab label={t('social.following')} />
          <Tab label={t('social.myPosts')} />
        </Tabs>
      </Paper>

      <AnimatePresence>
        {loading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : (
          <>
            {posts.map(post => renderPost(post))}
            
            {/* 무한 스크롤 로더 */}
            {hasMore && (
              <Box ref={loadMoreRef} display="flex" justifyContent="center" p={2}>
                {loadingMore && <CircularProgress />}
              </Box>
            )}
            
            {!hasMore && posts.length > 0 && (
              <Box textAlign="center" py={4}>
                <Typography variant="body2" color="text.secondary">
                  {t('social.noMorePosts')}
                </Typography>
              </Box>
            )}
            
            {posts.length === 0 && (
              <Box textAlign="center" py={8}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t('social.noPosts')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('social.startSharing')}
                </Typography>
              </Box>
            )}
          </>
        )}
      </AnimatePresence>

      {/* Create Post Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('social.createPost')}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder={t('social.postPlaceholder')}
              value={newPost.content}
              onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
              sx={{ mb: 2 }}
            />
            
            {/* File Upload Preview */}
            {selectedFile && filePreview && (
              <Box sx={{ mb: 2, position: 'relative' }}>
                {selectedFile.type.startsWith('image/') ? (
                  <img 
                    src={filePreview} 
                    alt="Preview" 
                    style={{ width: '100%', maxHeight: 300, objectFit: 'cover', borderRadius: 8 }}
                  />
                ) : selectedFile.type.startsWith('video/') ? (
                  <video 
                    src={filePreview} 
                    controls 
                    style={{ width: '100%', maxHeight: 300, borderRadius: 8 }}
                  />
                ) : null}
                <IconButton
                  sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'background.paper' }}
                  onClick={() => {
                    setSelectedFile(null);
                    setFilePreview(null);
                  }}
                >
                  <Close />
                </IconButton>
                {uploadProgress > 0 && uploadProgress < 100 && (
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress} 
                    sx={{ mt: 1 }}
                  />
                )}
              </Box>
            )}
            
            {/* Media Buttons */}
            <Box display="flex" gap={1} mb={2}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Image />}
                component="label"
              >
                {t('social.addImage')}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 10 * 1024 * 1024) { // 10MB limit
                      setSelectedFile(file);
                      setFilePreview(URL.createObjectURL(file));
                    } else {
                      alert(t('social.fileSizeError'));
                    }
                  }}
                />
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<VideoCall />}
                component="label"
              >
                {t('social.addVideo')}
                <input
                  type="file"
                  hidden
                  accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      // Check video duration
                      const video = document.createElement('video');
                      video.preload = 'metadata';
                      video.onloadedmetadata = function() {
                        window.URL.revokeObjectURL(video.src);
                        if (video.duration <= 8) {
                          if (file.size <= 50 * 1024 * 1024) { // 50MB limit for videos
                            setSelectedFile(file);
                            setFilePreview(URL.createObjectURL(file));
                          } else {
                            alert(t('social.videoSizeError'));
                          }
                        } else {
                          alert(t('social.videoDurationError'));
                        }
                      };
                      video.src = URL.createObjectURL(file);
                    }
                  }}
                />
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Gif />}
                component="label"
              >
                {t('social.addGif')}
                <input
                  type="file"
                  hidden
                  accept="image/gif"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file && file.size <= 10 * 1024 * 1024) { // 10MB limit
                      setSelectedFile(file);
                      setFilePreview(URL.createObjectURL(file));
                    } else {
                      alert(t('social.fileSizeError'));
                    }
                  }}
                />
              </Button>
            </Box>
            
            <FormControl fullWidth>
              <InputLabel>{t('social.visibility')}</InputLabel>
              <Select
                value={newPost.visibility}
                onChange={(e) => setNewPost({ ...newPost, visibility: e.target.value as any })}
                startAdornment={visibilityIcons[newPost.visibility]}
              >
                <MenuItem value="public">
                  <Public sx={{ mr: 1 }} />
                  {t('social.visibilityPublic')}
                </MenuItem>
                <MenuItem value="followers">
                  <People sx={{ mr: 1 }} />
                  {t('social.visibilityFollowers')}
                </MenuItem>
                <MenuItem value="private">
                  <Lock sx={{ mr: 1 }} />
                  {t('social.visibilityPrivate')}
                </MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setCreateDialogOpen(false);
            setSelectedFile(null);
            setFilePreview(null);
          }}>{t('common.cancel')}</Button>
          <Button onClick={handleCreatePost} variant="contained" disabled={!newPost.content.trim()}>
            {t('common.post')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onClose={() => setCommentDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{t('social.comments')}</DialogTitle>
        <DialogContent>
          {selectedPost && (
            <Box>
              {/* Comments List */}
              <List>
                {selectedPost.comments?.map((comment) => (
                  <ListItem key={comment.id} alignItems="flex-start">
                    <ListItemAvatar>
                      <Avatar src={comment.user.profile_picture_url}>
                        {comment.user.username[0].toUpperCase()}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={comment.user.username}
                      secondary={
                        <>
                          <Typography variant="body2" color="text.primary">
                            {comment.content}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {formatDate(comment.created_at)}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>

              {/* Add Comment */}
              <Box display="flex" gap={1} mt={2}>
                <TextField
                  fullWidth
                  placeholder={t('social.addComment')}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleComment();
                    }
                  }}
                />
                <Button onClick={handleComment} variant="contained" disabled={!newComment.trim()}>
                  {t('common.send')}
                </Button>
              </Box>
            </Box>
          )}
        </DialogContent>
      </Dialog>

      {/* Post Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={() => setAnchorEl(null)}
      >
        <MenuItem onClick={() => handleDeletePost(selectedPostMenu!)}>
          {t('common.delete')}
        </MenuItem>
      </Menu>
    </Container>
  );
}
