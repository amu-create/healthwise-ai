import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  LinearProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  CloudUpload,
  VideoLibrary,
  CheckCircle,
  Info
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { analyzeVideo } from '../../services/pose-analysis/poseAnalysisService';
import { Exercise } from '../../services/pose-analysis/exercises';

interface VideoUploadProps {
  onUpload: (file: File) => void;
  exercise: Exercise | null;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onUpload, exercise }) => {
  const { t } = useTranslation();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      // 파일 검증
      const validTypes = ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov', 'video/quicktime'];
      const fileType = selectedFile.type.toLowerCase();
      
      if (!validTypes.includes(fileType)) {
        setError(t('pose_analysis.invalid_file_type'));
        return;
      }
      
      // 파일 크기 검증 (100MB)
      if (selectedFile.size > 100 * 1024 * 1024) {
        setError(t('pose_analysis.file_too_large'));
        return;
      }
      
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError(t('pose_analysis.select_file_first'));
      return;
    }
    
    if (!exercise) {
      setError(t('pose_analysis.select_exercise_first'));
      return;
    }
    
    console.log('Starting upload process...');
    console.log('File:', file.name, 'Exercise:', exercise.name);
    
    setUploading(true);
    setError(null);
    
    try {
      // 진행률 시뮬레이션
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);
      
      // 진행률 100% 만들기
      setTimeout(() => {
        clearInterval(progressInterval);
        setUploadProgress(100);
        
        // 분석 시작
        console.log('Calling onUpload with file:', file);
        onUpload(file);
        
        // UI 초기화
        setTimeout(() => {
          setUploading(false);
          setUploadProgress(0);
          setFile(null);
        }, 300);
      }, 1000);
      
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.response?.data?.error || err.message || t('pose_analysis.upload_failed'));
      setUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Box>
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          border: '2px dashed',
          borderColor: file ? 'primary.main' : 'divider',
          bgcolor: 'background.default',
          cursor: 'pointer',
          transition: 'all 0.3s',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'action.hover'
          }
        }}
      >
        <VideoLibrary sx={{ fontSize: 60, color: file ? 'primary.main' : 'text.secondary', mb: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          {t('pose_analysis.drag_drop_video')}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t('pose_analysis.or_click_to_select')}
        </Typography>
        
        <Button
          variant="contained"
          component="label"
          startIcon={<CloudUpload />}
          disabled={uploading}
        >
          {t('pose_analysis.select_video')}
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            style={{ display: 'none' }}
            disabled={uploading}
          />
        </Button>
      </Paper>

      {/* 파일 정보 */}
      {file && !error && (
        <Box sx={{ mt: 3 }}>
          <Alert severity="success" icon={<CheckCircle />}>
            <Typography variant="subtitle2">
              {t('pose_analysis.selected_file')}: {file.name}
            </Typography>
            <Typography variant="caption">
              {t('pose_analysis.file_size')}: {(file.size / 1024 / 1024).toFixed(2)} MB
            </Typography>
          </Alert>
          
          {!uploading && (
            <Box sx={{ mt: 2, textAlign: 'center' }}>
              <Button
                variant="contained"
                size="large"
                onClick={handleUpload}
                startIcon={<CloudUpload />}
              >
                {t('pose_analysis.start_upload_analysis')}
              </Button>
            </Box>
          )}
        </Box>
      )}

      {/* 업로드 진행률 */}
      {uploading && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="body2" sx={{ mb: 1 }}>
            {t('pose_analysis.uploading')}... {uploadProgress}%
          </Typography>
          <LinearProgress variant="determinate" value={uploadProgress} />
        </Box>
      )}

      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* 지원 정보 */}
      <Box sx={{ mt: 3 }}>
        <Alert severity="info" icon={<Info />}>
          <Typography variant="subtitle2" gutterBottom>
            {t('pose_analysis.supported_formats')}:
          </Typography>
          <List dense>
            <ListItem>
              <ListItemIcon>
                <CheckCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="MP4, WebM, OGG, AVI, MOV" />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('pose_analysis.max_file_size')} />
            </ListItem>
            <ListItem>
              <ListItemIcon>
                <CheckCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText primary={t('pose_analysis.clear_video_required')} />
            </ListItem>
          </List>
        </Alert>
      </Box>
    </Box>
  );
};

export default VideoUpload;
