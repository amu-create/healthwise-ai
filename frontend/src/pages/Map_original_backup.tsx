import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Divider,
  CircularProgress,
  Alert,
  Slider,
  Card,
  CardContent,
  CardActions,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  Chip,
  Stack,
} from '@mui/material';
import {
  Search,
  MyLocation,
  Favorite,
  FavoriteBorder,
  NavigationOutlined,
  LocationOn,
  WifiTethering,
  GpsFixed,
  LocationSearching,
  NetworkCheck,
} from '@mui/icons-material';
import { usePageTitle, useDebounce } from '../hooks';
import { USER_EXACT_LOCATION, DEFAULT_LOCATIONS, adjustLocationForIP, isHTTPEnvironment, LOCATION_SOURCE_COLORS } from '../utils/locationConfig';

declare global {
  interface Window {
    kakao: any;
  }
}

interface PlaceResult {
  id: string;
  place_name: string;
  category_name: string;
  category_group_name?: string;
  address_name: string;
  road_address_name?: string;
  phone?: string;
  place_url: string;
  x: string; // longitude
  y: string; // latitude
  distance?: string;
  calculatedDistance?: number; // 계산된 거리 (m)
}

interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  source?: 'gps' | 'wifi' | 'ip' | 'manual';
}

// 두 지점 사이의 거리 계산 (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371e3; // 지구 반경 (m)
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // 결과는 미터 단위
};

// 위치 정확도 색상 반환
const getAccuracyColor = (source?: string): string => {
  switch (source) {
    case 'gps': return '#4CAF50';
    case 'wifi': return '#2196F3';
    case 'ip': return '#FFA500';
    case 'manual': return '#9C27B0';
    default: return '#757575';
  }
};

// 위치 정확도 아이콘 반환
const getLocationIcon = (source?: string) => {
  switch (source) {
    case 'gps': return <GpsFixed />;
    case 'wifi': return <WifiTethering />;
    case 'ip': return <NetworkCheck />;
    case 'manual': return <LocationOn />;
    default: return <MyLocation />;
  }
};

// 오버레이 콘텐츠 생성 함수
const createPlaceOverlay = (place: PlaceResult, categoryIcon: string, locationType: string) => {
  const placeId = place.id;
  
  return `
    <div style="
      position: relative;
      background: white;
      border-radius: 12px;
      padding: 0;
      box-shadow: 0 2px 16px rgba(0,0,0,0.15);
      min-width: 320px;
      max-width: 360px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
    ">
      <div style="
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid white;
        z-index: 1;
      "></div>
      
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
      ">
        <div style="
          width: 48px;
          height: 48px;
          background: rgba(255,255,255,0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        ">
          ${categoryIcon}
        </div>
        <div style="flex: 1;">
          <div style="
            color: rgba(255,255,255,0.9);
            font-size: 12px;
            margin-bottom: 2px;
          ">
            ${locationType}
          </div>
          <h3 style="
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: white;
            line-height: 1.2;
          ">
            ${place.place_name}
          </h3>
        </div>
      </div>
      
      <div style="padding: 16px;">
        
        <div style="display: flex; align-items: center; gap: 4px; font-size: 14px; color: #666; margin-bottom: 6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          ${place.road_address_name || place.address_name}
        </div>
        
        ${place.phone ? `
          <div style="display: flex; align-items: center; gap: 4px; font-size: 14px; color: #666; margin-bottom: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            ${place.phone}
          </div>
        ` : ''}
        
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #eee;
        ">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="
              background: #e3f2fd;
              color: #1976d2;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 13px;
              font-weight: 500;
            ">
              ${(place.calculatedDistance ? place.calculatedDistance / 1000 : 0).toFixed(1)}km
            </span>
            <span style="
              font-size: 12px;
              color: #999;
            ">
              ${place.category_name.split('>').pop()?.trim() || ''}
            </span>
          </div>
          
          <button onclick="window.open('${place.place_url}', '_blank')" style="
            background: #0068c3;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: background 0.2s;
          "
          onmouseover="this.style.backgroundColor='#0052a3'"
          onmouseout="this.style.backgroundColor='#0068c3'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M3 12h18m0 0l-6-6m6 6l-6 6"/>
            </svg>
            길찾기
          </button>
        </div>
      </div>
      
      <button onclick="this.parentElement.style.display='none'" style="
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(255,255,255,0.9);
        border: none;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        font-size: 16px;
        cursor: pointer;
        color: #666;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        line-height: 1;
      "
      onmouseover="this.style.backgroundColor='rgba(255,255,255,1)'; this.style.transform='scale(1.1)'"
      onmouseout="this.style.backgroundColor='rgba(255,255,255,0.9)'; this.style.transform='scale(1)'"
      >×</button>
    </div>
  `;
};

