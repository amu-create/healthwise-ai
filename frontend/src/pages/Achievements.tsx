import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  Card,
  CardContent,
  LinearProgress,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Avatar,
  Badge,
  Tooltip,
  Alert,
  Snackbar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  Stack,
} from '@mui/material';
import {
  EmojiEvents,
  FitnessCenter,
  Restaurant,
  TrendingUp,
  Flag,
  LocalFireDepartment,
  Star,
  Add,
  Edit,
  CheckCircle,
  RadioButtonUnchecked,
  WorkspacePremium,
  MilitaryTech,
  AutoAwesome,
  Lock,
  LockOpen,
  Whatshot,
  Timer,
  CalendarMonth,
  Leaderboard,
  Groups,
  SportsScore,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

interface Achievement {
  id: number;
  achievement: {
    id: number;
    name: string;
    name_en: string;
    name_es: string;
    description: string;
    description_en: string;
    description_es: string;
    category: string;
    category_display: string;
    badge_level: string;
    badge_level_display: string;
    icon_name: string;
    target_value: number;
    points: number;
  };
  progress: number;
  progress_percentage: number;
  completed: boolean;
  completed_at: string | null;
}

interface UserGoal {
  id: number;
  goal_type: string;
  goal_type_display: string;
  target_value: number;
  current_value: number;
  progress_percentage: number;
  is_completed: boolean;
  is_active: boolean;
}

interface UserLevel {
  level: number;
  title: string;
  current_xp: number;
  next_level_xp: number;
  total_points: number;
}

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
      id={`achievements-tabpanel-${index}`}
      aria-labelledby={`achievements-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const categoryIcons: { [key: string]: React.ReactElement } = {
  workout: <FitnessCenter />,
  nutrition: <Restaurant />,
  streak: <Whatshot />,
  milestone: <Flag />,
  challenge: <LocalFireDepartment />,
};

const badgeColors: { [key: string]: string } = {
  bronze: '#CD7F32',
  silver: '#C0C0C0',
  gold: '#FFD700',
  platinum: '#E5E4E2',
  diamond: '#B9F2FF',
};

const levelTitles: { [key: number]: string } = {
  1: '초보자',
  5: '견습생',
  10: '수련생',
  20: '전사',
  30: '베테랑',
  40: '엘리트',
  50: '마스터',
  60: '그랜드마스터',
  70: '챔피언',
  80: '레전드',
  90: '신화',
  100: '전설의 존재',
};

export default function Achievements() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);
  const [achievements, setAchievements] = useState<{ [key: string]: Achievement[] }>({});
  const [goals, setGoals] = useState<UserGoal[]>([]);
  const [userLevel, setUserLevel] = useState<UserLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [goalDialogOpen, setGoalDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<UserGoal | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCompleted, setShowCompleted] = useState(true);
  const [newGoal, setNewGoal] = useState({
    goal_type: '',
    target_value: 0,
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error' | 'info',
  });
  const [leaderboardOpen, setLeaderboardOpen] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<any[]>([]);
  const [followingAchievements, setFollowingAchievements] = useState<any[]>([]);

  useEffect(() => {
    fetchAchievements();
    fetchGoals();
    fetchUserLevel();
  }, []);

  const fetchAchievements = async () => {
    try {
      const response = await api.get('/achievements/user_achievements/');
      setAchievements(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
      setLoading(false);
    }
  };

  const fetchGoals = async () => {
    try {
      const response = await api.get('/user-goals/');
      const goalsData = Array.isArray(response.data) ? response.data : response.data.results || [];
      setGoals(goalsData);
    } catch (error) {
      console.error('Failed to fetch goals:', error);
      setGoals([]);
    }
  };

  const fetchUserLevel = async () => {
    try {
      const response = await api.get('/user-level/');
      // 응답 데이터 검증 및 기본값 설정
      const levelData = {
        level: response.data.level || 1,
        title: response.data.title || '',
        current_xp: response.data.current_xp || 0,
        next_level_xp: response.data.next_level_xp || 100,
        total_points: response.data.total_points || 0,
      };
      setUserLevel(levelData);
    } catch (error) {
      console.error('Failed to fetch user level:', error);
      // 오류 발생 시 기본값 설정
      setUserLevel({
        level: 1,
        title: '초보자',
        current_xp: 0,
        next_level_xp: 100,
        total_points: 0,
      });
    }
  };

  const fetchLeaderboardData = async () => {
    try {
      // 팔로잉하는 사용자들의 업적 데이터 가져오기
      const response = await api.get('/achievements/following-leaderboard/');
      setFollowingAchievements(response.data.results || []);
    } catch (error) {
      console.error('Failed to fetch leaderboard data:', error);
      setFollowingAchievements([]);
    }
  };

  const handleCreateGoal = async () => {
    try {
      await api.post('/user-goals/', newGoal);
      setGoalDialogOpen(false);
      setNewGoal({ goal_type: '', target_value: 0 });
      fetchGoals();
      setSnackbar({
        open: true,
        message: t('pages.achievements.goalCreated'),
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: t('pages.achievements.goalCreateError'),
        severity: 'error',
      });
    }
  };

  const handleUpdateGoalProgress = async (goalId: number, currentValue: number) => {
    try {
      await api.post(`/user-goals/${goalId}/update_progress/`, { current_value: currentValue });
      fetchGoals();
      setSnackbar({
        open: true,
        message: t('pages.achievements.goalUpdated'),
        severity: 'success',
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message: t('pages.achievements.goalUpdateError'),
        severity: 'error',
      });
    }
  };

  const getAchievementName = (achievement: Achievement['achievement']) => {
    const lang = i18n.language;
    if (lang === 'en' && achievement.name_en) return achievement.name_en;
    if (lang === 'es' && achievement.name_es) return achievement.name_es;
    return achievement.name;
  };

  const getAchievementDescription = (achievement: Achievement['achievement']) => {
    const lang = i18n.language;
    if (lang === 'en' && achievement.description_en) return achievement.description_en;
    if (lang === 'es' && achievement.description_es) return achievement.description_es;
    return achievement.description;
  };

  const getLevelTitle = (level: number): string => {
    const keys = Object.keys(levelTitles).map(Number).sort((a, b) => b - a);
    for (const key of keys) {
      if (level >= key) {
        return levelTitles[key];
      }
    }
    return levelTitles[1];
  };

  const renderLevelCard = () => {
    if (!userLevel) return null;

    // 기본값 설정으로 undefined 오류 방지
    const totalPoints = userLevel.total_points || 0;
    const currentXp = userLevel.current_xp || 0;
    const nextLevelXp = userLevel.next_level_xp || 1; // 0으로 나누는 것 방지
    const progressPercentage = (currentXp / nextLevelXp) * 100;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card 
          sx={{ 
            mb: 4,
            background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 255, 179, 0.1))',
            border: '2px solid',
            borderColor: 'primary.main',
          }}
        >
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
              <Box display="flex" alignItems="center" gap={2}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
                  }}
                >
                  <Typography variant="h4" fontWeight={900}>
                    {userLevel.level}
                  </Typography>
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={700}>
                    {getLevelTitle(userLevel.level)}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {t('pages.achievements.level')} {userLevel.level}
                  </Typography>
                </Box>
              </Box>
              <Box textAlign="right">
                <Typography variant="h6" color="primary">
                  {totalPoints.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('pages.achievements.totalPoints')}
                </Typography>
              </Box>
            </Box>
            
            <Box>
              <Box display="flex" justifyContent="space-between" mb={1}>
                <Typography variant="body2">
                  {t('pages.achievements.experience')}
                </Typography>
                <Typography variant="body2">
                  {currentXp} / {nextLevelXp} XP
                </Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={progressPercentage}
                sx={{
                  height: 10,
                  borderRadius: 5,
                  '& .MuiLinearProgress-bar': {
                    background: 'linear-gradient(90deg, #00D4FF, #00FFB3)',
                  },
                }}
              />
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderAchievementCard = (achievementData: Achievement) => {
    const achievement = achievementData.achievement;
    const isCompleted = achievementData.completed;
    const progress = achievementData.progress_percentage;

    return (
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3 }}
        whileHover={{ scale: 1.02 }}
      >
        <Card
          sx={{
            height: '100%',
            opacity: 1,
            position: 'relative',
            overflow: 'visible',
            background: isCompleted 
              ? `linear-gradient(135deg, ${badgeColors[achievement.badge_level]}20, transparent)`
              : progress > 0
                ? 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), transparent)'
                : 'background.paper',
            border: '2px solid',
            borderColor: isCompleted 
              ? badgeColors[achievement.badge_level] 
              : progress > 0
                ? 'warning.main'
                : 'divider',
            transform: progress > 0 && !isCompleted ? 'scale(1.02)' : 'scale(1)',
            boxShadow: progress > 0 && !isCompleted 
              ? '0 0 20px rgba(255, 152, 0, 0.3)' 
              : isCompleted
                ? `0 0 20px ${badgeColors[achievement.badge_level]}30`
                : 'none',
          }}
        >
          {!isCompleted && progress < 100 && (
            <Box
              sx={{
                position: 'absolute',
                top: -10,
                right: -10,
                background: 'background.paper',
                borderRadius: '50%',
                p: 0.5,
              }}
            >
              <Lock sx={{ fontSize: 20, color: 'text.disabled' }} />
            </Box>
          )}
          
          <CardContent>
            <Box display="flex" alignItems="flex-start" gap={2}>
              <Badge
                badgeContent={
                  isCompleted ? (
                    <CheckCircle sx={{ fontSize: 20, color: badgeColors[achievement.badge_level] }} />
                  ) : null
                }
                overlap="circular"
              >
                <Avatar
                  sx={{
                    bgcolor: isCompleted ? badgeColors[achievement.badge_level] : 'grey.700',
                    width: 64,
                    height: 64,
                    boxShadow: isCompleted ? `0 0 20px ${badgeColors[achievement.badge_level]}50` : 'none',
                  }}
                >
                  {achievement.badge_level === 'diamond' ? (
                    <AutoAwesome sx={{ fontSize: 36 }} />
                  ) : achievement.badge_level === 'platinum' ? (
                    <WorkspacePremium sx={{ fontSize: 36 }} />
                  ) : achievement.badge_level === 'gold' ? (
                    <EmojiEvents sx={{ fontSize: 36, color: '#FFD700' }} />
                  ) : (
                    <EmojiEvents sx={{ fontSize: 36 }} />
                  )}
                </Avatar>
              </Badge>
              
              <Box flex={1}>
                <Typography variant="h6" gutterBottom fontWeight={700}>
                  {getAchievementName(achievement)}
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {getAchievementDescription(achievement)}
                </Typography>
                
                <Stack direction="row" spacing={1} mt={1}>
                  <Chip
                    label={achievement.category_display || t(`pages.achievements.categories.${achievement.category}`)}
                    size="small"
                    icon={categoryIcons[achievement.category]}
                  />
                  <Chip
                    label={`+${achievement.points} ${t('pages.achievements.points')}`}
                    size="small"
                    color="primary"
                    sx={{ fontWeight: 700 }}
                  />
                  <Chip
                    label={achievement.badge_level_display || achievement.badge_level}
                    size="small"
                    sx={{
                      bgcolor: `${badgeColors[achievement.badge_level]}30`,
                      color: badgeColors[achievement.badge_level],
                      fontWeight: 700,
                    }}
                  />
                </Stack>
                
                {!isCompleted && (
                  <Box mt={2}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" fontWeight={600}>
                        {achievementData.progress} / {achievement.target_value}
                      </Typography>
                      <Typography variant="caption" fontWeight={600}>
                        {progress}%
                      </Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={progress}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: 'grey.800',
                        '& .MuiLinearProgress-bar': {
                          background: `linear-gradient(90deg, ${badgeColors[achievement.badge_level]}, ${badgeColors[achievement.badge_level]}CC)`,
                        },
                      }}
                    />
                  </Box>
                )}
                
                {isCompleted && achievementData.completed_at && (
                  <Box display="flex" alignItems="center" gap={1} mt={2}>
                    <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                    <Typography variant="caption" color="success.main" fontWeight={600}>
                      {t('pages.achievements.completedOn')}: {new Date(achievementData.completed_at).toLocaleDateString()}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const renderGoalCard = (goal: UserGoal) => {
    const Icon = goal.goal_type.includes('workout') ? FitnessCenter : 
                 goal.goal_type.includes('calories') ? LocalFireDepartment :
                 goal.goal_type.includes('weight') ? TrendingUp : Flag;

    return (
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="flex-start">
              <Box display="flex" gap={2} flex={1}>
                <Avatar sx={{ bgcolor: goal.is_completed ? 'success.main' : 'primary.main' }}>
                  <Icon />
                </Avatar>
                <Box flex={1}>
                  <Typography variant="h6" fontWeight={600}>
                    {goal.goal_type_display || t(`pages.achievements.goals.${goal.goal_type}`)}
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <Typography variant="body2" fontWeight={600}>
                      {goal.current_value} / {goal.target_value}
                    </Typography>
                    {goal.is_completed && (
                      <Chip 
                        label={t('pages.achievements.completed')} 
                        size="small" 
                        color="success"
                        icon={<CheckCircle />}
                      />
                    )}
                  </Box>
                  <Box mt={2}>
                    <LinearProgress
                      variant="determinate"
                      value={goal.progress_percentage}
                      color={goal.is_completed ? 'success' : 'primary'}
                      sx={{ height: 10, borderRadius: 5 }}
                    />
                  </Box>
                </Box>
              </Box>
              <IconButton
                onClick={() => {
                  setEditingGoal(goal);
                  setGoalDialogOpen(true);
                }}
              >
                <Edit />
              </IconButton>
            </Box>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  const categories = Object.keys(achievements);
  const filteredCategories = selectedCategory 
    ? categories.filter(cat => cat === selectedCategory)
    : categories;

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={900}>
          {t('pages.achievements.title')}
        </Typography>
        <Stack direction="row" spacing={2}>
          <Chip
            icon={<Leaderboard />}
            label={t('pages.achievements.leaderboard')}
            clickable
            color="primary"
            variant="outlined"
            onClick={() => {
              setLeaderboardOpen(true);
              fetchLeaderboardData();
            }}
          />
          <Chip
            icon={<Groups />}
            label={t('pages.achievements.following')}
            clickable
            color="primary"
            variant="outlined"
            onClick={() => navigate('/achievements/following')}
          />
        </Stack>
      </Box>

      {renderLevelCard()}

      <Paper sx={{ width: '100%', mb: 4 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          indicatorColor="primary"
          textColor="primary"
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab label={t('pages.achievements.allAchievements')} icon={<EmojiEvents />} />
          <Tab label={t('pages.achievements.myGoals')} icon={<SportsScore />} />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          {/* Category Filter */}
          <Stack direction="row" spacing={1} mb={3} sx={{ overflowX: 'auto', pb: 1 }}>
            <Chip
              label={t('pages.achievements.all')}
              onClick={() => setSelectedCategory(null)}
              color={!selectedCategory ? 'primary' : 'default'}
              clickable
            />
            {categories.map((category) => (
              <Chip
                key={category}
                label={t(`pages.achievements.categories.${category}`)}
                icon={categoryIcons[category]}
                onClick={() => setSelectedCategory(category)}
                color={selectedCategory === category ? 'primary' : 'default'}
                clickable
              />
            ))}
            <Divider orientation="vertical" flexItem />
            <Chip
              label={showCompleted ? t('pages.achievements.hideCompleted') : t('pages.achievements.showCompleted')}
              onClick={() => setShowCompleted(!showCompleted)}
              variant="outlined"
              clickable
            />
          </Stack>

          {loading ? (
            <Box display="flex" justifyContent="center" p={4}>
              <LinearProgress sx={{ width: '50%' }} />
            </Box>
          ) : (
            <AnimatePresence>
              {filteredCategories.map((category) => {
                const categoryAchievements = achievements[category] || [];
                
                // 업적을 정렬: 진행 중(미완료 & 진행도 > 0) -> 완료 -> 미시작(진행도 0)
                const sortedAchievements = [...categoryAchievements].sort((a, b) => {
                  // 완료된 업적은 중간으로
                  if (a.completed && !b.completed) return 1;
                  if (!a.completed && b.completed) return -1;
                  
                  // 미완료 중에서는 진행도가 있는 것을 위로
                  if (!a.completed && !b.completed) {
                    if (a.progress > 0 && b.progress === 0) return -1;
                    if (a.progress === 0 && b.progress > 0) return 1;
                    // 둘 다 진행 중이면 진행률이 높은 것을 위로
                    return b.progress_percentage - a.progress_percentage;
                  }
                  
                  return 0;
                });
                
                const filteredAchievements = showCompleted 
                  ? sortedAchievements 
                  : sortedAchievements.filter(a => !a.completed);
                
                if (!filteredAchievements.length) return null;

                return (
                  <Box key={category} mb={4}>
                    <Box display="flex" alignItems="center" gap={1} mb={2}>
                      {categoryIcons[category]}
                      <Typography variant="h5" fontWeight={700}>
                        {t(`pages.achievements.categories.${category}`)}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        <Chip 
                          label={`${t('pages.achievements.inProgress')}: ${categoryAchievements.filter(a => !a.completed && a.progress > 0).length}`}
                          size="small"
                          color="warning"
                          icon={<Timer />}
                        />
                        <Chip 
                          label={`${t('pages.achievements.completed')}: ${categoryAchievements.filter(a => a.completed).length}`}
                          size="small"
                          color="success"
                          icon={<CheckCircle />}
                        />
                        <Chip 
                          label={`${t('pages.achievements.notStarted')}: ${categoryAchievements.filter(a => !a.completed && a.progress === 0).length}`}
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    </Box>
                    <Box
                      display="grid"
                      gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)' }}
                      gap={2}
                    >
                      {filteredAchievements.map((achievement) => (
                        <Box key={achievement.id || achievement.achievement.id}>
                          {renderAchievementCard(achievement)}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                );
              })}
            </AnimatePresence>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box mb={3}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => {
                setEditingGoal(null);
                setGoalDialogOpen(true);
              }}
              sx={{
                background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
                color: '#000',
                fontWeight: 700,
              }}
            >
              {t('pages.achievements.addGoal')}
            </Button>
          </Box>
          <Box
            display="grid"
            gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)' }}
            gap={2}
          >
            {Array.isArray(goals) && goals.map((goal) => (
              <Box key={goal.id}>
                {renderGoalCard(goal)}
              </Box>
            ))}
          </Box>
          {(!goals || goals.length === 0) && (
            <Box textAlign="center" py={8}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                {t('pages.achievements.noGoals')}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {t('pages.achievements.noGoalsDescription')}
              </Typography>
            </Box>
          )}
        </TabPanel>
      </Paper>

      {/* Goal Dialog */}
      <Dialog open={goalDialogOpen} onClose={() => setGoalDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingGoal ? t('pages.achievements.editGoal') : t('pages.achievements.addGoal')}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>{t('pages.achievements.goalType')}</InputLabel>
              <Select
                value={editingGoal?.goal_type || newGoal.goal_type}
                onChange={(e) => setNewGoal({ ...newGoal, goal_type: e.target.value })}
                disabled={!!editingGoal}
              >
                <MenuItem value="daily_calories">{t('pages.achievements.goals.dailyCalories')}</MenuItem>
                <MenuItem value="weekly_workouts">{t('pages.achievements.goals.weeklyWorkouts')}</MenuItem>
                <MenuItem value="monthly_workouts">{t('pages.achievements.goals.monthlyWorkouts')}</MenuItem>
                <MenuItem value="weight_target">{t('pages.achievements.goals.weightTarget')}</MenuItem>
                <MenuItem value="daily_steps">{t('pages.achievements.goals.dailySteps')}</MenuItem>
                <MenuItem value="daily_water">{t('pages.achievements.goals.dailyWater')}</MenuItem>
                <MenuItem value="sleep_hours">{t('pages.achievements.goals.sleepHours')}</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label={t('pages.achievements.targetValue')}
              type="number"
              value={editingGoal?.target_value || newGoal.target_value}
              onChange={(e) => setNewGoal({ ...newGoal, target_value: Number(e.target.value) })}
              disabled={!!editingGoal}
            />
            {editingGoal && (
              <TextField
                fullWidth
                label={t('pages.achievements.currentValue')}
                type="number"
                value={editingGoal.current_value}
                onChange={(e) => setEditingGoal({ ...editingGoal, current_value: Number(e.target.value) })}
                sx={{ mt: 2 }}
              />
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGoalDialogOpen(false)}>{t('common.cancel')}</Button>
          <Button
            onClick={() => {
              if (editingGoal) {
                handleUpdateGoalProgress(editingGoal.id, editingGoal.current_value);
                setGoalDialogOpen(false);
              } else {
                handleCreateGoal();
              }
            }}
            variant="contained"
          >
            {editingGoal ? t('common.update') : t('common.create')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Leaderboard Dialog */}
      <Dialog 
        open={leaderboardOpen} 
        onClose={() => setLeaderboardOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'background.paper',
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <Leaderboard />
            <Typography variant="h5" fontWeight={700}>
              {t('pages.achievements.leaderboard')}
            </Typography>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Tabs
            value={0}
            sx={{ mb: 3 }}
          >
            <Tab label={t('pages.achievements.myFollowing')} />
            <Tab label={t('pages.achievements.global')} disabled />
          </Tabs>
          
          <List>
            {/* My Achievement Summary */}
            <ListItem
              sx={{
                bgcolor: 'primary.main',
                borderRadius: 2,
                mb: 2,
                color: 'primary.contrastText',
              }}
            >
              <ListItemAvatar>
                <Avatar
                  sx={{
                    bgcolor: 'primary.dark',
                    width: 56,
                    height: 56,
                  }}
                >
                  <Typography variant="h6" fontWeight={900}>
                    {userLevel?.level || 1}
                  </Typography>
                </Avatar>
              </ListItemAvatar>
              <ListItemText
                primary={
                  <Typography variant="h6" fontWeight={700}>
                    {t('pages.achievements.you')}
                  </Typography>
                }
                secondary={
                  <Typography variant="body2" sx={{ color: 'inherit', opacity: 0.9 }}>
                    {t('pages.achievements.totalPoints')}: {userLevel?.total_points || 0}
                  </Typography>
                }
              />
              <Box textAlign="right">
                <Typography variant="h5" fontWeight={900}>
                  #{1}
                </Typography>
              </Box>
            </ListItem>
            
            <Divider sx={{ my: 2 }} />
            
            {/* Following Users' Achievements */}
            {followingAchievements.length > 0 ? (
              followingAchievements.map((userData, index) => (
                <ListItem 
                  key={userData.user.id} 
                  sx={{ 
                    py: 2,
                    cursor: 'pointer',
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  onClick={() => navigate(`/profile/${userData.user.id}`)}
                >
                  <ListItemAvatar>
                    <Badge
                      badgeContent={`#${index + 2}`}
                      color="primary"
                      anchorOrigin={{
                        vertical: 'top',
                        horizontal: 'left',
                      }}
                    >
                      <Avatar
                        src={userData.user.profile_picture_url}
                        sx={{ width: 48, height: 48 }}
                      >
                        {userData.user.username[0].toUpperCase()}
                      </Avatar>
                    </Badge>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle1" fontWeight={600}>
                        {userData.user.username}
                      </Typography>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2" color="text.secondary">
                          {t('pages.achievements.level')} {userData.level} • {userData.total_points} {t('pages.achievements.points')}
                        </Typography>
                        <Box display="flex" gap={0.5} mt={0.5}>
                          {userData.recent_achievements?.slice(0, 3).map((achievement: any) => (
                            <Chip
                              key={achievement.id}
                              label={achievement.name}
                              size="small"
                              sx={{
                                bgcolor: `${badgeColors[achievement.badge_level]}30`,
                                color: badgeColors[achievement.badge_level],
                                fontSize: '0.7rem',
                              }}
                            />
                          ))}
                        </Box>
                      </Box>
                    }
                  />
                  <Box textAlign="right">
                    <Typography variant="body2" color="text.secondary">
                      {userData.completed_achievements} {t('pages.achievements.completed')}
                    </Typography>
                  </Box>
                </ListItem>
              ))
            ) : (
              <Box textAlign="center" py={4}>
                <Typography variant="body1" color="text.secondary">
                  {t('pages.achievements.noFollowing')}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Groups />}
                  onClick={() => {
                    setLeaderboardOpen(false);
                    navigate('/social');
                  }}
                  sx={{ mt: 2 }}
                >
                  {t('pages.achievements.findPeople')}
                </Button>
              </Box>
            )}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLeaderboardOpen(false)}>
            {t('common.close')}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
