import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Switch,
  FormControlLabel,
  FormGroup,
  Divider,
  Button,

  Alert,
  Snackbar,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  Slider,
  IconButton,
} from '@mui/material';
import { VolumeOff, VolumeUp, PlayArrow } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { TimePicker } from '@mui/x-date-pickers/TimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { ko, enUS, es } from 'date-fns/locale';

interface NotificationSettings {
  // 운동 알림
  workout_completed: boolean;
  workout_reminder: boolean;
  workout_reminder_time: string | null;
  workout_streak: boolean;
  workout_goal_progress: boolean;
  
  // 영양 알림
  meal_reminder: boolean;
  meal_reminder_times: {
    breakfast: string | null;
    lunch: string | null;
    dinner: string | null;
  };
  calorie_goal: boolean;
  nutrition_analysis: boolean;
  water_reminder: boolean;
  
  // 건강 알림
  weight_tracking: boolean;
  health_metrics: boolean;
  health_report: boolean;
  checkup_reminder: boolean;
  
  // 커뮤니티 알림
  social_likes: boolean;
  social_comments: boolean;
  social_follows: boolean;
  friend_requests: boolean;
  group_invitations: boolean;
  
  // AI 알림
  ai_recommendations: boolean;
  ai_tips: boolean;
  ai_analysis: boolean;
  
  // 동기부여 알림
  daily_motivation: boolean;
  achievement_celebration: boolean;
  milestone_countdown: boolean;
  
  // 시스템 알림
  system_updates: boolean;
  security_alerts: boolean;
  maintenance_notices: boolean;
  
  // 알림 수신 채널
  push_enabled: boolean;
  email_enabled: boolean;
  in_app_enabled: boolean;
  
  // 방해 금지 시간
  quiet_hours_enabled: boolean;
  quiet_hours_start: string | null;
  quiet_hours_end: string | null;
  
  // 알림 소리
  sound_enabled: boolean;
  sound_volume: number;
}