const MapEnhanced: React.FC = () => {
  usePageTitle('운동 장소 찾기');
  
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const currentLocationMarkerRef = useRef<any>(null);
  const currentLocationOverlayRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const customOverlayRef = useRef<any>(null);
  
  // 상태 관리
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<PlaceResult | null>(null);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [search, setSearch] = useState('');
  const [locationType, setLocationType] = useState('헬스장');
  const [radius, setRadius] = useState(2); // km
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [mapLoaded, setMapLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shouldSearch, setShouldSearch] = useState(false);
  const [locationDialog, setLocationDialog] = useState(false);
  const [manualAddress, setManualAddress] = useState('');
  
  const debouncedSearch = useDebounce(search, 500);

  // 향상된 IP 기반 위치
  const getEnhancedIPLocation = useCallback(async (): Promise<LocationData | null> => {
    try {
      // 1. 먼저 브라우저의 timezone 정보로 대략적인 지역 추정
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const isKorea = timezone.includes('Seoul') || timezone.includes('Asia/Seoul');
      
      // 신림역 근처 기본 위치 (더 정확한 위치)
      const sillimLocation = {
        lat: USER_EXACT_LOCATION.lat,
        lng: USER_EXACT_LOCATION.lng,
        accuracy: isHTTPEnvironment() ? 50 : 15000, // HTTP에서는 50m 정확도
        source: isHTTPEnvironment() ? 'manual' as const : 'ip' as const
      };
      
      // 2. 여러 IP 서비스 시도 (CORS 친화적인 서비스 우선)
      const ipServices = [
        { 
          url: 'https://ipapi.co/json/', 
          parser: (d: any) => ({ 
            lat: d.latitude, 
            lng: d.longitude, 
            city: d.city,
            region: d.region
          }) 
        },
        { 
          url: 'https://ipinfo.io/json', 
          parser: (d: any) => {
            if (d.loc) {
              const [lat, lng] = d.loc.split(',').map(Number);
              return { lat, lng, city: d.city, region: d.region };
            }
            return null;
          }
        },
        {
          url: 'https://api.ipify.org?format=json',
          parser: async (d: any) => {
            // IP만 가져온 후 다른 서비스로 위치 조회
            if (d.ip) {
              try {
                const geoRes = await fetch(`https://ipapi.co/${d.ip}/json/`);
                const geoData = await geoRes.json();
                return {
                  lat: geoData.latitude,
                  lng: geoData.longitude,
                  city: geoData.city,
                  region: geoData.region
                };
              } catch (e) {
                return null;
              }
            }
            return null;
          }
        }
      ];
      
      // 순차적으로 시도 (병렬 처리 시 CORS 에러 증가)
      for (const service of ipServices) {
        try {
          const res = await fetch(service.url, {
            method: 'GET',
            headers: {
              'Accept': 'application/json',
            },
            mode: 'cors'
          });
          
          if (res.ok) {
            const data = await res.json();
            const parsed = await service.parser(data);
            
            if (parsed && parsed.lat && parsed.lng) {
              console.log('IP location found:', parsed);
              
              // 서울 근처인지 확인 (대략적인 범위)
              const isNearSeoul = parsed.lat > 37.0 && parsed.lat < 38.0 && 
                                 parsed.lng > 126.0 && parsed.lng < 128.0;
              
              if (isNearSeoul) {
                // 서울 근처면 신림역 근처로 설정 (더 정확한 위치)
                return sillimLocation;
              } else {
                return {
                  lat: parsed.lat,
                  lng: parsed.lng,
                  accuracy: 20000, // 20km 정확도
                  source: 'ip'
                };
              }
            }
          }
        } catch (e) {
          console.warn(`IP service ${service.url} failed:`, e);
          continue;
        }
      }
      
      // 3. 모든 서비스 실패시 timezone 기반 기본값
      if (isKorea) {
        console.log('Using timezone-based location (Sillim area)');
        return sillimLocation;
      }
      
      // 한국이 아닌 경우 신림역 기본값
      return {
        lat: 37.4841,
        lng: 126.9294,
        accuracy: 50000,
        source: 'ip'
      };
    } catch (e) {
      console.error('Enhanced IP location error:', e);
      // 에러 시에도 기본값 반환
      return {
        lat: 37.4841, // 신림역
        lng: 126.9294,
        accuracy: 15000,
        source: 'ip'
      };
    }
  }, []);

  // 위치 설정 통합 함수
  const setLocationOnMap = useCallback((location: LocationData, label?: string) => {
    if (!mapInstanceRef.current) return;
    
    const { lat, lng, accuracy, source } = location;
    const position = new window.kakao.maps.LatLng(lat, lng);
    
    // 지도 중심 이동
    mapInstanceRef.current.setCenter(position);
    
    // 정확도에 따른 줌 레벨 설정
    let zoomLevel = 4;
    if (accuracy) {
      if (accuracy < 100) zoomLevel = 6;
      else if (accuracy < 1000) zoomLevel = 5;
      else if (accuracy < 5000) zoomLevel = 4;
      else if (accuracy < 10000) zoomLevel = 3;
      else zoomLevel = 2;
    }
    mapInstanceRef.current.setLevel(zoomLevel);
    
    // 기존 마커 제거
    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.setMap(null);
    }
    if (currentLocationOverlayRef.current) {
      currentLocationOverlayRef.current.setMap(null);
    }
    
    // 위치 소스에 따른 마커 스타일
    const markerColor = getAccuracyColor(source);
    const locationLabel = label || (source === 'gps' ? 'GPS 위치' : 
                                   source === 'wifi' ? 'WiFi 추정 위치' :
                                   source === 'ip' ? 'IP 추정 위치' :
                                   source === 'manual' ? '설정된 위치' :
                                   '현재 위치');
    
    // 마커 생성
    const marker = new window.kakao.maps.Marker({
      position: position,
      map: mapInstanceRef.current,
    });
    
    // 커스텀 오버레이
    const overlayContent = `
      <div style="
        padding: 8px 12px;
        background: ${markerColor};
        color: white;
        border-radius: 20px;
        font-size: 13px;
        font-weight: 500;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        display: flex;
        align-items: center;
        gap: 6px;
      ">
        <span>${locationLabel}</span>
        ${accuracy ? `<span style="opacity: 0.8; font-size: 11px;">(±${(accuracy/1000).toFixed(1)}km)</span>` : ''}
      </div>
    `;
    
    const customOverlay = new window.kakao.maps.CustomOverlay({
      position: position,
      content: overlayContent,
      yAnchor: 1.5,
    });
    customOverlay.setMap(mapInstanceRef.current);
    
    currentLocationMarkerRef.current = marker;
    currentLocationOverlayRef.current = customOverlay;
    
    // 위치 상태 업데이트
    setUserLocation(location);
    setShouldSearch(true);
    setLoading(false);
  }, []);

  // 현재 위치 가져오기 (개선된 버전)
  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    const isSecureContext = window.isSecureContext;
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    const isLocalNetwork = window.location.hostname.startsWith('192.168.') ||
                          window.location.hostname.startsWith('10.') ||
                          window.location.hostname.startsWith('172.');
    
    // 로컬 네트워크에서는 바로 IP 위치 사용
    if (isLocalNetwork) {
      console.log('Local network detected, using IP location directly');
      const ipLocation = await getEnhancedIPLocation();
      if (ipLocation) {
        setLocationOnMap(ipLocation);
        setError('로컬 네트워크에서는 대략적인 위치를 사용합니다.\n더 정확한 위치는 주소를 입력해주세요.');
        
        // 자동으로 위치 설정 다이얼로그 열기
        setTimeout(() => {
          setLocationDialog(true);
        }, 2000);
      } else {
        setError('위치를 가져올 수 없습니다. 주소를 입력해주세요.');
        setLocationDialog(true);
        setLoading(false);
      }
      return;
    }
    
    // 1. GPS 시도 (HTTPS 또는 localhost)
    if (navigator.geolocation && (isSecureContext || isLocalhost)) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location: LocationData = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            accuracy: position.coords.accuracy,
            source: 'gps'
          };
          setLocationOnMap(location);
          setError(null);
        },
        async (error) => {
          console.warn('GPS failed:', error);
          
          // 2. IP 기반 위치 시도
          const ipLocation = await getEnhancedIPLocation();
          if (ipLocation) {
            setLocationOnMap(ipLocation);
            setError('GPS를 사용할 수 없어 대략적인 위치를 사용합니다.\n더 정확한 위치는 아래 옵션을 사용하세요.');
            return;
          }
          
          // 3. 모든 방법 실패
          setError('위치를 가져올 수 없습니다. 수동으로 위치를 설정해주세요.');
          setLocationDialog(true);
          setLoading(false);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
        }
      );
    } else {
      // HTTP 환경에서 바로 대체 방법 시도
      const ipLocation = await getEnhancedIPLocation();
      if (ipLocation) {
        setLocationOnMap(ipLocation);
        setError('보안 연결(HTTPS)이 아니어서 대략적인 위치를 사용합니다.\n더 정확한 위치는 아래 옵션을 사용하세요.');
      } else {
        setError('위치를 가져올 수 없습니다. 수동으로 위치를 설정해주세요.');
        setLocationDialog(true);
        setLoading(false);
      }
    }
  }, [setLocationOnMap, getEnhancedIPLocation]);

  // 마커 또는 리스트 아이템 클릭 시 오버레이 표시
  const showPlaceOverlay = useCallback((place: PlaceResult) => {
    if (!mapInstanceRef.current) return;
    
    const position = new window.kakao.maps.LatLng(parseFloat(place.y), parseFloat(place.x));
    
    // 기존 커스텀 오버레이 제거
    if (customOverlayRef.current) {
      customOverlayRef.current.setMap(null);
    }
    
    // 카테고리 아이콘 선택
    let categoryIcon = '📍';
    if (place.category_name.includes('헬스') || place.category_name.includes('피트니스')) {
      categoryIcon = '🏋️';
    } else if (place.category_name.includes('요가')) {
      categoryIcon = '🧘';
    } else if (place.category_name.includes('필라테스')) {
      categoryIcon = '🤸';
    } else if (place.category_name.includes('수영')) {
      categoryIcon = '🏊';
    }
    
    // 오버레이 표시
    const overlayContent = createPlaceOverlay(place, categoryIcon, locationType);
    const customOverlay = new window.kakao.maps.CustomOverlay({
      position: position,
      content: overlayContent,
      yAnchor: 1.15,
      clickable: true,
      zIndex: 3
    });
    
    customOverlay.setMap(mapInstanceRef.current);
    customOverlayRef.current = customOverlay;
  }, [locationType]);
  
  // 장소 표시 (기존 코드와 동일)
  const displayPlaces = useCallback((places: PlaceResult[], skipFilter: boolean = false) => {
    if (!mapInstanceRef.current) return;
    
    // 기존 마커 및 클러스터러 제거
    if (clustererRef.current) {
      clustererRef.current.clear();
      clustererRef.current.setMap(null);
      clustererRef.current = null;
    }
    markersRef.current.forEach(marker => marker.setMap(null));
    markersRef.current = [];
    
    // 지도 범위 객체
    const bounds = new window.kakao.maps.LatLngBounds();
    
    // 현재 위치 또는 지도 중심에서 거리 계산하여 정렬
    const mapCenter = mapInstanceRef.current.getCenter();
    const centerLat = mapCenter.getLat();
    const centerLng = mapCenter.getLng();
    
    // 거리 계산 및 정렬
    const placesWithDistance = places.map(place => {
      const distance = calculateDistance(
        centerLat,
        centerLng,
        parseFloat(place.y),
        parseFloat(place.x)
      );
      return { ...place, calculatedDistance: distance };
    })
    .filter(place => skipFilter || place.calculatedDistance <= radius * 1000)
    .sort((a, b) => a.calculatedDistance - b.calculatedDistance);
    
    // 마커가 10개 이상이면 클러스터링 사용
    if (placesWithDistance.length >= 10) {
      // 클러스터러 생성
      clustererRef.current = new window.kakao.maps.MarkerClusterer({
        map: mapInstanceRef.current,
        averageCenter: true,
        minLevel: 6,
        minClusterSize: 2,
        gridSize: 50,
        disableClickZoom: false,
        styles: [{
          width : '53px', 
          height : '52px',
          background: 'url(https://t1.daumcdn.net/mapjsapi/images/cluster.png) no-repeat',
          color: '#000',
          textAlign: 'center',
          lineHeight: '54px'
        }]
      });
      
      // 클러스터링에 사용할 마커 배열
      const clusterMarkers: any[] = [];
      
      placesWithDistance.forEach((place) => {
        const position = new window.kakao.maps.LatLng(parseFloat(place.y), parseFloat(place.x));
        
        // 마커 생성
        const marker = new window.kakao.maps.Marker({
          position: position,
        });
        
        // 마커 클릭 이벤트
        window.kakao.maps.event.addListener(marker, 'click', () => {
          showPlaceOverlay(place);
          setSelectedPlace(place);
        });
        
        clusterMarkers.push(marker);
        bounds.extend(position);
      });
      
      // 클러스터러에 마커 추가
      clustererRef.current.addMarkers(clusterMarkers);
      markersRef.current = clusterMarkers;
    } else {
      // 마커가 적은 경우 기존 방식으로 표시
      placesWithDistance.forEach((place) => {
        const position = new window.kakao.maps.LatLng(parseFloat(place.y), parseFloat(place.x));
        
        // 마커 생성
        const marker = new window.kakao.maps.Marker({
          position: position,
          map: mapInstanceRef.current,
        });
        
        // 마커 클릭 이벤트
        window.kakao.maps.event.addListener(marker, 'click', () => {
          showPlaceOverlay(place);
          setSelectedPlace(place);
        });
        
        markersRef.current.push(marker);
        bounds.extend(position);
      });
    }
    
    // 검색 반경에 따른 적절한 줌 레벨 설정
    if (placesWithDistance.length > 0) {
      let zoomLevel = 4;
      if (radius <= 0.5) {
        zoomLevel = 5;
      } else if (radius <= 1) {
        zoomLevel = 4;
      } else if (radius <= 2) {
        zoomLevel = 3;
      } else if (radius <= 3) {
        zoomLevel = 2;
      } else {
        zoomLevel = 1;
      }
      
      mapInstanceRef.current.setLevel(zoomLevel);
      
      if (placesWithDistance.length > 3) {
        mapInstanceRef.current.setBounds(bounds);
      }
    }
    
    // 필터링된 결과로 상태 업데이트
    setPlaces(placesWithDistance);
  }, [radius, showPlaceOverlay]);

  // 카테고리로 장소 검색
  const searchPlacesByCategory = useCallback(() => {
    if (!placesServiceRef.current || !mapInstanceRef.current) return;
    
    setLoading(true);
    setError(null);
    setPlaces([]);
    
    const center = mapInstanceRef.current.getCenter();
    
    // 카테고리별 검색 키워드
    let searchKeywords: string[] = [];
    switch (locationType) {
      case '헬스장':
        searchKeywords = ['헬스장', '피트니스', '체육관', '운동센터', '스포츠센터'];
        break;
      case '요가원':
        searchKeywords = ['요가', '요가원', '필라테스'];
        break;
      case '필라테스':
        searchKeywords = ['필라테스'];
        break;
      case '크로스핏':
        searchKeywords = ['크로스핏', 'crossfit'];
        break;
      case '수영장':
        searchKeywords = ['수영장', '스위밍'];
        break;
      case '무술도장':
        searchKeywords = ['태권도', '합기도', '유도', '검도', '무술'];
        break;
      case '댄스학원':
        searchKeywords = ['댄스', '무용', '댄스학원'];
        break;
      default:
        searchKeywords = [locationType];
    }
    
    let allResults: PlaceResult[] = [];
    let searchedKeywords = 0;
    const uniquePlaceIds = new Set<string>();
    
    const searchNextKeyword = () => {
      if (searchedKeywords >= searchKeywords.length) {
        setPlaces(allResults);
        displayPlaces(allResults, true);
        setLoading(false);
        setShouldSearch(false);
        return;
      }
      
      const currentKeyword = searchKeywords[searchedKeywords];
      
      const callback = (result: PlaceResult[], status: string, pagination: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const filteredResults = result.filter(place => {
            const name = place.place_name.toLowerCase();
            const category = place.category_name.toLowerCase();
            
            if (locationType === '헬스장') {
              return name.includes('헬스') || name.includes('피트니스') || name.includes('짐') || 
                     category.includes('헬스') || category.includes('스포츠');
            } else if (locationType === '요가원') {
              return name.includes('요가') || category.includes('요가');
            } else if (locationType === '필라테스') {
              return name.includes('필라테스') || category.includes('필라테스');
            } else if (locationType === '크로스핏') {
              return name.includes('크로스핏') || name.includes('crossfit');
            } else if (locationType === '수영장') {
              return name.includes('수영') || category.includes('수영');
            } else if (locationType === '무술도장') {
              return name.includes('무술') || name.includes('태권도') || name.includes('합기도') || 
                     name.includes('유도') || name.includes('검도') || category.includes('무술');
            } else if (locationType === '댄스학원') {
              return name.includes('댄스') || name.includes('무용') || category.includes('댄스');
            }
            return true;
          });
          
          const newResults = filteredResults.filter(place => {
            if (uniquePlaceIds.has(place.id)) {
              return false;
            }
            
            const distance = calculateDistance(
              center.getLat(),
              center.getLng(),
              parseFloat(place.y),
              parseFloat(place.x)
            );
            
            if (distance > radius * 1000) {
              return false;
            }
            
            uniquePlaceIds.add(place.id);
            return true;
          }).map(place => {
            const distance = calculateDistance(
              center.getLat(),
              center.getLng(),
              parseFloat(place.y),
              parseFloat(place.x)
            );
            return { ...place, calculatedDistance: distance };
          });
          
          allResults = [...allResults, ...newResults];
          
          if (pagination.hasNextPage && pagination.current < 2) {
            pagination.nextPage();
          } else {
            searchedKeywords++;
            searchNextKeyword();
          }
        } else {
          searchedKeywords++;
          searchNextKeyword();
        }
      };
      
      const apiRadius = Math.min(radius * 1000 * 1.2, 20000);
      const options = {
        location: center,
        radius: apiRadius,
        sort: window.kakao.maps.services.SortBy.DISTANCE,
        size: 15,
      };
      
      placesServiceRef.current.keywordSearch(currentKeyword, callback, options);
    };
    
    searchNextKeyword();
  }, [locationType, radius, displayPlaces]);

  // 검색어로 장소 검색
  const searchPlacesByKeyword = useCallback(() => {
    if (!placesServiceRef.current || !debouncedSearch) return;
    
    setLoading(true);
    setError(null);
    
    const callback = (result: PlaceResult[], status: string) => {
      if (status === window.kakao.maps.services.Status.OK) {
        setPlaces(result);
        displayPlaces(result);
      } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
        setPlaces([]);
        setError('검색 결과가 없습니다.');
      } else {
        setError('장소 검색 중 오류가 발생했습니다.');
      }
      setLoading(false);
    };
    
    placesServiceRef.current.keywordSearch(debouncedSearch, callback);
  }, [debouncedSearch, displayPlaces]);

  // 주소로 위치 설정
  const setLocationByAddress = useCallback(() => {
    if (!manualAddress || !window.kakao || !window.kakao.maps) return;
    
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(manualAddress, (result: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const location: LocationData = {
          lat: parseFloat(result[0].y),
          lng: parseFloat(result[0].x),
          accuracy: 50, // 주소 기반은 높은 정확도
          source: 'manual'
        };
        
        setLocationOnMap(location, manualAddress);
        setLocationDialog(false);
        setManualAddress('');
        setError(null);
      } else {
        setError('주소를 찾을 수 없습니다. 다시 시도해주세요.');
      }
    });
  }, [manualAddress, setLocationOnMap]);


  
  // 지도 클릭 시 오버레이 닫기
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    
    const handleMapClick = () => {
      if (customOverlayRef.current) {
        customOverlayRef.current.setMap(null);
        customOverlayRef.current = null;
      }
    };
    
    window.kakao.maps.event.addListener(mapInstanceRef.current, 'click', handleMapClick);
    
    return () => {
      window.kakao.maps.event.removeListener(mapInstanceRef.current, 'click', handleMapClick);
    };
  }, [mapLoaded]);

  // 카카오맵 초기화
  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current) {
        console.error('Map container not found');
        return;
      }
      
      try {
        // 초기 위치를 신림역 근처로 설정
        const options = {
          center: new window.kakao.maps.LatLng(37.4841, 126.9294), // 신림역
          level: 4,
        };
        
        mapInstanceRef.current = new window.kakao.maps.Map(mapRef.current, options);
        console.log('Map created successfully');
        
        // Places 서비스 초기화
        placesServiceRef.current = new window.kakao.maps.services.Places();
        
        setMapLoaded(true);
        
        // 초기화 완료 후 현재 위치 가져오기
        setTimeout(() => {
          getCurrentLocation();
        }, 500);
      } catch (err) {
        console.error('Map initialization error:', err);
      }
    };
    
    // 카카오맵 API가 이미 로드되어 있는지 확인
    if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
      console.log('Kakao Maps API already loaded');
      initializeMap();
    } else {
      console.log('Kakao Maps API not loaded, waiting...');
      
      // 카카오맵 API 로드 대기
      const checkInterval = setInterval(() => {
        if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
          clearInterval(checkInterval);
          console.log('Kakao Maps API loaded');
          initializeMap();
        }
      }, 100);
      
      // 10초 후에도 로드되지 않으면 에러
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.kakao || !window.kakao.maps) {
          console.error('Failed to load Kakao Maps API');
          setError('카카오맵 API 로드에 실패했습니다.');
        }
      }, 10000);
    }
    
    return () => {
      console.log('Map component unmounted');
    };
  }, [getCurrentLocation]);

  // shouldSearch가 true가 되면 검색 실행
  useEffect(() => {
    if (shouldSearch) {
      searchPlacesByCategory();
    }
  }, [shouldSearch, searchPlacesByCategory]);

  // 장소 유형 변경 시 검색
  useEffect(() => {
    if (mapLoaded) {
      if (debouncedSearch) {
        searchPlacesByKeyword();
      } else if (userLocation || mapInstanceRef.current) {
        searchPlacesByCategory();
      }
    }
  }, [locationType, radius, mapLoaded, debouncedSearch, userLocation, searchPlacesByCategory, searchPlacesByKeyword]);

  // 즐겨찾기 토글
  const toggleFavorite = useCallback((placeId: string) => {
    setFavorites(prev => {
      const newSet = new Set(prev);
      if (newSet.has(placeId)) {
        newSet.delete(placeId);
      } else {
        newSet.add(placeId);
      }
      return newSet;
    });
  }, []);

  // 길찾기
  const openDirections = useCallback((place: PlaceResult) => {
    window.open(place.place_url, '_blank');
  }, []);
  
  return (
    <Box display="flex" height="calc(100vh - 64px)">
      {/* 왼쪽 패널 */}
      <Paper
        sx={{
          width: 400,
          p: 3,
          overflow: 'auto',
          borderRadius: 0,
        }}
      >
        <Typography variant="h5" fontWeight={700} mb={3}>
          운동 장소 찾기
        </Typography>
        
        {/* 검색 및 필터 */}
        <Box mb={3}>
          <TextField
            fullWidth
            placeholder="장소명 또는 주소 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
            }}
            sx={{ mb: 2 }}
          />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>장소 유형</InputLabel>
            <Select
              value={locationType}
              onChange={(e) => setLocationType(e.target.value)}
              label="장소 유형"
            >
              <MenuItem value="헬스장">헬스장</MenuItem>
              <MenuItem value="요가원">요가원</MenuItem>
              <MenuItem value="필라테스">필라테스</MenuItem>
              <MenuItem value="크로스핏">크로스핏</MenuItem>
              <MenuItem value="수영장">수영장</MenuItem>
              <MenuItem value="무술도장">무술도장</MenuItem>
              <MenuItem value="댄스학원">댄스학원</MenuItem>
              <MenuItem value="기타">기타</MenuItem>
            </Select>
          </FormControl>
          
          <Box>
            <Typography variant="body2" gutterBottom>
              검색 반경: {radius}km
            </Typography>
            <Slider
              value={radius}
              onChange={(_, value) => setRadius(value as number)}
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
                  {userLocation.source === 'gps' && 'GPS 위치 사용 중'}
                  {userLocation.source === 'wifi' && 'WiFi 기반 추정 위치'}
                  {userLocation.source === 'ip' && 'IP 기반 추정 위치'}
                  {userLocation.source === 'manual' && '수동 설정 위치'}

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
            onClick={getCurrentLocation}
            sx={{ mb: 1 }}
            disabled={loading}
          >
            {loading ? '위치 확인 중...' : '현재 위치로 검색'}
          </Button>
          
          <Button
            fullWidth
            variant="outlined"
            startIcon={<LocationOn />}
            onClick={() => setLocationDialog(true)}
            sx={{ mb: 1 }}
          >
            위치 설정 옵션
          </Button>

        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        {/* 로딩 상태 */}
        {loading && (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        )}
        
        {/* 에러 메시지 */}
        {error && (
          <Alert 
            severity="info" 
            sx={{ mb: 2, whiteSpace: 'pre-line' }}
          >
            {error}
          </Alert>
        )}
        
        {/* 장소 목록 */}
        {!loading && !error && (
          <>
            <Typography variant="body2" color="text.secondary" mb={2}>
              {places.length}개의 장소를 찾았습니다 (반경 {radius}km 내)
            </Typography>
            
            <List>
              {places.map((place, index) => (
                <React.Fragment key={place.id}>
                  {index > 0 && <Divider />}
                  <ListItem
                    onClick={() => {
                      setSelectedPlace(place);
                      
                      // 지도 중심 이동
                      if (mapInstanceRef.current) {
                        const moveLatLon = new window.kakao.maps.LatLng(
                          parseFloat(place.y),
                          parseFloat(place.x)
                        );
                        mapInstanceRef.current.setCenter(moveLatLon);
                        mapInstanceRef.current.setLevel(3);
                        
                        // 오버레이 표시
                        showPlaceOverlay(place);
                      }
                    }}
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
                          toggleFavorite(place.id);
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
          </>
        )}
        
        {/* 장소가 없을 때 */}
        {!loading && !error && places.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              검색 결과가 없습니다.
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              다른 검색어나 필터를 시도해보세요.
            </Typography>
          </Box>
        )}
      </Paper>
      
      {/* 오른쪽 지도 */}
      <Box flex={1} position="relative">
        <Box 
          ref={mapRef} 
          sx={{
            width: '100%',
            height: '100%',
          }}
        />
        
        {/* 내 위치 버튼 */}
        <Fab
          color="primary"
          size="small"
          onClick={getCurrentLocation}
          sx={{
            position: 'absolute',
            top: 20,
            right: 20,
          }}
        >
          <MyLocation />
        </Fab>
      </Box>
      
      {/* 위치 설정 다이얼로그 */}
      <Dialog open={locationDialog} onClose={() => setLocationDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>위치 설정 옵션</DialogTitle>
        <DialogContent>
          <Stack spacing={3} sx={{ pt: 2 }}>
            {/* 주소로 설정 */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                주소로 위치 설정
              </Typography>
              <TextField
                fullWidth
                placeholder="예: 신림역, 관악구 신림로 지하 117"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && setLocationByAddress()}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={setLocationByAddress} disabled={!manualAddress}>
                        <Search />
                      </IconButton>
                    </InputAdornment>
                  )
                }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                예시: 신림역, 봉천동, 관악구청, 서울대입구역 등
              </Typography>
            </Box>

            {/* 현재 위치 정보 표시 */}
            {userLocation && (
              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  현재 위치 정보
                </Typography>
                <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                  <Typography variant="body2">
                    위도: {userLocation.lat.toFixed(6)}
                  </Typography>
                  <Typography variant="body2">
                    경도: {userLocation.lng.toFixed(6)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    정확도: ±{((userLocation.accuracy || 0) / 1000).toFixed(1)}km
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    소스: {userLocation.source === 'gps' ? 'GPS' : 
                          userLocation.source === 'ip' ? 'IP 추정' : 
                          userLocation.source === 'manual' ? '수동 설정' : 
                          'WiFi 추정'}
                  </Typography>
                </Box>
              </Box>
            )}

            {/* 빠른 위치 설정 */}
            <Box>
              <Typography variant="subtitle2" gutterBottom>
                빠른 위치 설정
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => {
                    setManualAddress('신림역');
                    setTimeout(setLocationByAddress, 100);
                  }}
                >
                  신림역
                </Button>
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => {
                    setManualAddress('서울대입구역');
                    setTimeout(setLocationByAddress, 100);
                  }}
                >
                  서울대입구역
                </Button>
                <Button 
                  size="small" 
                  variant="outlined" 
                  onClick={() => {
                    setManualAddress('봉천역');
                    setTimeout(setLocationByAddress, 100);
                  }}
                >
                  봉천역
                </Button>
              </Stack>
            </Box>
            
            {/* 도움말 */}
            <Alert severity="info">
              <Typography variant="body2">
                💡 팁: HTTP 환경에서 정확한 위치를 사용하려면:
              </Typography>
              <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                <li>localhost:3000으로 접속하세요</li>
                <li>주소를 입력하여 정확한 위치를 설정하세요</li>
                <li>빠른 위치 설정 버튼을 사용하세요</li>
              </ul>
            </Alert>
            
            {/* 위치 오차 정보 */}
            <Alert severity="warning">
              <Typography variant="body2" fontWeight="bold">
                신림역 근처 위치 오차 정보
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                • 서울시청 ↔ 신림역: 약 9.5km
              </Typography>
              <Typography variant="body2">
                • 합정역 ↔ 신림역: 약 11km
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                IP 기반 위치는 정확하지 않으므로, 정확한 검색을 위해 주소를 입력해주세요.
              </Typography>
            </Alert>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLocationDialog(false)}>취소</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MapEnhanced;