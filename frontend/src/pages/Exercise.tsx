import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Skeleton,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

import {
  PlayArrow,
  Favorite,
  FavoriteBorder,
  Search,
  FilterList,
  Close,
  Timer,
  LocalFireDepartment,
  FitnessCenter,
} from '@mui/icons-material';
import { useWorkoutVideos } from '../hooks/useData';
import { useDebounce, usePageTitle } from '../hooks';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

interface WorkoutVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
  description: string;
  publishedAt: string;
  category: string;
  difficulty: string;
}

const Exercise: React.FC = () => {
  const { t } = useTranslation();
  usePageTitle(t('pages.exercise.title'));
  
  // 필터 상태
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [difficulty, setDifficulty] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // 선택된 영상
  const [selectedVideo, setSelectedVideo] = useState<WorkoutVideo | null>(null);
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  
  // 좋아요 상태
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set());
  
  // 디바운스된 검색어
  const debouncedSearch = useDebounce(search, 500);
  
  // 데이터 fetching
  const { data, loading, error } = useWorkoutVideos({
    search: debouncedSearch,
    category: category || undefined,
    difficulty: difficulty || undefined,
  });
  
  // 영상 재생
  const handlePlayVideo = useCallback((video: WorkoutVideo) => {
    setSelectedVideo(video);
    setShowVideoDialog(true);
  }, []);
  
  // 운동 기록 추가
  const handleLogWorkout = useCallback(async (video: WorkoutVideo) => {
    try {
      const workoutData = {
        date: new Date().toISOString().split('T')[0],
        workout_name: video.title,
        workout_type: 'home',
        duration: 30, // 기본 30분으로 설정
        notes: `YouTube 영상: ${video.title}`,
      };
      
      await api.post('/api/workouts/', workoutData);
      
      // 성공 메시지 (토스트 등)
      alert(t('pages.exercise.workoutLogged'));
      
      // 비디오 다이얼로그 닫기
      setShowVideoDialog(false);
    } catch (error) {
      console.error('Failed to log workout:', error);
      alert(t('pages.exercise.workoutLogFailed'));
    }
  }, []);
  
  // 좋아요 토글
  const handleToggleLike = useCallback((videoId: string) => {
    setLikedVideos(prev => {
      const newSet = new Set(prev);
      if (newSet.has(videoId)) {
        newSet.delete(videoId);
      } else {
        newSet.add(videoId);
      }
      return newSet;
    });
  }, []);
  
  // 시간 포맷
  const formatDuration = useCallback((seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }, []);
  
  // 난이도 라벨
  const getDifficultyLabel = useCallback((difficulty: string): string => {
    const labels: Record<string, string> = {
      beginner: t('pages.exercise.difficulty.beginner'),
      intermediate: t('pages.exercise.difficulty.intermediate'),
      advanced: t('pages.exercise.difficulty.advanced'),
    };
    return labels[difficulty] || difficulty;
  }, [t]);
  
  // 난이도 색상
  const getDifficultyColor = useCallback((difficulty: string): 'success' | 'warning' | 'error' => {
    const colors: Record<string, 'success' | 'warning' | 'error'> = {
      beginner: 'success',
      intermediate: 'warning',
      advanced: 'error',
    };
    return colors[difficulty] || 'success';
  }, []);
  
  // 카테고리 목록
  const categories = [
    { value: 'all', label: t('pages.exercise.categories.all') },
    { value: 'cardio', label: t('pages.exercise.categories.cardio') },
    { value: 'strength', label: t('pages.exercise.categories.strength') },
    { value: 'yoga', label: t('pages.exercise.categories.yoga') },
    { value: 'pilates', label: t('pages.exercise.categories.pilates') },
    { value: 'hiit', label: t('pages.exercise.categories.hiit') },
    { value: 'stretching', label: t('pages.exercise.categories.stretching') },
  ];
  
  const videos = data?.items || [];
  
  return (
    <Box>
      {/* 헤더 */}
      <Box mb={4}>
        <Typography variant="h4" fontWeight={900} mb={1}>
          {t('pages.exercise.title')}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('pages.exercise.subtitle')}
        </Typography>
      </Box>
      
      {/* 검색 및 필터 */}
      <Box mb={4} sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
        <Box sx={{ gridColumn: { xs: '1', md: 'span 2' } }}>
          <TextField
            fullWidth
            placeholder={t('pages.exercise.searchPlaceholder')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
          />
        </Box>
        <Box>
          <FormControl fullWidth>
            <InputLabel>{t('pages.exercise.category')}</InputLabel>
            <Select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              label={t('pages.exercise.category')}
            >
              {categories.map((cat) => (
                <MenuItem key={cat.value} value={cat.value}>
                  {cat.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box>
          <FormControl fullWidth>
            <InputLabel>{t('pages.exercise.difficulty.label')}</InputLabel>
            <Select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              label={t('pages.exercise.difficulty.label')}
            >
              <MenuItem value="">{t('pages.exercise.categories.all')}</MenuItem>
              <MenuItem value="beginner">{t('pages.exercise.difficulty.beginner')}</MenuItem>
              <MenuItem value="intermediate">{t('pages.exercise.difficulty.intermediate')}</MenuItem>
              <MenuItem value="advanced">{t('pages.exercise.difficulty.advanced')}</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Box>
          <Button
            fullWidth
            variant="outlined"
            startIcon={<FilterList />}
            onClick={() => setShowFilters(!showFilters)}
          >
            {t('common.filter')}
          </Button>
        </Box>
      </Box>
      
      {/* 에러 메시지 */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {t('pages.exercise.loadError')}
        </Alert>
      )}
      
      {/* 영상 목록 */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' }, gap: 2 }}>
        {loading ? (
          // 스켈레톤 로딩
          Array.from({ length: 6 }).map((_, index) => (
            <Box key={index}>
              <Card>
                <Skeleton variant="rectangular" height={180} />
                <CardContent>
                  <Skeleton variant="text" height={28} />
                  <Skeleton variant="text" width="60%" />
                  <Box mt={2}>
                    <Skeleton variant="text" width="40%" />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          ))
        ) : (
          videos.map((video: WorkoutVideo) => (
            <Box key={video.id}>
              <Card
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <Box position="relative">
                  <CardMedia
                    component="img"
                    height="180"
                    image={video.thumbnail}
                    alt={video.title}
                    sx={{ cursor: 'pointer', objectFit: 'cover' }}
                    onClick={() => handlePlayVideo(video)}
                  />
                  <Box
                    position="absolute"
                    top="50%"
                    left="50%"
                    sx={{
                      transform: 'translate(-50%, -50%)',
                      backgroundColor: 'rgba(0, 0, 0, 0.7)',
                      borderRadius: '50%',
                      width: 48,
                      height: 48,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.9)',
                        transform: 'translate(-50%, -50%) scale(1.1)',
                      },
                    }}
                    onClick={() => handlePlayVideo(video)}
                  >
                    <PlayArrow sx={{ color: 'white', fontSize: 28 }} />
                  </Box>
                  <IconButton
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      bgcolor: 'background.paper',
                      '&:hover': { bgcolor: 'background.paper' },
                    }}
                    onClick={() => handleToggleLike(video.id)}
                  >
                    {likedVideos.has(video.id) ? (
                      <Favorite color="error" />
                    ) : (
                      <FavoriteBorder />
                    )}
                  </IconButton>
                </Box>
                
                <CardContent sx={{ flexGrow: 1, p: 2 }}>
                  <Typography variant="body2" fontWeight={600} gutterBottom sx={{ 
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    lineHeight: 1.4,
                    minHeight: '2.8em'
                  }}>
                    {video.title}
                  </Typography>
                  
                  <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                    {video.channelTitle}
                  </Typography>
                  
                  <Box display="flex" gap={0.5} mb={1} flexWrap="wrap">
                    {video.difficulty && (
                      <Chip
                        label={getDifficultyLabel(video.difficulty)}
                        size="small"
                        color={getDifficultyColor(video.difficulty)}
                      />
                    )}
                    {video.category !== 'all' && (
                      <Chip
                        label={categories.find(c => c.value === video.category)?.label || video.category}
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Box>
                  
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {video.description}
                  </Typography>
                </CardContent>
                
                <CardActions sx={{ p: 2, pt: 0 }}>
                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<PlayArrow />}
                    onClick={() => handlePlayVideo(video)}
                  >
                    {t('pages.exercise.watchVideo')}
                  </Button>
                </CardActions>
              </Card>
            </Box>
          ))
        )}
      </Box>
      
      {/* 영상이 없을 때 */}
      {!loading && videos.length === 0 && (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {t('pages.exercise.noResults')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('pages.exercise.tryOtherSearch')}
          </Typography>
        </Box>
      )}
      
      {/* 영상 재생 다이얼로그 */}
      <Dialog
        open={showVideoDialog}
        onClose={() => setShowVideoDialog(false)}
        maxWidth="md"
        fullWidth
      >
        {selectedVideo && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h6">{selectedVideo.title}</Typography>
                <IconButton onClick={() => setShowVideoDialog(false)}>
                  <Close />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent>
              <Box
                component="iframe"
                src={`https://www.youtube.com/embed/${selectedVideo.id}`}
                width="100%"
                height="400px"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                sx={{ mb: 2 }}
              />
              
              <Box display="flex" gap={1} mb={2}>
                {selectedVideo.difficulty && (
                  <Chip
                    label={getDifficultyLabel(selectedVideo.difficulty)}
                    color={getDifficultyColor(selectedVideo.difficulty)}
                  />
                )}
                {selectedVideo.category !== 'all' && (
                  <Chip 
                    label={categories.find(c => c.value === selectedVideo.category)?.label || selectedVideo.category} 
                    variant="outlined" 
                  />
                )}
              </Box>
              
              <Typography variant="body2" color="text.secondary" gutterBottom>
                {selectedVideo.channelTitle}
              </Typography>
              
              <Typography variant="body1" paragraph>
                {selectedVideo.description}
              </Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setShowVideoDialog(false)}>
                {t('common.close')}
              </Button>
              <Button
                variant="contained"
                onClick={() => handleLogWorkout(selectedVideo)}
                startIcon={<FitnessCenter />}
              >
                {t('pages.exercise.logWorkout')}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default Exercise;