export default function NotificationSettingsPage() {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    fetchSettings();
    
    // Initialize audio for testing
    audioRef.current = new Audio('/sounds/notification.mp3');
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/notifications/settings/');
      setSettings(response.data);
    } catch (error) {
      console.error('Failed to fetch notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof NotificationSettings) => {
    if (settings) {
      setSettings({
        ...settings,
        [key]: !settings[key],
      });
    }
  };

  const handleTimeChange = (key: string, value: Date | null) => {
    if (settings && value) {
      const timeString = value.toTimeString().slice(0, 5);
      if (key.includes('.')) {
        const [parent, child] = key.split('.');
        setSettings({
          ...settings,
          [parent]: {
            ...(settings as any)[parent],
            [child]: timeString,
          },
        });
      } else {
        setSettings({
          ...settings,
          [key]: timeString,
        });
      }
    }
  };

  const handleSave = async () => {
    if (!settings) return;
    
    try {
      setSaving(true);
      await api.put('/notifications/settings/', settings);
      setShowSuccess(true);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const getLocale = () => {
    switch (i18n.language) {
      case 'ko':
        return ko;
      case 'es':
        return es;
      default:
        return enUS;
    }
  };

  if (loading || !settings) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Typography>{t('common.loading')}...</Typography>
      </Container>
    );
  }

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={getLocale()}>
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Paper elevation={2} sx={{ borderRadius: 2, p: 3 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {t('notifications.settings.title')}
          </Typography>
          <Typography variant="body2" color="text.secondary" paragraph>
            {t('notifications.settings.description')}
          </Typography>

          <Divider sx={{ my: 3 }} />

          {/* 알림 채널 설정 */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              {t('notifications.settings.channels')}
            </Typography>
            <FormGroup>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.push_enabled}
                    onChange={() => handleToggle('push_enabled')}
                  />
                }
                label={t('notifications.settings.pushNotifications')}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.email_enabled}
                    onChange={() => handleToggle('email_enabled')}
                  />
                }
                label={t('notifications.settings.emailNotifications')}
              />
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.in_app_enabled}
                    onChange={() => handleToggle('in_app_enabled')}
                  />
                }
                label={t('notifications.settings.inAppNotifications')}
              />
            </FormGroup>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* 운동 알림 */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              {t('notifications.settings.workout')}
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Box flex={{ xs: '0 0 100%', md: '0 0 calc(50% - 8px)' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.workout_completed}
                      onChange={() => handleToggle('workout_completed')}
                    />
                  }
                  label={t('notifications.settings.workoutCompleted')}
                />
              </Box>
              <Box flex={{ xs: '0 0 100%', md: '0 0 calc(50% - 8px)' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.workout_streak}
                      onChange={() => handleToggle('workout_streak')}
                    />
                  }
                  label={t('notifications.settings.workoutStreak')}
                />
              </Box>
              <Box flex={{ xs: '0 0 100%', md: '0 0 calc(50% - 8px)' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.workout_goal_progress}
                      onChange={() => handleToggle('workout_goal_progress')}
                    />
                  }
                  label={t('notifications.settings.workoutGoalProgress')}
                />
              </Box>
              <Box flex={{ xs: '0 0 100%', md: '0 0 calc(50% - 8px)' }}>
                <Box display="flex" alignItems="center" gap={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={settings.workout_reminder}
                        onChange={() => handleToggle('workout_reminder')}
                      />
                    }
                    label={t('notifications.settings.workoutReminder')}
                  />
                  {settings.workout_reminder && (
                    <TimePicker
                      label={t('common.time')}
                      value={settings.workout_reminder_time ? new Date(`2000-01-01T${settings.workout_reminder_time}`) : null}
                      onChange={(value: Date | null) => handleTimeChange('workout_reminder_time', value)}
                      slotProps={{
                        textField: {
                          size: 'small',
                        },
                      }}
                    />
                  )}
                </Box>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* 영양 알림 */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              {t('notifications.settings.nutrition')}
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Box flex={{ xs: '0 0 100%', md: '0 0 calc(50% - 8px)' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.calorie_goal}
                      onChange={() => handleToggle('calorie_goal')}
                    />
                  }
                  label={t('notifications.settings.calorieGoal')}
                />
              </Box>
              <Box flex={{ xs: '0 0 100%', md: '0 0 calc(50% - 8px)' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.nutrition_analysis}
                      onChange={() => handleToggle('nutrition_analysis')}
                    />
                  }
                  label={t('notifications.settings.nutritionAnalysis')}
                />
              </Box>
              <Box flex={{ xs: '0 0 100%', md: '0 0 calc(50% - 8px)' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.water_reminder}
                      onChange={() => handleToggle('water_reminder')}
                    />
                  }
                  label={t('notifications.settings.waterReminder')}
                />
              </Box>
              <Box flex="0 0 100%">
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.meal_reminder}
                      onChange={() => handleToggle('meal_reminder')}
                    />
                  }
                  label={t('notifications.settings.mealReminder')}
                />
                {settings.meal_reminder && (
                  <Box mt={2} display="flex" gap={2} flexWrap="wrap">
                    <TimePicker
                      label={t('nutrition.breakfast')}
                      value={settings.meal_reminder_times.breakfast ? new Date(`2000-01-01T${settings.meal_reminder_times.breakfast}`) : null}
                      onChange={(value: Date | null) => handleTimeChange('meal_reminder_times.breakfast', value)}
                      slotProps={{
                        textField: {
                          size: 'small',
                        },
                      }}
                    />
                    <TimePicker
                      label={t('nutrition.lunch')}
                      value={settings.meal_reminder_times.lunch ? new Date(`2000-01-01T${settings.meal_reminder_times.lunch}`) : null}
                      onChange={(value: Date | null) => handleTimeChange('meal_reminder_times.lunch', value)}
                      slotProps={{
                        textField: {
                          size: 'small',
                        },
                      }}
                    />
                    <TimePicker
                      label={t('nutrition.dinner')}
                      value={settings.meal_reminder_times.dinner ? new Date(`2000-01-01T${settings.meal_reminder_times.dinner}`) : null}
                      onChange={(value: Date | null) => handleTimeChange('meal_reminder_times.dinner', value)}
                      slotProps={{
                        textField: {
                          size: 'small',
                        },
                      }}
                    />
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* 커뮤니티 알림 */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              {t('notifications.settings.social')}
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Box flex={{ xs: '0 0 100%', md: '0 0 calc(50% - 8px)' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.social_likes}
                      onChange={() => handleToggle('social_likes')}
                    />
                  }
                  label={t('notifications.settings.socialLikes')}
                />
              </Box>
              <Box flex={{ xs: '0 0 100%', md: '0 0 calc(50% - 8px)' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.social_comments}
                      onChange={() => handleToggle('social_comments')}
                    />
                  }
                  label={t('notifications.settings.socialComments')}
                />
              </Box>
              <Box flex={{ xs: '0 0 100%', md: '0 0 calc(50% - 8px)' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.social_follows}
                      onChange={() => handleToggle('social_follows')}
                    />
                  }
                  label={t('notifications.settings.socialFollows')}
                />
              </Box>
              <Box flex={{ xs: '0 0 100%', md: '0 0 calc(50% - 8px)' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.friend_requests}
                      onChange={() => handleToggle('friend_requests')}
                    />
                  }
                  label={t('notifications.settings.friendRequests')}
                />
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* AI 알림 */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              {t('notifications.settings.ai')}
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2}>
              <Box flex={{ xs: '0 0 100%', md: '0 0 calc(50% - 8px)' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.ai_recommendations}
                      onChange={() => handleToggle('ai_recommendations')}
                    />
                  }
                  label={t('notifications.settings.aiRecommendations')}
                />
              </Box>
              <Box flex={{ xs: '0 0 100%', md: '0 0 calc(50% - 8px)' }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.ai_tips}
                      onChange={() => handleToggle('ai_tips')}
                    />
                  }
                  label={t('notifications.settings.aiTips')}
                />
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* 알림 소리 설정 */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              {t('notifications.settings.soundSettings')}
            </Typography>
            <Box display="flex" alignItems="center" gap={3}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.sound_enabled}
                    onChange={() => {
                      handleToggle('sound_enabled');
                      // Save sound preference to localStorage
                      localStorage.setItem('notificationSound', (!settings.sound_enabled).toString());
                    }}
                  />
                }
                label={t('notifications.settings.enableSound')}
              />
              {settings.sound_enabled && (
                <>
                  <Box display="flex" alignItems="center" gap={2} flex={1} maxWidth={300}>
                    <VolumeOff />
                    <Slider
                      value={settings.sound_volume}
                      onChange={(_, value) => {
                        if (settings && typeof value === 'number') {
                          setSettings({ ...settings, sound_volume: value });
                          if (audioRef.current) {
                            audioRef.current.volume = value / 100;
                          }
                        }
                      }}
                      valueLabelDisplay="auto"
                      step={10}
                      marks
                      min={0}
                      max={100}
                    />
                    <VolumeUp />
                  </Box>
                  <IconButton
                    onClick={() => {
                      if (audioRef.current) {
                        audioRef.current.volume = settings.sound_volume / 100;
                        audioRef.current.play().catch(err => {
                          console.log('Failed to play test sound:', err);
                        });
                      }
                    }}
                    color="primary"
                  >
                    <PlayArrow />
                  </IconButton>
                </>  
              )}
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* 방해 금지 시간 */}
          <Box mb={4}>
            <Typography variant="h6" gutterBottom>
              {t('notifications.settings.quietHours')}
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <FormControlLabel
                control={
                  <Switch
                    checked={settings.quiet_hours_enabled}
                    onChange={() => handleToggle('quiet_hours_enabled')}
                  />
                }
                label={t('notifications.settings.enableQuietHours')}
              />
              {settings.quiet_hours_enabled && (
                <>
                  <TimePicker
                    label={t('common.from')}
                    value={settings.quiet_hours_start ? new Date(`2000-01-01T${settings.quiet_hours_start}`) : null}
                    onChange={(value: Date | null) => handleTimeChange('quiet_hours_start', value)}
                    slotProps={{
                      textField: {
                        size: 'small',
                      },
                    }}
                  />
                  <TimePicker
                    label={t('common.to')}
                    value={settings.quiet_hours_end ? new Date(`2000-01-01T${settings.quiet_hours_end}`) : null}
                    onChange={(value: Date | null) => handleTimeChange('quiet_hours_end', value)}
                    slotProps={{
                      textField: {
                        size: 'small',
                      },
                    }}
                  />
                </>
              )}
            </Box>
          </Box>

          {/* 저장 버튼 */}
          <Box display="flex" justifyContent="flex-end" mt={4}>
            <Button
              variant="contained"
              size="large"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? t('common.saving') : t('common.save')}
            </Button>
          </Box>
        </Paper>

        {/* 성공 메시지 */}
        <Snackbar
          open={showSuccess}
          autoHideDuration={3000}
          onClose={() => setShowSuccess(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert severity="success" onClose={() => setShowSuccess(false)}>
            {t('notifications.settings.saved')}
          </Alert>
        </Snackbar>
      </Container>
    </LocalizationProvider>
  );
}
