import React from 'react';
import { Box, Typography } from '@mui/material';

const HealthCheck: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" fontWeight={900} mb={4}>
        건강 체크
      </Typography>
      <Typography color="text.secondary">
        건강 체크 기능이 여기에 표시됩니다.
      </Typography>
    </Box>
  );
};

export default HealthCheck;
