import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Avatar,
  Typography,
  Box,
  TextField,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { Send } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { Post, Comment } from '../../types/social';

interface CommentDialogProps {
  open: boolean;
  onClose: () => void;
  post: Post | null;
  onSubmit: (content: string) => Promise<void>;
  formatDate: (date: string) => string;
}

export default function CommentDialog({ 
  open, 
  onClose, 
  post, 
  onSubmit,
  formatDate 
}: CommentDialogProps) {
  const { t } = useTranslation();
  const [newComment, setNewComment] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;
    
    setSubmitting(true);
    try {
      await onSubmit(newComment);
      setNewComment('');
    } catch (error) {
      console.error('Failed to add comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 600 }}>
        {t('social.comments')}
      </DialogTitle>
      <DialogContent>
        {post && (
          <Box>
            {/* Comments List */}
            <List sx={{ maxHeight: 400, overflow: 'auto' }}>
              {post.comments?.map((comment) => (
                <ListItem key={comment.id} alignItems="flex-start" sx={{ px: 0 }}>
                  <ListItemAvatar>
                    <Avatar
                      src={comment.user.profile_picture_url}
                      sx={{ width: 40, height: 40 }}
                    >
                      {comment.user.username[0].toUpperCase()}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" fontWeight={600}>
                          {comment.user.username}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(comment.created_at)}
                        </Typography>
                      </Box>
                    }
                    secondary={
                      <Typography 
                        variant="body2" 
                        color="text.primary" 
                        sx={{ mt: 0.5 }}
                      >
                        {comment.content}
                      </Typography>
                    }
                  />
                </ListItem>
              ))}
            </List>

            {/* Add Comment */}
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                placeholder={t('social.addComment')}
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                variant="outlined"
                size="small"
                disabled={submitting}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton 
                        onClick={handleSubmit}
                        disabled={!newComment.trim() || submitting}
                        edge="end"
                        color="primary"
                      >
                        <Send />
                      </IconButton>
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 8 }
                }}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
            </Box>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
}
