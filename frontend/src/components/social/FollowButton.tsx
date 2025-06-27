import React, { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { PersonAdd, PersonRemove } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';
import achievementService from '../../services/achievementService';

interface FollowButtonProps {
  userId: number;
  isFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
}

const FollowButton: React.FC<FollowButtonProps> = ({
  userId,
  isFollowing: initialIsFollowing,
  onFollowChange,
  size = 'medium',
  fullWidth = false,
}) => {
  const { t } = useTranslation();
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [loading, setLoading] = useState(false);

  const handleFollowToggle = async () => {
    setLoading(true);
    try {
      // 사용자의 프로필 ID를 찾아야 함
      const response = await api.get('/social/profiles/', {
        params: { user: userId }
      });
      
      if (response.data.results && response.data.results.length > 0) {
        const profileId = response.data.results[0].id;
        
        // follow 액션 호출
        const followResponse = await api.post(`/social/profiles/${profileId}/follow/`);
        
        // 응답에 따라 상태 업데이트
        if (followResponse.data.status === 'followed') {
          setIsFollowing(true);
          onFollowChange?.(true);
          // 팔로우 시 업적 체크
          checkFollowAchievement();
        } else {
          setIsFollowing(false);
          onFollowChange?.(false);
        }
      }
    } catch (error) {
      console.error('Failed to toggle follow:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkFollowAchievement = async () => {
    try {
      // 업적 체크 - 알림 자동 표시
      await achievementService.checkSocialAchievement('follow_user');
    } catch (error: any) {
      // 405 오류는 무시 (백엔드 API 미구현)
      if (error.response?.status !== 405) {
        console.error('Failed to check achievement:', error);
      }
    }
  };

  return (
    <Button
      variant={isFollowing ? 'outlined' : 'contained'}
      color={isFollowing ? 'secondary' : 'primary'}
      size={size}
      fullWidth={fullWidth}
      onClick={handleFollowToggle}
      disabled={loading}
      startIcon={
        loading ? (
          <CircularProgress size={16} />
        ) : isFollowing ? (
          <PersonRemove />
        ) : (
          <PersonAdd />
        )
      }
    >
      {loading ? '' : isFollowing ? t('social.unfollow') : t('social.follow')}
    </Button>
  );
};

export default FollowButton;
