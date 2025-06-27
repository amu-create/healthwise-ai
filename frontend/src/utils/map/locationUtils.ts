import { LocationData } from '../../types/map';

// 두 지점 사이의 거리 계산 (Haversine formula)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
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
export const getAccuracyColor = (source?: string): string => {
  switch (source) {
    case 'gps': return '#4CAF50';
    case 'wifi': return '#2196F3';
    case 'ip': return '#FFA500';
    case 'manual': return '#9C27B0';
    default: return '#757575';
  }
};

// IP 서비스 파서 타입
interface ParsedLocation {
  lat: number;
  lng: number;
  city?: string;
  region?: string;
  isp?: string;
  org?: string;
  ip?: string;
}

// IP 서비스 정의
export const ipServices = [
  {
    name: 'ip-api',
    url: 'https://ip-api.com/json/',
    priority: 1,
    parser: (d: any): ParsedLocation | null => ({
      lat: d.lat,
      lng: d.lon,
      city: d.city,
      region: d.regionName,
      isp: d.isp,
      org: d.org,
      ip: d.query
    })
  },
  { 
    name: 'ipapi.co',
    url: 'https://ipapi.co/json/', 
    priority: 2,
    parser: (d: any): ParsedLocation | null => ({ 
      lat: d.latitude, 
      lng: d.longitude, 
      city: d.city,
      region: d.region,
      org: d.org,
      ip: d.ip
    }) 
  },
  { 
    name: 'ipinfo.io',
    url: 'https://ipinfo.io/json', 
    priority: 3,
    parser: (d: any): ParsedLocation | null => {
      if (d.loc) {
        const [lat, lng] = d.loc.split(',').map(Number);
        return { lat, lng, city: d.city, region: d.region, org: d.org, ip: d.ip };
      }
      return null;
    }
  },
  {
    name: 'geolocation-db',
    url: 'https://geolocation-db.com/json/',
    priority: 4,
    parser: (d: any): ParsedLocation | null => {
      if (d.latitude && d.longitude && d.latitude !== 'Not found') {
        return {
          lat: parseFloat(d.latitude),
          lng: parseFloat(d.longitude),
          city: d.city,
          region: d.state,
          ip: d.IPv4
        };
      }
      return null;
    }
  }
];