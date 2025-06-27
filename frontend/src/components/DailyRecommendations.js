import React, { useState, useEffect } from 'react';
import { Card, CardContent, Typography, Box, Chip, CircularProgress, Alert } from '@mui/material';
import { LocalFireDepartment, Restaurant } from '@mui/icons-material';
import api from '../services/api';

const DailyRecommendations = () => {
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const response = await api.get('/recommendations/daily/');
      setRecommendations(response.data.recommendations);
    } catch (err) {
      setError('추천을 불러올 수 없습니다.');
      console.error('추천 로드 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!recommendations || (!recommendations.workout && !recommendations.diet)) {
    return (
      <Alert severity="info">
        오늘의 추천이 아직 생성되지 않았습니다. 챗봇과 대화를 시작해보세요!
      </Alert>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {recommendations.workout && (
        <Card sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white'
        }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <LocalFireDepartment sx={{ mr: 1 }} />
              <Typography variant="h6">오늘의 운동 추천</Typography>
            </Box>
            
            <Typography variant="h5" gutterBottom>
              {recommendations.workout.title}
            </Typography>
            
            <Typography variant="body1" paragraph>
              {recommendations.workout.description}
            </Typography>
            
            {recommendations.workout.details && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom>
                  운동 상세:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {recommendations.workout.details.duration && (
                    <Chip 
                      label={`시간: ${recommendations.workout.details.duration}`} 
                      size="small" 
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
                    />
                  )}
                  {recommendations.workout.details.intensity && (
                    <Chip 
                      label={`강도: ${recommendations.workout.details.intensity}`} 
                      size="small" 
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
                    />
                  )}
                </Box>
                {recommendations.workout.details.exercises && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      추천 운동:
                    </Typography>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {recommendations.workout.details.exercises.map((exercise, index) => (
                        <li key={index}>
                          <Typography variant="body2">{exercise}</Typography>
                        </li>
                      ))}
                    </ul>
                  </Box>
                )}
              </Box>
            )}
            
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                추천 이유: {recommendations.workout.reasoning}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {recommendations.diet && (
        <Card sx={{ 
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white'
        }}>
          <CardContent>
            <Box display="flex" alignItems="center" mb={2}>
              <Restaurant sx={{ mr: 1 }} />
              <Typography variant="h6">오늘의 식단 추천</Typography>
            </Box>
            
            <Typography variant="h5" gutterBottom>
              {recommendations.diet.title}
            </Typography>
            
            <Typography variant="body1" paragraph>
              {recommendations.diet.description}
            </Typography>
            
            {recommendations.diet.details && (
              <Box sx={{ mt: 2 }}>
                {Object.entries(recommendations.diet.details).map(([meal, foods]) => (
                  <Box key={meal} sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {meal === 'breakfast' ? '아침' :
                       meal === 'lunch' ? '점심' :
                       meal === 'dinner' ? '저녁' : '간식'}:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {foods.map((food, index) => (
                        <Chip 
                          key={index}
                          label={food} 
                          size="small" 
                          sx={{ bgcolor: 'rgba(255,255,255,0.2)' }}
                        />
                      ))}
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
            
            <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid rgba(255,255,255,0.2)' }}>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                추천 이유: {recommendations.diet.reasoning}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};

export default DailyRecommendations;
