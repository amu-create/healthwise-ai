import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  LinearProgress,
  IconButton,
  Avatar,
  Chip,
  Button,
  Skeleton,
} from '@mui/material';
import {
  LocalFireDepartment,
  DirectionsRun,
  Restaurant,
  FitnessCenter,
  MoreVert,
  NavigateNext,
  Egg as ProteinIcon,
  Grain as CarbIcon,
  OilBarrel as FatIcon,
  EmojiEvents,
  TrendingUp,
  TrendingDown,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { styled } from '@mui/material/styles';
import DailyRecommendations from '../components/DailyRecommendations';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const StatsCard = styled(Card)(({ theme }) => ({
  background: 'rgba(17, 17, 17, 0.8)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 20,
  transition: 'all 0.3s ease',
  cursor: 'pointer',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
  },
}));

const GradientIcon = styled(Box)<{ gradient?: string }>(({ gradient }) => ({
  width: 60,
  height: 60,
  borderRadius: 16,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  background: gradient || 'linear-gradient(135deg, #00D4FF, #00FFB3)',
  color: '#000',
  marginBottom: 16,
}));

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [todayNutrition, setTodayNutrition] = useState<any>(null);
  const [workoutStats, setWorkoutStats] = useState<any>(null);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);
  const [userGoals, setUserGoals] = useState({
    calories: 2000,
    protein: 50,
    workout: 60,
    steps: 10000,
  });
  // 업적 진행 상황 상태 제거

  useEffect(() => {
    fetchDashboardData();
  }, [i18n.language]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      // 업적 진행 상황 제거 - Today's Goals는 이제 독립적으로 계산

      // 오늘의 영양 데이터
      const today = new Date().toISOString().split('T')[0];
      try {
        const nutritionRes = await api.get(`/daily-nutrition/${today}/`);
        setTodayNutrition(nutritionRes.data);
      } catch (err) {
        console.log('No nutrition data for today');
      }

      // 주간 영양 통계
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - 7);
      
      try {
        const weeklyRes = await api.get('/nutrition-statistics/', {
          params: {
            start_date: startDate.toISOString().split('T')[0],
            end_date: endDate.toISOString().split('T')[0],
          },
        });
        
        if (weeklyRes.data.daily_data) {
          setWeeklyData(weeklyRes.data.daily_data);
        }
      } catch (err) {
        console.log('Failed to fetch weekly data');
      }

      // 운동 로그 데이터
      try {
        const workoutRes = await api.get('/workout-logs/', {
          params: { limit: 7 },
        });
        
        // 오늘의 운동 시간 계산
        const todayWorkouts = workoutRes.data.filter((log: any) => 
          log.date === today
        );
        const totalMinutes = todayWorkouts.reduce((sum: number, log: any) => 
          sum + (log.duration || 0), 0
        );
        
        setWorkoutStats({ 
          todayMinutes: totalMinutes,
          weeklyLogs: workoutRes.data,
        });
      } catch (err) {
        console.log('Failed to fetch workout data');
      }

      // 최근 활동 생성
      interface Activity {
        type: string;
        name: string;
        time: string;
        detail: string;
        icon: React.ReactNode;
        color: string;
      }
      const activities: Activity[] = [];
      
      // 최근 영양 분석
      if (todayNutrition?.food_analyses) {
        todayNutrition.food_analyses.slice(0, 2).forEach((food: any) => {
          activities.push({
            type: t('dashboard.meal'),
            name: food.food_name,
            time: new Date(food.analyzed_at).toLocaleTimeString(i18n.language, { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            detail: `${food.calories}kcal`,
            icon: <Restaurant />,
            color: '#00FFB3',
          });
        });
      }

      // 최근 운동
      if (workoutStats?.weeklyLogs) {
        workoutStats.weeklyLogs.slice(0, 2).forEach((log: any) => {
          activities.push({
            type: t('dashboard.exercise'),
            name: log.exercise_name || t('dashboard.exercise'),
            time: new Date(log.logged_at).toLocaleTimeString(i18n.language, { 
              hour: '2-digit', 
              minute: '2-digit' 
            }),
            detail: `${log.duration || 0} ${t('dashboard.minutes')}`,
            icon: <FitnessCenter />,
            color: '#00D4FF',
          });
        });
      }

      setRecentActivities(activities.sort((a, b) => 
        b.time.localeCompare(a.time)
      ).slice(0, 4));

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 통계 카드 데이터
  const stats = [
    {
      title: t('dashboard.todayCalories'),
      value: todayNutrition?.total_calories || 0,
      unit: 'kcal',
      goal: userGoals.calories,
      progress: Math.min(((todayNutrition?.total_calories || 0) / userGoals.calories) * 100, 100),
      icon: <LocalFireDepartment />,
      gradient: 'linear-gradient(135deg, #FF6B6B, #FF8787)',
      onClick: () => navigate('/nutrition'),
    },
    {
      title: t('dashboard.exerciseTime'),
      value: workoutStats?.todayMinutes || 0,
      unit: t('dashboard.minutes'),
      goal: userGoals.workout,
      progress: Math.min(((workoutStats?.todayMinutes || 0) / userGoals.workout) * 100, 100),
      icon: <DirectionsRun />,
      gradient: 'linear-gradient(135deg, #00D4FF, #00A8CC)',
      onClick: () => navigate('/ai-workout'),
    },
    {
      title: t('dashboard.proteinIntake'),
      value: todayNutrition?.total_protein || 0,
      unit: 'g',
      goal: userGoals.protein,
      progress: Math.min(((todayNutrition?.total_protein || 0) / userGoals.protein) * 100, 100),
      icon: <ProteinIcon />,
      gradient: 'linear-gradient(135deg, #00FFB3, #00CC8F)',
      onClick: () => navigate('/ai-nutrition'),
    },
  ];

  // 주간 데이터 차트용 포맷
  const formatWeeklyChartData = () => {
    return weeklyData.map(item => ({
      date: new Date(item.date).toLocaleDateString(i18n.language, { 
        month: 'short', 
        day: 'numeric' 
      }),
      [t('pages.map.calories')]: item.total_calories,
      [t('dashboard.protein')]: item.total_protein,
    }));
  };

  // 영양소 비율 데이터
  const getNutritionRatioData = () => {
    if (!todayNutrition) return [];
    
    const total = (todayNutrition.total_protein || 0) + 
                  (todayNutrition.total_carbohydrates || 0) + 
                  (todayNutrition.total_fat || 0);
    
    if (total === 0) return [];
    
    return [
      { name: t('dashboard.protein'), value: todayNutrition.total_protein || 0, color: '#00FFB3' },
      { name: t('dashboard.carbohydrates'), value: todayNutrition.total_carbohydrates || 0, color: '#FFB347' },
      { name: t('dashboard.fat'), value: todayNutrition.total_fat || 0, color: '#FF6B6B' },
    ];
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rectangular" height={200} sx={{ mb: 3, borderRadius: 3 }} />
        <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} variant="rectangular" height={180} sx={{ flex: 1, borderRadius: 3 }} />
          ))}
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box mb={4}>
        <Typography variant="h4" fontWeight={900} mb={1}>
          {t('dashboard.greeting', { name: user?.username })}
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {t('dashboard.subtitle')}
        </Typography>
      </Box>

      {/* 목표 달성 현황 */}
      <Box mb={4}>
        <Paper 
          sx={{
            p: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 255, 179, 0.1))',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            transition: 'all 0.3s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
            },
          }}
          onClick={() => navigate('/achievements')}>
          <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
            <Typography variant="h6" fontWeight={700}>
              {t('dashboard.todayGoals')}
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Chip 
                icon={<EmojiEvents />} 
                label={t('dashboard.achieved', { percent: Math.round(stats.reduce((sum, stat) => sum + stat.progress, 0) / stats.length) })}
                color="primary"
              />
              <NavigateNext />
            </Box>
          </Box>
          <LinearProgress
            variant="determinate"
            value={stats.reduce((sum, stat) => sum + stat.progress, 0) / stats.length}
            sx={{
              height: 10,
              borderRadius: 5,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                background: 'linear-gradient(90deg, #00D4FF, #00FFB3)',
              },
            }}
          />
          <Box display="flex" justifyContent="space-between" mt={2}>
            <Typography variant="caption" color="text.secondary">
              {t('dashboard.caloriesProgress', { current: todayNutrition?.total_calories || 0, goal: userGoals.calories })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('dashboard.exerciseProgress', { current: workoutStats?.todayMinutes || 0, goal: userGoals.workout })}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {t('dashboard.proteinProgress', { current: todayNutrition?.total_protein || 0, goal: userGoals.protein })}
            </Typography>
          </Box>
        </Paper>
      </Box>

      {/* Stats Grid */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: 'repeat(4, 1fr)' }, gap: 3, mb: 4 }}>
        {stats.map((stat, index) => (
          <StatsCard key={index} onClick={stat.onClick}>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="start">
                <Box>
                  <GradientIcon gradient={stat.gradient}>{stat.icon}</GradientIcon>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    {stat.title}
                  </Typography>
                  <Typography variant="h4" fontWeight={700}>
                    {stat.value}
                    <Typography
                      component="span"
                      variant="body1"
                      color="text.secondary"
                      ml={1}
                    >
                      {stat.unit}
                    </Typography>
                  </Typography>
                </Box>
                <IconButton size="small">
                  <NavigateNext />
                </IconButton>
              </Box>
              <Box mt={2}>
                <LinearProgress
                  variant="determinate"
                  value={stat.progress}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      background: stat.gradient,
                    },
                  }}
                />
                <Box display="flex" justifyContent="space-between" mt={1}>
                  <Typography variant="caption" color="text.secondary">
                    {t('dashboard.goalProgress', { percent: stat.progress.toFixed(0) })}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('dashboard.goal')}: {stat.goal}{stat.unit}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </StatsCard>
        ))}
      </Box>

      {/* Charts & Activities */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '2fr 1fr' }, gap: 3 }}>
        {/* 주간 활동 차트 */}
        <Paper
          sx={{
            p: 3,
            borderRadius: 3,
            background: 'rgba(17, 17, 17, 0.8)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight={700}>
              {t('dashboard.weeklyTrend')}
            </Typography>
            <Button 
              size="small" 
              endIcon={<NavigateNext />}
              onClick={() => navigate('/nutrition')}
            >
              {t('dashboard.viewDetails')}
            </Button>
          </Box>
          
          {weeklyData.length > 0 ? (
            <Box height={300}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={formatWeeklyChartData()}>
                  <defs>
                    <linearGradient id="colorCalories" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00D4FF" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorProtein" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00FFB3" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#00FFB3" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(0,0,0,0.8)', 
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: 8,
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey={t('pages.map.calories')}
                    stroke="#00D4FF" 
                    fillOpacity={1} 
                    fill="url(#colorCalories)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey={t('dashboard.protein')}
                    stroke="#00FFB3" 
                    fillOpacity={1} 
                    fill="url(#colorProtein)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          ) : (
            <Box height={300} display="flex" alignItems="center" justifyContent="center">
              <Typography color="text.secondary">
                {t('dashboard.noData')}. {t('dashboard.startAnalysis')}
              </Typography>
            </Box>
          )}
        </Paper>

        {/* 최근 활동 & 영양소 비율 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* 영양소 비율 */}
          {todayNutrition && getNutritionRatioData().length > 0 && (
            <Paper
              sx={{
                p: 3,
                borderRadius: 3,
                background: 'rgba(17, 17, 17, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography variant="h6" fontWeight={700} mb={2}>
                {t('dashboard.todayNutrientRatio')}
              </Typography>
              <Box height={200}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getNutritionRatioData()}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {getNutritionRatioData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box display="flex" justifyContent="space-around" mt={2}>
                {getNutritionRatioData().map((item, index) => (
                  <Box key={index} textAlign="center">
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        backgroundColor: item.color,
                        borderRadius: '50%',
                        display: 'inline-block',
                        mr: 1,
                      }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {item.name}
                    </Typography>
                    <Typography variant="body2" fontWeight={600}>
                      {item.value}g
                    </Typography>
                  </Box>
                ))}
              </Box>
            </Paper>
          )}

          {/* 최근 활동 */}
          <Paper
            sx={{
              p: 3,
              borderRadius: 3,
              background: 'rgba(17, 17, 17, 0.8)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              flex: 1,
            }}
          >
            <Typography variant="h6" fontWeight={700} mb={3}>
              {t('dashboard.recentActivities')}
            </Typography>
            {recentActivities.length > 0 ? (
              <Box>
                {recentActivities.map((activity, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      py: 2,
                      borderBottom:
                        index !== recentActivities.length - 1
                          ? '1px solid rgba(255, 255, 255, 0.05)'
                          : 'none',
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 40,
                        height: 40,
                        bgcolor: activity.color,
                        mr: 2,
                      }}
                    >
                      {activity.icon}
                    </Avatar>
                    <Box flex={1}>
                      <Typography variant="body2" fontWeight={600}>
                        {activity.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {activity.time} • {activity.detail}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            ) : (
              <Typography color="text.secondary" textAlign="center" py={4}>
                {t('dashboard.noActivities')}
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>
      
      {/* Daily Recommendations */}
      <Box mt={4}>
        <Typography variant="h5" fontWeight={700} mb={3}>
          {t('dashboard.todayRecommendations')}
        </Typography>
        <DailyRecommendations />
      </Box>
    </Box>
  );
};

export default Dashboard;
