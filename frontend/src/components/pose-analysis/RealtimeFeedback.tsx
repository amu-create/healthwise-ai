import React from 'react';
import {
  Box,
  Paper,
  Typography,
  LinearProgress,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText
} from '@mui/material';
import {
  FitnessCenter,
  Timer,
  Speed,
  CheckCircle,
  Warning,
  Error,
  PauseCircle
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

interface RealtimeFeedbackProps {
  analysisResult: any;
  repCount: number;
  duration: number;
  isPaused?: boolean;
}

const RealtimeFeedback: React.FC<RealtimeFeedbackProps> = ({
  analysisResult,
  repCount,
  duration,
  isPaused = false
}) => {
  const { t } = useTranslation();

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'success';
    if (score >= 60) return 'warning';
    return 'error';
  };

  const getScoreIcon = (score: number) => {
    if (score >= 80) return <CheckCircle />;
    if (score >= 60) return <Warning />;
    return <Error />;
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 10,
        left: 10,
        right: 10,
        pointerEvents: 'none'
      }}
    >
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        {/* 점수 표시 */}
        <Box sx={{ flex: '1 1 250px', minWidth: 0 }}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              bgcolor: 'background.paper',
              opacity: 0.9
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Speed color={getScoreColor(analysisResult.overallScore) as any} />
              <Typography variant="h6">
                {t('pose_analysis.score')}
              </Typography>
            </Box>
            <Typography variant="h3" color={getScoreColor(analysisResult.overallScore)}>
              {Math.round(analysisResult.overallScore)}
            </Typography>
            <LinearProgress
              variant="determinate"
              value={analysisResult.overallScore}
              color={getScoreColor(analysisResult.overallScore) as any}
              sx={{ mt: 1 }}
            />
          </Paper>
        </Box>

        {/* 운동 시간만 표시 (반복 횟수 숨김) */}
        <Box sx={{ flex: '1 1 250px', minWidth: 0 }}>
          <Paper
            elevation={3}
            sx={{
              p: 2,
              bgcolor: 'background.paper',
              opacity: 0.9
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {isPaused ? (
                <PauseCircle color="warning" />
              ) : (
                <Timer color="secondary" />
              )}
              <Typography variant="h6">
                {t('pose_analysis.duration')}
              </Typography>
            </Box>
            <Typography variant="h3" color={isPaused ? "warning" : "secondary"}>
              {formatTime(duration)}
            </Typography>
            {isPaused && (
              <Typography variant="caption" color="warning">
                {t('pose_analysis.paused')}
              </Typography>
            )}
          </Paper>
        </Box>
      </Box>

      {/* 피드백 메시지 */}
      {analysisResult.feedback && analysisResult.feedback.length > 0 && (
        <Paper
          elevation={3}
          sx={{
            mt: 2,
            p: 2,
            bgcolor: 'background.paper',
            opacity: 0.9,
            maxWidth: 500
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            {t('pose_analysis.feedback')}:
          </Typography>
          <List dense>
            {analysisResult.feedback.slice(0, 3).map((feedback: string, idx: number) => (
              <ListItem key={idx}>
                <ListItemIcon>
                  {getScoreIcon(analysisResult.overallScore)}
                </ListItemIcon>
                <ListItemText primary={feedback} />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}

      {/* 자세 상태 */}
      <Box sx={{ position: 'absolute', bottom: 10, right: 10 }}>
        <Chip
          label={
            analysisResult.isInPosition
              ? t('pose_analysis.correct_position')
              : t('pose_analysis.adjust_position')
          }
          color={analysisResult.isInPosition ? 'success' : 'warning'}
          size="medium"
          sx={{ pointerEvents: 'auto' }}
        />
      </Box>
    </Box>
  );
};

export default RealtimeFeedback;
