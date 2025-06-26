import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Container,
  Button,
  IconButton,
  Stepper,
  Step,
  StepLabel,
  Alert,
  CircularProgress,
  Chip,
  Tooltip
} from '@mui/material';
import {
  FitnessCenter,
  Camera,
  Analytics,
  Info,
  ArrowBack,
  CheckCircle,
  Warning,
  Close
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const PoseAnalysisIntro = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchExercises();
  }, []);

  const fetchExercises = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get('/api/pose-analysis/exercises/', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      setExercises(response.data.results || []);
    } catch (error) {
      console.error('Failed to fetch exercises:', error);
      setError(t('pose_analysis.error_loading_exercises'));
    } finally {
      setLoading(false);
    }
  };

  const steps = [
    t('pose_analysis.step_select_exercise'),
    t('pose_analysis.step_camera_setup'),
    t('pose_analysis.step_perform_exercise'),
    t('pose_analysis.step_view_results')
  ];

  const features = [
    {
      icon: <Camera sx={{ fontSize: 40 }} />,
      title: t('pose_analysis.feature_realtime'),
      description: t('pose_analysis.feature_realtime_desc')
    },
    {
      icon: <Analytics sx={{ fontSize: 40 }} />,
      title: t('pose_analysis.feature_detailed'),
      description: t('pose_analysis.feature_detailed_desc')
    },
    {
      icon: <CheckCircle sx={{ fontSize: 40 }} />,
      title: t('pose_analysis.feature_improvement'),
      description: t('pose_analysis.feature_improvement_desc')
    }
  ];

  const handleExerciseSelect = (exerciseId) => {
    navigate(`/pose-analysis/exercise/${exerciseId}`);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate('/exercise')}
          sx={{ mb: 2 }}
        >
          {t('common.back')}
        </Button>
        
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          {t('pose_analysis.title')}
        </Typography>
        
        <Typography variant="subtitle1" color="text.secondary">
          {t('pose_analysis.subtitle')}
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Features */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
          {t('pose_analysis.features_title')}
        </Typography>
        
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
            gap: 3 
          }}
        >
          {features.map((feature, index) => (
            <Paper
              key={index}
              sx={{
                p: 3,
                textAlign: 'center',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3
                }
              }}
            >
              <Box sx={{ color: 'primary.main', mb: 2 }}>
                {feature.icon}
              </Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {feature.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {feature.description}
              </Typography>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Process Steps */}
      <Box sx={{ mb: 5 }}>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
          {t('pose_analysis.how_it_works')}
        </Typography>
        
        <Stepper alternativeLabel>
          {steps.map((label, index) => (
            <Step key={index} completed={false}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
      </Box>

      {/* Exercise Selection */}
      <Box>
        <Typography variant="h5" fontWeight="bold" sx={{ mb: 3 }}>
          {t('pose_analysis.select_exercise')}
        </Typography>
        
        <Box 
          sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
            gap: 3 
          }}
        >
          {exercises.map((exercise) => (
            <Paper
              key={exercise.id}
              sx={{
                p: 3,
                cursor: 'pointer',
                transition: 'all 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 3,
                  borderColor: 'primary.main'
                },
                border: '1px solid',
                borderColor: 'divider'
              }}
              onClick={() => handleExerciseSelect(exercise.id)}
            >
              <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
                <FitnessCenter color="primary" />
                <Chip 
                  label={exercise.difficulty}
                  size="small"
                  color={
                    exercise.difficulty === 'beginner' ? 'success' :
                    exercise.difficulty === 'intermediate' ? 'warning' : 'error'
                  }
                />
              </Box>
              
              <Typography variant="h6" fontWeight="bold" gutterBottom>
                {exercise.name}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {exercise.description}
              </Typography>
              
              <Box display="flex" gap={1} flexWrap="wrap">
                <Chip label={exercise.category} size="small" variant="outlined" />
                {exercise.target_muscles?.map((muscle, idx) => (
                  <Chip key={idx} label={muscle} size="small" variant="outlined" />
                ))}
              </Box>
            </Paper>
          ))}
        </Box>
      </Box>

      {/* Info Box */}
      <Paper sx={{ p: 3, mt: 4, bgcolor: 'info.lighter' }}>
        <Box display="flex" alignItems="flex-start" gap={2}>
          <Info color="info" />
          <Box flex={1}>
            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
              {t('pose_analysis.tips_title')}
            </Typography>
            <Typography variant="body2">
              {t('pose_analysis.tips_content')}
            </Typography>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default PoseAnalysisIntro;
