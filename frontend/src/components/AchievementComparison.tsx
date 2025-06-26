import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Tabs,
  Tab,
  Divider,
  CircularProgress,
} from '@mui/material';
import {
  Close,
  EmojiEvents,
  PersonAdd,
  Group,
  TrendingUp,
  Star,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import api from '../services/api';
import AchievementBadge from './AchievementBadge';

interface Friend {
  id: number;
  username: string;
  profile_picture_url?: string;
  level: number;
  total_points: number;
  achievements_count: number;
  completed_achievements: number;
}

interface AchievementComparison {
  achievement: {
    id: number;
    name: string;
    name_en?: string;
    name_es?: string;
    description: string;
    description_en?: string;
    description_es?: string;
    category: string;
    badge_level: string;
    target_value: number;
    points: number;
  };
  my_progress: {
    progress: number;
    progress_percentage: number;
    completed: boolean;
    completed_at?: string;
  };
  friend_progress: {
    progress: number;
    progress_percentage: number;
    completed: boolean;
    completed_at?: string;
  };
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
      id={`achievement-comparison-tabpanel-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
}

const AchievementComparison: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [comparisons, setComparisons] = useState<AchievementComparison[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      fetchFriends();
    }
  }, [open]);

  useEffect(() => {
    if (selectedFriend) {
      fetchComparisons(selectedFriend.id);
    }
  }, [selectedFriend]);

  const fetchFriends = async () => {
    try {
      setLoading(true);
      const response = await api.get('/social/friends/with-achievements/');
      setFriends(response.data);
    } catch (error) {
      console.error('Failed to fetch friends:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchComparisons = async (friendId: number) => {
    try {
      setLoading(true);
      const response = await api.get(`/achievements/compare/${friendId}/`);
      setComparisons(response.data);
    } catch (error) {
      console.error('Failed to fetch comparisons:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAchievementName = (achievement: any) => {
    const lang = i18n.language;
    if (lang === 'en' && achievement.name_en) return achievement.name_en;
    if (lang === 'es' && achievement.name_es) return achievement.name_es;
    return achievement.name;
  };

  const renderFriendsList = () => (
    <List>
      {friends.map((friend) => (
        <ListItem
          key={friend.id}
          onClick={() => setSelectedFriend(friend)}
          sx={{
            borderRadius: 2,
            mb: 1,
            cursor: 'pointer',
            bgcolor: selectedFriend?.id === friend.id ? 'primary.light' : 'transparent',
            '&:hover': {
              bgcolor: selectedFriend?.id === friend.id ? 'primary.light' : 'action.hover',
            },
          }}
        >
          <ListItemAvatar>
            <Avatar src={friend.profile_picture_url}>
              {friend.username[0].toUpperCase()}
            </Avatar>
          </ListItemAvatar>
          <ListItemText
            primary={friend.username}
            secondary={
              <Box display="flex" alignItems="center" gap={1}>
                <Chip
                  size="small"
                  label={`Lv.${friend.level}`}
                  color="primary"
                />
                <Typography variant="caption">
                  {friend.total_points} {t('common.points')}
                </Typography>
              </Box>
            }
          />
          <ListItemSecondaryAction>
            <Box textAlign="right">
              <Typography variant="h6" color="primary">
                {friend.completed_achievements}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t('achievements.completed')}
              </Typography>
            </Box>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );

  const renderComparison = () => {
    if (!selectedFriend) {
      return (
        <Box textAlign="center" py={4}>
          <Group sx={{ fontSize: 80, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {t('achievements.selectFriendToCompare')}
          </Typography>
        </Box>
      );
    }

    const categories = ['workout', 'nutrition', 'streak', 'milestone', 'challenge'];
    const filteredCategories = tabValue === 0 
      ? categories 
      : [categories[tabValue - 1]];

    return (
      <Box>
        {/* 전체 통계 비교 */}
        <Card sx={{ mb: 3, bgcolor: 'background.default' }}>
          <CardContent>
            <Box display="flex" justifyContent="space-around" alignItems="center">
              <Box textAlign="center">
                <Typography variant="h4" color="primary">
                  {comparisons.filter(c => c.my_progress.completed).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('achievements.myAchievements')}
                </Typography>
              </Box>
              <TrendingUp sx={{ fontSize: 40, color: 'text.disabled' }} />
              <Box textAlign="center">
                <Typography variant="h4" color="secondary">
                  {comparisons.filter(c => c.friend_progress.completed).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {selectedFriend.username}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>

        {/* 카테고리별 비교 */}
        {filteredCategories.map((category) => {
          const categoryComparisons = comparisons.filter(
            c => c.achievement.category === category
          );

          if (categoryComparisons.length === 0) return null;

          return (
            <Box key={category} mb={3}>
              <Typography variant="h6" gutterBottom>
                {t(`pages.achievements.categories.${category}`)}
              </Typography>
              
              {categoryComparisons.map((comparison) => (
                <Card key={comparison.achievement.id} sx={{ mb: 2 }}>
                  <CardContent>
                    <Box display="flex" alignItems="center" gap={2} mb={2}>
                      <AchievementBadge
                        achievement={comparison.achievement}
                        size="small"
                        completed={comparison.my_progress.completed || comparison.friend_progress.completed}
                      />
                      <Box flex={1}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          {getAchievementName(comparison.achievement)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('achievements.targetValue')}: {comparison.achievement.target_value}
                        </Typography>
                      </Box>
                      <Chip
                        label={`+${comparison.achievement.points}`}
                        size="small"
                        color="primary"
                      />
                    </Box>

                    {/* 나의 진행도 */}
                    <Box mb={2}>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" fontWeight="bold">
                          {t('achievements.me')}
                        </Typography>
                        <Typography variant="body2">
                          {comparison.my_progress.progress} / {comparison.achievement.target_value}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={comparison.my_progress.progress_percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'grey.300',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: comparison.my_progress.completed ? 'success.main' : 'primary.main',
                          },
                        }}
                      />
                    </Box>

                    {/* 친구의 진행도 */}
                    <Box>
                      <Box display="flex" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" fontWeight="bold">
                          {selectedFriend.username}
                        </Typography>
                        <Typography variant="body2">
                          {comparison.friend_progress.progress} / {comparison.achievement.target_value}
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={comparison.friend_progress.progress_percentage}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: 'grey.300',
                          '& .MuiLinearProgress-bar': {
                            bgcolor: comparison.friend_progress.completed ? 'success.main' : 'secondary.main',
                          },
                        }}
                      />
                    </Box>

                    {/* 승자 표시 */}
                    {comparison.my_progress.completed && comparison.friend_progress.completed && (
                      <Box mt={2} textAlign="center">
                        {new Date(comparison.my_progress.completed_at!) < new Date(comparison.friend_progress.completed_at!) ? (
                          <Chip
                            icon={<Star />}
                            label={t('achievements.youCompletedFirst')}
                            color="primary"
                            size="small"
                          />
                        ) : (
                          <Chip
                            label={t('achievements.friendCompletedFirst', { name: selectedFriend.username })}
                            color="default"
                            size="small"
                          />
                        )}
                      </Box>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          );
        })}
      </Box>
    );
  };

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<Group />}
        onClick={() => setOpen(true)}
      >
        {t('achievements.compareFriends')}
      </Button>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Typography variant="h6">{t('achievements.compareAchievements')}</Typography>
            <IconButton onClick={() => setOpen(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box display="flex" gap={2} height={600}>
            {/* 친구 목록 */}
            <Box width={300} sx={{ borderRight: 1, borderColor: 'divider', pr: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold" mb={2}>
                {t('achievements.friends')}
              </Typography>
              {loading && !friends.length ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : (
                renderFriendsList()
              )}
            </Box>

            {/* 비교 내용 */}
            <Box flex={1}>
              <Tabs
                value={tabValue}
                onChange={(e, newValue) => setTabValue(newValue)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
              >
                <Tab label={t('achievements.all')} />
                <Tab label={t('pages.achievements.categories.workout')} />
                <Tab label={t('pages.achievements.categories.nutrition')} />
                <Tab label={t('pages.achievements.categories.streak')} />
                <Tab label={t('pages.achievements.categories.milestone')} />
                <Tab label={t('pages.achievements.categories.challenge')} />
              </Tabs>

              {loading && selectedFriend ? (
                <Box display="flex" justifyContent="center" p={4}>
                  <CircularProgress />
                </Box>
              ) : (
                renderComparison()
              )}
            </Box>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AchievementComparison;
