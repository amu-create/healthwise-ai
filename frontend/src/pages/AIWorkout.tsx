import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Avatar,
  IconButton,
} from '@mui/material';
import {
  ExpandMore as ExpandMoreIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  LocalFireDepartment as FireIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Share as ShareIcon,
  CameraAlt as CameraIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { translateExerciseName, translateLevel, translateExperience, translateGoal, translateExerciseTip, translateRoutineName } from '../utils/exerciseTranslations';
import { socialWorkoutService } from '../services/socialWorkoutService';
import { toast } from 'react-toastify';

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
  birth_date?: string;
  age: number;
  gender: string;
  preferred_exercises?: string[];
  gym_access?: boolean;
}

// GIF 컴포넌트 - 프록시 사용 추가
const ExerciseGif: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(false);
  const [imgSrc, setImgSrc] = React.useState('');

  React.useEffect(() => {
    // src가 있고 유효한 URL인 경우만 설정
    if (src && (src.startsWith('http://') || src.startsWith('https://'))) {
      // burnfit.io URL인 경우 프록시 사용
      if (src.includes('burnfit.io')) {
        const proxyUrl = `/api/proxy/image/?url=${encodeURIComponent(src)}`;
        setImgSrc(proxyUrl);
      } else {
        setImgSrc(src);
      }
      setError(false);
      setLoading(true);
    } else {
      setError(true);
      setLoading(false);
    }
  }, [src]);

  const handleLoad = () => {
    setLoading(false);
    setError(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

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
      {loading && !error && imgSrc && (
        <CircularProgress size={30} sx={{ color: '#00D4FF', position: 'absolute' }} />
      )}
      {error || !imgSrc ? (
        <Box
          sx={{
            color: 'rgba(255,255,255,0.3)',
            fontSize: '10px',
            textAlign: 'center',
            padding: '4px',
            wordBreak: 'break-word',
          }}
        >
          GIF
          <br />
          {t('pages.aiWorkout.imageLoadFailed')}
        </Box>
      ) : (
        <img
          src={imgSrc}
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
          crossOrigin="anonymous"
        />
      )}
    </Box>
  );
};

