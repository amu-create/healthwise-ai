import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Button,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  IconButton,
  Chip,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import {
  SkipNext,
  SkipPrevious,
  ThumbUp,
  ThumbDown,
  MusicNote,
  Search,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { guestLimitsService } from '../../services/guestLimitsService';
import { useNavigate } from 'react-router-dom';

interface MusicKeyword {
  keyword: string;
  selected: boolean;
}

interface YouTubeVideo {
  id: string;
  title: string;
  thumbnail: string;
  channelTitle: string;
}

const MusicRecommendation: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [exercise, setExercise] = useState('running');
  const [mood, setMood] = useState('energetic');
  const [keywords, setKeywords] = useState<MusicKeyword[]>([]);
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [guestLimitDialogOpen, setGuestLimitDialogOpen] = useState(false);
  const [remainingUses, setRemainingUses] = useState<number | null>(null);

  useEffect(() => {
    // 비회원인 경우 남은 사용 횟수 확인
    if (!user) {
      const remaining = guestLimitsService.getRemainingUses('AI_MUSIC');
      console.log('Guest remaining uses for AI_MUSIC:', remaining);
      setRemainingUses(remaining);
    }
  }, [user]);

  const handleExerciseChange = (event: SelectChangeEvent) => {
    setExercise(event.target.value);
  };

  const handleMoodChange = (event: SelectChangeEvent) => {
    setMood(event.target.value);
  };

  const getAIKeywords = async () => {
    // 비회원 사용 제한 체크
    if (!user) {
      if (!guestLimitsService.canUseFeature('AI_MUSIC')) {
        setGuestLimitDialogOpen(true);
        return;
      }
    }

    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/music/ai-keywords/', {
        exercise,
        mood,
      });
      
      const keywordList = response.data.keywords.map((keyword: string) => ({
        keyword,
        selected: true,
      }));
      
      setKeywords(keywordList);
      
      // 비회원인 경우 사용 횟수 증가
      if (!user) {
        guestLimitsService.incrementUsage('AI_MUSIC');
        setRemainingUses(guestLimitsService.getRemainingUses('AI_MUSIC'));
      }
    } catch (error) {
      console.error('Failed to get AI keywords:', error);
      setError(t('pages.music.getKeywordsError'));
    } finally {
      setLoading(false);
    }
  };

  const searchYouTube = async () => {
    if (keywords.length === 0) {
      setError(t('pages.music.needKeywordsFirst'));
      return;
    }

    setLoading(true);
    setError(null);
    
    const selectedKeywords = keywords.filter(k => k.selected).map(k => k.keyword);
    
    if (selectedKeywords.length === 0) {
      setError(t('pages.music.selectAtLeastOneKeyword'));
      setLoading(false);
      return;
    }

    try {
      // 서버 프록시를 통한 YouTube 검색
      const searchPromises = selectedKeywords.map(async (keyword) => {
        const response = await api.post('/music/youtube-search/', {
          query: keyword,
          maxResults: 5
        });
        return response.data.items || [];
      });

      const results = await Promise.all(searchPromises);
      const allVideos = results.flat();
      
      const uniqueVideos = Array.from(
        new Map(allVideos.map((video: any) => [video.id.videoId, video])).values()
      );

      const formattedVideos: YouTubeVideo[] = uniqueVideos.map((video: any) => ({
        id: video.id.videoId,
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.medium.url,
        channelTitle: video.snippet.channelTitle,
      }));

      setVideos(formattedVideos);
      setCurrentVideoIndex(0);
    } catch (error: any) {
      console.error('YouTube search failed:', error);
      if (error.response?.data?.details) {
        setError(`${t('pages.music.youtubeSearchFailed')}: ${error.response.data.details}`);
      } else if (error.response?.data?.error) {
        setError(`${t('pages.music.youtubeSearchFailed')}: ${error.response.data.error}`);
      } else {
        setError(t('pages.music.youtubeSearchError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleKeyword = (index: number) => {
    setKeywords(prev => prev.map((k, i) => 
      i === index ? { ...k, selected: !k.selected } : k
    ));
  };

  const playNext = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
    }
  };

  const playPrevious = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(prev => prev - 1);
    }
  };

  const saveFeedback = async (feedback: 'liked' | 'disliked') => {
    // 실제로는 현재 운동 세션과 연결해야 함
    try {
      await api.post('/music/save-feedback/', {
        workout_id: null, // 실제 운동 ID가 필요
        feedback,
        songs_played: videos.slice(0, currentVideoIndex + 1).map(v => ({
          id: v.id,
          title: v.title,
        })),
      });
    } catch (error) {
      console.error('Failed to save feedback:', error);
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 900 }}>
        {t('pages.music.title', 'AI 음악 추천')}
      </Typography>

      {/* 남은 사용 횟수 표시 */}
      {!user && (
        <Alert
          severity="warning"
          sx={{ mb: 2 }}
        >
          {t('pages.music.guestLimit', { count: remainingUses ?? 3 })}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '300px 1fr' }, gap: 2, height: 'calc(100vh - 200px)' }}>
        {/* 설정 패널 */}
        <Box>
          <Paper sx={{ 
            p: 2, 
            height: '100%', 
            overflow: 'auto',
            border: '2px solid',
            borderColor: 'primary.main',
            backgroundColor: 'rgba(0, 212, 255, 0.05)',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'background.paper',
              borderRadius: '3px',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'divider',
              borderRadius: '3px',
              '&:hover': {
                backgroundColor: 'text.secondary',
              },
            },
          }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              {t('pages.music.preferences', '음악 선호도 설정')}
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>{t('pages.music.exercise', '운동 종류')}</InputLabel>
              <Select value={exercise} onChange={handleExerciseChange}>
                <MenuItem value="running">{t('pages.music.running', '달리기')}</MenuItem>
                <MenuItem value="walking">{t('pages.music.walking', '걷기')}</MenuItem>
                <MenuItem value="yoga">{t('pages.music.yoga', '요가')}</MenuItem>
                <MenuItem value="strength">{t('pages.music.strength', '근력 운동')}</MenuItem>
                <MenuItem value="cycling">{t('pages.music.cycling', '자전거')}</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>{t('pages.music.mood', '기분')}</InputLabel>
              <Select value={mood} onChange={handleMoodChange}>
                <MenuItem value="energetic">{t('pages.music.energetic', '활기찬')}</MenuItem>
                <MenuItem value="calm">{t('pages.music.calm', '차분한')}</MenuItem>
                <MenuItem value="focused">{t('pages.music.focused', '집중된')}</MenuItem>
                <MenuItem value="relaxed">{t('pages.music.relaxed', '편안한')}</MenuItem>
                <MenuItem value="pumped">{t('pages.music.pumped', '흥분된')}</MenuItem>
              </Select>
            </FormControl>

            <Button
              fullWidth
              variant="contained"
              startIcon={<MusicNote />}
              onClick={getAIKeywords}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {t('pages.music.getKeywords', 'AI 키워드 추천받기')}
              {!user && ` (${t('pages.music.remainingCount', { count: remainingUses ?? 3 })})`}
            </Button>

            {keywords.length > 0 && (
              <>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  {t('pages.music.suggestedKeywords', '추천 키워드')}
                </Typography>
                <Box sx={{ mb: 2 }}>
                  {keywords.map((keyword, index) => (
                    <Chip
                      key={index}
                      label={keyword.keyword}
                      onClick={() => toggleKeyword(index)}
                      color={keyword.selected ? 'primary' : 'default'}
                      sx={{ m: 0.5 }}
                    />
                  ))}
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<Search />}
                  onClick={searchYouTube}
                  disabled={loading || !keywords.some(k => k.selected)}
                >
                  {t('pages.music.searchYouTube', 'YouTube 검색')}
                </Button>
              </>
            )}
          </Paper>
        </Box>

        {/* 플레이어 영역 */}
        <Box sx={{ 
          height: '100%', 
          overflow: 'auto',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            backgroundColor: 'background.default',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'divider',
            borderRadius: '4px',
            '&:hover': {
              backgroundColor: 'text.secondary',
            },
          },
        }}>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
              <CircularProgress />
            </Box>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {videos.length > 0 && !loading && (
            <>
              <Paper sx={{ p: 2, mb: 2, backgroundColor: 'background.paper' }}>
                <Card sx={{ backgroundColor: 'background.default' }}>
                  <Box
                    sx={{
                      position: 'relative',
                      paddingBottom: '56.25%', // 16:9 aspect ratio
                      height: 0,
                      overflow: 'hidden',
                      maxHeight: '400px',
                    }}
                  >
                    <iframe
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                      }}
                      src={`https://www.youtube.com/embed/${videos[currentVideoIndex].id}?autoplay=1`}
                      title={videos[currentVideoIndex].title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </Box>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="h6" noWrap>
                      {videos[currentVideoIndex].title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {videos[currentVideoIndex].channelTitle}
                    </Typography>
                  </CardContent>
                  <CardActions sx={{ justifyContent: 'space-between' }}>
                    <Box>
                      <IconButton 
                        onClick={playPrevious} 
                        disabled={currentVideoIndex === 0}
                      >
                        <SkipPrevious />
                      </IconButton>
                      <IconButton 
                        onClick={playNext}
                        disabled={currentVideoIndex === videos.length - 1}
                      >
                        <SkipNext />
                      </IconButton>
                    </Box>
                    <Box>
                      <IconButton 
                        onClick={() => saveFeedback('liked')}
                        color="primary"
                      >
                        <ThumbUp />
                      </IconButton>
                      <IconButton 
                        onClick={() => saveFeedback('disliked')}
                        color="error"
                      >
                        <ThumbDown />
                      </IconButton>
                    </Box>
                  </CardActions>
                </Card>
              </Paper>

              {/* 플레이리스트 - 세로 스크롤 */}
              <Paper sx={{ 
                p: 2,
                '&::-webkit-scrollbar': {
                  width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                  backgroundColor: 'background.paper',
                  borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                  backgroundColor: 'primary.main',
                  borderRadius: '4px',
                  '&:hover': {
                    backgroundColor: 'primary.dark',
                  },
                },
              }}>
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
                  {t('pages.music.playlist', '플레이리스트')} ({currentVideoIndex + 1}/{videos.length})
                </Typography>
                <Box sx={{ 
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                }}>
                  {videos.map((video, index) => (
                    <Card
                      key={video.id}
                      sx={{
                        cursor: 'pointer',
                        backgroundColor: index === currentVideoIndex ? 'primary.main' : 'background.default',
                        '&:hover': {
                          backgroundColor: 'action.hover',
                          transform: 'translateX(4px)',
                        },
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'row',
                        overflow: 'hidden',
                      }}
                      onClick={() => setCurrentVideoIndex(index)}
                    >
                      <CardMedia
                        component="img"
                        sx={{ 
                          width: 160, 
                          height: 90,
                          objectFit: 'cover',
                          flexShrink: 0,
                        }}
                        image={video.thumbnail}
                        alt={video.title}
                      />
                      <CardContent sx={{ 
                        p: 2, 
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}>
                        <Typography 
                          variant="body1" 
                          sx={{ 
                            fontWeight: index === currentVideoIndex ? 600 : 400,
                            fontSize: '0.9rem',
                            mb: 0.5,
                            color: index === currentVideoIndex ? 'primary.contrastText' : 'text.primary',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                          }}
                        >
                          {video.title}
                        </Typography>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            color: index === currentVideoIndex ? 'primary.contrastText' : 'text.secondary',
                            opacity: index === currentVideoIndex ? 0.9 : 0.7,
                          }}
                        >
                          {video.channelTitle}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              </Paper>
            </>
          )}
        </Box>
      </Box>

      {/* 비회원 사용 제한 다이얼로그 */}
      <Dialog
        open={guestLimitDialogOpen}
        onClose={() => setGuestLimitDialogOpen(false)}
      >
        <DialogTitle>{t('pages.music.limitExceededTitle')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('pages.music.limitExceededMessage')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGuestLimitDialogOpen(false)}>{t('common.close')}</Button>
          <Button
            onClick={() => navigate('/register')}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
              color: '#000',
            }}
          >
            {t('auth.register')}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MusicRecommendation;
