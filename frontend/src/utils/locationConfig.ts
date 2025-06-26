// 위치 설정 관리 모듈
export interface LocationConfig {
  lat: number;
  lng: number;
  address: string;
  name: string;
}

// 사용자 지정 정확한 위치
export const USER_EXACT_LOCATION: LocationConfig = {
  lat: 37.4776,  // 서울 관악구 남부순환로 1633 좌표
  lng: 126.9522,
  address: '서울특별시 관악구 남부순환로 1633',
  name: '사용자 위치'
};

// 기본 위치 (HTTP 환경에서 사용)
export const DEFAULT_LOCATIONS = {
  USER_LOCATION: USER_EXACT_LOCATION,
  SILLIM: {
    lat: 37.4841,
    lng: 126.9294,
    address: '서울특별시 관악구 신림역',
    name: '신림역'
  },
  SEOUL_UNIV: {
    lat: 37.4813,
    lng: 126.9527,
    address: '서울특별시 관악구 서울대입구역',
    name: '서울대입구역'
  },
  BONGCHEON: {
    lat: 37.4821,
    lng: 126.9433,
    address: '서울특별시 관악구 봉천역',
    name: '봉천역'
  }
};

// IP 기반 위치 보정 함수
export function adjustLocationForIP(ipLocation: { lat: number; lng: number }): LocationConfig {
  // 서울 지역 감지 (위도 37.0~38.0, 경도 126.5~127.5)
  const isNearSeoul = 
    ipLocation.lat > 37.0 && ipLocation.lat < 38.0 && 
    ipLocation.lng > 126.5 && ipLocation.lng < 127.5;
  
  if (isNearSeoul) {
    // 서울 지역이면 사용자 지정 위치로 자동 조정
    return USER_EXACT_LOCATION;
  }
  
  // 다른 지역은 IP 위치 그대로 사용
  return {
    lat: ipLocation.lat,
    lng: ipLocation.lng,
    address: 'IP 기반 추정 위치',
    name: 'IP 위치'
  };
}

// 위치 정확도 계산 함수
export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // 지구 반경 (km)
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// 위치 소스별 색상
export const LOCATION_SOURCE_COLORS = {
  gps: '#4CAF50',      // 초록색
  wifi: '#2196F3',     // 파란색
  ip: '#FFA500',       // 주황색
  manual: '#9C27B0',   // 보라색
  shared: '#00BCD4'    // 청록색
};

// HTTP 환경 감지
export function isHTTPEnvironment(): boolean {
  return window.location.protocol === 'http:' && 
         !window.location.hostname.includes('localhost');
}
