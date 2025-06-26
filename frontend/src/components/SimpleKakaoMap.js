import React, { useEffect, useRef } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';

const SimpleKakaoMap = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    // 카카오 지도 API 로드 확인 함수
    const checkKakaoMaps = () => {
      if (window.kakao && window.kakao.maps) {
        console.log('✅ 카카오 맵 API 로드됨');
        return true;
      }
      console.log('⏳ 카카오 맵 API 로딩 중...');
      return false;
    };

    // 지도 초기화 함수
    const initializeMap = () => {
      if (!mapRef.current) return;

      try {
        const container = mapRef.current;
        const options = {
          center: new window.kakao.maps.LatLng(37.4944803, 126.9131115), // 기본 위치
          level: 3
        };

        // 지도 생성
        const map = new window.kakao.maps.Map(container, options);
        mapInstanceRef.current = map;

        console.log('✅ 카카오 맵 초기화 완료');

        // 현재 위치 가져오기
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const lat = position.coords.latitude;
              const lng = position.coords.longitude;
              const locPosition = new window.kakao.maps.LatLng(lat, lng);
              
              // 지도 중심 이동
              map.setCenter(locPosition);
              
              // 마커 생성
              const marker = new window.kakao.maps.Marker({
                position: locPosition,
                map: map
              });

              console.log('✅ 현재 위치 설정 완료:', lat, lng);
            },
            (error) => {
              console.error('❌ 위치 정보 가져오기 실패:', error);
            }
          );
        }
      } catch (error) {
        console.error('❌ 카카오 맵 초기화 오류:', error);
      }
    };

    // API 로드 대기 후 지도 초기화
    const loadInterval = setInterval(() => {
      if (checkKakaoMaps()) {
        clearInterval(loadInterval);
        initializeMap();
      }
    }, 100);

    // 5초 후에도 로드되지 않으면 중단
    const timeout = setTimeout(() => {
      clearInterval(loadInterval);
      console.error('❌ 카카오 맵 API 로드 시간 초과');
    }, 5000);

    return () => {
      clearInterval(loadInterval);
      clearTimeout(timeout);
    };
  }, []);

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      <div 
        ref={mapRef} 
        style={{ 
          width: '100%', 
          height: '100%',
          minHeight: '500px'
        }}
      />
      {!mapInstanceRef.current && (
        <Box
          sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            textAlign: 'center'
          }}
        >
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            지도를 불러오는 중...
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default SimpleKakaoMap;
