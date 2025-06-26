import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  Switch,
  FormControlLabel,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Stack
} from '@mui/material';
import {
  Share,
  Public,
  People,
  Lock,
  Close,
  Save,
  EmojiEvents
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { 
  shareToSocialFeed, 
  ShareToSocialData, 
  checkAchievementUpdate 
} from '../../services/workout/workoutResultService';
import { useNavigate } from 'react-router-dom';
import { useSnackbar } from 'notistack';

interface ShareDialogProps {
  open: boolean;
  onClose: () => void;
  workoutResultId: number;
  defaultMessage: string;
  exerciseName: string;
}

const ShareDialog: React.FC<ShareDialogProps> = ({
  open,
  onClose,
  workoutResultId,
  defaultMessage,
  exerciseName
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(defaultMessage);
  const [visibility, setVisibility] = useState<'public' | 'friends' | 'private'>('public');
  const [showAchievements, setShowAchievements] = useState(false);
  const [newAchievements, setNewAchievements] = useState<any[]>([]);
  
  // 기본 태그 설정
  const [tags] = useState<string[]>([
    '헬스와이즈',
    'AI운동분석',
    exerciseName,
    '운동완료',
    '자세분석'
  ]);

  const handleShare = async () => {
    setLoading(true);
    try {
      const shareData: ShareToSocialData = {
        content: message,
        workout_result_id: workoutResultId,
        visibility,
        tags
      };

      await shareToSocialFeed(shareData);
      
      // 업적 업데이트 체크
      const achievementResult = await checkAchievementUpdate(workoutResultId);
      if (achievementResult.new_achievements && achievementResult.new_achievements.length > 0) {
        setNewAchievements(achievementResult.new_achievements);
        setShowAchievements(true);
      }
      
      enqueueSnackbar(t('pose_analysis.share_success'), { variant: 'success' });
      
      // 업적이 없으면 바로 소셜 피드로 이동
      if (!achievementResult.new_achievements || achievementResult.new_achievements.length === 0) {
        navigate('/social');
      }
    } catch (error) {
      console.error('Error sharing to social:', error);
      enqueueSnackbar(t('pose_analysis.share_error'), { variant: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const getVisibilityIcon = () => {
    switch (visibility) {
      case 'public':
        return <Public />;
      case 'friends':
        return <People />;
      case 'private':
        return <Lock />;
    }
  };

  const handleAchievementClose = () => {
    setShowAchievements(false);
    onClose();
    navigate('/social');
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" justifyContent="space-between">
            <Box display="flex" alignItems="center" gap={1}>
              <Share />
              <Typography variant="h6">{t('pose_analysis.share_to_social')}</Typography>
            </Box>
            <IconButton size="small" onClick={onClose}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              multiline
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              variant="outlined"
              placeholder={t('pose_analysis.share_message_placeholder')}
              sx={{ mb: 3 }}
            />

            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                {t('pose_analysis.visibility')}
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip
                  icon={<Public />}
                  label={t('pose_analysis.visibility_public')}
                  onClick={() => setVisibility('public')}
                  color={visibility === 'public' ? 'primary' : 'default'}
                  variant={visibility === 'public' ? 'filled' : 'outlined'}
                />
                <Chip
                  icon={<People />}
                  label={t('pose_analysis.visibility_friends')}
                  onClick={() => setVisibility('friends')}
                  color={visibility === 'friends' ? 'primary' : 'default'}
                  variant={visibility === 'friends' ? 'filled' : 'outlined'}
                />
                <Chip
                  icon={<Lock />}
                  label={t('pose_analysis.visibility_private')}
                  onClick={() => setVisibility('private')}
                  color={visibility === 'private' ? 'primary' : 'default'}
                  variant={visibility === 'private' ? 'filled' : 'outlined'}
                />
              </Stack>
            </Box>

            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('pose_analysis.tags')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {tags.map((tag, index) => (
                  <Chip
                    key={index}
                    label={`#${tag}`}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose} disabled={loading}>
            {t('common.cancel')}
          </Button>
          <Button
            variant="contained"
            onClick={handleShare}
            disabled={loading || !message.trim()}
            startIcon={loading ? <CircularProgress size={20} /> : getVisibilityIcon()}
          >
            {loading ? t('common.loading') : t('pose_analysis.share')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 새로운 업적 획득 다이얼로그 */}
      <Dialog open={showAchievements} onClose={handleAchievementClose} maxWidth="sm" fullWidth>
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={1}>
            <EmojiEvents sx={{ color: 'gold' }} />
            <Typography variant="h6">{t('achievements.new_achievements_unlocked')}</Typography>
          </Box>
        </DialogTitle>
        
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {newAchievements.map((achievement, index) => (
              <Alert
                key={index}
                severity="success"
                sx={{ mb: 2 }}
                icon={<EmojiEvents />}
              >
                <Typography variant="subtitle1" fontWeight="bold">
                  {achievement.title}
                </Typography>
                <Typography variant="body2">
                  {achievement.description}
                </Typography>
                <Typography variant="caption" display="block" sx={{ mt: 1 }}>
                  +{achievement.points} {t('achievements.points')}
                </Typography>
              </Alert>
            ))}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => navigate('/achievements')} color="secondary">
            {t('achievements.view_all')}
          </Button>
          <Button variant="contained" onClick={handleAchievementClose}>
            {t('common.continue')}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ShareDialog;
