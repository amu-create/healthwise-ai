import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  Link,
  Alert,
  InputAdornment,
  IconButton,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Select,
  MenuItem,
  Chip,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Email,
  Lock,
  Person,
  ArrowBack,
  ArrowForward,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import authService from '../services/authService';
import { styled } from '@mui/material/styles';

const GradientBox = styled(Box)({
  background: 'linear-gradient(135deg, #000 0%, #111 100%)',
  minHeight: '100vh',
  display: 'flex',
  alignItems: 'center',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-50%',
    left: '-50%',
    width: '200%',
    height: '200%',
    background: 'radial-gradient(circle, rgba(0, 212, 255, 0.1) 0%, transparent 70%)',
    animation: 'rotate 30s linear infinite',
  },
  '@keyframes rotate': {
    '0%': { transform: 'rotate(0deg)' },
    '100%': { transform: 'rotate(360deg)' },
  },
});

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  borderRadius: 24,
  background: 'rgba(17, 17, 17, 0.8)',
  backdropFilter: 'blur(20px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
  minHeight: 600,
}));

const GradientButton = styled(Button)({
  background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
  color: '#000',
  fontWeight: 700,
  padding: '12px 32px',
  fontSize: '1rem',
  borderRadius: 12,
  textTransform: 'none',
  boxShadow: '0 4px 20px rgba(0, 212, 255, 0.3)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 30px rgba(0, 212, 255, 0.5)',
  },
  '&:disabled': {
    background: 'rgba(255, 255, 255, 0.1)',
    color: 'rgba(255, 255, 255, 0.3)',
  },
});

