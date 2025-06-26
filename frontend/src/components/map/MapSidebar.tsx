import React from 'react';
import {
  Box,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Slider,
  Button,
  Stack,
  Chip,
} from '@mui/material';
import { Search, MyLocation, LocationOn } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { LocationType, LocationData } from '../../types/map';
import { getAccuracyColor } from '../../utils/map/locationUtils';
import {
  GpsFixed,
  WifiTethering,
  NetworkCheck,
} from '@mui/icons-material';

interface MapSidebarProps {
  search: string;
  onSearchChange: (value: string) => void;
  locationType: LocationType;
  onLocationTypeChange: (value: LocationType) => void;
  radius: number;
  onRadiusChange: (value: number) => void;
  userLocation: LocationData | null;
  onGetCurrentLocation: () => void;
  onOpenLocationDialog: () => void;
  loading: boolean;
}

const getLocationIcon = (source?: string) => {
  switch (source) {
    case 'gps': return <GpsFixed />;
    case 'wifi': return <WifiTethering />;
    case 'ip': return <NetworkCheck />;
    case 'manual': return <LocationOn />;
    default: return <MyLocation />;
  }
};

export const MapSidebar: React.FC<MapSidebarProps> = ({
  search,
  onSearchChange,
  locationType,
  onLocationTypeChange,
  radius,
  onRadiusChange,
  userLocation,
  onGetCurrentLocation,
  onOpenLocationDialog,
  loading
}) => {
  const { t } = useTranslation();
  return (
    <Box>
      <Typography variant="h5" fontWeight={700} mb={3}>
        {t('pages.map.title')}
      </Typography>
      
      {/* 검색 및 필터 */}
      <Box mb={3}>
        <TextField
          fullWidth
          placeholder={t('pages.map.searchPlaceholder')}
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          InputProps={{
            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          sx={{ mb: 2 }}
        />
        
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>{t('pages.map.exerciseType')}</InputLabel>
          <Select
            value={locationType}
            onChange={(e) => onLocationTypeChange(e.target.value as LocationType)}
            label={t('pages.map.exerciseType')}
          >
            <MenuItem value="fitness">{t('pages.map.fitness')}</MenuItem>
            <MenuItem value="yoga">{t('pages.map.yoga')}</MenuItem>
            <MenuItem value="pilates">{t('pages.map.pilates')}</MenuItem>
            <MenuItem value="crossfit">{t('pages.map.crossfit')}</MenuItem>
            <MenuItem value="swimming">{t('pages.map.swimming')}</MenuItem>
            <MenuItem value="martialArts">{t('pages.map.martialArts')}</MenuItem>
            <MenuItem value="danceAcademy">{t('pages.map.danceAcademy')}</MenuItem>
            <MenuItem value="other">{t('pages.map.other')}</MenuItem>
          </Select>
        </FormControl>
        
        <Box>
          <Typography variant="body2" gutterBottom>
            {t('pages.map.searchRadius')}: {radius}km
          </Typography>
          <Slider
            value={radius}
            onChange={(_, value) => onRadiusChange(value as number)}
            min={0.5}
            max={5}
            step={0.5}
            marks
            valueLabelDisplay="auto"
          />
        </Box>
        
        {/* 위치 상태 표시 */}
        {userLocation && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box color={getAccuracyColor(userLocation.source)}>
                {getLocationIcon(userLocation.source)}
              </Box>
              <Typography variant="body2">
                {userLocation.source === 'gps' && t('pages.map.locationStatus.gps')}
                {userLocation.source === 'wifi' && t('pages.map.locationStatus.wifi')}
                {userLocation.source === 'ip' && t('pages.map.locationStatus.ip')}
                {userLocation.source === 'manual' && t('pages.map.locationStatus.manual')}
              </Typography>
              {userLocation.accuracy && (
                <Chip 
                  size="small" 
                  label={`±${(userLocation.accuracy/1000).toFixed(1)}km`}
                  sx={{ height: 20 }}
                />
              )}
            </Stack>
          </Box>
        )}
        
        <Button
          fullWidth
          variant="contained"
          startIcon={<MyLocation />}
          onClick={onGetCurrentLocation}
          sx={{ mb: 1 }}
          disabled={loading}
        >
          {loading ? t('pages.map.locating') : t('pages.map.searchNearby')}
        </Button>
        
        <Button
          fullWidth
          variant="outlined"
          startIcon={<LocationOn />}
          onClick={onOpenLocationDialog}
          sx={{ mb: 1 }}
        >
          {t('pages.map.locationSettings')}
        </Button>
      </Box>
    </Box>
  );
};