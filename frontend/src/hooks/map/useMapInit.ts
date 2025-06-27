import { useEffect, useRef, useState } from 'react';
import { MapRefs } from '../../types/map';

declare global {
  interface Window {
    kakao: any;
  }
}

interface UseMapInitProps {
  onMapLoaded?: () => void;
}

export const useMapInit = ({ onMapLoaded }: UseMapInitProps = {}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const currentLocationMarkerRef = useRef<any>(null);
  const currentLocationOverlayRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const clustererRef = useRef<any>(null);
  const customOverlayRef = useRef<any>(null);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeMap = () => {
      if (!mapRef.current) {
        console.error('Map container not found');
        return;
      }
      
      try {
        // 초기 위치 설정 - 신림역
        const initialLat = 37.4841;
        const initialLng = 126.9294;
        
        const options = {
          center: new window.kakao.maps.LatLng(initialLat, initialLng),
          level: 4,
        };
        
        mapInstanceRef.current = new window.kakao.maps.Map(mapRef.current, options);
        // console.log('[Map Init] Map created successfully');
        
        // Places 서비스 초기화
        placesServiceRef.current = new window.kakao.maps.services.Places();
        
        setMapLoaded(true);
        onMapLoaded?.();
      } catch (err) {
        console.error('Map initialization error:', err);
        setError('지도 초기화 중 오류가 발생했습니다.');
      }
    };
    
    // 카카오맵 API가 이미 로드되어 있는지 확인
    if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
      console.log('[Map Init] Kakao Maps API already loaded');
      initializeMap();
    } else {
      console.log('[Map Init] Kakao Maps API not loaded, waiting...');
      
      // 카카오맵 API 로드 대기
      const checkInterval = setInterval(() => {
        if (window.kakao && window.kakao.maps && window.kakao.maps.services) {
          clearInterval(checkInterval);
          console.log('[Map Init] Kakao Maps API loaded');
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
      // console.log('[Map Init] Map component unmounted');
    };
  }, [onMapLoaded]);

  const refs: MapRefs = {
    mapRef,
    mapInstanceRef,
    markersRef,
    currentLocationMarkerRef,
    currentLocationOverlayRef,
    placesServiceRef,
    clustererRef,
    customOverlayRef
  };

  return {
    refs,
    mapLoaded,
    error
  };
};