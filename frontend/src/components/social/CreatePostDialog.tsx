import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  LinearProgress,
} from '@mui/material';
import {
  Image,
  VideoCall,
  Gif,
  Close,
  Public,
  People,
  Lock,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface CreatePostDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    content: string;
    visibility: 'public' | 'followers' | 'private';
    media_file?: File;
  }) => Promise<void>;
}

const visibilityIcons = {
  public: <Public />,
  followers: <People />,
  private: <Lock />,
};

export default function CreatePostDialog({ open, onClose, onSubmit }: CreatePostDialogProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState<'public' | 'followers' | 'private'>('public');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const handleClose = () => {
    setContent('');
    setVisibility('public');
    setSelectedFile(null);
    setFilePreview(null);
    setUploadProgress(0);
    onClose();
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onSubmit({
        content,
        visibility,
        media_file: selectedFile || undefined,
      });
      handleClose();
    } catch (error) {
      console.error('Failed to create post:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFileSelect = (file: File, type: 'image' | 'video' | 'gif') => {
    if (type === 'video') {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = function() {
        window.URL.revokeObjectURL(video.src);
        if (video.duration <= 8) {
          if (file.size <= 50 * 1024 * 1024) {
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
    } else {
      if (file.size <= 10 * 1024 * 1024) {
        setSelectedFile(file);
        setFilePreview(URL.createObjectURL(file));
      } else {
        alert(t('social.fileSizeError'));
      }
    }
  };

  return (
    <Dialog 
      open={open} 
      onClose={handleClose} 
      maxWidth="sm" 
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
        }
      }}
    >
      <DialogTitle sx={{ fontWeight: 600, fontSize: '1.25rem' }}>
        {t('social.createPost')}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ pt: 2 }}>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder={t('social.postPlaceholder')}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            variant="outlined"
            sx={{ 
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
              }
            }}
          />
          
          {/* File Upload Preview */}
          {selectedFile && filePreview && (
            <Box sx={{ mb: 2, position: 'relative' }}>
              <Box
                sx={{
                  bgcolor: '#f5f5f5',
                  borderRadius: 2,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  maxHeight: 300,
                }}
              >
                {selectedFile.type.startsWith('image/') ? (
                  <img 
                    src={filePreview} 
                    alt="Preview" 
                    style={{ 
                      width: '100%', 
                      height: 'auto',
                      maxHeight: 300, 
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                ) : selectedFile.type.startsWith('video/') ? (
                  <video 
                    src={filePreview} 
                    controls 
                    style={{ 
                      width: '100%', 
                      height: 'auto',
                      maxHeight: 300,
                      objectFit: 'contain',
                      display: 'block',
                    }}
                  />
                ) : null}
              </Box>
              <IconButton
                sx={{ 
                  position: 'absolute', 
                  top: 8, 
                  right: 8, 
                  bgcolor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0,0,0,0.8)',
                  }
                }}
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
                  sx={{ 
                    mt: 1,
                    borderRadius: 1,
                    height: 6,
                  }}
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
              sx={{
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              {t('social.addImage')}
              <input
                type="file"
                hidden
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, 'image');
                }}
              />
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<VideoCall />}
              component="label"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              {t('social.addVideo')}
              <input
                type="file"
                hidden
                accept="video/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, 'video');
                }}
              />
            </Button>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Gif />}
              component="label"
              sx={{
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              {t('social.addGif')}
              <input
                type="file"
                hidden
                accept="image/gif"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file, 'gif');
                }}
              />
            </Button>
          </Box>
          
          <FormControl fullWidth>
            <InputLabel>{t('social.visibility')}</InputLabel>
            <Select
              value={visibility}
              onChange={(e) => setVisibility(e.target.value as any)}
              sx={{
                borderRadius: 2,
              }}
            >
              <MenuItem value="public">
                <Box display="flex" alignItems="center" gap={1}>
                  <Public />
                  {t('social.visibilityPublic')}
                </Box>
              </MenuItem>
              <MenuItem value="followers">
                <Box display="flex" alignItems="center" gap={1}>
                  <People />
                  {t('social.visibilityFollowers')}
                </Box>
              </MenuItem>
              <MenuItem value="private">
                <Box display="flex" alignItems="center" gap={1}>
                  <Lock />
                  {t('social.visibilityPrivate')}
                </Box>
              </MenuItem>
            </Select>
          </FormControl>
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button 
          onClick={handleClose}
          disabled={submitting}
          sx={{ 
            borderRadius: 2,
            textTransform: 'none',
          }}
        >
          {t('common.cancel')}
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={!content.trim() || submitting}
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            px: 3,
          }}
        >
          {t('common.post')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
