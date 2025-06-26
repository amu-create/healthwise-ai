import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Stack,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Search } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { LocationData } from '../../types/map';

interface LocationDialogProps {
  open: boolean;
  onClose: () => void;
  userLocation: LocationData | null;
  onSetLocationByAddress: (address: string) => void;
}

export const LocationDialog: React.FC<LocationDialogProps> = ({
  open,
  onClose,
  userLocation,
  onSetLocationByAddress
}) => {
  const { t } = useTranslation();
  const [manualAddress, setManualAddress] = useState('');

  const handleSetLocation = () => {
    if (manualAddress) {
      onSetLocationByAddress(manualAddress);
      setManualAddress('');
      onClose();
    }
  };

  const quickLocations = [
    { name: t('pages.map.quickLocations.sillimStation'), address: '신림역' },
    { name: t('pages.map.quickLocations.seoulUnivStation'), address: '서울대입구역' },
    { name: t('pages.map.quickLocations.bongcheonStation'), address: '봉천역' },
  ];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{t('pages.map.locationSettings')}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ pt: 2 }}>
          {/* 주소로 설정 */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('pages.map.setLocationByAddress')}
            </Typography>
            <TextField
              fullWidth
              placeholder={t('pages.map.addressPlaceholder')}
              value={manualAddress}
              onChange={(e) => setManualAddress(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSetLocation()}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={handleSetLocation} disabled={!manualAddress}>
                      <Search />
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
              {t('pages.map.addressExample')}
            </Typography>
          </Box>

          {/* 현재 위치 정보 표시 */}
          {userLocation && (
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                {t('pages.map.currentLocationInfo')}
              </Typography>
              <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                <Typography variant="body2">
                  {t('pages.map.latitude')}: {userLocation.lat.toFixed(6)}
                </Typography>
                <Typography variant="body2">
                  {t('pages.map.longitude')}: {userLocation.lng.toFixed(6)}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('pages.map.accuracy')}: ±{((userLocation.accuracy || 0) / 1000).toFixed(1)}km
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {t('pages.map.source')}: {userLocation.source === 'gps' ? t('pages.map.gps') : 
                        userLocation.source === 'ip' ? t('pages.map.ipEstimate') : 
                        userLocation.source === 'manual' ? t('pages.map.manualSetting') : 
                        t('pages.map.wifiEstimate')}
                </Typography>
              </Box>
            </Box>
          )}

          {/* 빠른 위치 설정 */}
          <Box>
            <Typography variant="subtitle2" gutterBottom>
              {t('pages.map.quickLocationSettings')}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              {quickLocations.map((location) => (
                <Button 
                  key={location.name}
                  size="small" 
                  variant="outlined" 
                  onClick={() => {
                    setManualAddress(location.address);
                    setTimeout(handleSetLocation, 100);
                  }}
                >
                  {location.name}
                </Button>
              ))}
            </Stack>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t('common.cancel')}</Button>
      </DialogActions>
    </Dialog>
  );
};