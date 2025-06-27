import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  Paper,
  CircularProgress,
  Alert,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  PhotoCamera as PhotoCameraIcon,
  Analytics as AnalyticsIcon,
  LocalFireDepartment as FireIcon,
  Egg as ProteinIcon,
  Grain as CarbIcon,
  OilBarrel as FatIcon,
  CalendarToday as CalendarIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  CheckCircle as CheckCircleIcon,
  NavigateBefore as NavigateBeforeIcon,
  NavigateNext as NavigateNextIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
// @ts-ignore
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip } from 'recharts';

interface FoodAnalysis {
  id: number;
  food_name: string;
  description?: string;
  image_url?: string;
  calories: number;
  protein: number;
  carbohydrates: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
  analysis_summary: string;
  recommendations: string;
  analyzed_at: string;
  is_temp?: boolean; // 임시 분석 여부
}

interface DailyNutrition {
  id: number;
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbohydrates: number;
  total_fat: number;
  food_analyses: FoodAnalysis[];
}

const TEMP_ANALYSES_KEY = 'healthwise_temp_food_analyses';

const AIFoodAnalysis: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [foodName, setFoodName] = useState('');
  const [description, setDescription] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [latestAnalysis, setLatestAnalysis] = useState<FoodAnalysis | null>(null);
  const [todayNutrition, setTodayNutrition] = useState<DailyNutrition | null>(null);
  const [openDetailDialog, setOpenDetailDialog] = useState(false);
  const [selectedAnalysis, setSelectedAnalysis] = useState<FoodAnalysis | null>(null);

  const [tempAnalyses, setTempAnalyses] = useState<FoodAnalysis[]>([]);
  const [savedAnalysesIds, setSavedAnalysesIds] = useState<Set<number>>(new Set());
  const [savingAnalysisId, setSavingAnalysisId] = useState<number | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // localStorage에서 임시 분석 목록 불러오기
  useEffect(() => {
    const savedTempAnalyses = localStorage.getItem(TEMP_ANALYSES_KEY);
    if (savedTempAnalyses) {
      try {
        const parsed = JSON.parse(savedTempAnalyses);
        setTempAnalyses(parsed);
      } catch (e) {
        console.error('Failed to load temp analyses:', e);
      }
    }
  }, []);

  // 임시 분석 목록이 변경될 때마다 localStorage에 저장
  useEffect(() => {
    if (tempAnalyses.length > 0) {
      localStorage.setItem(TEMP_ANALYSES_KEY, JSON.stringify(tempAnalyses));
    } else {
      localStorage.removeItem(TEMP_ANALYSES_KEY);
    }
  }, [tempAnalyses]);

  useEffect(() => {
    fetchNutritionForDate(selectedDate);
  }, [selectedDate, user]);

  const fetchNutritionForDate = async (date: Date) => {
    try {
      const dateStr = date.toISOString().split('T')[0];
      const response = await api.get(`/daily-nutrition/${dateStr}/`);
      setTodayNutrition(response.data);
    } catch (err) {
      console.log('No nutrition data for this date yet');
      setTodayNutrition(null);
    }
  };

  const handleDateChange = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImageBase64(base64String);
        setImagePreview(base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAnalyze = async () => {
    if (!foodName && !imageBase64) {
      setError(t('pages.aiNutrition.enterFoodInfo'));
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      // API에서 분석 결과만 받아오기 (저장하지 않음)
      const response = await api.post('/ai-nutrition/analyze/', {
        food_name: foodName,
        description: description,
        image_base64: imageBase64
      });

      // 분석 결과를 임시 목록에 추가
      const tempAnalysis = {
        ...response.data,
        is_temp: true,
        id: Date.now(), // 임시 ID
        analyzed_at: new Date().toISOString(),
      };
      
      setTempAnalyses([tempAnalysis, ...tempAnalyses]);
      setLatestAnalysis(tempAnalysis);
      setSuccess(t('pages.aiNutrition.analysisComplete'));
      
      // 입력 초기화
      setFoodName('');
      setDescription('');
      setImageBase64('');
      setImagePreview('');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err: any) {
      setError(err.response?.data?.error || t('pages.aiNutrition.analysisFailed'));
    } finally {
      setLoading(false);
    }
  };

  const saveTempAnalysis = async (analysis: FoodAnalysis) => {
    if (!user) {
      setError(t('auth.loginRequired'));
      return;
    }

    setSavingAnalysisId(analysis.id);
    try {
      // 실제 저장 API 호출
      const response = await api.post('/ai-nutrition/', {
        food_name: analysis.food_name,
        description: analysis.description,
        calories: analysis.calories,
        protein: analysis.protein,
        carbohydrates: analysis.carbohydrates,
        fat: analysis.fat,
        fiber: analysis.fiber,
        sugar: analysis.sugar,
        sodium: analysis.sodium,
        analysis_summary: analysis.analysis_summary,
        recommendations: analysis.recommendations,
      });

      // 저장된 분석 ID 기록
      const newSavedIds = new Set(savedAnalysesIds);
      newSavedIds.add(analysis.id);
      setSavedAnalysesIds(newSavedIds);
      
      // 임시 목록에서 제거
      setTempAnalyses(tempAnalyses.filter(a => a.id !== analysis.id));
      
      // 영양 정보 다시 불러오기
      await fetchNutritionForDate(selectedDate);
      
      setSuccess('음식을 기록했습니다!');
    } catch (err: any) {
      setError(err.response?.data?.error || t('errors.general'));
    } finally {
      setSavingAnalysisId(null);
    }
  };

  const deleteTempAnalysis = (id: number) => {
    setTempAnalyses(tempAnalyses.filter(a => a.id !== id));
    if (latestAnalysis?.id === id) {
      setLatestAnalysis(null);
    }
  };

  const deleteAnalysis = async (id: number) => {
    if (!window.confirm(t('pages.aiNutrition.deleteConfirm'))) return;

    try {
      await api.delete(`/food-analyses/${id}/`);
      setSuccess(t('pages.aiNutrition.deleteSuccess'));
      fetchNutritionForDate(selectedDate);
    } catch (err) {
      setError(t('errors.general'));
    }
  };

  const viewAnalysisDetail = (analysis: FoodAnalysis) => {
    setSelectedAnalysis(analysis);
    setOpenDetailDialog(true);
  };

  // 차트 데이터 준비
  const getMacroData = (analysis: FoodAnalysis) => {
    const total = analysis.protein + analysis.carbohydrates + analysis.fat;
    return [
      { name: '단백질', value: analysis.protein, percentage: (analysis.protein / total * 100).toFixed(1) },
      { name: '탄수화물', value: analysis.carbohydrates, percentage: (analysis.carbohydrates / total * 100).toFixed(1) },
      { name: '지방', value: analysis.fat, percentage: (analysis.fat / total * 100).toFixed(1) },
    ];
  };

  const COLORS = ['#00D4FF', '#00FFB3', '#FF6B6B'];

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" gutterBottom sx={{ 
            fontWeight: 900,
            background: 'linear-gradient(135deg, #00D4FF 0%, #00FFB3 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {t('pages.aiNutrition.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('pages.aiNutrition.subtitle')}
          </Typography>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
          {/* 입력 섹션 */}
          <Box>
            <Card sx={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {t('pages.aiNutrition.enterFoodTitle')}
                </Typography>
                
                <Box sx={{ mb: 3 }}>
                  <TextField
                    fullWidth
                    label={t('pages.aiNutrition.foodName')}
                    value={foodName}
                    onChange={(e) => setFoodName(e.target.value)}
                    placeholder={t('pages.aiNutrition.foodNamePlaceholder')}
                    sx={{ mb: 2 }}
                  />
                  
                  <TextField
                    fullWidth
                    label={t('pages.aiNutrition.additionalDescription')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('pages.aiNutrition.descriptionPlaceholder')}
                    multiline
                    rows={2}
                    sx={{ mb: 2 }}
                  />
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    style={{ display: 'none' }}
                    id="food-image-input"
                  />
                  <label htmlFor="food-image-input">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<PhotoCameraIcon />}
                      fullWidth
                      sx={{ mb: 2 }}
                    >
                      {t('pages.aiNutrition.uploadPhoto')}
                    </Button>
                  </label>
                  
                  {imagePreview && (
                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                      <img 
                        src={imagePreview} 
                        alt={t('pages.aiNutrition.foodPreview')} 
                        style={{ 
                          maxWidth: '100%', 
                          maxHeight: '200px',
                          borderRadius: '8px',
                        }} 
                      />
                    </Box>
                  )}
                </Box>
                
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleAnalyze}
                  disabled={loading || (!foodName && !imageBase64)}
                  startIcon={loading ? <CircularProgress size={20} /> : <AnalyticsIcon />}
                  sx={{
                    background: 'linear-gradient(135deg, #00D4FF 0%, #00FFB3 100%)',
                    color: '#000',
                    fontWeight: 'bold',
                    '&:hover': {
                      background: 'linear-gradient(135deg, #00FFB3 0%, #00D4FF 100%)',
                    },
                  }}
                >
                  {loading ? t('common.loading') : t('pages.aiNutrition.analyze')}
                </Button>
              </CardContent>
            </Card>
          </Box>

          {/* 최근 분석 결과 */}
          <Box>
            {latestAnalysis && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <Card sx={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {t('pages.aiNutrition.analysisResult')}: {latestAnalysis.food_name}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="h4" sx={{ color: '#00D4FF', fontWeight: 'bold' }}>
                        {latestAnalysis.calories} kcal
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 1, mb: 2 }}>
                      <Box sx={{ textAlign: 'center' }}>
                        <ProteinIcon sx={{ color: '#00D4FF' }} />
                        <Typography variant="body2">{t('dashboard.protein')}</Typography>
                        <Typography variant="h6">{latestAnalysis.protein}g</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <CarbIcon sx={{ color: '#00FFB3' }} />
                        <Typography variant="body2">{t('dashboard.carbohydrates')}</Typography>
                        <Typography variant="h6">{latestAnalysis.carbohydrates}g</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'center' }}>
                        <FatIcon sx={{ color: '#FF6B6B' }} />
                        <Typography variant="body2">{t('dashboard.fat')}</Typography>
                        <Typography variant="h6">{latestAnalysis.fat}g</Typography>
                      </Box>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>{t('pages.aiNutrition.analysisSummary')}:</strong>
                    </Typography>
                    <Typography variant="body2" paragraph>
                      {latestAnalysis.analysis_summary}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      <strong>{t('pages.aiNutrition.recommendations')}:</strong>
                    </Typography>
                    <Typography variant="body2">
                      {latestAnalysis.recommendations}
                    </Typography>
                    
                    {latestAnalysis.is_temp && (
                      <Box sx={{ mt: 2 }}>
                        <Button
                          variant="contained"
                          fullWidth
                          onClick={() => saveTempAnalysis(latestAnalysis)}
                          disabled={savedAnalysesIds.has(latestAnalysis.id) || savingAnalysisId === latestAnalysis.id}
                          startIcon={savingAnalysisId === latestAnalysis.id ? <CircularProgress size={20} /> : savedAnalysesIds.has(latestAnalysis.id) ? <CheckCircleIcon /> : <FireIcon />}
                          sx={{
                            background: savedAnalysesIds.has(latestAnalysis.id) 
                              ? 'linear-gradient(135deg, #4CAF50 0%, #45A049 100%)'
                              : 'linear-gradient(135deg, #00D4FF 0%, #00FFB3 100%)',
                            color: savedAnalysesIds.has(latestAnalysis.id) ? '#fff' : '#000',
                            fontWeight: 'bold',
                            '&:hover': {
                              background: savedAnalysesIds.has(latestAnalysis.id)
                                ? 'linear-gradient(135deg, #45A049 0%, #4CAF50 100%)'
                                : 'linear-gradient(135deg, #00FFB3 0%, #00D4FF 100%)',
                            },
                          }}
                        >
                          {savedAnalysesIds.has(latestAnalysis.id) ? '저장됨' : '먹었어요'}
                        </Button>
                      </Box>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </Box>

          {/* 임시 분석 목록 */}
          {tempAnalyses.length > 0 && (
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Card sx={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    분석한 음식들 (아직 기록 전)
                  </Typography>
                  <List>
                    {tempAnalyses.map((analysis) => (
                      <ListItem
                        key={analysis.id}
                        secondaryAction={
                          <Box>
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={() => saveTempAnalysis(analysis)}
                              disabled={savedAnalysesIds.has(analysis.id) || savingAnalysisId === analysis.id}
                              startIcon={savingAnalysisId === analysis.id ? <CircularProgress size={16} /> : savedAnalysesIds.has(analysis.id) ? <CheckCircleIcon /> : <FireIcon />}
                              sx={{ mr: 1 }}
                            >
                              {savedAnalysesIds.has(analysis.id) ? '저장됨' : '먹었어요'}
                            </Button>
                            <IconButton onClick={() => viewAnalysisDetail(analysis)}>
                              <ViewIcon />
                            </IconButton>
                            <IconButton onClick={() => deleteTempAnalysis(analysis.id)} color="error">
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        }
                      >
                        <ListItemText
                          primary={analysis.food_name}
                          secondary={`${analysis.calories} kcal | ${new Date(analysis.analyzed_at).toLocaleTimeString('ko-KR')}`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Box>
          )}

          {/* 오늘의 영양 섭취 */}
          <Box sx={{ gridColumn: '1 / -1' }}>
            <Card sx={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">
                    영양 섭취 기록
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton onClick={() => handleDateChange(-1)} size="small">
                      <NavigateBeforeIcon />
                    </IconButton>
                    <Chip 
                      icon={<CalendarIcon />} 
                      label={selectedDate.toLocaleDateString('ko-KR')} 
                      onClick={() => {
                        // 날짜 선택 다이얼로그 열기 (추후 구현)
                      }}
                    />
                    <IconButton 
                      onClick={() => handleDateChange(1)} 
                      size="small"
                      disabled={selectedDate.toDateString() === new Date().toDateString()}
                    >
                      <NavigateNextIcon />
                    </IconButton>
                  </Box>
                </Box>

                {todayNutrition ? (
                  <>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(4, 1fr)' }, gap: 2, mb: 3 }}>
                      <Paper sx={{ p: 2, textAlign: 'center', background: 'rgba(0, 212, 255, 0.1)' }}>
                        <FireIcon sx={{ color: '#00D4FF', mb: 1 }} />
                        <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                          {todayNutrition.total_calories}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('pages.aiNutrition.totalCalories')}
                        </Typography>
                      </Paper>
                      <Paper sx={{ p: 2, textAlign: 'center', background: 'rgba(0, 255, 179, 0.1)' }}>
                        <Typography variant="h6">{todayNutrition.total_protein}g</Typography>
                        <Typography variant="body2" color="text.secondary">{t('dashboard.protein')}</Typography>
                      </Paper>
                      <Paper sx={{ p: 2, textAlign: 'center', background: 'rgba(0, 255, 179, 0.1)' }}>
                        <Typography variant="h6">{todayNutrition.total_carbohydrates}g</Typography>
                        <Typography variant="body2" color="text.secondary">{t('dashboard.carbohydrates')}</Typography>
                      </Paper>
                      <Paper sx={{ p: 2, textAlign: 'center', background: 'rgba(255, 107, 107, 0.1)' }}>
                        <Typography variant="h6">{todayNutrition.total_fat}g</Typography>
                        <Typography variant="body2" color="text.secondary">{t('dashboard.fat')}</Typography>
                      </Paper>
                    </Box>

                    <Typography variant="subtitle2" gutterBottom>
                      기록한 음식들 ({todayNutrition.food_analyses.length}개)
                    </Typography>
                    <List>
                      {todayNutrition?.food_analyses?.map((analysis) => (
                        <ListItem
                          key={analysis.id}
                          secondaryAction={
                            <Box>
                              <IconButton onClick={() => viewAnalysisDetail(analysis)}>
                                <ViewIcon />
                              </IconButton>
                              <IconButton onClick={() => deleteAnalysis(analysis.id)} color="error">
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemText
                            primary={analysis.food_name}
                            secondary={`${analysis.calories} kcal | ${new Date(analysis.analyzed_at).toLocaleTimeString('ko-KR')}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </>
                ) : (
                  <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                    {selectedDate.toDateString() === new Date().toDateString() 
                      ? '오늘 먹은 음식을 기록해보세요!'
                      : '이날은 기록된 음식이 없습니다.'}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Box>
        </Box>

        {/* 상세 정보 다이얼로그 */}
        <Dialog
          open={openDetailDialog}
          onClose={() => setOpenDetailDialog(false)}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>{selectedAnalysis?.food_name} {t('pages.aiNutrition.detailInfo')}</DialogTitle>
          <DialogContent>
            {selectedAnalysis && (
              <Box sx={{ pt: 2 }}>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="h4" sx={{ color: '#00D4FF', fontWeight: 'bold', textAlign: 'center' }}>
                    {selectedAnalysis.calories} kcal
                  </Typography>
                </Box>

                <Box sx={{ height: 200, mb: 3 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={getMacroData(selectedAnalysis)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) => `${entry.name}: ${entry.percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {getMacroData(selectedAnalysis).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>

                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2, mb: 2 }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary">{t('dashboard.protein')}</Typography>
                    <Typography variant="h6">{selectedAnalysis.protein}g</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">{t('dashboard.carbohydrates')}</Typography>
                    <Typography variant="h6">{selectedAnalysis.carbohydrates}g</Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">{t('dashboard.fat')}</Typography>
                    <Typography variant="h6">{selectedAnalysis.fat}g</Typography>
                  </Box>
                  {selectedAnalysis.fiber && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">{t('pages.aiNutrition.fiber')}</Typography>
                      <Typography variant="h6">{selectedAnalysis.fiber}g</Typography>
                    </Box>
                  )}
                  {selectedAnalysis.sugar && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">{t('pages.aiNutrition.sugar')}</Typography>
                      <Typography variant="h6">{selectedAnalysis.sugar}g</Typography>
                    </Box>
                  )}
                  {selectedAnalysis.sodium && (
                    <Box>
                      <Typography variant="body2" color="text.secondary">{t('pages.aiNutrition.sodium')}</Typography>
                      <Typography variant="h6">{selectedAnalysis.sodium}mg</Typography>
                    </Box>
                  )}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>{t('pages.aiNutrition.analysisSummary')}:</strong>
                </Typography>
                <Typography variant="body2" paragraph>
                  {selectedAnalysis.analysis_summary}
                </Typography>

                <Typography variant="body2" color="text.secondary" gutterBottom>
                  <strong>{t('pages.aiNutrition.recommendations')}:</strong>
                </Typography>
                <Typography variant="body2">
                  {selectedAnalysis.recommendations}
                </Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDetailDialog(false)}>{t('common.close')}</Button>
            {selectedAnalysis?.is_temp && (
              <Button 
                variant="contained"
                onClick={() => {
                  saveTempAnalysis(selectedAnalysis);
                  setOpenDetailDialog(false);
                }}
                startIcon={<FireIcon />}
                sx={{
                  background: 'linear-gradient(135deg, #00D4FF 0%, #00FFB3 100%)',
                  color: '#000',
                  fontWeight: 'bold',
                }}
              >
                먹었어요
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </motion.div>
    </Container>
  );
};

export default AIFoodAnalysis;