const Register: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { register } = useAuth();
  
  // Use translations for steps
  const steps = [t('auth.signup.basicInfo'), t('auth.signup.personalInfo'), t('auth.signup.healthInfo')];
  
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [healthOptions, setHealthOptions] = useState<{
    diseases: string[];
    allergies: string[];
  }>({ diseases: [], allergies: [] });
  
  const [formData, setFormData] = useState({
    // Step 1: Basic information
    email: '',
    username: '',
    password: '',
    password2: '',
    
    // Step 2: Physical information
    age: '',
    height: '',
    weight: '',
    gender: 'O' as 'M' | 'F' | 'O',
    exercise_experience: 'beginner' as 'beginner' | 'intermediate' | 'advanced' | 'expert',
    
    // Step 3: Health information
    diseases: [] as string[],
    allergies: [] as string[],
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  useEffect(() => {
    fetchHealthOptions();
  }, []);

  // 언어 변경 감지
  useEffect(() => {
    const handleLanguageChange = () => {
      fetchHealthOptions();
    };

    // i18next 언어 변경 이벤트 리스너
    window.addEventListener('languageChanged', handleLanguageChange);
    
    return () => {
      window.removeEventListener('languageChanged', handleLanguageChange);
    };
  }, []);

  const fetchHealthOptions = async () => {
    try {
      const options = await authService.getHealthOptions();
      console.log('Health options received:', options);
      setHealthOptions(options);
    } catch (error) {
      console.error('Failed to fetch health options:', error);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
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

  const validateStep = () => {
    switch (activeStep) {
      case 0:
        if (!formData.email || !formData.username || !formData.password || !formData.password2) {
          if (!formData.email) setError(t('auth.signup.errors.emailRequired'));
          else if (!formData.username) setError(t('auth.signup.errors.usernameRequired'));
          else if (!formData.password) setError(t('auth.signup.errors.passwordRequired'));
          else if (!formData.password2) setError(t('auth.signup.errors.passwordRequired'));
          return false;
        }
        if (formData.password !== formData.password2) {
          setError(t('auth.signup.errors.passwordMismatch'));
          return false;
        }
        if (formData.password.length < 8) {
          setError(t('auth.signup.errors.passwordTooShort'));
          return false;
        }
        break;
      case 1:
        if (!formData.age || !formData.height || !formData.weight) {
          if (!formData.age) setError(t('auth.signup.errors.ageInvalid'));
          else if (!formData.height) setError(t('auth.signup.errors.heightInvalid'));
          else if (!formData.weight) setError(t('auth.signup.errors.weightInvalid'));
          return false;
        }
        break;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    setActiveStep(prev => prev - 1);
    setError('');
  };

  // Complete registration
  const handleFinish = async () => {
    setLoading(true);
    setError('');

    const requestData = {
      ...formData,
      age: parseInt(formData.age),
      height: parseFloat(formData.height),
      weight: parseFloat(formData.weight),
    };

    console.log('Registration request data:', requestData);

    try {
      await register(requestData);
      // Registration successful, navigate to dashboard (auto-login)
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      console.error('Error response:', err.response);
      console.error('Error response data:', err.response?.data);
      
      // 에러 메시지 처리
      if (err.response?.data) {
        const errorData = err.response.data;
        console.log('Error data type:', typeof errorData);
        console.log('Error data:', errorData);
        
        if (typeof errorData === 'object') {
          // error 필드가 있는 경우
          if (errorData.error) {
            setError(errorData.error);
          } 
          // 필드별 에러 메시지 처리
          else {
            const errorMessages = Object.entries(errorData)
              .filter(([field, _]) => field !== 'non_field_errors')
              .map(([field, messages]) => {
                // 필드명을 번역
                const fieldNameMap: Record<string, string> = {
                  email: t('auth.signup.email'),
                  username: t('auth.signup.username'),
                  password: t('auth.signup.password'),
                  age: t('auth.signup.age'),
                  height: t('auth.signup.height'),
                  weight: t('auth.signup.weight'),
                  gender: t('profile.gender'),
                  diseases: t('auth.signup.conditions'),
                  allergies: t('auth.signup.allergies')
                };
                const fieldName = fieldNameMap[field] || field;
                
                if (Array.isArray(messages)) {
                  return `${fieldName}: ${messages.join(', ')}`;
                }
                return `${fieldName}: ${messages}`;
              })
              .join('\n');
            
            // non_field_errors 처리
            if (errorData.non_field_errors) {
              const nonFieldErrors = Array.isArray(errorData.non_field_errors) 
                ? errorData.non_field_errors.join(', ')
                : errorData.non_field_errors;
              setError(nonFieldErrors || errorMessages || t('auth.signup.errors.serverError'));
            } else {
              setError(errorMessages || t('auth.signup.errors.serverError'));
            }
          }
        } else {
          setError(errorData || t('auth.signup.errors.serverError'));
        }
      } else {
        setError(err.message || t('auth.signup.errors.serverError'));
      }
    } finally {
      setLoading(false);
    }
  };

  // Enter 키 핸들러
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && activeStep < steps.length - 1) {
      e.preventDefault();
      handleNext();
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <AnimatePresence mode="wait">
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <TextField
                fullWidth
                name="email"
                type="email"
                label={t('auth.signup.email')}
                value={formData.email}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                margin="normal"
                required
                autoComplete="email"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                name="username"
                label={t('auth.signup.username')}
                value={formData.username}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                margin="normal"
                required
                autoComplete="username"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                name="password"
                type={showPassword ? 'text' : 'password'}
                label={t('auth.signup.password')}
                value={formData.password}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                margin="normal"
                required
                autoComplete="new-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword(!showPassword)}
                        edge="end"
                      >
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
              
              <TextField
                fullWidth
                name="password2"
                type={showPassword2 ? 'text' : 'password'}
                label={t('auth.signup.confirmPassword')}
                value={formData.password2}
                onChange={handleChange}
                onKeyPress={handleKeyPress}
                margin="normal"
                required
                autoComplete="new-password"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock sx={{ color: 'text.secondary' }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowPassword2(!showPassword2)}
                        edge="end"
                      >
                        {showPassword2 ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </motion.div>
          </AnimatePresence>
        );
        
      case 1:
        return (
          <AnimatePresence mode="wait">
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                <TextField
                  fullWidth
                  name="age"
                  type="number"
                  label={t('auth.signup.age')}
                  value={formData.age}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  required
                  inputProps={{ min: 1, max: 120 }}
                  helperText={t('auth.signup.ageHelp')}
                />
                <TextField
                  fullWidth
                  name="height"
                  type="number"
                  label={t('auth.signup.height')}
                  value={formData.height}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  required
                  inputProps={{ min: 50, max: 300, step: 0.1 }}
                  helperText={t('auth.signup.heightHelp')}
                />
                <TextField
                  fullWidth
                  name="weight"
                  type="number"
                  label={t('auth.signup.weight')}
                  value={formData.weight}
                  onChange={handleChange}
                  onKeyPress={handleKeyPress}
                  required
                  inputProps={{ min: 20, max: 500, step: 0.1 }}
                />
              </Box>
              
              <FormControl component="fieldset" sx={{ mt: 3, mb: 2 }}>
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
              
              <FormControl fullWidth sx={{ mt: 2 }}>
                <FormLabel>{t('profile.exerciseExperience')}</FormLabel>
                <Select
                  name="exercise_experience"
                  value={formData.exercise_experience}
                  onChange={(e) => handleSelectChange('exercise_experience', e.target.value)}
                >
                  <MenuItem value="beginner">{t('profile.beginner')}</MenuItem>
                  <MenuItem value="intermediate">{t('profile.intermediate')}</MenuItem>
                  <MenuItem value="advanced">{t('profile.advanced')}</MenuItem>
                  <MenuItem value="expert">{t('profile.expert')}</MenuItem>
                </Select>
              </FormControl>
            </motion.div>
          </AnimatePresence>
        );
        
      case 2:
        return (
          <AnimatePresence mode="wait">
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Typography variant="h6" gutterBottom>
                {t('auth.signup.conditions')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
                {healthOptions.diseases.map((disease) => (
                  <Chip
                    key={disease}
                    label={disease}
                    onClick={() => handleCheckboxChange('diseases', disease)}
                    color={formData.diseases.includes(disease) ? 'primary' : 'default'}
                    variant={formData.diseases.includes(disease) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
              
              <Typography variant="h6" gutterBottom>
                {t('auth.signup.allergies')}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {healthOptions.allergies.map((allergy) => (
                  <Chip
                    key={allergy}
                    label={allergy}
                    onClick={() => handleCheckboxChange('allergies', allergy)}
                    color={formData.allergies.includes(allergy) ? 'secondary' : 'default'}
                    variant={formData.allergies.includes(allergy) ? 'filled' : 'outlined'}
                  />
                ))}
              </Box>
            </motion.div>
          </AnimatePresence>
        );
    }
  };

  return (
    <GradientBox>
      <Container maxWidth="md">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <StyledPaper>
            <Box textAlign="center" mb={4}>
              <Typography
                variant="h3"
                sx={{
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 1,
                }}
              >
                {t('common.appName')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('auth.signup.title')}
              </Typography>
            </Box>

            <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
              {steps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <Box sx={{ minHeight: 300 }}>
              {renderStepContent()}
            </Box>

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                onClick={handleBack}
                disabled={activeStep === 0}
                startIcon={<ArrowBack />}
              >
                {t('common.back')}
              </Button>
              
              {activeStep === steps.length - 1 ? (
                <GradientButton
                  onClick={handleFinish}
                  disabled={loading}
                  endIcon={loading ? null : <ArrowForward />}
                >
                  {loading ? (
                    <CircularProgress size={24} sx={{ color: '#000' }} />
                  ) : (
                    t('common.finish')
                  )}
                </GradientButton>
              ) : (
                <GradientButton
                  onClick={handleNext}
                  endIcon={<ArrowForward />}
                >
                  {t('common.next')}
                </GradientButton>
              )}
            </Box>

            <Box textAlign="center" mt={3}>
              <Typography variant="body2" color="text.secondary">
                {t('auth.signup.hasAccount')}{' '}
                <Link
                  component={RouterLink}
                  to="/login"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {t('auth.signup.loginLink')}
                </Link>
              </Typography>
            </Box>
          </StyledPaper>
        </motion.div>
      </Container>
    </GradientBox>
  );
};

export default Register;
