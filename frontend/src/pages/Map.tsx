import React, { useState, useEffect, useCallback } from 'react';
import { Box, Paper, CircularProgress, Alert, Divider, Fab, IconButton } from '@mui/material';
import { MyLocation, Menu as MenuIcon, Close } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import { usePageTitle, useDebounce } from '../hooks';
import { favoritesStorage, locationHistory } from '../utils/map';

// Types
import { PlaceResult, LocationData, LocationType } from '../types/map';

// Hooks
import { useMapInit } from '../hooks/map/useMapInit';
import { useLocation } from '../hooks/map/useLocation';
import { useSearch } from '../hooks/map/useSearch';
import { useMarkers } from '../hooks/map/useMarkers';

// Components
import { MapSidebar } from '../components/map/MapSidebar';
import { PlaceList } from '../components/map/PlaceList';
import { LocationDialog } from '../components/map/LocationDialog';

const Map: React.FC = () => {
  const { t } = useTranslation();
  usePageTitle(t('pages.map.title'));
  
  // 상태 관리
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [search, setSearch] = useState('');
  const [locationType, setLocationType] = useState<LocationType>(t('pages.map.fitness') as LocationType);
  const [radius, setRadius] = useState(2); // km
  const [favorites, setFavorites] = useState<Set<string>>(favoritesStorage.getFavorites());
  const [shouldSearch, setShouldSearch] = useState(false);
  const [locationDialog, setLocationDialog] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const debouncedSearch = useDebounce(search, 500);

  // 맵 초기화
  const { refs, mapLoaded, error: mapError } = useMapInit();

  // 위치 관리
  const {
    userLocation,
    loading: locationLoading,
    error: locationError,
    getCurrentLocation,
    setLocationByAddress,
    setLocationOnMap
  } = useLocation({
    mapInstanceRef: refs.mapInstanceRef,
    currentLocationMarkerRef: refs.currentLocationMarkerRef,
    currentLocationOverlayRef: refs.currentLocationOverlayRef,
    onLocationSet: () => setShouldSearch(true)
  });

  // 검색 기능
  const {
    places,
    loading: searchLoading,
    error: searchError,
    searchPlacesByCategory,
    searchPlacesByKeyword
  } = useSearch({
    mapInstanceRef: refs.mapInstanceRef,
    placesServiceRef: refs.placesServiceRef
  });

  // 마커 관리
  const { displayPlaces, showPlaceOverlay, moveToPlace } = useMarkers({
    mapInstanceRef: refs.mapInstanceRef,
    markersRef: refs.markersRef,
    clustererRef: refs.clustererRef,
    customOverlayRef: refs.customOverlayRef,
    onPlaceClick: setSelectedPlace
  });

  // 맵 로드 시 초기 위치 설정 (한 번만 실행)
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    if (mapLoaded && !isInitialized) {
      const initialLocation: LocationData = {
        lat: 37.4841, // 신림역
        lng: 126.9294, // 신림역
        accuracy: 5000,
        source: 'ip'
      };
      
      setLocationOnMap(initialLocation, 'Sillim Station');
      setIsInitialized(true);
      locationHistory.addHistory(initialLocation, 'Initial location', 'mapInit');
    }
  }, [mapLoaded, isInitialized, setLocationOnMap]);

  // shouldSearch가 true가 되면 검색 실행
  useEffect(() => {
    if (shouldSearch && mapLoaded) {
      searchPlacesByCategory(locationType, radius);
      setShouldSearch(false);
    }
  }, [shouldSearch, mapLoaded, locationType, radius, searchPlacesByCategory]);

  // 장소 유형 또는 반경 변경 시 검색
  useEffect(() => {
    if (mapLoaded) {
      if (debouncedSearch) {
        searchPlacesByKeyword(debouncedSearch);
      } else if (userLocation || refs.mapInstanceRef.current) {
        searchPlacesByCategory(locationType, radius);
      }
    }
  }, [locationType, radius, mapLoaded, debouncedSearch, userLocation, searchPlacesByCategory, searchPlacesByKeyword]);

  // 장소가 검색되면 마커 표시
  useEffect(() => {
    if (places.length > 0) {
      displayPlaces(places, radius, locationType);
    }
  }, [places, radius, locationType, displayPlaces]);

  // 지도 클릭 시 오버레이 닫기
  useEffect(() => {
    if (!refs.mapInstanceRef.current) return;
    
    const handleMapClick = () => {
      if (refs.customOverlayRef.current) {
        refs.customOverlayRef.current.setMap(null);
        refs.customOverlayRef.current = null;
      }
    };
    
    window.kakao?.maps.event.addListener(refs.mapInstanceRef.current, 'click', handleMapClick);
    
    return () => {
      window.kakao?.maps.event.removeListener(refs.mapInstanceRef.current, 'click', handleMapClick);
    };
  }, [mapLoaded, refs]);

  // 즐겨찾기 토글
  const toggleFavorite = useCallback((placeId: string) => {
    const newFavorites = favoritesStorage.toggleFavorite(placeId);
    setFavorites(newFavorites);
  }, []);

  // 장소 클릭 핸들러
  const handlePlaceClick = useCallback((place: PlaceResult) => {
    setSelectedPlace(place);
    moveToPlace(place);
    showPlaceOverlay(place, locationType);
  }, [moveToPlace, showPlaceOverlay, locationType]);

  // 디버깅 명령어 추가
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).mapDebug = {
        showLocationHistory: () => locationHistory.printRecentHistory(),
        clearLocationHistory: () => locationHistory.clearHistory(),
        getCurrentLocation: () => getCurrentLocation(),
        getMapCenter: () => {
          if (refs.mapInstanceRef.current) {
            const center = refs.mapInstanceRef.current.getCenter();
            console.log('[MapDebug] Current center:', {
              lat: center.getLat(),
              lng: center.getLng()
            });
            return { lat: center.getLat(), lng: center.getLng() };
          }
          return null;
        },
        getZoomLevel: () => {
          if (refs.mapInstanceRef.current) {
            const level = refs.mapInstanceRef.current.getLevel();
            console.log('[MapDebug] Current zoom level:', level);
            return level;
          }
          return null;
        }
      };
      console.log('[MapDebug] Debug commands available: window.mapDebug');
    }
  }, [getCurrentLocation, refs]);

  const loading = locationLoading || searchLoading;
  const error = mapError || locationError || searchError;
  
  return (
    <Box display="flex" height="calc(100vh - 64px)" position="relative">
      {/* 왼쪽 패널 */}
      <Paper
        sx={{
          width: sidebarOpen ? 350 : 0,
          transition: 'width 0.3s ease',
          p: sidebarOpen ? 2 : 0,
          overflow: 'auto',
          borderRadius: 0,
          boxShadow: 3,
          zIndex: 1,
        }}
      >
        {sidebarOpen && (
          <>
            <MapSidebar
              search={search}
              onSearchChange={setSearch}
              locationType={locationType}
              onLocationTypeChange={setLocationType}
              radius={radius}
              onRadiusChange={setRadius}
              userLocation={userLocation}
              onGetCurrentLocation={getCurrentLocation}
              onOpenLocationDialog={() => setLocationDialog(true)}
              loading={loading}
            />
            
            <Divider sx={{ mb: 2 }} />
            
            {/* 로딩 상태 */}
            {loading && (
              <Box display="flex" justifyContent="center" py={4}>
                <CircularProgress />
              </Box>
            )}
            
            {/* 에러 메시지 */}
            {error && (
              <Alert severity="warning" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {/* 장소 목록 */}
            {!loading && !error && (
              <PlaceList
                places={places}
                selectedPlace={selectedPlace}
                favorites={favorites}
                onPlaceClick={handlePlaceClick}
                onToggleFavorite={toggleFavorite}
              />
            )}
          </>
        )}
      </Paper>
      
      {/* 오른쪽 지도 */}
      <Box flex={1} position="relative">
        <Box 
          ref={refs.mapRef} 
          sx={{
            width: '100%',
            height: '100%',
          }}
        />
        
        {/* 사이드바 토글 버튼 */}
        <IconButton
          onClick={() => setSidebarOpen(!sidebarOpen)}
          sx={{
            position: 'absolute',
            top: 10,
            left: 10,
            bgcolor: 'background.paper',
            boxShadow: 2,
            '&:hover': {
              bgcolor: 'background.paper',
              transform: 'scale(1.05)',
            },
            zIndex: 2,
          }}
        >
          {sidebarOpen ? <Close /> : <MenuIcon />}
        </IconButton>
        
        {/* 내 위치 버튼 */}
        <Fab
          color="primary"
          size="small"
          onClick={getCurrentLocation}
          disabled={loading}
          sx={{
            position: 'absolute',
            top: 10,
            right: 10,
            zIndex: 2,
          }}
        >
          <MyLocation />
        </Fab>
      </Box>
      
      {/* 위치 설정 다이얼로그 */}
      <LocationDialog
        open={locationDialog}
        onClose={() => setLocationDialog(false)}
        userLocation={userLocation}
        onSetLocationByAddress={setLocationByAddress}
      />
    </Box>
  );
};

export default Map;