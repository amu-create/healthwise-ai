import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Card,
  CardContent,
  CardHeader,
  Typography,
  Button,
  Chip,
  LinearProgress,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Badge,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Paper,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  PlayArrow,
  Stop,
  Pause,
  PlayCircle,
  BarChart,
  FitnessCenter,
  Timer,
  EmojiEvents,
  VideoLibrary,
  CameraAlt
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useMediaPipe } from '../../hooks/pose-analysis/useMediaPipe';
import { allExercises, exerciseCategories, getExercisesByCategory } from '../../services/pose-analysis/exercises';
import { getExercises } from '../../services/pose-analysis/poseAnalysisService';
import ExerciseSelector from './ExerciseSelector';
import VideoUpload from './VideoUpload';
import RealtimeFeedback from './RealtimeFeedback';
import AnalysisChart from './AnalysisChart';
import FinalResults from './FinalResults';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`analysis-tabpanel-${index}`}
      aria-labelledby={`analysis-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const PoseAnalysisMain: React.FC = () => {
  const { t } = useTranslation();
  const [exercises, setExercises] = useState<any[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFinalResults, setShowFinalResults] = useState(false);
  const [analysisFrames, setAnalysisFrames] = useState<any[]>([]);
  const [exerciseDuration, setExerciseDuration] = useState(0);
  const [currentTab, setCurrentTab] = useState(0);
  const [mode, setMode] = useState<'realtime' | 'upload'>('realtime');
  const [loading, setLoading] = useState(true);
  const [pausedDuration, setPausedDuration] = useState(0);
  const [lastPauseTime, setLastPauseTime] = useState<number | null>(null);
  const startTimeRef = useRef<number>(0);

  // analysisFrames를 ref로 관리하여 클로저 문제 해결
  const analysisFramesRef = useRef<any[]>([]);
  
  const {
    videoRef,
    canvasRef,
    isAnalyzing,
    isPaused,
    analysisResult,
    repCount,
    startAnalysis,
    stopAnalysis,
    togglePause,
    analyzeVideoFile,
    setMode: setMediaPipeMode
  } = useMediaPipe({
    exercise: selectedExercise,
    mode,
    onResults: (result) => {
      console.log('onResults called:', result);
      if (result && result.overallScore !== undefined && !isPaused) {
        const currentTime = (Date.now() - startTimeRef.current - pausedDuration) / 1000;
        console.log('Adding frame:', {
          score: result.overallScore,
          timestamp: currentTime,
          frameCount: analysisFramesRef.current.length
        });
        
        const newFrame = {
          ...result,
          timestamp: currentTime,
          frameIndex: analysisFramesRef.current.length,
          overallScore: result.overallScore || 0
        };
        
        analysisFramesRef.current = [...analysisFramesRef.current, newFrame];
        setAnalysisFrames([...analysisFramesRef.current]);
        console.log('Total frames:', analysisFramesRef.current.length);
      }
    },
    onVideoEnd: () => {
      // 비디오 분석이 끝나면 결과 표시
      console.log('onVideoEnd called in PoseAnalysisMain');
      console.log('current mode:', mode, 'analysisFrames:', analysisFramesRef.current.length);
      
      // ref에서 직접 확인
      if (analysisFramesRef.current.length > 0) {
        const duration = (Date.now() - startTimeRef.current) / 1000;
        setExerciseDuration(duration);
        console.log('Setting showFinalResults to true with frames:', analysisFramesRef.current.length);
        setShowFinalResults(true);
      } else {
        console.log('No analysis frames, not showing results');
      }
    }
  });

  const handleStartAnalysis = () => {
    setShowFinalResults(false);
    setAnalysisFrames([]);
    analysisFramesRef.current = [];
    setPausedDuration(0);
    setLastPauseTime(null);
    startTimeRef.current = Date.now();
    startAnalysis();
  };

  const handleStopAnalysis = async () => {
    // 일시정지 중이었다면 일시정지 시간 추가
    if (isPaused && lastPauseTime) {
      setPausedDuration(prev => prev + (Date.now() - lastPauseTime));
    }
    
    const sessionData = await stopAnalysis();
    const totalDuration = (Date.now() - startTimeRef.current - pausedDuration) / 1000;
    setExerciseDuration(totalDuration);
    
    // 백엔드 세션 데이터가 있으면 사용
    if (sessionData) {
      console.log('Using backend session data:', sessionData);
      // 백엔드 데이터를 프론트엔드 형식으로 변환
      if (sessionData.average_score !== undefined) {
        setAnalysisFrames(prev => {
          if (prev.length === 0) {
            // 프레임 데이터가 없으면 기본 데이터 생성
            return [{
              overallScore: sessionData.average_score,
              timestamp: totalDuration,
              frameIndex: 0,
              feedback: sessionData.feedback_summary || [],
              corrections: sessionData.corrections_summary || []
            }];
          }
          return prev;
        });
      }
      
      // 백엔드에서 반복 횟수 받아오기
      // repCount는 useMediaPipe 내부에서 관리되므로, 백엔드 데이터는 별도로 관리
      // TODO: 백엔드 반복 횟수 데이터를 표시하는 방법 개선 필요
    }
    
    if (analysisFrames.length > 0 || sessionData) {
      setTimeout(() => {
        setShowFinalResults(true);
      }, 500);
    }
  };

  const handleTogglePause = () => {
    if (isPaused) {
      // 재개
      if (lastPauseTime) {
        const pauseDuration = Date.now() - lastPauseTime;
        setPausedDuration(prev => prev + pauseDuration);
        setLastPauseTime(null);
      }
    } else {
      // 일시정지
      setLastPauseTime(Date.now());
    }
    togglePause();
  };

  const handleVideoUpload = async (file: File) => {
    console.log('=== handleVideoUpload START ===');
    console.log('Handling video upload:', file.name, 'size:', file.size);
    console.log('Current isAnalyzing:', isAnalyzing);
    console.log('Selected exercise:', selectedExercise);
    
    // 모드 설정
    setMode('upload');
    setMediaPipeMode('upload');
    
    // 상태 초기화
    setShowFinalResults(false);
    setAnalysisFrames([]);
    analysisFramesRef.current = [];
    setPausedDuration(0);
    startTimeRef.current = Date.now();
    
    // 비디오 분석 시작 - 약간의 지연 후 실행
    console.log('Starting video analysis in 500ms...');
    setTimeout(async () => {
      console.log('Calling analyzeVideoFile...');
      try {
        await analyzeVideoFile(file);
        console.log('analyzeVideoFile called successfully');
      } catch (error) {
        console.error('Error in analyzeVideoFile:', error);
      }
    }, 500);
    
    console.log('=== handleVideoUpload END ===');
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
    // 탭 변경 시 모드도 함께 변경
    if (newValue === 0) {
      setMode('realtime');
      setMediaPipeMode('realtime');
    }
  };

  // 백엔드에서 운동 목록 가져오기
  useEffect(() => {
    const fetchExercises = async () => {
      try {
        setLoading(true);
        console.log('Fetching exercises from API...');
        const response = await getExercises();
        console.log('API Response:', response);
        
        // API 응답이 배열인지 확인
        const data = response.results || response;
        
        if (Array.isArray(data) && data.length > 0) {
          // 백엔드 데이터와 프론트엔드 데이터 매핑
          const mappedExercises = data.map((apiExercise: any) => {
            // 이름으로 프론트엔드 데이터 찾기
            const frontendExercise = allExercises.find(ex => 
              ex.name === apiExercise.name || ex.nameEn === apiExercise.name_en
            );
            
            if (frontendExercise) {
              // 프론트엔드 데이터와 백엔드 데이터 병합
              return {
                ...frontendExercise,
                ...apiExercise,
                // 프론트엔드의 angleCalculations 보존
                angleCalculations: frontendExercise.angleCalculations,
                icon: frontendExercise.icon
              };
            }
            
            // 매핑되지 않은 경우 API 데이터 그대로 사용
            return apiExercise;
          });
          
          console.log('Mapped exercises:', mappedExercises);
          setExercises(mappedExercises);
          setSelectedExercise(mappedExercises[0]);
        } else {
          throw new Error('No exercises returned from API');
        }
      } catch (error) {
        console.error('Error fetching exercises:', error);
        // 오류 시 프론트엔드 더미 데이터 사용
        console.log('Using dummy data...');
        const dummyExercises = allExercises.map((ex, index) => ({
          ...ex,
          id: index + 1, // 숫자 ID로 변환
          target_muscles: ex.targetMuscles, // API 형식에 맞게 변환
          key_points: ex.keyPoints,
          name_en: ex.nameEn
        }));
        console.log('Dummy exercises:', dummyExercises);
        setExercises(dummyExercises);
        if (dummyExercises.length > 0) {
          setSelectedExercise(dummyExercises[0]);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchExercises();
  }, []);

  const averageScore = analysisFrames.length > 0
    ? analysisFrames.reduce((sum, f) => sum + f.overallScore, 0) / analysisFrames.length
    : 0;

  // 실제 운동 시간 계산 (일시정지 시간 제외)
  const getActualDuration = () => {
    if (isAnalyzing) {
      const currentPausedDuration = isPaused && lastPauseTime 
        ? pausedDuration + (Date.now() - lastPauseTime)
        : pausedDuration;
      return (Date.now() - startTimeRef.current - currentPausedDuration) / 1000;
    }
    return exerciseDuration;
  };

  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
          <CircularProgress size={60} />
        </Box>
      </Container>
    );
  }

  if (!selectedExercise || exercises.length === 0) {
    return (
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          {t('pose_analysis.no_exercises_available')}
        </Alert>
        <Box sx={{ mt: 2 }}>
          <Typography>Exercises count: {exercises.length}</Typography>
          <Typography>Selected exercise: {selectedExercise ? 'Yes' : 'No'}</Typography>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h3" component="h1" gutterBottom>
          {t('pose_analysis.title')}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          {t('pose_analysis.subtitle')}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {/* 왼쪽 패널 - 운동 선택 */}
        <Box sx={{ flex: '0 1 300px', minWidth: '250px' }}>
          <ExerciseSelector
            exercises={exercises}
            selectedExercise={selectedExercise}
            selectedCategory={selectedCategory}
            onExerciseSelect={setSelectedExercise}
            onCategorySelect={setSelectedCategory}
            disabled={isAnalyzing}
          />
        </Box>

        {/* 중앙 패널 - 비디오/분석 */}
        <Box sx={{ flex: '1 1 600px', minWidth: 0 }}>
          {/* 비디오와 캔버스는 가장 상위에 한 번만 렌더링 */}
          <Box sx={{ position: 'relative' }}>
            <video
              ref={videoRef}
              style={{
                position: 'absolute',
                width: 0,
                height: 0,
                visibility: 'hidden'
              }}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                width: 0,
                height: 0,
                visibility: 'hidden'
              }}
            />
          </Box>
          
          <Card sx={{ mb: 3 }}>
            <CardContent>
              
              <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 2 }}>
                <Tab 
                  icon={<CameraAlt />} 
                  label={t('pose_analysis.realtime_analysis')} 
                  disabled={isAnalyzing && mode === 'upload'}
                />
                <Tab 
                  icon={<VideoLibrary />} 
                  label={t('pose_analysis.video_upload')} 
                  disabled={isAnalyzing}
                />
              </Tabs>

              <TabPanel value={currentTab} index={0}>
                {/* 실시간 분석 */}
                <Box sx={{ position: 'relative' }}>
                  <Paper
                    elevation={3}
                    sx={{
                      position: 'relative',
                      paddingTop: '56.25%', // 16:9 aspect ratio
                      bgcolor: 'black',
                      overflow: 'hidden'
                    }}
                  >
                    {/* 비디오와 캔버스는 위에서 이미 렌더링됨 */}
                    <Box
                      sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%'
                      }}
                    >
                      {/* 분석 중일 때 표시용 캔버스 */}
                      {isAnalyzing && (
                        <canvas
                          id="display-canvas"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      )}
                    </Box>
                    
                    {!isAnalyzing && !showFinalResults && mode === 'realtime' && (
                      <Box
                        sx={{
                          position: 'absolute',
                          top: '50%',
                          left: '50%',
                          transform: 'translate(-50%, -50%)',
                          textAlign: 'center'
                        }}
                      >
                        <Typography variant="h1" sx={{ mb: 2 }}>
                          🎥
                        </Typography>
                        <Typography variant="h5" color="white" sx={{ mb: 3 }}>
                          {t('pose_analysis.start_camera_message')}
                        </Typography>
                        <Button
                          variant="contained"
                          size="large"
                          startIcon={<PlayArrow />}
                          onClick={handleStartAnalysis}
                        >
                          {t('pose_analysis.start_analysis')}
                        </Button>
                      </Box>
                    )}
                  </Paper>

                  {/* 실시간 피드백 */}
                  {isAnalyzing && analysisResult && (
                    <RealtimeFeedback
                      analysisResult={analysisResult}
                      repCount={repCount}
                      duration={getActualDuration()}
                      isPaused={isPaused}
                    />
                  )}

                  {/* 컨트롤 버튼 */}
                  {isAnalyzing && (
                    <Box sx={{ mt: 2, textAlign: 'center', display: 'flex', gap: 2, justifyContent: 'center' }}>
                      <Button
                        variant="contained"
                        color={isPaused ? "primary" : "warning"}
                        size="large"
                        startIcon={isPaused ? <PlayCircle /> : <Pause />}
                        onClick={handleTogglePause}
                      >
                        {isPaused ? t('pose_analysis.resume_analysis') : t('pose_analysis.pause_analysis')}
                      </Button>
                      <Button
                        variant="contained"
                        color="error"
                        size="large"
                        startIcon={<Stop />}
                        onClick={handleStopAnalysis}
                      >
                        {t('pose_analysis.stop_analysis')}
                      </Button>
                    </Box>
                  )}
                </Box>
              </TabPanel>

              <TabPanel value={currentTab} index={1}>
                {/* 비디오 업로드 */}
                {!isAnalyzing && (
                  <VideoUpload 
                    onUpload={handleVideoUpload}
                    exercise={selectedExercise}
                  />
                )}
                
                {/* 비디오 분석 중일 때 캔버스 표시 */}
                {isAnalyzing && mode === 'upload' && (
                  <Box sx={{ position: 'relative' }}>
                    <Paper
                      elevation={3}
                      sx={{
                        position: 'relative',
                        paddingTop: '56.25%', // 16:9 aspect ratio
                        bgcolor: 'black',
                        overflow: 'hidden'
                      }}
                    >
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%'
                        }}
                      >
                        {/* 분석 중일 때 표시용 캔버스 */}
                        <canvas
                          id="display-canvas"
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain'
                          }}
                        />
                      </Box>
                    </Paper>

                    {/* 실시간 피드백 */}
                    {analysisResult && (
                      <RealtimeFeedback
                        analysisResult={analysisResult}
                        repCount={repCount}
                        duration={getActualDuration()}
                        isPaused={false}
                      />
                    )}

                    {/* 분석 중지 버튼 */}
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <Button
                        variant="contained"
                        color="error"
                        size="large"
                        startIcon={<Stop />}
                        onClick={handleStopAnalysis}
                      >
                        {t('pose_analysis.stop_analysis')}
                      </Button>
                    </Box>
                  </Box>
                )}
              </TabPanel>
            </CardContent>
          </Card>

          {/* 분석 결과 */}
          {showFinalResults && (analysisFrames.length > 0 || averageScore > 0) && (
            <FinalResults
              frames={analysisFrames}
              exercise={selectedExercise}
              duration={exerciseDuration}
              averageScore={averageScore}
              repCount={repCount}
              onClose={() => {
                setShowFinalResults(false);
                setAnalysisFrames([]);
                analysisFramesRef.current = [];
              }}
            />
          )}

          {/* 운동 정보 */}
          {!showFinalResults && !isAnalyzing && (
            <Card>
              <CardHeader
                title={`${selectedExercise.name} (${selectedExercise.name_en || selectedExercise.nameEn})`}
                subheader={selectedExercise.description}
              />
              <CardContent>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    {t('pose_analysis.target_muscles')}:
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {(selectedExercise.target_muscles || selectedExercise.targetMuscles || []).map((muscle: string, idx: number) => (
                      <Chip key={idx} label={muscle} size="small" />
                    ))}
                  </Box>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  {t('pose_analysis.key_points')}:
                </Typography>
                <List dense>
                  {(selectedExercise.key_points || selectedExercise.keyPoints || []).map((point: string, idx: number) => (
                    <ListItem key={idx}>
                      <ListItemText primary={`• ${point}`} />
                    </ListItem>
                  ))}
                </List>
              </CardContent>
            </Card>
          )}
        </Box>
      </Box>
    </Container>
  );
};

export default PoseAnalysisMain;
