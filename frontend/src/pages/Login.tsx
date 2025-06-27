import React, { useState, useEffect } from 'react';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
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
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock, ArrowBack } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
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
}));

const GradientButton = styled(Button)({
  background: 'linear-gradient(135deg, #00D4FF, #00FFB3)',
  color: '#000',
  fontWeight: 700,
  padding: '12px 0',
  fontSize: '1.1rem',
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

const Login: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

  useEffect(() => {
    if (location.state?.message) {
      setSuccessMessage(location.state.message);
      // 히스토리 상태 초기화
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // 로딩 시작 시간 기록
      const startTime = Date.now();
      
      await login(formData);
      
      // 최소 로딩 시간 보장 (부드러운 전환을 위해)
      const elapsedTime = Date.now() - startTime;
      if (elapsedTime < 500) {
        await new Promise(resolve => setTimeout(resolve, 500 - elapsedTime));
      }
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || t('auth.loginPage.errors.invalidCredentials'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <GradientBox>
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <StyledPaper>
            {/* Back Button */}
            <Box sx={{ mb: 3 }}>
              <IconButton
                onClick={() => navigate('/')}
                sx={{
                  color: 'text.secondary',
                  '&:hover': {
                    color: 'primary.main',
                    backgroundColor: 'rgba(0, 212, 255, 0.1)',
                  },
                }}
              >
                <ArrowBack />
              </IconButton>
            </Box>

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
              <Typography variant="h5" sx={{ mb: 1, fontWeight: 600 }}>
                {t('auth.loginPage.success.welcomeBack')}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {t('auth.loginPage.title')}
              </Typography>
            </Box>

            {successMessage && (
              <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
                {successMessage}
              </Alert>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                name="email"
                type="email"
                label={t('auth.loginPage.email')}
                value={formData.email}
                onChange={handleChange}
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />
              
              <TextField
                fullWidth
                name="password"
                type={showPassword ? 'text' : 'password'}
                label={t('auth.loginPage.password')}
                value={formData.password}
                onChange={handleChange}
                margin="normal"
                required
                autoComplete="current-password"
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
                sx={{
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                  },
                }}
              />

              <GradientButton
                type="submit"
                fullWidth
                disabled={loading}
                sx={{ 
                  mt: 4, 
                  mb: 3,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {loading ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress 
                      size={20} 
                      sx={{ 
                        color: '#000',
                        animation: 'spin 1s linear infinite',
                      }} 
                    />
                    <Typography sx={{ color: '#000', fontWeight: 700 }}>
                      {t('common.loading')}
                    </Typography>
                  </Box>
                ) : (
                  t('auth.loginPage.submit')
                )}
              </GradientButton>
            </form>

            <Box textAlign="center">
              <Typography variant="body2" color="text.secondary">
                {t('auth.loginPage.noAccount')}{' '}
                <Link
                  component={RouterLink}
                  to="/register"
                  sx={{
                    color: 'primary.main',
                    textDecoration: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      textDecoration: 'underline',
                    },
                  }}
                >
                  {t('auth.loginPage.signupLink')}
                </Link>
              </Typography>
              
              <Box sx={{ mt: 3, pt: 3, borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {t('common.or', '또는')}
                </Typography>
                <Button
                  variant="outlined"
                  fullWidth
                  onClick={() => navigate('/dashboard')}
                  sx={{
                    borderColor: 'rgba(255, 255, 255, 0.3)',
                    color: 'text.primary',
                    py: 1.5,
                    borderRadius: 2,
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'rgba(0, 212, 255, 0.05)',
                    },
                  }}
                >
                  {t('auth.loginPage.guestEntry')}
                </Button>
              </Box>
            </Box>
          </StyledPaper>
        </motion.div>
      </Container>
    </GradientBox>
  );
};

export default Login;
