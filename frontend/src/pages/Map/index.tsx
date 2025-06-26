import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  Card,
  CardContent,
  IconButton,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  LocationOn,
  DirectionsRun,
  Pool,
  FitnessCenter,
  Park,
  Directions,
  AccessTime,
  Star,
  Navigation,
} from '@mui/icons-material';
import { useTranslation } from 'react-i18next';
import api from '../../services/api';

declare global {
  interface Window {
    kakao: any;
  }
}

interface ExercisePlace {
  id: string;
  place_name: string;
  category_name: string;
  address_name: string;
  road_address_name: string;
  distance: string;
  x: string; // longitude
  y: string; // latitude
  phone?: string;
  place_url?: string;
}

const ExerciseMap: React.FC = () => {
  const { t } = useTranslation();
  const mapContainer = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [exerciseType, setExerciseType] = useState('fitness');
  const [searchRadius, setSearchRadius] = useState('2000'); // 2km로 기본값 변경
  const [places, setPlaces] = useState<ExercisePlace[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<ExercisePlace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);

  // 카카오맵 스크립트 로드
  useEffect(() => {
    const script = document.createElement('script');
    script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=3ea46ac465e9b3c9306c90ba3b3f2c5b&libraries=services&autoload=false`;
    script.async = true;
    
    script.onload = () => {
      window.kakao.maps.load(() => {
        initializeMap();
      });
    };

    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  // 지도와 현재 위치가 설정되면 자동으로 검색
  useEffect(() => {
    if (map && currentPosition) {
      searchPlaces();
    }
  }, [map, currentPosition]); // eslint-disable-line react-hooks/exhaustive-deps

  // 카카오맵 스타일 설정
  const mapStyles = [
    {
      width: '100%',
      height: '100%',
      minHeight: '600px',
    },
  ];

  const initializeMap = () => {
    if (!mapContainer.current) return;

    // 기본 위치 (신림역)
    const defaultPosition = new window.kakao.maps.LatLng(37.4841, 126.9294);
    
    const options = {
      center: defaultPosition,
      level: 4, // 약간 더 넓은 범위
      draggable: true,
      scrollwheel: true,
      disableDoubleClickZoom: false,
    };

    const kakaoMap = new window.kakao.maps.Map(mapContainer.current, options);
    
    // 지도 타입 컨트롤 추가
    const mapTypeControl = new window.kakao.maps.MapTypeControl();
    kakaoMap.addControl(mapTypeControl, window.kakao.maps.ControlPosition.TOPRIGHT);
    
    // 줌 컨트롤 추가
    const zoomControl = new window.kakao.maps.ZoomControl();
    kakaoMap.addControl(zoomControl, window.kakao.maps.ControlPosition.RIGHT);
    
    setMap(kakaoMap);

    // 현재 위치 가져오기
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const locPosition = new window.kakao.maps.LatLng(lat, lng);
          
          setCurrentPosition({ lat, lng });
          
          // 현재 위치로 지도 이동
          kakaoMap.setCenter(locPosition);
          
          // 현재 위치 마커 표시 (다른 스타일로)
          const markerImage = new window.kakao.maps.MarkerImage(
            'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
            new window.kakao.maps.Size(24, 35)
          );
          
          const marker = new window.kakao.maps.Marker({
            map: kakaoMap,
            position: locPosition,
            image: markerImage,
          });

          const customOverlay = new window.kakao.maps.CustomOverlay({
            position: locPosition,
            content: '<div style="padding:5px 10px;background:#4285f4;color:white;border-radius:15px;font-size:12px;">현재 위치</div>',
            yAnchor: 2.5,
          });

          customOverlay.setMap(kakaoMap);
        },
        (error) => {
          console.error('위치 정보를 가져올 수 없습니다:', error);
          setError('위치 정보를 가져올 수 없습니다. 기본 위치를 사용합니다.');
          // 기본 위치에서도 검색 실행
          setTimeout(() => {
            searchPlaces();
          }, 500);
        }
      );
    }
  };

  // 기존 마커 제거
  const clearMarkers = () => {
    markers.forEach(marker => {
      if (marker.setMap) {
        marker.setMap(null);
      }
    });
    setMarkers([]);
  };

  const searchPlaces = async () => {
    if (!map || !window.kakao) return;

    setLoading(true);
    setError(null);

    // 기존 마커 제거
    clearMarkers();

    const ps = new window.kakao.maps.services.Places(map);

    const searchOptions = {
      location: map.getCenter(),
      radius: parseInt(searchRadius),
      sort: window.kakao.maps.services.SortBy.DISTANCE,
    };

    console.log('검색 옵션:', {
      center: map.getCenter().toString(),
      radius: searchRadius,
      type: exerciseType
    });

    // 운동 종류에 따른 검색
    if (exerciseType === 'running') {
      // 달리기/조깅 장소는 여러 키워드로 검색
      const runningKeywords = ['한강공원', '청계천', '호수공원', '산책로', '둘레길', '하천', '수변공원'];
      const allResults: any[] = [];
      
      let completedSearches = 0;
      
      for (const runKeyword of runningKeywords) {
        ps.keywordSearch(runKeyword, (data: any, status: any) => {
          if (status === window.kakao.maps.services.Status.OK) {
            allResults.push(...data);
          }
          
          completedSearches++;
          
          if (completedSearches === runningKeywords.length) {
            // 중복 제거 및 거리순 정렬
            const uniqueResults = Array.from(new Map(allResults.map(item => [item.id, item])).values());
            uniqueResults.sort((a, b) => parseInt(a.distance) - parseInt(b.distance));
            
            const filteredResults = uniqueResults.filter(place => 
              parseInt(place.distance) <= parseInt(searchRadius)
            );
            
            setPlaces(filteredResults.slice(0, 20)); // 상위 20개만 표시
            displayPlaces(filteredResults.slice(0, 20));
            setLoading(false);
          }
        }, searchOptions);
      }
    } else {
      // 일반 검색
      const keyword = exerciseType === 'fitness' ? '헬스장' :
                     exerciseType === 'yoga' ? '요가' :
                     exerciseType === 'swimming' ? '수영장' :
                     exerciseType === 'park' ? '공원' :
                     '운동';

      ps.keywordSearch(keyword, (data: any, status: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          // 반경 내 결과만 필터링
          const filteredData = data.filter((place: any) => {
            const distance = parseInt(place.distance);
            return distance <= parseInt(searchRadius);
          });
          
          console.log(`전체 결과: ${data.length}개, 반경 ${searchRadius}m 내 결과: ${filteredData.length}개`);
          
          setPlaces(filteredData);
          displayPlaces(filteredData);
        } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
          setError('검색 결과가 없습니다.');
          setPlaces([]);
        } else {
          setError('검색 중 오류가 발생했습니다.');
        }
        setLoading(false);
      }, searchOptions);
    }
  };

  const displayPlaces = (places: any[]) => {
    if (!map) return;

    const bounds = new window.kakao.maps.LatLngBounds();
    const newMarkers: any[] = [];

    places.forEach((place, index) => {
      const position = new window.kakao.maps.LatLng(place.y, place.x);
      
      // 운동 종류별 마커 색상
      const markerColors: Record<string, string> = {
        fitness: '#FF6B6B',
        yoga: '#9B59B6',
        swimming: '#3498DB',
        park: '#2ECC71',
        running: '#F39C12',
      };
      
      // 커스텀 마커 생성 - 클릭 이벤트를 위해 onclick 속성 추가
      const content = document.createElement('div');
      content.innerHTML = `
        <div style="
          display: flex;
          align-items: center;
          justify-content: center;
          width: 30px;
          height: 30px;
          background: ${markerColors[exerciseType] || '#E74C3C'};
          border-radius: 50%;
          color: white;
          font-weight: bold;
          border: 2px solid white;
          box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          cursor: pointer;
        ">
          ${index + 1}
        </div>
      `;
      
      // 클릭 이벤트 추가
      content.onclick = () => {
        setSelectedPlace(place);
        map.setCenter(position);
        map.setLevel(3);
      };
      
      const customOverlay = new window.kakao.maps.CustomOverlay({
        position: position,
        content: content,
        clickable: true,
        zIndex: index + 1,
      });
      
      customOverlay.setMap(map);

      newMarkers.push(customOverlay);
      bounds.extend(position);
    });

    setMarkers(newMarkers);
    
    // 검색된 장소들이 모두 보이도록 지도 범위 조정
    if (places.length > 0) {
      map.setBounds(bounds);
    }
  };

  const calculateWalkingTime = (distance: string): string => {
    const distanceNum = parseInt(distance);
    const walkingSpeed = 4; // km/h
    const minutes = Math.round((distanceNum / 1000) / walkingSpeed * 60);
    
    if (minutes < 60) {
      return `도보 ${minutes}분`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `도보 ${hours}시간 ${mins}분`;
    }
  };

  const handleExerciseTypeChange = (event: SelectChangeEvent) => {
    setExerciseType(event.target.value);
  };

  const handleRadiusChange = (event: SelectChangeEvent) => {
    setSearchRadius(event.target.value);
  };

  const openDirections = (place: ExercisePlace) => {
    if (currentPosition) {
      const url = `https://map.kakao.com/link/to/${place.place_name},${place.y},${place.x}/from/내위치,${currentPosition.lat},${currentPosition.lng}`;
      window.open(url, '_blank');
    } else {
      const url = `https://map.kakao.com/link/to/${place.place_name},${place.y},${place.x}`;
      window.open(url, '_blank');
    }
  };

  const getExerciseIcon = (type: string) => {
    switch (type) {
      case 'fitness':
        return <FitnessCenter />;
      case 'yoga':
        return <DirectionsRun />;
      case 'swimming':
        return <Pool />;
      case 'park':
        return <Park />;
      case 'running':
        return <DirectionsRun />;
      default:
        return <LocationOn />;
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 900 }}>
        {t('pages.map.title', '운동 장소 추천')}
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '3fr 2fr' }, gap: 2, height: 'calc(100vh - 200px)' }}>
        {/* 지도 영역 */}
        <Box sx={{ position: 'relative' }}>
          <Paper
            sx={{
              height: '100%',
              minHeight: '600px',
              borderRadius: 2,
              overflow: 'hidden',
              position: 'relative',
            }}
          >
            <Box
              ref={mapContainer}
              sx={{
                width: '100%',
                height: '100%',
              }}
            />
          </Paper>
          
          {/* 지도 위 버튼들 */}
          <Box sx={{ 
            position: 'absolute', 
            top: 16, 
            left: 16, 
            zIndex: 10,
            display: 'flex',
            gap: 1,
          }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<Navigation />}
              onClick={() => {
                if (navigator.geolocation && map) {
                  navigator.geolocation.getCurrentPosition((position) => {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    const locPosition = new window.kakao.maps.LatLng(lat, lng);
                    map.setCenter(locPosition);
                    map.setLevel(3);
                  });
                }
              }}
              sx={{ 
                backgroundColor: 'white',
                color: 'primary.main',
                '&:hover': {
                  backgroundColor: 'grey.100',
                },
              }}
            >
              내 위치
            </Button>
          </Box>
        </Box>

        {/* 검색 및 결과 패널 */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, height: '100%' }}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 600 }}>
              {t('pages.map.searchSettings', '검색 설정')}
            </Typography>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>{t('pages.map.exerciseType', '운동 종류')}</InputLabel>
              <Select value={exerciseType} onChange={handleExerciseTypeChange}>
                <MenuItem value="fitness">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <FitnessCenter fontSize="small" />
                    {t('pages.map.fitness', '헬스장/피트니스')}
                  </Box>
                </MenuItem>
                <MenuItem value="yoga">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DirectionsRun fontSize="small" />
                    {t('pages.map.yoga', '요가/필라테스')}
                  </Box>
                </MenuItem>
                <MenuItem value="swimming">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Pool fontSize="small" />
                    {t('pages.map.swimming', '수영장')}
                  </Box>
                </MenuItem>
                <MenuItem value="park">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Park fontSize="small" />
                    {t('pages.map.park', '공원')}
                  </Box>
                </MenuItem>
                <MenuItem value="running">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <DirectionsRun fontSize="small" />
                    {t('pages.map.running', '달리기/조깅 코스')}
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>{t('pages.map.searchRadius', '검색 반경')}</InputLabel>
              <Select value={searchRadius} onChange={handleRadiusChange}>
                <MenuItem value="500">500m</MenuItem>
                <MenuItem value="1000">1km</MenuItem>
                <MenuItem value="2000">2km</MenuItem>
                <MenuItem value="3000">3km</MenuItem>
                <MenuItem value="5000">5km</MenuItem>
              </Select>
            </FormControl>

            <Button
              fullWidth
              variant="contained"
              size="large"
              startIcon={<LocationOn />}
              onClick={searchPlaces}
              disabled={loading || !map}
            >
              {t('pages.map.searchNearby', '주변 운동 장소 검색')}
            </Button>
          </Paper>

          {/* 검색 결과 */}
          <Paper sx={{ p: 2, flexGrow: 1, overflow: 'auto' }}>
            <Typography variant="h6" sx={{ mb: 1 }}>
              {t('pages.map.searchResults', '검색 결과')} ({places.length})
            </Typography>

            {loading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <List>
              {places.map((place, index) => (
                <ListItem
                  key={place.id}
                  sx={{
                    cursor: 'pointer',
                    backgroundColor: selectedPlace?.id === place.id ? 'action.selected' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                    },
                    borderRadius: 1,
                    mb: 1,
                  }}
                  onClick={() => setSelectedPlace(place)}
                >
                  <ListItemIcon>
                    {getExerciseIcon(exerciseType)}
                  </ListItemIcon>
                  <ListItemText
                    primary={place.place_name}
                    secondary={
                      <>
                        <Typography variant="body2" color="text.secondary" component="span">
                          {place.road_address_name || place.address_name}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.5 }}>
                          <Chip
                            icon={<AccessTime />}
                            label={calculateWalkingTime(place.distance)}
                            size="small"
                            color="primary"
                          />
                          <Chip
                            label={`${place.distance}m`}
                            size="small"
                            variant="outlined"
                          />
                        </Box>
                      </>
                    }
                  />
                  <ListItemSecondaryAction>
                    <IconButton
                      edge="end"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDirections(place);
                      }}
                    >
                      <Directions />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Box>
      </Box>

      {/* 선택된 장소 상세 정보 */}
      {selectedPlace && (
        <Paper sx={{ mt: 2, p: 2, backgroundColor: 'background.paper' }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            {selectedPlace.place_name}
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' }, gap: 2, mb: 2 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">
                주소
              </Typography>
              <Typography variant="body1">
                {selectedPlace.road_address_name || selectedPlace.address_name}
              </Typography>
            </Box>
            {selectedPlace.phone && (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  전화번호
                </Typography>
                <Typography variant="body1">
                  {selectedPlace.phone}
                </Typography>
              </Box>
            )}
            <Box>
              <Typography variant="body2" color="text.secondary">
                거리 / 도보 시간
              </Typography>
              <Typography variant="body1">
                {selectedPlace.distance}m / {calculateWalkingTime(selectedPlace.distance)}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={<Navigation />}
              onClick={() => openDirections(selectedPlace)}
            >
              길찾기
            </Button>
            {selectedPlace.place_url && (
              <Button
                variant="outlined"
                onClick={() => window.open(selectedPlace.place_url, '_blank')}
              >
                카카오맵에서 보기
              </Button>
            )}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default ExerciseMap;
