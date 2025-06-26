import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Divider,
  Avatar,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Edit,
  Save,
  Cancel,
  Person,
  Height,
  MonitorWeight,
  Cake,
  FitnessCenter,
  CameraAlt,
  Delete,
  EmojiEvents,
  Star,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import ImageCropper from '../components/ImageCropper';
import api from '../services/api';

const Profile: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, refreshUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [healthOptions, setHealthOptions] = useState<{
    diseases: string[];
    allergies: string[];
  }>({ diseases: [], allergies: [] });
  
  // 프로필 이미지 관련 상태
  const [profileImage, setProfileImage] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [cropperOpen, setCropperOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [userLevel, setUserLevel] = useState<any>(null);

  const [formData, setFormData] = useState<{
    age: number;
    height: number;
    weight: number;
    gender: string;
    exercise_experience: string;
    diseases: string[];
    allergies: string[];
  }>({
    age: user?.profile?.age || 0,
    height: user?.profile?.height || 0,
    weight: user?.profile?.weight || 0,
    gender: user?.profile?.gender || 'O',
    exercise_experience: user?.profile?.exercise_experience || 'beginner',
    diseases: user?.profile?.diseases || [],
    allergies: user?.profile?.allergies || [],
  });

  useEffect(() => {
    if (user?.profile) {
      setFormData({
        age: user.profile.age,
        height: user.profile.height,
        weight: user.profile.weight,
        gender: user.profile.gender,
        exercise_experience: user.profile.exercise_experience,
        diseases: user.profile.diseases || [],
        allergies: user.profile.allergies || [],
      });
      // 프로필 이미지 설정
      if (user.profile.profile_image) {
        setProfileImage(user.profile.profile_image);
      }
    }
    fetchHealthOptions();
    fetchUserLevel();
  }, [user, i18n.language]); // 언어 변경 시에도 다시 로드

  const fetchHealthOptions = async () => {
    try {
      const options = await authService.getHealthOptions();
      setHealthOptions(options);
    } catch (error) {
      console.error('Failed to fetch health options:', error);
    }
  };

  const fetchUserLevel = async () => {
    try {
      const response = await api.get('/api/user-level/');
      setUserLevel(response.data);
    } catch (error) {
      console.error('Failed to fetch user level:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSelectChange = (name: string, value: any) => {
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleCheckboxChange = (type: 'diseases' | 'allergies', value: string) => {
    setFormData({
      ...formData,
      [type]: formData[type].includes(value)
        ? formData[type].filter(item => item !== value)
        : [...formData[type], value],
    });
  };

  const handleEdit = () => {
    setIsEditing(true);
    setError('');
    setSuccess('');
  };

  const handleCancel = () => {
    setIsEditing(false);
    setError('');
    setSuccess('');
    // Reset to original data
    if (user?.profile) {
      setFormData({
        age: user.profile.age,
        height: user.profile.height,
        weight: user.profile.weight,
        gender: user.profile.gender,
        exercise_experience: user.profile.exercise_experience,
        diseases: user.profile.diseases || [],
        allergies: user.profile.allergies || [],
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await authService.updateProfile({
        ...formData,
        age: parseInt(formData.age.toString()),
        height: parseFloat(formData.height.toString()),
        weight: parseFloat(formData.weight.toString()),
        gender: formData.gender,
        exercise_experience: formData.exercise_experience,
      });
      
      await refreshUser();
      setSuccess(t('profile.updateSuccess'));
      setIsEditing(false);
    } catch (err: any) {
      setError(err.response?.data?.error || t('profile.updateError'));
    } finally {
      setLoading(false);
    }
  };

  const calculateBMI = () => {
    if (formData.height && formData.weight) {
      const heightInM = formData.height / 100;
      const bmi = formData.weight / (heightInM * heightInM);
      return bmi.toFixed(1);
    }
    return '0';
  };

  const getBMIStatus = () => {
    const bmi = parseFloat(calculateBMI());
    if (bmi < 18.5) return { text: t('profile.bmiStatus.underweight'), color: '#1E88E5' };
    if (bmi < 23) return { text: t('profile.bmiStatus.normal'), color: '#43A047' };
    if (bmi < 25) return { text: t('profile.bmiStatus.overweight'), color: '#FB8C00' };
    if (bmi < 30) return { text: t('profile.bmiStatus.obese'), color: '#E53935' };
    return { text: t('profile.bmiStatus.severelyObese'), color: '#B71C1C' };
  };

  // 프로필 이미지 관련 함수들
  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // 파일 크기 검사 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      setError(t('profile.profileImage.fileSizeError'));
      return;
    }

    // 파일 타입 검사
    if (!file.type.startsWith('image/')) {
      setError(t('profile.profileImage.fileTypeError'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
      setCropperOpen(true);
    };
    reader.readAsDataURL(file);
  };

  const handleCropComplete = async (croppedImageUrl: string) => {
    try {
      setLoading(true);
      setCropperOpen(false);
      
      // base64를 Blob으로 변환
      const fetchResponse = await fetch(croppedImageUrl);
      const blob = await fetchResponse.blob();
      
      // FormData 생성
      const formData = new FormData();
      formData.append('profile_image', blob, 'profile.png');
      
      // 서버에 업로드
      const uploadResponse = await api.post('/auth/profile/upload-image/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      // 서버에서 반환한 이미지 URL 사용
      if (uploadResponse.data.image_url) {
        setProfileImage(uploadResponse.data.image_url);
        await refreshUser();
      }
      
      setSuccess(t('profile.profileImage.uploadSuccess'));
      
      // 헤더 이미지 강제 새로고침을 위한 커스텀 이벤트 발생
      window.dispatchEvent(new Event('profileImageUpdated'));
    } catch (error: any) {
      setError(error.response?.data?.error || t('profile.profileImage.uploadError'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!window.confirm(t('profile.profileImage.deleteConfirm'))) {
      return;
    }
    
    try {
      setLoading(true);
      await api.delete('/auth/profile/delete-image/');
      setProfileImage('');
      await refreshUser();
      setSuccess(t('profile.profileImage.deleteSuccess'));
      
      // 헤더 이미지 강제 새로고침을 위한 커스텀 이벤트 발생
      window.dispatchEvent(new Event('profileImageUpdated'));
    } catch (error: any) {
      setError(error.response?.data?.error || t('profile.profileImage.deleteError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* 이미지 크롭퍼 다이얼로그 */}
      <ImageCropper
        open={cropperOpen}
        onClose={() => setCropperOpen(false)}
        imageUrl={imagePreview}
        onCropComplete={handleCropComplete}
      />
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={900}>
          {t('profile.title')}
        </Typography>
        {!isEditing ? (
          <Button
            variant="contained"
            startIcon={<Edit />}
            onClick={handleEdit}
            sx={{
              background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
              color: '#000',
              fontWeight: 700,
            }}
          >
            {t('profile.editButton')}
          </Button>
        ) : (
          <Box display="flex" gap={2}>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={handleCancel}
              disabled={loading}
            >
              {t('profile.cancelButton')}
            </Button>
            <Button
              variant="contained"
              startIcon={loading ? <CircularProgress size={20} /> : <Save />}
              onClick={handleSave}
              disabled={loading}
              sx={{
                background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
                color: '#000',
                fontWeight: 700,
              }}
            >
              {t('profile.saveButton')}
            </Button>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
        {/* 기본 정보 */}
        <Box>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Paper
              sx={{
                p: 3,
                background: 'rgba(17, 17, 17, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person /> {t('profile.basicInfo')}
              </Typography>
              <Divider sx={{ my: 2 }} />
              
              {/* 프로필 이미지 */}
              <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <Badge
                  overlap="circular"
                  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                  badgeContent={
                    <Box>
                      <IconButton
                        onClick={() => fileInputRef.current?.click()}
                        sx={{
                          bgcolor: 'primary.main',
                          color: '#000',
                          width: 32,
                          height: 32,
                          '&:hover': {
                            bgcolor: 'primary.dark',
                          },
                        }}
                      >
                        <CameraAlt sx={{ fontSize: 18 }} />
                      </IconButton>
                      {profileImage && (
                        <IconButton
                          onClick={handleDeleteImage}
                          sx={{
                            bgcolor: 'error.main',
                            color: '#fff',
                            width: 32,
                            height: 32,
                            ml: 0.5,
                            '&:hover': {
                              bgcolor: 'error.dark',
                            },
                          }}
                        >
                          <Delete sx={{ fontSize: 18 }} />
                        </IconButton>
                      )}
                    </Box>
                  }
                >
                  <Avatar
                    src={profileImage || undefined}
                    sx={{
                      width: 120,
                      height: 120,
                      bgcolor: 'primary.main',
                      fontSize: 48,
                      '& img': {
                        objectFit: 'cover',
                        width: '100%',
                        height: '100%',
                        maxWidth: '120px',
                        maxHeight: '120px',
                      },
                    }}
                  >
                    {!profileImage && (
                      <Person sx={{ fontSize: 60 }} />
                    )}
                  </Avatar>
                </Badge>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
              </Box>
              
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('profile.email')}
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {user?.email}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('profile.username')}
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {user?.username}
                </Typography>
              </Box>

              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('profile.joinDate')}
                </Typography>
                <Typography variant="body1" fontWeight={600}>
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                </Typography>
              </Box>

              {/* 레벨 정보 */}
              {userLevel && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <EmojiEvents sx={{ color: 'primary.main' }} />
                    <Typography variant="subtitle2" fontWeight={600}>
                      {t('profile.level')}
                    </Typography>
                  </Box>
                  <Box display="flex" alignItems="baseline" gap={2} mb={1}>
                    <Typography variant="h4" fontWeight={700} color="primary.main">
                      Lv. {userLevel.level}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {userLevel.title}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 1 }}>
                    <Box display="flex" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" color="text.secondary">
                        {t('profile.experience')}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {userLevel.current_xp} / {userLevel.next_level_xp} XP
                      </Typography>
                    </Box>
                    <Box sx={{ 
                      height: 8, 
                      bgcolor: 'background.paper', 
                      borderRadius: 1,
                      overflow: 'hidden'
                    }}>
                      <Box sx={{ 
                        width: `${(userLevel.current_xp / userLevel.next_level_xp) * 100}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #00D4FF, #00FFB3)',
                        transition: 'width 0.3s ease'
                      }} />
                    </Box>
                  </Box>
                  <Box display="flex" alignItems="center" gap={0.5}>
                    <Star sx={{ fontSize: 16, color: 'warning.main' }} />
                    <Typography variant="caption" fontWeight={600}>
                      {userLevel.total_points} {t('profile.points')}
                    </Typography>
                  </Box>
                </Box>
              )}
            </Paper>
          </motion.div>
        </Box>

        {/* 신체 정보 */}
        <Box>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <Paper
              sx={{
                p: 3,
                background: 'rgba(17, 17, 17, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography variant="h6" gutterBottom>
                {t('profile.bodyInfo')}
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <TextField
                  fullWidth
                  name="age"
                  type="number"
                  label={t('profile.age')}
                  value={formData.age}
                  onChange={handleChange}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <Cake sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <TextField
                  fullWidth
                  name="height"
                  type="number"
                  label={t('profile.height')}
                  value={formData.height}
                  onChange={handleChange}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <Height sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
                <TextField
                  fullWidth
                  name="weight"
                  type="number"
                  label={t('profile.weight')}
                  value={formData.weight}
                  onChange={handleChange}
                  disabled={!isEditing}
                  InputProps={{
                    startAdornment: <MonitorWeight sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                />
              </Box>

              <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  {t('profile.bmi')}
                </Typography>
                <Box display="flex" alignItems="baseline" gap={2}>
                  <Typography variant="h4" fontWeight={700}>
                    {calculateBMI()}
                  </Typography>
                  <Chip
                    label={getBMIStatus().text}
                    size="small"
                    sx={{
                      bgcolor: getBMIStatus().color,
                      color: '#fff',
                      fontWeight: 600,
                    }}
                  />
                </Box>
              </Box>

              <FormControl component="fieldset" sx={{ mt: 3 }} disabled={!isEditing}>
                <FormLabel component="legend">{t('profile.gender')}</FormLabel>
                <RadioGroup
                  row
                  name="gender"
                  value={formData.gender}
                  onChange={(e) => handleSelectChange('gender', e.target.value)}
                >
                  <FormControlLabel value="M" control={<Radio />} label={t('profile.male')} />
                  <FormControlLabel value="F" control={<Radio />} label={t('profile.female')} />
                  <FormControlLabel value="O" control={<Radio />} label={t('profile.other')} />
                </RadioGroup>
              </FormControl>

              <FormControl fullWidth sx={{ mt: 2 }} disabled={!isEditing}>
                <FormLabel>{t('profile.exerciseExperience')}</FormLabel>
                <Select
                  name="exercise_experience"
                  value={formData.exercise_experience}
                  onChange={(e) => handleSelectChange('exercise_experience', e.target.value)}
                  startAdornment={<FitnessCenter sx={{ mr: 1, color: 'text.secondary' }} />}
                >
                  <MenuItem value="beginner">{t('profile.beginner')}</MenuItem>
                  <MenuItem value="intermediate">{t('profile.intermediate')}</MenuItem>
                  <MenuItem value="advanced">{t('profile.advanced')}</MenuItem>
                  <MenuItem value="expert">{t('profile.expert')}</MenuItem>
                </Select>
              </FormControl>
            </Paper>
          </motion.div>
        </Box>

        {/* 건강 정보 */}
        <Box sx={{ gridColumn: { xs: '1', sm: '1 / -1' } }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Paper
              sx={{
                p: 3,
                background: 'rgba(17, 17, 17, 0.8)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <Typography variant="h6" gutterBottom>
                {t('profile.healthInfo')}
              </Typography>
              <Divider sx={{ my: 2 }} />

              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  {t('profile.diseases')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {healthOptions.diseases.map((disease) => (
                    <Chip
                      key={disease}
                      label={disease}
                      onClick={() => isEditing && handleCheckboxChange('diseases', disease)}
                      color={formData.diseases.includes(disease) ? 'primary' : 'default'}
                      variant={formData.diseases.includes(disease) ? 'filled' : 'outlined'}
                      disabled={!isEditing}
                      sx={{ cursor: isEditing ? 'pointer' : 'default' }}
                    />
                  ))}
                </Box>
              </Box>

              <Box>
                <Typography variant="subtitle1" gutterBottom fontWeight={600}>
                  {t('profile.allergies')}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {healthOptions.allergies.map((allergy) => (
                    <Chip
                      key={allergy}
                      label={allergy}
                      onClick={() => isEditing && handleCheckboxChange('allergies', allergy)}
                      color={formData.allergies.includes(allergy) ? 'secondary' : 'default'}
                      variant={formData.allergies.includes(allergy) ? 'filled' : 'outlined'}
                      disabled={!isEditing}
                      sx={{ cursor: isEditing ? 'pointer' : 'default' }}
                    />
                  ))}
                </Box>
              </Box>
            </Paper>
          </motion.div>
        </Box>
      </Box>
    </Box>
  );
};

export default Profile;
