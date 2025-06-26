import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  PhotoCamera as PhotoIcon,
  Videocam as VideoIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

interface StoryUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const StoryUploadDialog: React.FC<StoryUploadDialogProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    // 파일 크기 확인 (최대 50MB)
    const maxSize = 50 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError(t('social.story.fileTooLarge'));
      return;
    }

    // 파일 타입 확인
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/webm'];
    if (!allowedTypes.includes(selectedFile.type)) {
      setError(t('social.story.invalidFileType'));
      return;
    }

    setFile(selectedFile);
    setError(null);

    // 미리보기 생성
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append('media_file', file);
    if (caption) {
      formData.append('caption', caption);
    }

    try {
      await api.post('/social/stories/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // 성공
      onSuccess?.();
      handleClose();
    } catch (error: any) {
      console.error('Error uploading story:', error);
      setError(
        error.response?.data?.detail ||
        error.response?.data?.media_file?.[0] ||
        t('social.story.uploadFailed')
      );
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setPreview(null);
    setCaption('');
    setError(null);
    onClose();
  };

  const isVideo = file?.type.startsWith('video');

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">{t('social.story.createStory')}</Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!preview ? (
          <Box
            sx={{
              border: '2px dashed',
              borderColor: 'divider',
              borderRadius: 2,
              p: 4,
              textAlign: 'center',
              cursor: 'pointer',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'action.hover',
              },
            }}
            onClick={() => fileInputRef.current?.click()}
          >
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
              <PhotoIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
              <VideoIcon sx={{ fontSize: 48, color: 'text.secondary' }} />
            </Box>
            <Typography variant="h6" gutterBottom>
              {t('social.story.selectMedia')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('social.story.dragDropHint')}
            </Typography>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
              {t('social.story.supportedFormats')}
            </Typography>
          </Box>
        ) : (
          <Box>
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                maxHeight: 400,
                overflow: 'hidden',
                borderRadius: 2,
                bgcolor: 'black',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {isVideo ? (
                <video
                  src={preview}
                  controls
                  style={{
                    maxWidth: '100%',
                    maxHeight: 400,
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <img
                  src={preview}
                  alt="Preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 400,
                    objectFit: 'contain',
                  }}
                />
              )}
              <IconButton
                onClick={() => {
                  setFile(null);
                  setPreview(null);
                }}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'background.paper',
                  '&:hover': { bgcolor: 'background.default' },
                }}
              >
                <CloseIcon />
              </IconButton>
            </Box>

            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder={t('social.story.captionPlaceholder')}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              sx={{ mt: 2 }}
              inputProps={{ maxLength: 500 }}
              helperText={`${caption.length}/500`}
            />
          </Box>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,video/mp4,video/webm"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={isUploading}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!file || isUploading}
          startIcon={isUploading ? <CircularProgress size={20} /> : <UploadIcon />}
        >
          {isUploading ? t('social.story.uploading') : t('social.story.share')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default StoryUploadDialog;
