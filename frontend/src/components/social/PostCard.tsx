// 인스타그램 스타일 포스트 카드 컴포넌트
import React, { useState } from 'react';
import { 
  Card, 
  CardHeader, 
  CardContent, 
  CardActions,
  Avatar,
  IconButton,
  Typography,
  Box,
  TextField,
  Button,
  Collapse,
  Divider,
  Chip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  ChatBubbleOutline,
  BookmarkBorder,
  Bookmark,
  Share,
  MoreVert,
  Send
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import { ko, enUS, es } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { getNetworkAwareProfileImageUrl } from '../../utils/profileUtils';
import FollowButton from './FollowButton';
import ProfileCardDialog from './profile/ProfileCardDialog';

interface PostCardProps {
  post: any;
  currentUser: any;
  onLike: (postId: number) => void;
  onUnlike: (postId: number) => void;
  onComment: (postId: number, content: string) => void;
  onSave: (postId: number) => void;
  onUnsave: (postId: number) => void;
  onDelete?: (postId: number) => void;
  onEdit?: (postId: number) => void;
}

const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  onLike,
  onUnlike,
  onComment,
  onSave,
  onUnsave,
  onDelete,
  onEdit
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const isLiked = post.is_liked || post.likes?.some((like: any) => like.id === currentUser?.id);
  const isSaved = post.is_saved;
  const isOwner = post.user?.id === currentUser?.id;

  const handleLikeToggle = () => {
    if (isLiked) {
      onUnlike(post.id);
    } else {
      onLike(post.id);
    }
  };

  const handleSaveToggle = () => {
    if (isSaved) {
      onUnsave(post.id);
    } else {
      onSave(post.id);
    }
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      onComment(post.id, commentText.trim());
      setCommentText('');
    }
  };

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: t('social.sharePost'),
          text: post.content,
          url: window.location.origin + `/social/post/${post.id}`
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    }
  };

  const formatDate = (date: string) => {
    const locales = { ko, en: enUS, es };
    const locale = locales[i18n.language as keyof typeof locales] || enUS;
    return formatDistanceToNow(new Date(date), { addSuffix: true, locale });
  };

  const handleProfileClick = (userId: number) => {
    setSelectedUserId(userId);
    setProfileDialogOpen(true);
  };

  const renderMedia = () => {
    if (!post.media_file) return null;

    if (post.media_type === 'video') {
      return (
        <video
          controls
          style={{ width: '100%', maxHeight: '600px', objectFit: 'cover' }}
          src={post.media_file}
        />
      );
    } else if (post.media_type === 'gif') {
      return (
        <img
          src={post.media_file}
          alt="Post GIF"
          style={{ width: '100%', maxHeight: '600px', objectFit: 'cover' }}
        />
      );
    } else {
      return (
        <img
          src={post.media_file}
          alt="Post image"
          style={{ width: '100%', maxHeight: '600px', objectFit: 'cover' }}
        />
      );
    }
  };

  return (
    <>
      <Card sx={{ 
        mb: 3, 
        backgroundColor: 'background.paper',
        boxShadow: 'none',
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: { xs: 0, sm: 2 }
      }}>
      <CardHeader
        avatar={
          <Box 
            sx={{ cursor: 'pointer' }}
            onClick={(e) => {
              e.stopPropagation();
              handleProfileClick(post.user?.id);
            }}
          >
            <Avatar 
              src={getNetworkAwareProfileImageUrl(post.user)}
            >
              {post.user?.username?.charAt(0).toUpperCase()}
            </Avatar>
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {!isOwner && (
              <FollowButton
                userId={post.user?.id}
                isFollowing={post.user?.is_following || false}
                size="small"
              />
            )}
            {isOwner && (
              <>
                <IconButton onClick={handleMenuOpen}>
                  <MoreVert />
                </IconButton>
                <Menu
                  anchorEl={anchorEl}
                  open={Boolean(anchorEl)}
                  onClose={handleMenuClose}
                >
                  {onEdit && (
                    <MenuItem onClick={() => {
                      handleMenuClose();
                      onEdit(post.id);
                    }}>
                      {t('common.edit')}
                    </MenuItem>
                  )}
                  {onDelete && (
                    <MenuItem onClick={() => {
                      handleMenuClose();
                      onDelete(post.id);
                    }}>
                      {t('common.delete')}
                    </MenuItem>
                  )}
                </Menu>
              </>
            )}
          </Box>
        }
        title={
          <Typography 
            variant="subtitle2" 
            sx={{ 
              cursor: 'pointer', 
              fontWeight: 700,
              fontSize: '1rem'
            }}
            onClick={() => handleProfileClick(post.user?.id)}
          >
            {post.user?.username}
          </Typography>
        }
        subheader={
          <Typography variant="caption" color="text.secondary">
            {formatDate(post.created_at)}
            {post.location && ` • ${post.location}`}
          </Typography>
        }
      />

      {renderMedia()}

      <CardActions sx={{ px: 2, py: 1 }}>
        <IconButton onClick={handleLikeToggle} sx={{ color: isLiked ? 'error.main' : 'inherit' }}>
          {isLiked ? <Favorite /> : <FavoriteBorder />}
        </IconButton>
        <IconButton onClick={() => setShowComments(!showComments)}>
          <ChatBubbleOutline />
        </IconButton>
        <IconButton onClick={handleShare}>
          <Share />
        </IconButton>
        <IconButton 
          onClick={handleSaveToggle} 
          sx={{ ml: 'auto', color: isSaved ? 'primary.main' : 'inherit' }}
        >
          {isSaved ? <Bookmark /> : <BookmarkBorder />}
        </IconButton>
      </CardActions>

      <CardContent sx={{ pt: 0, px: 3 }}>
        {post.likes_count > 0 && (
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
            {t('social.likesCount', { count: post.likes_count })}
          </Typography>
        )}

        {post.content && (
          <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box sx={{ width: '100%', textAlign: 'left' }}>
              <Typography 
                component="span" 
                variant="subtitle2" 
                sx={{ 
                  fontWeight: 700,
                  mr: 1,
                  fontSize: '0.95rem',
                  cursor: 'pointer'
                }}
                onClick={() => handleProfileClick(post.user?.id)}
              >
                {post.user?.username}
              </Typography>
              <Typography 
                component="span" 
                variant="body2"
                sx={{
                  lineHeight: 1.6,
                  wordBreak: 'break-word'
                }}
              >
                {post.content}
              </Typography>
            </Box>
          </Box>
        )}

        {post.exercise_name && (
          <Box sx={{ mb: 1 }}>
            <Chip 
              label={post.exercise_name} 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ mr: 1 }}
            />
            {post.duration && (
              <Chip 
                label={`${post.duration} ${t('common.minutes')}`} 
                size="small" 
                variant="outlined"
              />
            )}
            {post.calories_burned && (
              <Chip 
                label={`${post.calories_burned} ${t('common.kcal')}`} 
                size="small" 
                variant="outlined"
                sx={{ ml: 1 }}
              />
            )}
          </Box>
        )}

        {post.comments_count > 0 && !showComments && (
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ cursor: 'pointer', mb: 1 }}
            onClick={() => setShowComments(true)}
          >
            {t('social.viewAllComments', { count: post.comments_count })}
          </Typography>
        )}

        <Collapse in={showComments}>
          <Box sx={{ mt: 2 }}>
            {post.comments?.map((comment: any) => (
              <Box key={comment.id} sx={{ mb: 1, display: 'flex', gap: 1 }}>
                <Box 
                  sx={{ cursor: 'pointer' }}
                  onClick={() => handleProfileClick(comment.user?.id)}
                >
                  <Avatar
                    src={getNetworkAwareProfileImageUrl(comment.user)}
                    sx={{ width: 28, height: 28 }}
                  >
                    {comment.user?.username?.charAt(0).toUpperCase()}
                  </Avatar>
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    component="span" 
                    variant="body2" 
                    sx={{ 
                      fontWeight: 700,
                      mr: 1, 
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                    onClick={() => handleProfileClick(comment.user?.id)}
                  >
                    {comment.user?.username}
                  </Typography>
                  <Typography component="span" variant="body2">
                    {comment.content}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" display="block">
                    {formatDate(comment.created_at)}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        </Collapse>

        <Divider sx={{ my: 1 }} />

        <Box component="form" onSubmit={handleCommentSubmit} sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            variant="standard"
            placeholder={t('social.addComment')}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            InputProps={{
              disableUnderline: true,
              sx: { fontSize: '0.875rem' }
            }}
          />
          {commentText.trim() && (
            <IconButton type="submit" size="small" color="primary">
              <Send />
            </IconButton>
          )}
        </Box>
      </CardContent>
    </Card>
    
    {/* Profile Card Dialog */}
    {selectedUserId && (
      <ProfileCardDialog
        open={profileDialogOpen}
        onClose={() => {
          setProfileDialogOpen(false);
          setSelectedUserId(null);
        }}
        userId={selectedUserId}
      />
    )}
    </>
  );
};

export default PostCard;
