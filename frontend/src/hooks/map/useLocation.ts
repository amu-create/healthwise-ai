import { useState, useCallback, useRef, useEffect } from 'react';
import { LocationData } from '../../types/map';
import { ipServices, getAccuracyColor } from '../../utils/map/locationUtils';
import { locationHistory } from '../../utils/map/locationHistory';

interface UseLocationProps {
  mapInstanceRef: React.MutableRefObject<any>;
  currentLocationMarkerRef: React.MutableRefObject<any>;
  currentLocationOverlayRef: React.MutableRefObject<any>;
  onLocationSet?: (location: LocationData) => void;
}

export const useLocation = ({
  mapInstanceRef,
  currentLocationMarkerRef,
  currentLocationOverlayRef,
  onLocationSet
}: UseLocationProps) => {
  const [userLocation, setUserLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // onLocationSet을 ref로 관리하여 함수 재생성 방지
  const onLocationSetRef = useRef(onLocationSet);
  useEffect(() => {
    onLocationSetRef.current = onLocationSet;
  }, [onLocationSet]);

  // 향상된 IP 기반 위치
  const getEnhancedIPLocation = useCallback(async (): Promise<LocationData | null> => {
    try {
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const isKorea = timezone.includes('Seoul') || timezone.includes('Asia/Seoul');
      
      // 저장된 최적 서비스 확인
      const savedBestService = localStorage.getItem('bestIPService');
      let sortedServices = [...ipServices];
      
      if (savedBestService) {
        sortedServices.sort((a, b) => {
          if (a.name === savedBestService) return -1;
          if (b.name === savedBestService) return 1;
          return a.priority - b.priority;
        });
      }
      
      // 순차적으로 시도
      for (const service of sortedServices) {
        try {
          const res = await fetch(service.url, {
            method: 'GET',
            headers: { 'Accept': 'application/json' },
            mode: 'cors',
            cache: 'no-cache'
          });
          
          if (res.ok) {
            const data = await res.json();
            const parsed = await service.parser(data);
            
            if (parsed && parsed.lat && parsed.lng) {
              console.log(`✅ IP location from ${service.name}:`, parsed);
              
              localStorage.setItem('bestIPService', service.name);
              localStorage.setItem('lastIPLocation', JSON.stringify({
                lat: parsed.lat,
                lng: parsed.lng,
                service: service.name,
                timestamp: Date.now()
              }));
              
              return {
                lat: parsed.lat,
                lng: parsed.lng,
                accuracy: 5000,
                source: 'ip'
              };
            }
          }
        } catch (e) {
          console.warn(`❌ IP service ${service.name} failed:`, e);
        }
      }
      
      // 기본값
      return {
        lat: 37.5665,
        lng: 126.9780,
        accuracy: 20000,
        source: 'ip'
      };
    } catch (e) {
      console.error('Enhanced IP location error:', e);
      return {
        lat: 37.5665,
        lng: 126.9780,
        accuracy: 20000,
        source: 'ip'
      };
    }
  }, []);

  // 위치 설정 통합 함수
  const setLocationOnMap = useCallback((location: LocationData, label?: string) => {
    if (!mapInstanceRef.current) return;
    
    const { lat, lng, accuracy, source } = location;
    console.log('[Location] Setting location on map:', { lat, lng, accuracy, source, label });
    
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
    if (onLocationSetRef.current) {
      onLocationSetRef.current(location);
    }
    
    // 위치 변경 이력 저장
    locationHistory.addHistory(location, label, 'setLocationOnMap');
    
    setLoading(false);
  }, []); // 모든 의존성 제거로 함수 안정화

  // 현재 위치 가져오기 - 개선된 버전
  const getCurrentLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    console.log('[Location] Starting location detection...');
    console.log('[Location] Current URL:', window.location.href);
    console.log('[Location] Protocol:', window.location.protocol);
    console.log('[Location] Hostname:', window.location.hostname);
    
    // HTTPS 또는 localhost 환경 체크
    const isSecureContext = window.isSecureContext;
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
    
    console.log('[Location] Secure context:', isSecureContext);
    console.log('[Location] Is localhost:', isLocalhost);
    
    // Geolocation API 사용 가능 여부 확인
    if (!navigator.geolocation) {
      console.log('[Location] Geolocation API not available');
      // IP 기반 위치로 대체
      const ipLocation = await getEnhancedIPLocation();
      if (ipLocation) {
        setLocationOnMap(ipLocation, 'IP 기반 추정 위치');
        locationHistory.addHistory(ipLocation, 'IP location (no geolocation)', 'getCurrentLocation');
      }
      setError('Geolocation을 사용할 수 없습니다. IP 기반 위치를 사용합니다.');
      return;
    }
    
    // 권한 상태 확인 (가능한 경우)
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        console.log('[Location] Permission status:', permission.state);
      } catch (e) {
        console.log('[Location] Could not query permission:', e);
      }
    }
    
    // GPS 위치 시도
    console.log('[Location] Attempting GPS location...');
    
    // 빠른 네트워크 기반 위치 먼저 시도
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('[Location] Initial location success (network/cached):', position.coords);
        const networkLocation: LocationData = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: position.coords.accuracy > 1000 ? 'wifi' : 'gps'
        };
        setLocationOnMap(networkLocation, '초기 위치');
        locationHistory.addHistory(networkLocation, 'Initial location', 'getCurrentLocation');
        
        // 더 정확한 GPS 위치 시도
        navigator.geolocation.getCurrentPosition(
          (betterPosition) => {
            console.log('[Location] High accuracy GPS success:', betterPosition.coords);
            const gpsLocation: LocationData = {
              lat: betterPosition.coords.latitude,
              lng: betterPosition.coords.longitude,
              accuracy: betterPosition.coords.accuracy,
              source: 'gps'
            };
            setLocationOnMap(gpsLocation, 'GPS 정밀 위치');
            locationHistory.addHistory(gpsLocation, 'High accuracy GPS', 'getCurrentLocation');
            setError(null);
          },
          (err) => {
            console.log('[Location] High accuracy GPS failed, keeping initial location');
          },
          {
            enableHighAccuracy: true,
            timeout: 30000,
            maximumAge: 0
          }
        );
      },
      async (error) => {
        console.error('[Location] Geolocation failed:', error);
        console.log('[Location] Error code:', error.code);
        console.log('[Location] Error message:', error.message);
        
        let errorMessage = '';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = '위치 권한이 거부되었습니다. 브라우저 설정에서 위치 권한을 허용해주세요.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = '위치 정보를 사용할 수 없습니다.';
            break;
          case error.TIMEOUT:
            errorMessage = '위치 요청 시간이 초과되었습니다.';
            break;
          default:
            errorMessage = '알 수 없는 오류가 발생했습니다.';
        }
        
        // GPS 실패 시 IP 기반 위치 사용
        console.log('[Location] Falling back to IP location...');
        const ipLocation = await getEnhancedIPLocation();
        if (ipLocation) {
          setLocationOnMap(ipLocation, 'IP 기반 추정 위치 (GPS 실패)');
          locationHistory.addHistory(ipLocation, 'IP location (GPS failed)', 'getCurrentLocation');
          setError(`${errorMessage} IP 기반 위치를 사용합니다.`);
        } else {
          // 최종 기본값
          const defaultLocation: LocationData = {
            lat: 37.4841, // 신림역
            lng: 126.9294, // 신림역
            accuracy: 5000,
            source: 'manual'
          };
          setLocationOnMap(defaultLocation, '기본 위치 (신림역)');
          locationHistory.addHistory(defaultLocation, 'Default location', 'getCurrentLocation');
          setError(errorMessage);
        }
      },
      {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 300000 // 5분 캐시 허용
      }
    );
  }, [getEnhancedIPLocation, setLocationOnMap]);

  // 주소로 위치 설정
  const setLocationByAddress = useCallback((address: string) => {
    if (!address || !window.kakao || !window.kakao.maps) return;
    
    const geocoder = new window.kakao.maps.services.Geocoder();
    geocoder.addressSearch(address, (result: any, status: any) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const location: LocationData = {
          lat: parseFloat(result[0].y),
          lng: parseFloat(result[0].x),
          accuracy: 50,
          source: 'manual'
        };
        
        setLocationOnMap(location, address);
        setError(null);
      } else {
        setError('주소를 찾을 수 없습니다. 다시 시도해주세요.');
      }
    });
  }, [setLocationOnMap]);

  // IP 위치 서비스 초기화 (디버깅용)
  const clearIPLocationCache = useCallback(() => {
    localStorage.removeItem('bestIPService');
    localStorage.removeItem('lastIPLocation');
    console.log('[Location] IP location cache cleared');
  }, []);

  return {
    userLocation,
    loading,
    error,
    getCurrentLocation,
    setLocationByAddress,
    setLocationOnMap,
    clearIPLocationCache
  };
};