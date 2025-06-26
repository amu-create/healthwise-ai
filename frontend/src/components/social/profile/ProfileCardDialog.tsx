import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  Box,
  Avatar,
  Typography,
  Button,
  IconButton,
  Chip,
  CircularProgress,
  Divider,
} from '@mui/material';
import { Close, Person, EmojiEvents, Grade } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import FollowButton from '../FollowButton';
import { getNetworkAwareProfileImageUrl } from '../../../utils/profileUtils';
import { useAuth } from '../../../contexts/AuthContext';

interface UserProfile {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  username?: string; // getNetworkAwareProfileImageUrl 호환성을 위해 추가
  profile_image?: string;
  profile_picture_url?: string; // Social 프로필 호환성
  bio?: string;
  level: number;
  total_points: number;
  followers_count: number;
  following_count: number;
  posts_count: number;
  achievements_count: number;
  is_following: boolean;
  recent_achievements: Achievement[];
}

interface Achievement {
  id: number;
  name: string;
  name_en: string;
  name_es: string;
  description: string;
  description_en: string;
  description_es: string;
  badge_level: string;
  points: number;
  completed_at: string;
}

interface ProfileCardDialogProps {
  open: boolean;
  onClose: () => void;
  userId: number;
}

const ProfileCardDialog: React.FC<ProfileCardDialogProps> = ({ open, onClose, userId }) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open && userId) {
      fetchProfile();
    }
  }, [open, userId]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/social/profiles/?user=${userId}`);
      if (response.data.results && response.data.results.length > 0) {
        setProfile(response.data.results[0]);
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewFullProfile = () => {
    navigate(`/profile/${userId}`);
    onClose();
  };

  const handleFollowChange = (isFollowing: boolean) => {
    if (profile) {
      setProfile({
        ...profile,
        is_following: isFollowing,
        followers_count: isFollowing ? profile.followers_count + 1 : profile.followers_count - 1,
      });
    }
  };

  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'gold': return '#FFD700';
      case 'silver': return '#C0C0C0';
      case 'bronze': return '#CD7F32';
      default: return '#9E9E9E';
    }
  };

  const getAchievementName = (achievement: Achievement) => {
    const lang = i18n.language;
    if (lang === 'ko') return achievement.name;
    if (lang === 'es') return achievement.name_es;
    return achievement.name_en;
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          overflow: 'hidden',
        },
      }}
    >
      <Box sx={{ position: 'relative', bgcolor: 'primary.main', p: 1 }}>
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: 'white',
            bgcolor: 'rgba(0,0,0,0.3)',
            '&:hover': { bgcolor: 'rgba(0,0,0,0.5)' },
          }}
        >
          <Close />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 3 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : profile ? (
          <Box>
            {/* 프로필 헤더 */}
            <Box textAlign="center" mb={3}>
              <Avatar
                src={getNetworkAwareProfileImageUrl(profile)}
                sx={{
                  width: 100,
                  height: 100,
                  mx: 'auto',
                  mb: 2,
                  border: '3px solid',
                  borderColor: 'primary.main',
                }}
              >
                {profile.user.username[0].toUpperCase()}
              </Avatar>
              
              <Typography variant="h5" gutterBottom>
                {profile.user.username}
              </Typography>
              
              <Box display="flex" alignItems="center" justifyContent="center" gap={1} mb={1}>
                <Chip
                  icon={<Grade />}
                  label={`${t('common.level')} ${profile.level}`}
                  color="primary"
                  size="small"
                />
                <Chip
                  icon={<EmojiEvents />}
                  label={`${profile.total_points} ${t('achievements.points')}`}
                  color="secondary"
                  size="small"
                />
              </Box>

              {profile.bio && (
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {profile.bio}
                </Typography>
              )}

              {/* 팔로우 버튼 또는 프로필 보기 버튼 */}
              {currentUser?.id === profile.user.id ? (
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleViewFullProfile}
                  startIcon={<Person />}
                >
                  {t('social.viewProfile')}
                </Button>
              ) : (
                <FollowButton
                  userId={profile.user.id}
                  isFollowing={profile.is_following}
                  onFollowChange={handleFollowChange}
                  fullWidth
                />
              )}
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* 통계 */}
            <Box display="flex" justifyContent="space-between" sx={{ mb: 2 }}>
              <Box textAlign="center" flex={1}>
                <Typography variant="h6">{profile.posts_count}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('social.posts')}
                </Typography>
              </Box>
              <Box textAlign="center" flex={1}>
                <Typography variant="h6">{profile.followers_count}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('social.followers')}
                </Typography>
              </Box>
              <Box textAlign="center" flex={1}>
                <Typography variant="h6">{profile.following_count}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('social.following')}
                </Typography>
              </Box>
              <Box textAlign="center" flex={1}>
                <Typography variant="h6">{profile.achievements_count}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('achievements.title')}
                </Typography>
              </Box>
            </Box>

            {/* 최근 업적 */}
            {profile.recent_achievements && profile.recent_achievements.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box>
                  <Typography variant="subtitle2" gutterBottom sx={{ mb: 1 }}>
                    {t('achievements.recent')}
                  </Typography>
                  <Box display="flex" gap={1} flexWrap="wrap">
                    {profile.recent_achievements.slice(0, 3).map((achievement) => (
                      <Chip
                        key={achievement.id}
                        icon={<EmojiEvents style={{ color: getBadgeColor(achievement.badge_level) }} />}
                        label={getAchievementName(achievement)}
                        size="small"
                        variant="outlined"
                      />
                    ))}
                  </Box>
                </Box>
              </>
            )}

            {/* 전체 프로필 보기 */}
            <Box mt={3}>
              <Button
                variant="text"
                fullWidth
                onClick={handleViewFullProfile}
                sx={{ textTransform: 'none' }}
              >
                {t('social.viewFullProfile')}
              </Button>
            </Box>
          </Box>
        ) : (
          <Box textAlign="center" py={4}>
            <Typography color="text.secondary">
              {t('social.profileNotFound')}
            </Typography>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileCardDialog;
