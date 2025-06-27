// 지도 관련 타입 정의
export interface PlaceResult {
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

export interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  source?: 'gps' | 'wifi' | 'ip' | 'manual';
}

export type LocationType = '헬스장' | '요가원' | '필라테스' | '크로스핏' | '수영장' | '무술도장' | '댄스학원' | '기타';

export interface MapRefs {
  mapRef: React.RefObject<HTMLDivElement | null>;
  mapInstanceRef: React.MutableRefObject<any>;
  markersRef: React.MutableRefObject<any[]>;
  currentLocationMarkerRef: React.MutableRefObject<any>;
  currentLocationOverlayRef: React.MutableRefObject<any>;
  placesServiceRef: React.MutableRefObject<any>;
  clustererRef: React.MutableRefObject<any>;
  customOverlayRef: React.MutableRefObject<any>;
}