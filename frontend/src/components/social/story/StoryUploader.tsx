import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  IconButton,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Close,
  PhotoCamera,
  Videocam,
  Gif,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface StoryUploaderProps {
  open: boolean;
  onClose: () => void;
  onUpload: (file: File, caption: string) => Promise<void>;
}

export default function StoryUploader({ open, onClose, onUpload }: StoryUploaderProps) {
  const { t } = useTranslation();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 체크
    const maxSize = file.type.startsWith('video/') ? 50 * 1024 * 1024 : 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setError(t('social.fileSizeTooLarge'));
      return;
    }

    // 비디오 길이 체크
    if (file.type.startsWith('video/')) {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = function () {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 15) {
          setError(t('social.videoTooLong'));
          return;
        }
        setSelectedFile(file);
        setPreview(URL.createObjectURL(file));
        setError(null);
      };
      video.src = URL.createObjectURL(file);
    } else {
      setSelectedFile(file);
      setPreview(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      await onUpload(selectedFile, caption);
      handleClose();
    } catch (error: any) {
      console.error('Upload error:', error);
      setError(error.response?.data?.detail || t('social.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleClose = () => {
    setSelectedFile(null);
    setPreview(null);
    setCaption('');
    setError(null);
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">{t('social.addStory')}</Typography>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </Box>
      </DialogTitle>
      
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!selectedFile ? (
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              py: 4,
            }}
          >
            <Typography variant="body1" color="text.secondary" gutterBottom>
              {t('social.selectStoryMedia')}
            </Typography>
            
            <Box display="flex" gap={2}>
              <Button
                variant="outlined"
                startIcon={<PhotoCamera />}
                onClick={() => fileInputRef.current?.click()}
              >
                {t('social.photo')}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Videocam />}
                onClick={() => fileInputRef.current?.click()}
              >
                {t('social.video')}
              </Button>
              <Button
                variant="outlined"
                startIcon={<Gif />}
                onClick={() => fileInputRef.current?.click()}
              >
                {t('social.gif')}
              </Button>
            </Box>
            
            <input
              ref={fileInputRef}
              type="file"
              hidden
              accept="image/*,video/*"
              onChange={handleFileSelect}
            />
          </Box>
        ) : (
          <Box>
            {/* Preview */}
            <Box
              sx={{
                position: 'relative',
                width: '100%',
                maxHeight: 400,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                bgcolor: 'black',
                borderRadius: 2,
                overflow: 'hidden',
                mb: 2,
              }}
            >
              {selectedFile.type.startsWith('video/') ? (
                <video
                  src={preview!}
                  controls
                  style={{
                    maxWidth: '100%',
                    maxHeight: 400,
                    objectFit: 'contain',
                  }}
                />
              ) : (
                <img
                  src={preview!}
                  alt="Story preview"
                  style={{
                    maxWidth: '100%',
                    maxHeight: 400,
                    objectFit: 'contain',
                  }}
                />
              )}
              
              <IconButton
                onClick={() => {
                  setSelectedFile(null);
                  setPreview(null);
                }}
                sx={{
                  position: 'absolute',
                  top: 8,
                  right: 8,
                  bgcolor: 'rgba(0, 0, 0, 0.6)',
                  color: 'white',
                  '&:hover': {
                    bgcolor: 'rgba(0, 0, 0, 0.8)',
                  },
                }}
              >
                <Close />
              </IconButton>
            </Box>

            {/* Caption */}
            <TextField
              fullWidth
              multiline
              rows={2}
              placeholder={t('social.addCaption')}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              sx={{ mb: 2 }}
            />

            {/* Info */}
            <Alert severity="info" sx={{ mt: 2 }}>
              {t('social.storyInfo')}
            </Alert>
          </Box>
        )}

        {uploading && <LinearProgress sx={{ mt: 2 }} />}
      </DialogContent>

      <DialogActions>
        <Button onClick={handleClose} disabled={uploading}>
          {t('common.cancel')}
        </Button>
        <Button
          onClick={handleUpload}
          variant="contained"
          disabled={!selectedFile || uploading}
        >
          {uploading ? t('common.uploading') : t('social.shareStory')}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
