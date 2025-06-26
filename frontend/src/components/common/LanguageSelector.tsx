import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Select, MenuItem, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import LanguageIcon from '@mui/icons-material/Language';

const StyledSelect = styled(Select)({
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(10px)',
  borderRadius: 30,
  color: '#fff',
  minWidth: 150,
  '& .MuiSelect-select': {
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  },
  '& .MuiOutlinedInput-notchedOutline': {
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    border: '1px solid rgba(255, 255, 255, 0.4)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    border: '2px solid #00FFB3',
  },
});

const LanguageOption = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: 12,
});

interface LanguageSelectorProps {
  variant?: 'default' | 'minimal';
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ variant = 'default' }) => {
  const { i18n } = useTranslation();

  const languages = [
    { code: 'ko', name: '한국어', flag: '🇰🇷' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
  ];

  const handleChange = (event: any) => {
    i18n.changeLanguage(event.target.value);
  };

  if (variant === 'minimal') {
    return (
      <Select
        value={i18n.language}
        onChange={handleChange}
        variant="standard"
        sx={{
          color: '#fff',
          fontSize: '0.9rem',
          '&:before': { display: 'none' },
          '&:after': { display: 'none' },
          '& .MuiSelect-select': {
            paddingRight: '20px !important',
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          },
        }}
      >
        {languages.map((lang) => (
          <MenuItem key={lang.code} value={lang.code}>
            <LanguageOption>
              <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
              <Typography variant="body2">{lang.name}</Typography>
            </LanguageOption>
          </MenuItem>
        ))}
      </Select>
    );
  }

  return (
    <StyledSelect
      value={i18n.language}
      onChange={handleChange}
      startAdornment={<LanguageIcon sx={{ fontSize: 20 }} />}
      renderValue={(value) => {
        const lang = languages.find(l => l.code === value);
        return lang ? (
          <Box display="flex" alignItems="center" gap={1}>
            <span style={{ fontSize: '1.2rem' }}>{lang.flag}</span>
            <span>{lang.name}</span>
          </Box>
        ) : (value as string);
      }}
      MenuProps={{
        PaperProps: {
          sx: {
            background: 'rgba(20, 20, 20, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            mt: 1,
            '& .MuiMenuItem-root': {
              color: '#fff',
              '&:hover': {
                background: 'rgba(255, 255, 255, 0.1)',
              },
              '&.Mui-selected': {
                background: 'rgba(0, 255, 179, 0.2)',
                '&:hover': {
                  background: 'rgba(0, 255, 179, 0.3)',
                },
              },
            },
          },
        },
      }}
    >
      {languages.map((lang) => (
        <MenuItem key={lang.code} value={lang.code}>
          <LanguageOption>
            <span style={{ fontSize: '1.4rem' }}>{lang.flag}</span>
            <Typography>{lang.name}</Typography>
          </LanguageOption>
        </MenuItem>
      ))}
    </StyledSelect>
  );
};

export default LanguageSelector;
