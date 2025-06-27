// HTTP 환경에서 카카오맵 위치 정확도 개선을 위한 초기화 스크립트

import { USER_EXACT_LOCATION } from '../utils/locationConfig';

// Map 컴포넌트가 로드될 때 자동으로 사용자 위치 설정
export function initializeMapWithUserLocation(map: any) {
  if (!map) return;
  
  // HTTP 환경인지 확인
  const isHTTP = window.location.protocol === 'http:';
  const isLocalNetwork = window.location.hostname.match(/^(192\.168\.|10\.|172\.)/);
  
  if (isHTTP || isLocalNetwork) {
    // 사용자 지정 위치로 지도 중심 설정
    const position = new window.kakao.maps.LatLng(
      USER_EXACT_LOCATION.lat, 
      USER_EXACT_LOCATION.lng
    );
    
    map.setCenter(position);
    map.setLevel(3); // 더 가까운 줌 레벨
    
    // 현재 위치 마커 추가
    const marker = new window.kakao.maps.Marker({
      position: position,
      map: map
    });
    
    // 정보 창 추가
    const infowindow = new window.kakao.maps.InfoWindow({
      content: `<div style="padding:5px;">${USER_EXACT_LOCATION.address}</div>`
    });
    
    window.kakao.maps.event.addListener(marker, 'click', function() {
      infowindow.open(map, marker);
    });
    
    console.log('HTTP 환경 감지: 사용자 지정 위치로 초기화됨', USER_EXACT_LOCATION);
  }
}

// 위치 검색 시 기준점 조정
export function adjustSearchCenter(keyword: string, currentCenter: any) {
  const isHTTP = window.location.protocol === 'http:';
  
  if (isHTTP) {
    // HTTP 환경에서는 항상 사용자 지정 위치를 기준으로 검색
    return new window.kakao.maps.LatLng(
      USER_EXACT_LOCATION.lat,
      USER_EXACT_LOCATION.lng
    );
  }
  
  return currentCenter;
}
