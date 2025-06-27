import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
  Button,
  CircularProgress,
  Stack,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
} from '@mui/material';
import {
  Person,
  EmojiEvents,
  Grade,
  Search,
  ArrowBack,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { getNetworkAwareProfileImageUrl } from '../utils/profileUtils';
import FollowButton from '../components/social/FollowButton';

interface FollowingUser {
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
  achievements_count: number;
  is_following: boolean;
}

export default function FollowingAchievements() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const [followingUsers, setFollowingUsers] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchFollowingUsers();
  }, []);

  const fetchFollowingUsers = async () => {
    setLoading(true);
    try {
      // 현재 사용자가 팔로우하는 사용자들의 프로필 가져오기
      const response = await api.get('/social/profiles/', {
        params: {
          following: true,  // 팔로잉하는 사용자들만
        }
      });
      
      const profiles = response.data.results || [];
      setFollowingUsers(profiles);
    } catch (error) {
      console.error('Failed to fetch following users:', error);
      setFollowingUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFollowChange = (userId: number, isFollowing: boolean) => {
    setFollowingUsers(prev => 
      prev.map(user => 
        user.user.id === userId 
          ? { ...user, is_following: isFollowing }
          : user
      )
    );
    
    // 언팔로우한 경우 목록에서 제거
    if (!isFollowing) {
      setTimeout(() => {
        setFollowingUsers(prev => prev.filter(user => user.user.id !== userId));
      }, 500);
    }
  };

  const filteredUsers = followingUsers.filter(user =>
    user.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" gap={2} mb={4}>
        <IconButton onClick={() => navigate('/achievements')}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" fontWeight={900} flex={1}>
          {t('pages.achievements.followingTitle')}
        </Typography>
      </Box>

      {/* Search Bar */}
      <TextField
        fullWidth
        placeholder={t('social.searchUsers')}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <Search />
            </InputAdornment>
          ),
        }}
        sx={{ mb: 4 }}
      />

      {/* User List */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress />
        </Box>
      ) : filteredUsers.length > 0 ? (
        <Box
          display="grid"
          gridTemplateColumns={{ xs: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
          gap={3}
        >
          {filteredUsers.map((profile) => (
            <Card
              key={profile.id}
              sx={{
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4,
                },
              }}
            >
              <CardContent>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                  <Avatar
                    src={getNetworkAwareProfileImageUrl(profile)}
                    sx={{
                      width: 64,
                      height: 64,
                      border: '2px solid',
                      borderColor: 'primary.main',
                    }}
                    onClick={() => navigate(`/profile/${profile.user.id}`)}
                  >
                    {profile.user.username[0].toUpperCase()}
                  </Avatar>
                  
                  <Box flex={1}>
                    <Typography
                      variant="h6"
                      fontWeight={700}
                      sx={{ cursor: 'pointer' }}
                      onClick={() => navigate(`/profile/${profile.user.id}`)}
                    >
                      {profile.user.username}
                    </Typography>
                    
                    <Stack direction="row" spacing={1} mt={0.5}>
                      <Chip
                        icon={<Grade />}
                        label={`${t('common.level')} ${profile.level}`}
                        size="small"
                        color="primary"
                      />
                      <Chip
                        icon={<EmojiEvents />}
                        label={`${profile.total_points} ${t('achievements.points')}`}
                        size="small"
                        color="secondary"
                      />
                    </Stack>
                  </Box>
                </Box>

                {profile.bio && (
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {profile.bio}
                  </Typography>
                )}

                {/* Stats */}
                <Box display="flex" justifyContent="space-around" mb={2}>
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight={700}>
                      {profile.achievements_count}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('achievements.title')}
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight={700}>
                      {profile.followers_count}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('social.followers')}
                    </Typography>
                  </Box>
                  <Box textAlign="center">
                    <Typography variant="h6" fontWeight={700}>
                      {profile.following_count}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {t('social.following')}
                    </Typography>
                  </Box>
                </Box>

                {/* Action Buttons */}
                <Stack direction="row" spacing={1}>
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<Person />}
                    onClick={() => navigate(`/profile/${profile.user.id}`)}
                  >
                    {t('social.viewProfile')}
                  </Button>
                  <FollowButton
                    userId={profile.user.id}
                    isFollowing={profile.is_following}
                    onFollowChange={(isFollowing) => handleFollowChange(profile.user.id, isFollowing)}
                    fullWidth
                  />
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      ) : (
        <Box textAlign="center" py={8}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            {searchQuery 
              ? t('social.noUsersFound')
              : t('pages.achievements.noFollowing')
            }
          </Typography>
          {!searchQuery && (
            <>
              <Typography variant="body2" color="text.secondary" mb={3}>
                {t('pages.achievements.noFollowingDescription')}
              </Typography>
              <Button
                variant="contained"
                startIcon={<Person />}
                onClick={() => navigate('/social')}
              >
                {t('pages.achievements.findPeople')}
              </Button>
            </>
          )}
        </Box>
      )}
    </Container>
  );
}
