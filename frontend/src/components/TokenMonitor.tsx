import React, { useState, useEffect } from 'react';
import {
  Box,
  LinearProgress,
  Typography,
  Chip,
  Alert,
  Tooltip,
} from '@mui/material';
import { Warning, Info } from '@mui/icons-material';
import api from '../services/api';

interface TokenUsage {
  session_id: number;
  estimated_tokens: number;
  max_tokens: number;
  usage_percentage: number;
  warning: boolean;
  message: string | null;
}

interface TokenMonitorProps {
  sessionId: number | null;
  onTokenWarning?: () => void;
}

const TokenMonitor: React.FC<TokenMonitorProps> = ({ sessionId, onTokenWarning }) => {
  const [tokenUsage, setTokenUsage] = useState<TokenUsage | null>(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (sessionId) {
      checkTokenUsage();
      // 주기적으로 토큰 사용량 체크 (5분마다)
      const interval = setInterval(checkTokenUsage, 5 * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [sessionId]);

  const checkTokenUsage = async () => {
    if (!sessionId) return;

    try {
      setChecking(true);
      const response = await api.post('/chatbot/sessions/check-tokens/', {
        session_id: sessionId,
      });
      setTokenUsage(response.data);

      // 경고 상태일 때 콜백 호출
      if (response.data.warning && onTokenWarning) {
        onTokenWarning();
      }
    } catch (error) {
      console.error('Failed to check token usage:', error);
    } finally {
      setChecking(false);
    }
  };

  if (!tokenUsage || !sessionId) return null;

  const getProgressColor = () => {
    if (tokenUsage.usage_percentage >= 90) return 'error';
    if (tokenUsage.usage_percentage >= 70) return 'warning';
    if (tokenUsage.usage_percentage >= 50) return 'primary';
    return 'success';
  };

  return (
    <Box sx={{ width: '100%', mb: 2 }}>
      {tokenUsage.warning && (
        <Alert
          severity="warning"
          icon={<Warning />}
          sx={{ mb: 2 }}
        >
          {tokenUsage.message}
        </Alert>
      )}

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          토큰 사용량
        </Typography>
        <Tooltip title="대화가 길어질수록 토큰을 더 많이 사용합니다. 70% 이상 사용 시 새 대화를 시작하는 것을 권장합니다.">
          <Info fontSize="small" sx={{ opacity: 0.7, cursor: 'help' }} />
        </Tooltip>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Box sx={{ flex: 1 }}>
          <LinearProgress
            variant="determinate"
            value={tokenUsage.usage_percentage}
            color={getProgressColor()}
            sx={{
              height: 8,
              borderRadius: 4,
              bgcolor: 'rgba(255, 255, 255, 0.1)',
            }}
          />
        </Box>
        <Chip
          label={`${tokenUsage.usage_percentage.toFixed(1)}%`}
          size="small"
          color={getProgressColor()}
          variant="outlined"
        />
      </Box>

      <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
        {tokenUsage.estimated_tokens.toLocaleString()} / {tokenUsage.max_tokens.toLocaleString()} 토큰
      </Typography>
    </Box>
  );
};

export default TokenMonitor;
