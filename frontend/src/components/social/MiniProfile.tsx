import React, { useState, useEffect } from 'react';
import {
  Popover,
  Box,
  Avatar,
  Typography,
  Button,
  Chip,
  Divider,
  CircularProgress,
  IconButton,
} from '@mui/material';
import {
  EmojiEvents,
  LocationOn,
  Close,
  PersonAdd,
  PersonRemove,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../services/api';
import achievementService from '../../services/achievementService';

interface MiniProfileProps {
  userId: number;
  anchorEl: HTMLElement | null;
  onClose: () => void;
}

interface UserProfileData {
  id: number;
  user: {
    id: number;
    username: string;
    email: string;
  };
  bio: string;
  profile_picture_url?: string;
  followers_count: number;
  following_count: number;
  is_following: boolean;
  location?: string;
  achievements_count?: number;
  level?: number;
  total_points?: number;
}

const MiniProfile: React.FC<MiniProfileProps> = ({ userId, anchorEl, onClose }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [profileData, setProfileData] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (anchorEl) {
      fetchUserProfile();
    }
  }, [userId, anchorEl]);

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      // 먼저 사용자의 프로필 찾기
      const profileResponse = await api.get('/social/profiles/', {
        params: { user: userId }
      });
      
      if (profileResponse.data.results && profileResponse.data.results.length > 0) {
        const profile = profileResponse.data.results[0];
        
        // 업적 정보 가져오기
        try {
          const achievementResponse = await api.get(`/achievements/user/${userId}/summary/`);
          setProfileData({
            ...profile,
            achievements_count: achievementResponse.data.completed_count,
            level: achievementResponse.data.level,
            total_points: achievementResponse.data.total_points,
          });
        } catch (error) {
          // 업적 정보를 가져오지 못해도 프로필은 표시
          setProfileData(profile);
        }
      }
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profileData) return;
    
    setFollowLoading(true);
    try {
      const response = await api.post(`/social/profiles/${profileData.id}/follow/`);
      
      if (response.data.status === 'followed') {
        setProfileData({ ...profileData, is_following: true });
        // 팔로우 업적 체크
        await achievementService.checkSocialAchievement('follow_user');
      } else {
        setProfileData({ ...profileData, is_following: false });
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    } finally {
      setFollowLoading(false);
    }
  };

  const handleViewProfile = () => {
    onClose();
    navigate(`/profile/${userId}`);
  };

  const open = Boolean(anchorEl);
  const isOwnProfile = currentUser?.id === userId;

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      PaperProps={{
        sx: {
          width: 320,
          maxWidth: '90vw',
          borderRadius: 2,
          overflow: 'hidden',
          backgroundImage: 'linear-gradient(135deg, rgba(0, 212, 255, 0.05), rgba(0, 255, 179, 0.05))',
        }
      }}
    >
      {loading ? (
        <Box p={4} display="flex" justifyContent="center">
          <CircularProgress />
        </Box>
      ) : profileData ? (
        <>
          {/* Header with close button */}
          <Box
            sx={{
              p: 2,
              background: 'linear-gradient(135deg, rgba(0, 212, 255, 0.1), rgba(0, 255, 179, 0.1))',
              position: 'relative',
            }}
          >
            <IconButton
              onClick={onClose}
              sx={{
                position: 'absolute',
                right: 8,
                top: 8,
                color: 'text.secondary',
              }}
              size="small"
            >
              <Close />
            </IconButton>
            
            {/* Profile Info */}
            <Box display="flex" flexDirection="column" alignItems="center" mt={1}>
              <Avatar
                src={profileData.profile_picture_url}
                sx={{
                  width: 80,
                  height: 80,
                  mb: 2,
                  border: '3px solid',
                  borderColor: 'primary.main',
                }}
              >
                {profileData.user.username[0].toUpperCase()}
              </Avatar>
              
              <Typography variant="h6" fontWeight={700}>
                {profileData.user.username}
              </Typography>
              
              {profileData.bio && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 1, textAlign: 'center', px: 2 }}
                >
                  {profileData.bio}
                </Typography>
              )}
              
              {profileData.location && (
                <Box display="flex" alignItems="center" gap={0.5} mt={1}>
                  <LocationOn sx={{ fontSize: 16, color: 'text.secondary' }} />
                  <Typography variant="caption" color="text.secondary">
                    {profileData.location}
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>
          
          <Divider />
          
          {/* Stats */}
          <Box p={2}>
            <Box display="flex" justifyContent="space-around" mb={2}>
              <Box textAlign="center">
                <Typography variant="h6" fontWeight={700}>
                  {profileData.followers_count}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('social.followers')}
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h6" fontWeight={700}>
                  {profileData.following_count}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {t('social.following')}
                </Typography>
              </Box>
              {profileData.achievements_count !== undefined && (
                <Box textAlign="center">
                  <Typography variant="h6" fontWeight={700}>
                    {profileData.achievements_count}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {t('pages.achievements.title')}
                  </Typography>
                </Box>
              )}
            </Box>
            
            {/* Level and Points */}
            {profileData.level !== undefined && (
              <Box
                sx={{
                  p: 1.5,
                  bgcolor: 'background.default',
                  borderRadius: 1,
                  mb: 2,
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box display="flex" alignItems="center" gap={1}>
                    <EmojiEvents sx={{ color: 'primary.main' }} />
                    <Typography variant="body2" fontWeight={600}>
                      {t('pages.achievements.level')} {profileData.level}
                    </Typography>
                  </Box>
                  <Chip
                    label={`${profileData.total_points || 0} ${t('pages.achievements.points')}`}
                    size="small"
                    color="primary"
                  />
                </Box>
              </Box>
            )}
            
            {/* Action Buttons */}
            <Box display="flex" gap={1}>
              {!isOwnProfile && (
                <Button
                  fullWidth
                  variant={profileData.is_following ? 'outlined' : 'contained'}
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  startIcon={
                    followLoading ? (
                      <CircularProgress size={16} />
                    ) : profileData.is_following ? (
                      <PersonRemove />
                    ) : (
                      <PersonAdd />
                    )
                  }
                >
                  {followLoading ? '' : profileData.is_following ? t('social.unfollow') : t('social.follow')}
                </Button>
              )}
              <Button
                fullWidth
                variant={isOwnProfile ? 'contained' : 'text'}
                onClick={handleViewProfile}
              >
                {t('social.viewProfile')}
              </Button>
            </Box>
          </Box>
        </>
      ) : (
        <Box p={4} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            {t('social.profileNotFound')}
          </Typography>
        </Box>
      )}
    </Popover>
  );
};

export default MiniProfile;
