import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  LocalFireDepartment as FireIcon,
  YouTube as YouTubeIcon,
  Close as CloseIcon,
  PlayArrow as PlayArrowIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { guestLimitsService } from '../services/guestLimitsService';
import { useNavigate } from 'react-router-dom';

interface Exercise {
  id: number;
  name: string;
  muscle_group: string;
  gif_url?: string;
  default_sets: number;
  default_reps: number;
  exercise_type: string;
  description?: string;
}

interface RoutineExercise {
  id: number;
  exercise: Exercise;
  order: number;
  sets: number;
  reps: number;
  recommended_weight?: number;
  notes?: string;
}

interface Routine {
  id: number;
  name: string;
  exercises: RoutineExercise[];
  level: string;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
}

interface FitnessProfile {
  id: number;
  experience: string;
  goal: string;
  goal_text?: string;
  frequency: number;
  weight: number;
  height: number;
  birth_date: string;
  age: number;
  gender: string;
  preferred_exercises: string[];
  gym_access: boolean;
}

// GIF 컴포넌트 - 직접 로드
const ExerciseGif: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    console.error(`Failed to load GIF: ${src}`);
    setLoading(false);
    setError(true);
  };

  // 상대경로를 절대경로로 변환
  const getFullUrl = (url: string | undefined) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    // Django static 파일 경로 처리
    if (url.startsWith('/static/') || url.startsWith('static/')) {
      return `http://localhost:8000${url.startsWith('/') ? '' : '/'}${url}`;
    }
    return url;
  };

  const fullUrl = getFullUrl(src);

  if (!fullUrl) {
    return (
      <Box
        sx={{
          width: '80px',
          height: '80px',
          borderRadius: '8px',
          border: '1px solid rgba(255,255,255,0.1)',
          background: 'rgba(0,0,0,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Typography variant="caption" color="text.secondary">
          No Image
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '80px',
        height: '80px',
        borderRadius: '8px',
        border: '1px solid rgba(255,255,255,0.1)',
        overflow: 'hidden',
        background: 'rgba(0,0,0,0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      {loading && !error && (
        <CircularProgress size={30} sx={{ color: '#00D4FF', position: 'absolute' }} />
      )}
      {error ? (
        <Box
          sx={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: '12px',
            textAlign: 'center',
            p: 1,
          }}
        >
          이미지<br/>로드 실패
        </Box>
      ) : (
        <img
          src={fullUrl}
          alt={alt}
          onLoad={handleLoad}
          onError={handleError}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: loading ? 'none' : 'block',
          }}
          referrerPolicy="no-referrer"
        />
      )}
    </Box>
  );
};