const AIWorkoutRoutine: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [routines, setRoutines] = useState<Routine[]>([]);
  // const [fitnessProfile, setFitnessProfile] = useState<FitnessProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [activeRoutine, setActiveRoutine] = useState<Routine | null>(null);
  const [completedRoutines, setCompletedRoutines] = useState<number[]>([]);
  
  // AI 추천 요청 상태
  const [aiRequest, setAiRequest] = useState({
    muscle_group: '',
    level: '',
    duration: 60,
    equipment_available: true,
    specific_goals: '',
  });

  // level 초기값 설정
  useEffect(() => {
    setAiRequest(prev => ({
      ...prev,
      level: t('pages.aiWorkout.beginner')
    }));
  }, [t]);

  // 초기 상태 및 효과
  useEffect(() => {
    fetchRoutines();
    // fetchFitnessProfile();
    // 컴포넌트 마운트 시에만 localStorage 확인
    loadCompletedRoutinesFromStorage();
  }, []);

  // 오늘 완료한 루틴 불러오기
  useEffect(() => {
    if (routines.length > 0) {
      fetchTodayWorkoutLogs();
    }
  }, [routines]);

  // localStorage에서 완료된 루틴 불러오기
  const loadCompletedRoutinesFromStorage = () => {
    try {
      const savedCompletedRoutines = localStorage.getItem('completedRoutines');
      if (savedCompletedRoutines) {
        const parsed = JSON.parse(savedCompletedRoutines);
        const today = new Date().toISOString().split('T')[0];
        if (parsed.date === today && Array.isArray(parsed.routines)) {
          setCompletedRoutines(parsed.routines);
        } else {
          // 날짜가 다르면 초기화
          localStorage.removeItem('completedRoutines');
          setCompletedRoutines([]);
        }
      }
    } catch (error) {
      console.error('Failed to load completed routines from storage:', error);
      localStorage.removeItem('completedRoutines');
    }
  };

  const fetchTodayWorkoutLogs = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get('/workout-logs/', {
        params: { date_from: today, date_to: today }
      });
      
      // response.data가 배열인지 확인
      let workoutLogs = [];
      if (Array.isArray(response.data)) {
        workoutLogs = response.data;
      } else if (response.data.results && Array.isArray(response.data.results)) {
        // 페이지네이션 응답인 경우
        workoutLogs = response.data.results;
      } else if (response.data.data && Array.isArray(response.data.data)) {
        // data 필드에 배열이 있는 경우
        workoutLogs = response.data.data;
      }
      
      // 오늘 완료한 루틴 ID들 추출
      const completedIds = workoutLogs
        .filter((log: any) => log.routine || log.routine_id)
        .map((log: any) => log.routine || log.routine_id);
      
      // localStorage와 비교하여 병합 (중복 제거)
      const storageCompletedRoutines = completedRoutines;
      const mergedArray = [...completedIds, ...storageCompletedRoutines];
      // Set 대신 filter를 사용하여 중복 제거
      const mergedCompletedRoutines = mergedArray.filter((id, index) => mergedArray.indexOf(id) === index);
      
      setCompletedRoutines(mergedCompletedRoutines);
      // 병합된 데이터를 localStorage에 저장
      saveCompletedRoutinesToStorage(mergedCompletedRoutines);
    } catch (err) {
      console.error('Failed to fetch today workout logs:', err);
    }
  };

  // localStorage에 저장하는 함수
  const saveCompletedRoutinesToStorage = (routineIds: number[]) => {
    const today = new Date().toISOString().split('T')[0];
    localStorage.setItem('completedRoutines', JSON.stringify({
      date: today,
      routines: routineIds
    }));
  };

  const fetchRoutines = async () => {
    try {
      const response = await api.get('/routines/');
      // 생성 시간 순서대로 정렬 (최신순)
      const sortedRoutines = response.data.sort((a: Routine, b: Routine) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setRoutines(sortedRoutines);
    } catch (err) {
      console.error('Failed to fetch routines:', err);
    }
  };

  // const fetchFitnessProfile = async () => {
  //   try {
  //     const response = await api.get('/fitness-profile/');
  //     setFitnessProfile(response.data);
  //   } catch (err) {
  //     console.error('Failed to fetch profile:', err);
  //   }
  // };

  const handleAIRecommendation = async () => {
    if (!aiRequest.muscle_group) {
      setError(t('pages.aiWorkout.selectMuscleError'));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    // 번역된 값을 백엔드가 기대하는 한국어 값으로 매핑
    const levelMap: { [key: string]: string } = {
      [t('pages.aiWorkout.beginner')]: '초급',
      [t('pages.aiWorkout.intermediate')]: '중급',
      [t('pages.aiWorkout.advanced')]: '상급',
    };

    const muscleGroupMap: { [key: string]: string } = {
      [t('pages.aiWorkout.muscleGroups.chest')]: '가슴',
      [t('pages.aiWorkout.muscleGroups.back')]: '등',
      [t('pages.aiWorkout.muscleGroups.legs')]: '하체',
      [t('pages.aiWorkout.muscleGroups.shoulders')]: '어깨',
      [t('pages.aiWorkout.muscleGroups.arms')]: '팔',
      [t('pages.aiWorkout.muscleGroups.abs')]: '복근',
      [t('pages.aiWorkout.muscleGroups.fullbody')]: '전신',
    };

    const requestData = {
      ...aiRequest,
      level: levelMap[aiRequest.level] || '초급',
      muscle_group: muscleGroupMap[aiRequest.muscle_group] || aiRequest.muscle_group,
    };

    try {
      const response = await api.post('/ai-workout/', requestData);
      const newRoutine = response.data.routine;
      // 새 루틴을 맨 앞에 추가 (최신순 정렬 유지)
      setRoutines([newRoutine, ...routines]);
      setSuccess(t('pages.aiWorkout.routineCreated'));
      setOpenDialog(false);
      setActiveRoutine(newRoutine);
      
      // 요청 초기화
      setAiRequest({
        muscle_group: '',
        level: t('pages.aiWorkout.beginner'),
        duration: 60,
        equipment_available: true,
        specific_goals: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.general'));
    } finally {
      setLoading(false);
    }
  };

  const deleteRoutine = async (id: number) => {
    if (!window.confirm(t('pages.aiWorkout.deleteConfirm'))) return;

    try {
      await api.delete(`/routines/${id}/`);
      setRoutines(routines.filter(r => r.id !== id));
      if (activeRoutine?.id === id) {
        setActiveRoutine(null);
      }
      setSuccess(t('pages.aiWorkout.routineDeleted'));
    } catch (err) {
      setError(t('errors.general'));
    }
  };

  const completeWorkout = async (routine: Routine, shareToSocial: boolean = false) => {
    setLoading(true);
    setError('');
    try {
      // 운동 시간 계산 (각 운동 3분 + 휴식 시간)
      const totalMinutes = routine.exercises.reduce((sum, ex) => {
        const exerciseTime = ex.sets * 3; // 각 세트당 3분
        const restTime = (ex.sets - 1) * 1.5; // 세트 사이 휴식 1.5분
        return sum + exerciseTime + restTime;
      }, 0);

      // 운동 로그 생성
      const workoutLog = {
        routine_id: routine.id,  // routine -> routine_id로 변경
        duration: Math.round(totalMinutes),
        date: new Date().toISOString().split('T')[0],
        notes: t('pages.aiWorkout.completedRoutine', { name: routine.name })
      };

      const logResponse = await api.post('/workout-logs/', workoutLog);
      
      // 소셜 공유
      if (shareToSocial && logResponse.data) {
        try {
          // 운동 통계 계산
          const totalSets = routine.exercises.reduce((sum, ex) => sum + ex.sets, 0);
          const totalReps = routine.exercises.reduce((sum, ex) => sum + (ex.sets * ex.reps), 0);
          const calories = Math.round(totalMinutes * 8); // 대략적인 칼로리 계산
          
          // 소셜 피드에 공유
          await socialWorkoutService.shareWorkoutToFeed({
            workoutLogId: logResponse.data.id,
            content: `💪 ${routine.name} 운동 완료!\n\n⏱️ ${Math.round(totalMinutes)}분\n🔥 ${calories}kcal\n📊 ${totalSets}세트, ${totalReps}회\n\n#HealthWise #운동완료 #AI운동루틴`,
            visibility: 'public',
            exerciseName: routine.name,
            duration: Math.round(totalMinutes),
            caloriesBurned: calories,
          });
          
          // 스토리에도 공유
          await socialWorkoutService.createWorkoutStory({
            workoutLogId: logResponse.data.id,
            stats: {
              duration: Math.round(totalMinutes),
              calories: calories,
              exercises: routine.exercises.length,
            },
          });
          
          toast.success(t('pages.aiWorkout.sharedToSocial'));
        } catch (shareError) {
          console.error('Failed to share to social:', shareError);
          // 공유 실패해도 운동 완료는 성공으로 처리
        }
      }
      
      // 성공 시 상태 업데이트
      const newCompletedRoutines = [...completedRoutines, routine.id];
      setCompletedRoutines(newCompletedRoutines);
      
      // localStorage에 저장
      saveCompletedRoutinesToStorage(newCompletedRoutines);
      
      setActiveRoutine(null);
      setSuccess(t('pages.aiWorkout.workoutCompleted'));
      
      // 대시보드 데이터 새로고침을 위해 잠시 후 리로드
      setTimeout(() => {
        fetchTodayWorkoutLogs();
      }, 1000);
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.general'));
    } finally {
      setLoading(false);
    }
  };

  // 운동 완료 확인 다이얼로그 상태
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [selectedRoutineForComplete, setSelectedRoutineForComplete] = useState<Routine | null>(null);

  const handleCompleteClick = (routine: Routine) => {
    setSelectedRoutineForComplete(routine);
    setCompleteDialogOpen(true);
  };

  const handleCompleteConfirm = async (shareToSocial: boolean) => {
    if (selectedRoutineForComplete) {
      await completeWorkout(selectedRoutineForComplete, shareToSocial);
      setCompleteDialogOpen(false);
      setSelectedRoutineForComplete(null);
    }
  };

  const startWorkout = (routine: Routine) => {
    setActiveRoutine(routine);
    setSuccess(t('pages.aiWorkout.startingRoutine', { name: routine.name }));
  };

  // +/- 버튼 핸들러 최적화
  const handleDurationChange = useCallback((delta: number) => {
    setAiRequest(prev => ({
      ...prev,
      duration: Math.max(10, Math.min(180, prev.duration + delta))
    }));
  }, []);

  const handleDurationInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0;
    if (value >= 10 && value <= 180) {
      setAiRequest(prev => ({ ...prev, duration: value }));
    }
  }, []);

  // muscle groups memoize
  const muscleGroups = useMemo(() => [
    { value: t('pages.aiWorkout.muscleGroups.chest'), label: t('pages.aiWorkout.muscleGroups.chest') },
    { value: t('pages.aiWorkout.muscleGroups.back'), label: t('pages.aiWorkout.muscleGroups.back') },
    { value: t('pages.aiWorkout.muscleGroups.legs'), label: t('pages.aiWorkout.muscleGroups.legs') },
    { value: t('pages.aiWorkout.muscleGroups.shoulders'), label: t('pages.aiWorkout.muscleGroups.shoulders') },
    { value: t('pages.aiWorkout.muscleGroups.arms'), label: t('pages.aiWorkout.muscleGroups.arms') },
    { value: t('pages.aiWorkout.muscleGroups.abs'), label: t('pages.aiWorkout.muscleGroups.abs') },
    { value: t('pages.aiWorkout.muscleGroups.fullbody'), label: t('pages.aiWorkout.muscleGroups.fullbody') },
  ], [t]);

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
            {t('pages.aiWorkout.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {t('pages.aiWorkout.subtitle')}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

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
            {t('pages.aiWorkout.generateAIRoutine')}
          </Button>
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          {/* 루틴 목록 */}
          <Box sx={{ flex: '1 1 100%', minWidth: 0 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
              {t('pages.aiWorkout.myRoutines')}
            </Typography>
            
            {routines.length === 0 ? (
              <Paper sx={{ p: 3, textAlign: 'center', background: 'rgba(255,255,255,0.05)' }}>
                <Typography variant="body2" color="text.secondary">
                  {t('pages.aiWorkout.noRoutines')}
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
                                {routine.is_ai_generated ? translateRoutineName(routine.name, t) : routine.name}
                                {routine.is_ai_generated && (
                                  <Chip 
                                    label={t('pages.aiWorkout.aiGenerated')} 
                                    size="small" 
                                    sx={{ ml: 1, height: 20 }} 
                                    color="primary"
                                  />
                                )}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {t('pages.aiWorkout.level')}: {translateLevel(routine.level, t)} | {t('pages.aiWorkout.exercises', { count: routine.exercises.length })}
                              </Typography>
                            </Box>
                            <Box>
                              {!completedRoutines.includes(routine.id) ? (
                                <>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => startWorkout(routine)}
                                    color="primary"
                                    title={t('pages.aiWorkout.startWorkout')}
                                  >
                                    <CheckCircleIcon fontSize="small" />
                                  </IconButton>
                                  {activeRoutine?.id === routine.id && (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="success"
                                      onClick={() => handleCompleteClick(routine)}
                                      disabled={loading}
                                      sx={{ ml: 1 }}
                                    >
                                      {loading ? <CircularProgress size={20} /> : t('pages.aiWorkout.complete')}
                                    </Button>
                                  )}
                                </>
                              ) : (
                                <Chip
                                  size="small"
                                  label={t('pages.aiWorkout.completed')}
                                  color="success"
                                  icon={<CheckCircleIcon />}
                                />
                              )}
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
                              <Typography variant="caption">{t('pages.aiWorkout.viewExerciseDetails')}</Typography>
                            </AccordionSummary>
                            <AccordionDetails sx={{ px: 0 }}>
                              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 1 }}>
                                {routine.exercises.map((ex, index) => {
                                  // exercise 데이터가 없는 경우 처리
                                  if (!ex.exercise) {
                                    console.error('Exercise data is missing for routine exercise:', ex);
                                    return null;
                                  }
                                  
                                  return (
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
                                                {index + 1}. {translateExerciseName(ex.exercise.name, i18n.language)}
                                              </Typography>
                                              <Typography variant="caption" color="text.secondary">
                                                {ex.sets}{t('pages.aiWorkout.sets')} × {ex.reps}{t('pages.aiWorkout.reps')}
                                              </Typography>
                                              {ex.notes && (
                                                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                                                  {t('pages.aiWorkout.tip')}: {translateExerciseTip(ex.notes, t)}
                                                </Typography>
                                              )}
                                            </Box>
                                          </Box>
                                        </CardContent>
                                      </Card>
                                    </Box>
                                  );
                                })}
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

        {/* 운동 완료 확인 다이얼로그 */}
        <Dialog
          open={completeDialogOpen}
          onClose={() => setCompleteDialogOpen(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle>{t('pages.aiWorkout.completeWorkout')}</DialogTitle>
          <DialogContent>
            <Typography variant="body2" sx={{ mb: 2 }}>
              {t('pages.aiWorkout.shareToSocialQuestion')}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexDirection: 'column' }}>
              <Button
                variant="contained"
                startIcon={<ShareIcon />}
                onClick={() => handleCompleteConfirm(true)}
                disabled={loading}
                sx={{
                  background: 'linear-gradient(135deg, #00D4FF 0%, #00FFB3 100%)',
                  color: '#000',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #00FFB3 0%, #00D4FF 100%)',
                  },
                }}
              >
                {t('pages.aiWorkout.completeAndShare')}
              </Button>
              <Button
                variant="outlined"
                onClick={() => handleCompleteConfirm(false)}
                disabled={loading}
              >
                {t('pages.aiWorkout.completeOnly')}
              </Button>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCompleteDialogOpen(false)} disabled={loading}>
              {t('common.cancel')}
            </Button>
          </DialogActions>
        </Dialog>

        {/* AI 추천 다이얼로그 - 크기 줄임 */}
        <Dialog 
          open={openDialog} 
          onClose={() => setOpenDialog(false)}
          maxWidth="xs"
          fullWidth
        >
          <DialogTitle sx={{ pb: 1 }}>{t('pages.aiWorkout.generateAIRoutine')}</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 1 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>{t('pages.aiWorkout.exercisePart')}</InputLabel>
                  <Select
                    value={aiRequest.muscle_group}
                    onChange={(e) => setAiRequest({ ...aiRequest, muscle_group: e.target.value })}
                    label={t('pages.aiWorkout.exercisePart')}
                  >
                    {muscleGroups.map((group) => (
                      <MenuItem key={group.value} value={group.value}>{group.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small">
                  <InputLabel>{t('pages.aiWorkout.level')}</InputLabel>
                  <Select
                    value={aiRequest.level}
                    onChange={(e) => setAiRequest({ ...aiRequest, level: e.target.value })}
                    label={t('pages.aiWorkout.level')}
                  >
                    <MenuItem value={t('pages.aiWorkout.beginner')}>{t('pages.aiWorkout.beginner')}</MenuItem>
                    <MenuItem value={t('pages.aiWorkout.intermediate')}>{t('pages.aiWorkout.intermediate')}</MenuItem>
                    <MenuItem value={t('pages.aiWorkout.advanced')}>{t('pages.aiWorkout.advanced')}</MenuItem>
                  </Select>
                </FormControl>

                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    {t('pages.aiWorkout.exerciseTime')}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleDurationChange(-10)}
                      sx={{ 
                        border: '1px solid rgba(255,255,255,0.2)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                      }}
                    >
                      <RemoveIcon fontSize="small" />
                    </IconButton>
                    <TextField
                      size="small"
                      value={aiRequest.duration}
                      onChange={handleDurationInput}
                      InputProps={{ 
                        inputProps: { 
                          min: 10, 
                          max: 180,
                          style: { textAlign: 'center', width: '60px' }
                        } 
                      }}
                      sx={{ 
                        '& .MuiOutlinedInput-root': {
                          '& input[type=number]': {
                            MozAppearance: 'textfield',
                          },
                          '& input[type=number]::-webkit-outer-spin-button': {
                            WebkitAppearance: 'none',
                            margin: 0,
                          },
                          '& input[type=number]::-webkit-inner-spin-button': {
                            WebkitAppearance: 'none',
                            margin: 0,
                          },
                        },
                      }}
                    />
                    <IconButton
                      size="small"
                      onClick={() => handleDurationChange(10)}
                      sx={{ 
                        border: '1px solid rgba(255,255,255,0.2)',
                        '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                      }}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                    <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                      {t('pages.aiWorkout.minutes')}
                    </Typography>
                  </Box>
                </Box>

                <FormControl fullWidth size="small">
                  <InputLabel>{t('pages.aiWorkout.equipmentAvailable')}</InputLabel>
                  <Select
                    value={aiRequest.equipment_available ? 'yes' : 'no'}
                    onChange={(e) => setAiRequest({ ...aiRequest, equipment_available: e.target.value === 'yes' })}
                    label={t('pages.aiWorkout.equipmentAvailable')}
                  >
                    <MenuItem value="yes">{t('pages.aiWorkout.yes')}</MenuItem>
                    <MenuItem value="no">{t('pages.aiWorkout.no')}</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  size="small"
                  label={t('pages.aiWorkout.specialGoals')}
                  multiline
                  rows={2}
                  value={aiRequest.specific_goals}
                  onChange={(e) => setAiRequest({ ...aiRequest, specific_goals: e.target.value })}
                  placeholder={t('pages.aiWorkout.goalsPlaceholder')}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} size="small">{t('pages.aiWorkout.cancel')}</Button>
            <Button 
              onClick={handleAIRecommendation} 
              variant="contained" 
              size="small"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={16} /> : <FireIcon />}
            >
              {loading ? t('pages.aiWorkout.generating') : t('pages.aiWorkout.aiRoutineGenerate')}
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default AIWorkoutRoutine;
