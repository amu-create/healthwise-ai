import React from 'react';
import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

const MusicRecommendation: React.FC = () => {
  const { t } = useTranslation();
  
  return (
    <Box>
      <Typography variant="h4" fontWeight={900} mb={4}>
        {t('pages.music.title')}
      </Typography>
      <Typography color="text.secondary">
        {t('pages.music.placeholder')}
      </Typography>
    </Box>
  );
};

export default MusicRecommendation;