const AIWorkoutRoutine: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [fitnessProfile, setFitnessProfile] = useState<FitnessProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [videoDialog, setVideoDialog] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [selectedVideoId, setSelectedVideoId] = useState<string>('');
  const [guestLimitDialogOpen, setGuestLimitDialogOpen] = useState(false);
  const [remainingUses, setRemainingUses] = useState<number | null>(null);
  
  // AI 추천 요청 상태
  const [aiRequest, setAiRequest] = useState({
    muscle_group: '',
    level: '초급',
    duration: 60,
    equipment_available: true,
    specific_goals: '',
  });

  useEffect(() => {
    fetchRoutines();
    fetchFitnessProfile();
    // 비회원인 경우 남은 사용 횟수 확인
    if (!user) {
      const remaining = guestLimitsService.getRemainingUses('AI_WORKOUT');
      console.log('Guest remaining uses for AI_WORKOUT:', remaining);
      setRemainingUses(remaining);
    }
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchRoutines = async () => {
    try {
      const response = await api.get('/routines/');
      console.log('Fetched routines:', response.data);
      // GIF URL 확인
      response.data.forEach((routine: Routine) => {
        console.log(`Routine: ${routine.name}`);
        routine.exercises.forEach((ex) => {
          console.log(`  Exercise: ${ex.exercise.name}, GIF URL: ${ex.exercise.gif_url}`);
        });
      });
      setRoutines(response.data);
    } catch (err) {
      console.error('Failed to fetch routines:', err);
    }
  };

  const fetchFitnessProfile = async () => {
    // 게스트 사용자는 프로필을 가져오지 않음
    if (!user) {
      setFitnessProfile(null);
      return;
    }
    
    try {
      const response = await api.get('/fitness-profile/');
      setFitnessProfile(response.data);
    } catch (err) {
      console.error('Failed to fetch fitness profile:', err);
      setFitnessProfile(null);
    }
  };

  const handleAIRecommendation = async () => {
    // 비회원 사용 제한 체크
    if (!user) {
      // 현재 사용 상태 디버깅
      guestLimitsService.debugUsage();
      
      if (!guestLimitsService.canUseFeature('AI_WORKOUT')) {
        setGuestLimitDialogOpen(true);
        return;
      }
    }

    if (!aiRequest.muscle_group) {
      setError('운동 부위를 선택해주세요.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await api.post('/ai-workout/', aiRequest);
      const rawRoutine = response.data.routine;
      
      // 비회원 응답 구조를 회원 응답 구조로 변환
      let newRoutine;
      if (rawRoutine.is_guest) {
        // 비회원 응답은 exercises 배열에 직접 운동 정보가 있음
        newRoutine = {
          ...rawRoutine,
          id: Date.now(), // 임시 ID
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_ai_generated: true,
          exercises: rawRoutine.exercises.map((ex: any, index: number) => ({
            id: index + 1,
            order: index + 1,
            exercise: {
              id: index + 1,
              name: ex.name,
              muscle_group: ex.muscle_group,
              gif_url: ex.gif_url,
              default_sets: ex.sets,
              default_reps: ex.reps,
              exercise_type: '운동',
              description: ex.notes
            },
            sets: ex.sets,
            reps: ex.reps,
            notes: ex.notes
          }))
        };
      } else {
        newRoutine = rawRoutine;
      }
      
      setRoutines([newRoutine, ...routines]);
      setSuccess('AI 운동 루틴이 생성되었습니다!');
      setOpenDialog(false);
      setActiveRoutine(newRoutine);
      
      // 비회원인 경우 성공 시에만 사용 횟수 증가
      if (!user) {
        guestLimitsService.incrementUsage('AI_WORKOUT');
        console.log(`AI_WORKOUT usage incremented after success. Used: ${guestLimitsService.getUsedCount('AI_WORKOUT')}/3`);
        setRemainingUses(guestLimitsService.getRemainingUses('AI_WORKOUT'));
      }
      
      // 요청 초기화
      setAiRequest({
        muscle_group: '',
        level: '초급',
        duration: 60,
        equipment_available: true,
        specific_goals: '',
      });
    } catch (err: any) {
      console.error('AI workout error:', err);
      
      // 429 오류 처리
      if (err.response?.status === 429) {
        setError('오늘의 사용 횟수를 모두 사용하셨습니다.');
        setGuestLimitDialogOpen(true);
        
        // 비회원인 경우 로컬 스토리지를 백엔드 상태와 동기화
        if (!user) {
          // 현재 사용 횟수를 최대치로 설정
          guestLimitsService.setFeatureUsageToMax('AI_WORKOUT');
          setRemainingUses(0);
          console.log('Synced guest usage with backend limit (set to 3/3)');
        }
      } else {
        setError(err.response?.data?.error || 'AI 루틴 생성에 실패했습니다.');
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteRoutine = async (id: number) => {
    if (!window.confirm('이 루틴을 삭제하시겠습니까?')) return;

    try {
      await api.delete(`/routines/${id}/`);
      setRoutines(routines.filter(r => r.id !== id));
      if (activeRoutine?.id === id) {
        setActiveRoutine(null);
      }
      setSuccess('루틴이 삭제되었습니다.');
    } catch (err) {
      setError('루틴 삭제에 실패했습니다.');
    }
  };

  const startWorkout = (routine: Routine) => {
    setActiveRoutine(routine);
    setSuccess(`'${routine.name}' 루틴을 시작합니다!`);
  };

  // 영상 보기 클릭 - 다이얼로그에서 재생
  const handleWatchVideo = async (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setVideoDialog(true);
    
    // YouTube API로 첫 번째 영상 가져오기
    try {
      const response = await api.get('/workout-videos/', {
        params: {
          search: exercise.name,
          maxResults: 1
        }
      });
      
      if (response.data.items && response.data.items.length > 0) {
        setSelectedVideoId(response.data.items[0].id);
      } else {
        // 결과가 없으면 기본 검색
        const searchQuery = encodeURIComponent(exercise.name);
        window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
        setVideoDialog(false);
      }
    } catch (err) {
      console.error('Failed to fetch video:', err);
      // 오류 시 YouTube로 직접 이동
      const searchQuery = encodeURIComponent(exercise.name);
      window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
      setVideoDialog(false);
    }
  };

  // 비디오 다이얼로그 닫기
  const handleCloseVideoDialog = () => {
    setVideoDialog(false);
    setSelectedExercise(null);
    setSelectedVideoId('');
  };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" gutterBottom sx={{ 
            fontWeight: 700,
            background: 'linear-gradient(135deg, #00D4FF 0%, #00FFB3 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            AI 운동 루틴
          </Typography>
          <Typography variant="body2" color="text.secondary">
            AI가 당신만을 위한 맞춤형 운동 루틴을 추천해드립니다
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        {/* 비회원 사용 제한 알림 */}
        {!user && (
          <Alert
            severity="warning"
            sx={{ mb: 2 }}
          >
            비회원은 AI 운동 루틴을 하루 3회까지 사용 가능합니다. (남은 횟수: {remainingUses ?? 3}회, 사용: {3 - (remainingUses ?? 3)}회)
          </Alert>
        )}

        {/* AI 추천 버튼 */}
        <Box sx={{ mb: 3 }}>
          <Button
            variant="contained"
            size="medium"
            startIcon={<FireIcon />}
            onClick={() => setOpenDialog(true)}
            sx={{
              background: 'linear-gradient(135deg, #00D4FF 0%, #00FFB3 100%)',
              color: '#000',
              fontWeight: 'bold',
              px: 3,
              py: 1,
              '&:hover': {
                background: 'linear-gradient(135deg, #00FFB3 0%, #00D4FF 100%)',
              },
            }}
          >
            AI 운동 루틴 생성
            {!user && ` (${remainingUses ?? 3}회 남음)`}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {/* 프로필 정보 - 회원일 때만 표시 */}
          {user && fitnessProfile && (
            <Box sx={{ flex: '0 0 280px', minWidth: 0 }}>
              <Card sx={{ 
                background: 'rgba(255,255,255,0.05)', 
                backdropFilter: 'blur(10px)',
                height: '100%' 
              }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle1" gutterBottom fontWeight="bold">
                    나의 피트니스 프로필
                  </Typography>
                  <List dense sx={{ p: 0 }}>
                    <ListItem sx={{ px: 0, py: 0.5 }}>
                      <ListItemText 
                        primary={<Typography variant="body2">경험</Typography>}
                        secondary={<Typography variant="caption">{fitnessProfile.experience}</Typography>}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0, py: 0.5 }}>
                      <ListItemText 
                        primary={<Typography variant="body2">목표</Typography>}
                        secondary={<Typography variant="caption">{fitnessProfile.goal}</Typography>}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0, py: 0.5 }}>
                      <ListItemText 
                        primary={<Typography variant="body2">주당 운동</Typography>}
                        secondary={<Typography variant="caption">{fitnessProfile.frequency}회</Typography>}
                      />
                    </ListItem>
                    <ListItem sx={{ px: 0, py: 0.5 }}>
                      <ListItemText 
                        primary={<Typography variant="body2">체중/신장</Typography>}
                        secondary={<Typography variant="caption">{fitnessProfile.weight}kg / {fitnessProfile.height}cm</Typography>}
                      />
                    </ListItem>
                  </List>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* 루틴 목록 - 더 컴팩트하게 */}
          <Box sx={{ flex: '1 1 600px', minWidth: 0 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              내 운동 루틴
            </Typography>
            
            {routines.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', background: 'rgba(255,255,255,0.05)' }}>
                <Typography variant="body2" color="text.secondary">
                  아직 생성된 루틴이 없습니다. AI 추천을 받아보세요!
                </Typography>
              </Paper>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {routines.map((routine) => (
                  <Box key={routine.id} sx={{ width: '100%' }}>
                    <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                      <Card sx={{ 
                        background: activeRoutine?.id === routine.id 
                          ? 'rgba(0, 212, 255, 0.1)' 
                          : 'rgba(255,255,255,0.05)',
                        backdropFilter: 'blur(10px)',
                        border: activeRoutine?.id === routine.id 
                          ? '2px solid #00D4FF' 
                          : 'none',
                      }}>
                        <CardContent sx={{ p: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                            <Box>
                              <Typography variant="subtitle1" fontWeight="bold">
                                {routine.name}
                                {routine.is_ai_generated && (
                                  <Chip 
                                    label="AI" 
                                    size="small" 
                                    sx={{ ml: 1, height: 20 }} 
                                    color="primary"
                                  />
                                )}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                난이도: {routine.level} | 운동 {routine.exercises.length}개
                              </Typography>
                            </Box>
                            <Box>
                              <IconButton 
                                size="small" 
                                onClick={() => startWorkout(routine)}
                                color="primary"
                              >
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                size="small" 
                                onClick={() => deleteRoutine(routine.id)}
                                color="error"
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          </Box>

                          <Accordion sx={{ background: 'transparent', boxShadow: 'none' }}>
                            <AccordionSummary 
                              expandIcon={<ExpandMoreIcon />}
                              sx={{ px: 0, minHeight: 36 }}
                            >
                              <Typography variant="caption">운동 상세 보기</Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ px: 0 }}>
                              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1 }}>
                                {routine.exercises.map((ex, index) => (
                                  <Box key={ex.id}>
                                    <Card sx={{ 
                                      background: 'rgba(255,255,255,0.02)', 
                                      border: '1px solid rgba(255,255,255,0.1)' 
                                    }}>
                                      <CardContent sx={{ p: 1.5 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                          <ExerciseGif 
                                            src={ex.exercise.gif_url} 
                                            alt={ex.exercise.name} 
                                          />
                                          <Box sx={{ flex: 1 }}>
                                            <Typography variant="body2" fontWeight="bold">
                                              {index + 1}. {ex.exercise.name}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                              {ex.sets}세트 × {ex.reps}회
                                            </Typography>
                                            {ex.notes && (
                                              <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                                💡 {ex.notes}
                                              </Typography>
                                            )}
                                            <Button
                                              size="small"
                                              startIcon={<PlayArrowIcon />}
                                              onClick={() => handleWatchVideo(ex.exercise)}
                                              sx={{ 
                                                mt: 1, 
                                                fontSize: '11px',
                                                textTransform: 'none',
                                                background: 'linear-gradient(135deg, #00D4FF 0%, #00FFB3 100%)',
                                                color: '#000',
                                                '&:hover': {
                                                  background: 'linear-gradient(135deg, #00FFB3 0%, #00D4FF 100%)',
                                                },
                                              }}
                                            >
                                              영상 보기
                                            </Button>
                                          </Box>
                                        </Box>
                                      </CardContent>
                                    </Card>
                                  </Box>
                                ))}
                              </Box>
                            </AccordionDetails>
                          </Accordion>
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        </Box>

        {/* AI 추천 다이얼로그 - 크기 줄임 */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>AI 운동 루틴 생성</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>운동 부위</InputLabel>
                  <Select
                    value={aiRequest.muscle_group}
                    onChange={(e) => setAiRequest({ ...aiRequest, muscle_group: e.target.value })}
                    label="운동 부위"
                  >
                    <MenuItem value="가슴">가슴</MenuItem>
                    <MenuItem value="등">등</MenuItem>
                    <MenuItem value="하체">하체</MenuItem>
                    <MenuItem value="어깨">어깨</MenuItem>
                    <MenuItem value="팔">팔</MenuItem>
                    <MenuItem value="복근">복근</MenuItem>
                    <MenuItem value="전신">전신</MenuItem>
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>난이도</InputLabel>
                  <Select
                    value={aiRequest.level}
                    onChange={(e) => setAiRequest({ ...aiRequest, level: e.target.value })}
                    label="난이도"
                  >
                    <MenuItem value="초급">초급</MenuItem>
                    <MenuItem value="중급">중급</MenuItem>
                    <MenuItem value="상급">상급</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="운동 시간 (분)"
                  type="number"
                  value={aiRequest.duration}
                  onChange={(e) => setAiRequest({ ...aiRequest, duration: parseInt(e.target.value) })}
                  InputProps={{ inputProps: { min: 15, max: 180 } }}
                />

                <FormControl fullWidth size="small">
                  <InputLabel>장비 사용 가능</InputLabel>
                  <Select
                    value={aiRequest.equipment_available ? 'yes' : 'no'}
                    onChange={(e) => setAiRequest({ ...aiRequest, equipment_available: e.target.value === 'yes' })}
                    label="장비 사용 가능"
                  >
                    <MenuItem value="yes">예</MenuItem>
                    <MenuItem value="no">아니오 (맨몸 운동)</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label="특별한 목표 (선택사항)"
                  multiline
                  rows={2}
                  value={aiRequest.specific_goals}
                  onChange={(e) => setAiRequest({ ...aiRequest, specific_goals: e.target.value })}
                  placeholder="예: 벤치프레스 중량 늘리기, 근지구력 향상 등"
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} size="small">취소</Button>
            <Button 
              onClick={handleAIRecommendation} 
              variant="contained" 
              size="small"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <FireIcon />}
            >
              {loading ? '생성 중...' : 'AI 루틴 생성'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* YouTube 영상 재생 다이얼로그 */}
        <Dialog
          open={videoDialog}
          onClose={handleCloseVideoDialog}
          maxWidth="md"
          fullWidth
        >
          {selectedExercise && (
            <>
              <DialogTitle>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Typography variant="h6">{selectedExercise.name}</Typography>
                  <IconButton onClick={handleCloseVideoDialog}>
                    <CloseIcon />
                  </IconButton>
                </Box>
              </DialogTitle>
              <DialogContent>
                {selectedVideoId ? (
                  <Box
                    component="iframe"
                    src={`https://www.youtube.com/embed/${selectedVideoId}`}
                    width="100%"
                    height="400px"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    sx={{ mb: 2 }}
                  />
                ) : (
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
                    <CircularProgress />
                  </Box>
                )}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseVideoDialog}>
                  닫기
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<YouTubeIcon />}
                  onClick={() => {
                    const searchQuery = encodeURIComponent(selectedExercise.name);
                    window.open(`https://www.youtube.com/results?search_query=${searchQuery}`, '_blank');
                  }}
                >
                  YouTube에서 더 보기
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* 비회원 사용 제한 다이얼로그 */}
        <Dialog
          open={guestLimitDialogOpen}
          onClose={() => setGuestLimitDialogOpen(false)}
        >
          <DialogTitle>사용 횟수 초과</DialogTitle>
          <DialogContent>
            <Typography>
              비회원은 AI 운동 루틴을 하루 3회까지만 사용할 수 있습니다.
            </Typography>
            <Typography sx={{ mt: 1 }}>
              현재 사용 현황: {3 - (remainingUses ?? 0)}/3회 사용
            </Typography>
            <Typography sx={{ mt: 2 }}>
              더 많은 기능을 이용하시려면 회원가입을 해주세요.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setGuestLimitDialogOpen(false)}>닫기</Button>
            <Button
              onClick={() => navigate('/register')}
              variant="contained"
              sx={{
                background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
                color: '#000',
              }}
            >
              회원가입
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default AIWorkoutRoutine;
