import React from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import { Favorite, FavoriteBorder } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { PlaceResult } from '../../types/map';

interface PlaceListProps {
  places: PlaceResult[];
  selectedPlace: PlaceResult | null;
  favorites: Set<string>;
  onPlaceClick: (place: PlaceResult) => void;
  onToggleFavorite: (placeId: string) => void;
}

export const PlaceList: React.FC<PlaceListProps> = ({
  places,
  selectedPlace,
  favorites,
  onPlaceClick,
  onToggleFavorite
}) => {
  const { t } = useTranslation();
  if (places.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="body1" color="text.secondary">
          {t('pages.map.noResults')}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={1}>
          {t('pages.map.tryDifferentSearch')}
        </Typography>
      </Box>
    );
  }

  return (
    <List>
      {places.map((place, index) => (
        <React.Fragment key={place.id}>
          {index > 0 && <Divider />}
          <ListItem
            onClick={() => onPlaceClick(place)}
            sx={{
              cursor: 'pointer',
              backgroundColor: selectedPlace?.id === place.id ? 'action.selected' : 'transparent',
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <ListItemText
              primary={
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {place.place_name}
                  </Typography>
                </Box>
              }
              secondary={
                <>
                  <Typography variant="body2" color="text.secondary" component="span">
                    {place.address_name}
                  </Typography>
                  {place.phone && (
                    <Typography variant="body2" color="text.secondary" component="span" display="block">
                      📞 {place.phone}
                    </Typography>
                  )}
                  {(place.calculatedDistance || place.distance) && (
                    <Typography variant="caption" color="primary" component="span" display="block">
                      {place.calculatedDistance 
                        ? (place.calculatedDistance / 1000).toFixed(1) 
                        : (parseInt(place.distance!) / 1000).toFixed(1)
                      }km
                    </Typography>
                  )}
                </>
              }
            />
            <ListItemSecondaryAction>
              <IconButton
                edge="end"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleFavorite(place.id);
                }}
              >
                {favorites.has(place.id) ? (
                  <Favorite color="error" />
                ) : (
                  <FavoriteBorder />
                )}
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        </React.Fragment>
      ))}
    </List>
  );
};