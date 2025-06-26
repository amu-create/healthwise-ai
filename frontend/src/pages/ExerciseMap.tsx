import React from 'react';
import { Box, Typography } from '@mui/material';

const ExerciseMap: React.FC = () => {
  return (
    <Box>
      <Typography variant="h4" fontWeight={900} mb={4}>
        운동 장소 지도
      </Typography>
      <Typography color="text.secondary">
        카카오맵이 여기에 표시됩니다.
      </Typography>
    </Box>
  );
};

export default ExerciseMap;
