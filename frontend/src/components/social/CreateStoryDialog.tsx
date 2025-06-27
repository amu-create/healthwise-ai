import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  PhotoCamera,
  Videocam,
  Close,
  CloudUpload,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface CreateStoryDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: {
    media_file: File;
    caption?: string;
  }) => Promise<void>;
}

const CreateStoryDialog: React.FC<CreateStoryDialogProps> = ({
  open,
  onClose,
  onSubmit
}) => {
  const { t } = useTranslation();
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(file.type)) {
      setError(t('errors.invalidFileType'));
      return;
    }

    // Validate file size
    const maxSize = file.type.startsWith('video') ? 50 * 1024 * 1024 : 10 * 1024 * 1024; // 50MB for video, 10MB for image
    if (file.size > maxSize) {
      setError(t('errors.fileTooLarge'));
      return;
    }

    setError(null);
    setMediaFile(file);

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setMediaPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!mediaFile) {
      setError(t('social.selectMedia'));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await onSubmit({
        media_file: mediaFile,
        caption: caption.trim() || undefined
      });
      
      // Reset form
      setMediaFile(null);
      setMediaPreview(null);
      setCaption('');
      onClose();
    } catch (error) {
      console.error('Failed to create story:', error);
      setError(t('errors.createStoryFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setMediaFile(null);
      setMediaPreview(null);
      setCaption('');
      setError(null);
      onClose();
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
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Typography variant="h6">{t('social.createStory')}</Typography>
        <IconButton onClick={handleClose} disabled={loading}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!mediaPreview ? (
          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.3s',
              '&:hover': {
                borderColor: 'primary.main',
                backgroundColor: 'action.hover',
              }
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Box sx={{ mb: 2 }}>
              <PhotoCamera sx={{ fontSize: 48, color: 'text.secondary', mr: 2 }} />
              <Videocam sx={{ fontSize: 48, color: 'text.secondary' }} />
            </Box>
            <Typography variant="h6" gutterBottom>
              {t('social.uploadStoryMedia')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('social.dragDropOrClick')}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              {t('social.storyMediaRequirements')}
            </Typography>
          </Box>
        ) : (
          <Box>
            <Box sx={{ position: 'relative', mb: 2 }}>
              {mediaFile?.type.startsWith('image') ? (
                <img
                  src={mediaPreview}
                  alt="Story preview"
                  style={{
                    width: '100%',
                    maxHeight: '400px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                />
              ) : (
                <video
                  src={mediaPreview}
                  controls
                  style={{
                    width: '100%',
                    maxHeight: '400px',
                    objectFit: 'contain',
                    borderRadius: '8px',
                  }}
                />
              )}
              <IconButton
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  backgroundColor: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  '&:hover': {
                    backgroundColor: 'rgba(0,0,0,0.8)',
                  }
                }}
                onClick={() => {
                  setMediaFile(null);
                  setMediaPreview(null);
                }}
              >
                <Close />
              </IconButton>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder={t('social.storyCaption')}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              inputProps={{ maxLength: 500 }}
              helperText={`${caption.length}/500`}
            />
          </Box>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={handleClose} disabled={loading}>
          {t('common.cancel')}
        </Button>
        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={!mediaFile || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <CloudUpload />}
        >
          {loading ? t('common.uploading') : t('social.shareStory')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CreateStoryDialog;
