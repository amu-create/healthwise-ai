import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  Box,
  Divider,
  TextField,
  MenuItem,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Stack,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Notifications,
  FitnessCenter,
  EmojiEvents,
  People,
  CalendarToday,
  AccessTime,
  Language,
  ExpandMore,
  ExpandLess
} from '@mui/icons-material';
// TimePicker imports removed - using native HTML input instead
import { useTranslation } from 'react-i18next';
import api from '../services/api';

interface NotificationSettings {
  fcm_token: string | null;
  enable_workout_reminders: boolean;
  reminder_time: string;
  reminder_days: string;
  reminder_days_list: number[];
  enable_goal_achievement_notif: boolean;
  enable_social_activity_notif: boolean;
  enable_weekly_summary: boolean;
  quiet_hours_start: string;
  quiet_hours_end: string;
  notification_language: string;
}

interface DayOfWeek {
  value: number;
  label: string;
  short: string;
}

const NotificationSettings: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedSections, setExpandedSections] = useState({
    workout: true,
    achievement: false,
    social: false,
    schedule: false
  });

  const DAYS_OF_WEEK: DayOfWeek[] = [
    { value: 0, label: t('common.days.sunday'), short: t('common.days.sun') },
    { value: 1, label: t('common.days.monday'), short: t('common.days.mon') },
    { value: 2, label: t('common.days.tuesday'), short: t('common.days.tue') },
    { value: 3, label: t('common.days.wednesday'), short: t('common.days.wed') },
    { value: 4, label: t('common.days.thursday'), short: t('common.days.thu') },
    { value: 5, label: t('common.days.friday'), short: t('common.days.fri') },
    { value: 6, label: t('common.days.saturday'), short: t('common.days.sat') }
  ];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/api/notifications/settings/');
      setSettings(response.data);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      setMessage({
        type: 'error',
        text: t('notifications.settings.loadError')
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    
    try {
      await api.put('/api/notifications/settings/', settings);
      setMessage({
        type: 'success',
        text: t('notifications.settings.saveSuccess')
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      setMessage({
        type: 'error',
        text: t('notifications.settings.saveError')
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof NotificationSettings, value: any) => {
    setSettings(prev => prev ? {
      ...prev,
      [field]: value
    } : null);
  };

  const handleDayToggle = (day: number) => {
    if (!settings) return;
    
    const currentDays = settings.reminder_days_list || [];
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort();
    
    setSettings(prev => prev ? {
      ...prev,
      reminder_days: newDays.join(','),
      reminder_days_list: newDays
    } : null);
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!settings) {
    return (
      <Alert severity="error">
        {t('notifications.settings.loadError')}
      </Alert>
    );
  }

  return (
    <Card>
        <CardContent>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Notifications color="primary" />
              {t('notifications.settings.title')}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {t('notifications.settings.subtitle')}
            </Typography>
          </Box>

          {message && (
            <Alert severity={message.type} sx={{ mb: 2 }} onClose={() => setMessage(null)}>
              {message.text}
            </Alert>
          )}

          {!settings.fcm_token && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {t('notifications.settings.permissionWarning')}
            </Alert>
          )}

          {/* 운동 알림 섹션 */}
          <Box sx={{ mb: 3 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer',
                p: 1,
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => toggleSection('workout')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <FitnessCenter color="action" />
                <Typography variant="h6">{t('notifications.settings.workoutReminders')}</Typography>
              </Box>
              <IconButton size="small">
                {expandedSections.workout ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            
            <Collapse in={expandedSections.workout}>
              <Box sx={{ pl: 4, pr: 2, pt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enable_workout_reminders}
                      onChange={(e) => handleChange('enable_workout_reminders', e.target.checked)}
                    />
                  }
                  label={t('notifications.settings.enableWorkoutReminders')}
                />
                
                {settings.enable_workout_reminders && (
                  <Box sx={{ mt: 2 }}>
                    <TextField
                      fullWidth
                      type="time"
                      label={t('notifications.settings.reminderTime')}
                      value={settings.reminder_time}
                      onChange={(e) => handleChange('reminder_time', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" gutterBottom>
                        {t('notifications.settings.reminderDays')}
                      </Typography>
                      <Stack direction="row" spacing={1}>
                        {DAYS_OF_WEEK.map(day => (
                          <Chip
                            key={day.value}
                            label={day.short}
                            onClick={() => handleDayToggle(day.value)}
                            color={settings.reminder_days_list?.includes(day.value) ? 'primary' : 'default'}
                            variant={settings.reminder_days_list?.includes(day.value) ? 'filled' : 'outlined'}
                          />
                        ))}
                      </Stack>
                    </Box>
                  </Box>
                )}
              </Box>
            </Collapse>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* 목표 달성 알림 섹션 */}
          <Box sx={{ mb: 3 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer',
                p: 1,
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => toggleSection('achievement')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <EmojiEvents color="action" />
                <Typography variant="h6">{t('notifications.settings.goalAchievements')}</Typography>
              </Box>
              <IconButton size="small">
                {expandedSections.achievement ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            
            <Collapse in={expandedSections.achievement}>
              <Box sx={{ pl: 4, pr: 2, pt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enable_goal_achievement_notif}
                      onChange={(e) => handleChange('enable_goal_achievement_notif', e.target.checked)}
                    />
                  }
                  label={t('notifications.settings.enableGoalAchievements')}
                />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 6 }}>
                  {t('notifications.settings.goalAchievementsDesc')}
                </Typography>
              </Box>
            </Collapse>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* 소셜 활동 알림 섹션 */}
          <Box sx={{ mb: 3 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer',
                p: 1,
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => toggleSection('social')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <People color="action" />
                <Typography variant="h6">{t('notifications.settings.socialActivity')}</Typography>
              </Box>
              <IconButton size="small">
                {expandedSections.social ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            
            <Collapse in={expandedSections.social}>
              <Box sx={{ pl: 4, pr: 2, pt: 2 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enable_social_activity_notif}
                      onChange={(e) => handleChange('enable_social_activity_notif', e.target.checked)}
                    />
                  }
                  label={t('notifications.settings.enableSocialActivity')}
                />
                <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 6 }}>
                  {t('notifications.settings.socialActivityDesc')}
                </Typography>
              </Box>
            </Collapse>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* 일정 설정 섹션 */}
          <Box sx={{ mb: 3 }}>
            <Box 
              sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                cursor: 'pointer',
                p: 1,
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' }
              }}
              onClick={() => toggleSection('schedule')}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AccessTime color="action" />
                <Typography variant="h6">{t('notifications.settings.scheduleSettings')}</Typography>
              </Box>
              <IconButton size="small">
                {expandedSections.schedule ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Box>
            
            <Collapse in={expandedSections.schedule}>
              <Box sx={{ pl: 4, pr: 2, pt: 2 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" gutterBottom>
                    {t('notifications.settings.quietHours')}
                  </Typography>
                  <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                    <TextField
                      type="time"
                      label={t('notifications.settings.startTime')}
                      value={settings.quiet_hours_start}
                      onChange={(e) => handleChange('quiet_hours_start', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                      type="time"
                      label={t('notifications.settings.endTime')}
                      value={settings.quiet_hours_end}
                      onChange={(e) => handleChange('quiet_hours_end', e.target.value)}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Stack>
                </Box>

                <FormControlLabel
                  control={
                    <Switch
                      checked={settings.enable_weekly_summary}
                      onChange={(e) => handleChange('enable_weekly_summary', e.target.checked)}
                    />
                  }
                  label={t('notifications.settings.enableWeeklySummary')}
                />
              </Box>
            </Collapse>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* 언어 설정 */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <Language color="action" />
              <Typography variant="h6">{t('notifications.settings.languageSettings')}</Typography>
            </Box>
            <TextField
              select
              fullWidth
              label={t('notifications.settings.notificationLanguage')}
              value={settings.notification_language}
              onChange={(e) => handleChange('notification_language', e.target.value)}
            >
              <MenuItem value="ko">{t('languages.korean')}</MenuItem>
              <MenuItem value="en">{t('languages.english')}</MenuItem>
              <MenuItem value="es">{t('languages.spanish')}</MenuItem>
            </TextField>
          </Box>

          {/* 저장 버튼 */}
          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || !settings.fcm_token}
              sx={{ minWidth: 120 }}
            >
              {saving ? <CircularProgress size={24} /> : t('common.save')}
            </Button>
          </Box>
        </CardContent>
      </Card>
  );
};

export default NotificationSettings;
