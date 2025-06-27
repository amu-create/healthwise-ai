import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Container,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Alert,
  Chip,
  LinearProgress,
} from '@mui/material';
import {
  CalendarToday as CalendarIcon,
  LocalFireDepartment as CaloriesIcon,
  Egg as ProteinIcon,
  Grain as CarbIcon,
  OilBarrel as FatIcon,
  TrendingUp as TrendIcon,
  Restaurant as FoodIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import api from '../services/api';
import { useTranslation } from 'react-i18next';

interface NutritionData {
  date: string;
  total_calories: number;
  total_protein: number;
  total_carbohydrates: number;
  total_fat: number;
  food_count: number;
}

interface PeriodStats {
  average_calories: number;
  average_protein: number;
  average_carbohydrates: number;
  average_fat: number;
  total_days: number;
  total_analyses: number;
  trend_calories: number; // 증감률
  trend_protein: number;
  trend_carbohydrates: number;
  trend_fat: number;
}

const COLORS = {
  calories: '#00D4FF',
  protein: '#00FFB3',
  carbohydrates: '#FFB347',
  fat: '#FF6B6B',
};

const Nutrition: React.FC = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | '6months' | 'year'>('week');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [nutritionData, setNutritionData] = useState<NutritionData[]>([]);
  const [periodStats, setPeriodStats] = useState<PeriodStats | null>(null);

  useEffect(() => {
    fetchNutritionData();
  }, [period]);

  const fetchNutritionData = async () => {
    setLoading(true);
    setError('');

    try {
      // 기간 설정
      const endDate = new Date();
      const startDate = new Date();
      
      switch (period) {
        case 'day':
          startDate.setDate(endDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(endDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(endDate.getMonth() - 1);
          break;
        case '6months':
          startDate.setMonth(endDate.getMonth() - 6);
          break;
        case 'year':
          startDate.setFullYear(endDate.getFullYear() - 1);
          break;
      }

      const response = await api.get('/nutrition-statistics/', {
        params: {
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        },
      });

      setNutritionData(response.data.daily_data || []);
      setPeriodStats(response.data.period_stats || null);
    } catch (err) {
      console.error('Failed to fetch nutrition data:', err);
      setError(t('pages.nutrition.errorLoadingData'));
    } finally {
      setLoading(false);
    }
  };

  const handlePeriodChange = (event: React.MouseEvent<HTMLElement>, newPeriod: string | null) => {
    if (newPeriod) {
      setPeriod(newPeriod as typeof period);
    }
  };

  // 원형 차트 데이터 준비
  const getMacroData = () => {
    if (!periodStats) return [];
    
    return [
      { name: t('dashboard.protein'), value: periodStats.average_protein, color: COLORS.protein },
      { name: t('dashboard.carbohydrates'), value: periodStats.average_carbohydrates, color: COLORS.carbohydrates },
      { name: t('dashboard.fat'), value: periodStats.average_fat, color: COLORS.fat },
    ];
  };

  // 차트 데이터 포맷팅
  const formatChartData = () => {
    return nutritionData.map(item => ({
      date: new Date(item.date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }),
      [t('pages.nutrition.calories')]: item.total_calories,
      [t('dashboard.protein')]: item.total_protein,
      [t('dashboard.carbohydrates')]: item.total_carbohydrates,
      [t('dashboard.fat')]: item.total_fat,
    }));
  };

  // 권장량 대비 퍼센티지 계산
  const getPercentage = (value: number, recommended: number) => {
    return Math.min((value / recommended) * 100, 100);
  };

  const recommendedValues = {
    calories: 2000,
    protein: 50,
    carbohydrates: 300,
    fat: 65,
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* 헤더 */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h3" gutterBottom sx={{ 
            fontWeight: 900,
            background: 'linear-gradient(135deg, #00D4FF 0%, #00FFB3 100%)',
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>
            {t('pages.nutrition.title')}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {t('pages.nutrition.subtitle')}
          </Typography>
        </Box>

        {/* 기간 선택 */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'center' }}>
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={handlePeriodChange}
            aria-label="기간 선택"
          >
            <ToggleButton value="day">{t('pages.nutrition.periods.day')}</ToggleButton>
            <ToggleButton value="week">{t('pages.nutrition.periods.week')}</ToggleButton>
            <ToggleButton value="month">{t('pages.nutrition.periods.month')}</ToggleButton>
            <ToggleButton value="6months">{t('pages.nutrition.periods.sixMonths')}</ToggleButton>
            <ToggleButton value="year">{t('pages.nutrition.periods.year')}</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* 통계 카드 */}
            {periodStats && (
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
                <Box>
                  <Card sx={{ background: 'rgba(0, 212, 255, 0.1)', backdropFilter: 'blur(10px)' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CaloriesIcon sx={{ color: COLORS.calories, mr: 1 }} />
                        <Typography variant="h6">{t('pages.nutrition.averageCalories')}</Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: COLORS.calories }}>
                        {Math.round(periodStats.average_calories)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('pages.nutrition.kcalPerDay')}
                      </Typography>
                      {periodStats.trend_calories !== 0 && (
                        <Chip
                          size="small"
                          icon={<TrendIcon />}
                          label={`${periodStats.trend_calories > 0 ? '+' : ''}${periodStats.trend_calories.toFixed(1)}%`}
                          color={periodStats.trend_calories > 0 ? 'error' : 'success'}
                          sx={{ mt: 1 }}
                        />
                      )}
                    </CardContent>
                  </Card>
                </Box>

                <Box>
                  <Card sx={{ background: 'rgba(0, 255, 179, 0.1)', backdropFilter: 'blur(10px)' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <ProteinIcon sx={{ color: COLORS.protein, mr: 1 }} />
                        <Typography variant="h6">{t('pages.nutrition.averageProtein')}</Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: COLORS.protein }}>
                        {Math.round(periodStats.average_protein)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('pages.nutrition.gPerDay')}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={getPercentage(periodStats.average_protein, recommendedValues.protein)}
                        sx={{ mt: 1, height: 6, borderRadius: 3 }}
                      />
                    </CardContent>
                  </Card>
                </Box>

                <Box>
                  <Card sx={{ background: 'rgba(255, 179, 71, 0.1)', backdropFilter: 'blur(10px)' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <CarbIcon sx={{ color: COLORS.carbohydrates, mr: 1 }} />
                        <Typography variant="h6">{t('pages.nutrition.averageCarbohydrates')}</Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: COLORS.carbohydrates }}>
                        {Math.round(periodStats.average_carbohydrates)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('pages.nutrition.gPerDay')}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={getPercentage(periodStats.average_carbohydrates, recommendedValues.carbohydrates)}
                        sx={{ mt: 1, height: 6, borderRadius: 3 }}
                      />
                    </CardContent>
                  </Card>
                </Box>

                <Box>
                  <Card sx={{ background: 'rgba(255, 107, 107, 0.1)', backdropFilter: 'blur(10px)' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <FatIcon sx={{ color: COLORS.fat, mr: 1 }} />
                        <Typography variant="h6">{t('pages.nutrition.averageFat')}</Typography>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 'bold', color: COLORS.fat }}>
                        {Math.round(periodStats.average_fat)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('pages.nutrition.gPerDay')}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={getPercentage(periodStats.average_fat, recommendedValues.fat)}
                        sx={{ mt: 1, height: 6, borderRadius: 3 }}
                      />
                    </CardContent>
                  </Card>
                </Box>
              </Box>
            )}

            {/* 차트 섹션 */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
              {/* 칼로리 추이 차트 */}
              <Box>
                <Card sx={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {t('pages.nutrition.calorieIntakeTrend')}
                    </Typography>
                    <Box sx={{ height: 300, mt: 2 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={formatChartData()}>
                          <defs>
                            <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLORS.calories} stopOpacity={0.8}/>
                              <stop offset="95%" stopColor={COLORS.calories} stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Area 
                            type="monotone" 
                            dataKey={t('pages.nutrition.calories')} 
                            stroke={COLORS.calories} 
                            fillOpacity={1} 
                            fill="url(#colorCalories)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              {/* 영양소 비율 차트 */}
              <Box>
                <Card sx={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {t('pages.nutrition.averageNutrientRatio')}
                    </Typography>
                    <Box sx={{ height: 300, mt: 2 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={getMacroData()}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(entry) => `${entry.name}: ${entry.value.toFixed(0)}${t('pages.nutrition.gram')}`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {getMacroData().map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Box>
            </Box>

            {/* 영양소별 추이 차트 */}
            <Box sx={{ mt: 3 }}>
                <Card sx={{ background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {t('pages.nutrition.nutrientIntakeTrend')}
                    </Typography>
                    <Box sx={{ height: 350, mt: 2 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={formatChartData()}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey={t('dashboard.protein')} 
                            stroke={COLORS.protein} 
                            strokeWidth={2}
                            dot={{ fill: COLORS.protein, r: 4 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey={t('dashboard.carbohydrates')} 
                            stroke={COLORS.carbohydrates} 
                            strokeWidth={2}
                            dot={{ fill: COLORS.carbohydrates, r: 4 }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey={t('dashboard.fat')} 
                            stroke={COLORS.fat} 
                            strokeWidth={2}
                            dot={{ fill: COLORS.fat, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Box>

            {/* 요약 정보 */}
            {periodStats && (
              <Box sx={{ mt: 4 }}>
                <Paper sx={{ p: 3, background: 'rgba(255,255,255,0.05)', backdropFilter: 'blur(10px)' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <FoodIcon sx={{ mr: 1 }} />
                    <Typography variant="h6">{t('pages.nutrition.periodSummary')}</Typography>
                  </Box>
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' }, gap: 2 }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('pages.nutrition.analyzedFoodCount')}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {periodStats.total_analyses}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('pages.nutrition.recordedDays')}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {periodStats.total_days}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('pages.nutrition.dailyAverageFoods')}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {periodStats.total_days > 0 
                          ? (periodStats.total_analyses / periodStats.total_days).toFixed(1)
                          : 0}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="body2" color="text.secondary">
                        {t('pages.nutrition.calorieGoalAchievement')}
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                        {getPercentage(periodStats.average_calories, recommendedValues.calories).toFixed(0)}%
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>
            )}

            {/* 데이터가 없을 때 */}
            {nutritionData.length === 0 && !loading && (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <Typography variant="h6" color="text.secondary" gutterBottom>
                  {t('pages.nutrition.noDataForPeriod')}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('pages.nutrition.startRecording')}
                </Typography>
              </Box>
            )}
          </>
        )}
      </motion.div>
    </Container>
  );
};

export default Nutrition;
