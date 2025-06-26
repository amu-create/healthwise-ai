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
  const startTimeRef = useRef<number>(0);

  const {
    videoRef,
    canvasRef,
    isAnalyzing,
    analysisResult,
    repCount,
    startAnalysis,
    stopAnalysis,
    analyzeVideoFile
  } = useMediaPipe({
    exercise: selectedExercise,
    mode,
    onResults: (result) => {
      if (result && result.overallScore !== undefined) {
        const currentTime = (Date.now() - startTimeRef.current) / 1000;
        setAnalysisFrames(prev => [...prev, {
          ...result,
          timestamp: currentTime,
          frameIndex: prev.length,
          overallScore: result.overallScore || 0
        }]);
      }
    }
  });

  const handleStartAnalysis = () => {
    setShowFinalResults(false);
    setAnalysisFrames([]);
    startTimeRef.current = Date.now();
    startAnalysis();
  };

  const handleStopAnalysis = () => {
    stopAnalysis();
    const duration = (Date.now() - startTimeRef.current) / 1000;
    setExerciseDuration(duration);
    
    if (analysisFrames.length > 0) {
      setTimeout(() => {
        setShowFinalResults(true);
      }, 500);
    }
  };

  const handleVideoUpload = (file: File) => {
    setMode('upload');
    setShowFinalResults(false);
    setAnalysisFrames([]);
    startTimeRef.current = Date.now();
    analyzeVideoFile(file);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
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
          setExercises(data);
          setSelectedExercise(data[0]);
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
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Tabs value={currentTab} onChange={handleTabChange} sx={{ mb: 2 }}>
                <Tab 
                  icon={<CameraAlt />} 
                  label={t('pose_analysis.realtime_analysis')} 
                  disabled={isAnalyzing}
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
                    <video
                      ref={videoRef}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%',
                        display: isAnalyzing ? 'block' : 'none'
                      }}
                    />
                    <canvas
                      ref={canvasRef}
                      style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '100%',
                        height: '100%'
                      }}
                    />
                    
                    {!isAnalyzing && !showFinalResults && (
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
                      duration={(Date.now() - startTimeRef.current) / 1000}
                    />
                  )}

                  {/* 컨트롤 버튼 */}
                  {isAnalyzing && (
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
                  )}
                </Box>
              </TabPanel>

              <TabPanel value={currentTab} index={1}>
                {/* 비디오 업로드 */}
                <VideoUpload 
                  onUpload={handleVideoUpload}
                  exercise={selectedExercise}
                />
              </TabPanel>
            </CardContent>
          </Card>

          {/* 분석 결과 */}
          {showFinalResults && analysisFrames.length > 0 && (
            <FinalResults
              frames={analysisFrames}
              exercise={selectedExercise}
              duration={exerciseDuration}
              averageScore={averageScore}
              repCount={repCount}
              onClose={() => {
                setShowFinalResults(false);
                setAnalysisFrames([]);
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
