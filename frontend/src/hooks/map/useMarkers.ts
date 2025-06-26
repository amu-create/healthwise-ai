import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { PlaceResult } from '../../types/map';
import { calculateDistance } from '../../utils/map/locationUtils';
import { createPlaceOverlay, getCategoryIcon } from '../../utils/map/overlayUtils';
import { getZoomLevelByRadius } from '../../utils/map/searchUtils';

interface UseMarkersProps {
  mapInstanceRef: React.MutableRefObject<any>;
  markersRef: React.MutableRefObject<any[]>;
  clustererRef: React.MutableRefObject<any>;
  customOverlayRef: React.MutableRefObject<any>;
  onPlaceClick?: (place: PlaceResult) => void;
}

export const useMarkers = ({
  mapInstanceRef,
  markersRef,
  clustererRef,
  customOverlayRef,
  onPlaceClick
}: UseMarkersProps) => {
  const { t } = useTranslation();
  
  // 마커 또는 리스트 아이템 클릭 시 오버레이 표시
  const showPlaceOverlay = useCallback((place: PlaceResult, locationType: string) => {
    if (!mapInstanceRef.current) return;
    
    const position = new window.kakao.maps.LatLng(parseFloat(place.y), parseFloat(place.x));
    
    // 기존 커스텀 오버레이 제거
    if (customOverlayRef.current) {
      customOverlayRef.current.setMap(null);
    }
    
    // 카테고리 아이콘 선택
    const categoryIcon = getCategoryIcon(place.category_name, locationType);
    
    // 오버레이 표시
    const directionsText = t('pages.map.directions');
    const overlayContent = createPlaceOverlay(place, categoryIcon, locationType, directionsText);
    const customOverlay = new window.kakao.maps.CustomOverlay({
      position: position,
      content: overlayContent,
      yAnchor: 1.15,
      clickable: true,
      zIndex: 3
    });
    
    customOverlay.setMap(mapInstanceRef.current);
    customOverlayRef.current = customOverlay;
  }, [mapInstanceRef, customOverlayRef, t]);
  
  // 장소 표시
  const displayPlaces = useCallback((
    places: PlaceResult[],
    radius: number,
    locationType: string,
    skipFilter: boolean = false
  ) => {
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
          showPlaceOverlay(place, locationType);
          onPlaceClick?.(place);
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
          showPlaceOverlay(place, locationType);
          onPlaceClick?.(place);
        });
        
        markersRef.current.push(marker);
        bounds.extend(position);
      });
    }
    
    // 검색 반경에 따른 적절한 줌 레벨 설정
    if (placesWithDistance.length > 0) {
      const zoomLevel = getZoomLevelByRadius(radius);
      mapInstanceRef.current.setLevel(zoomLevel);
      
      if (placesWithDistance.length > 3) {
        mapInstanceRef.current.setBounds(bounds);
      }
    }
    
    return placesWithDistance;
  }, [mapInstanceRef, markersRef, clustererRef, showPlaceOverlay, onPlaceClick]);

  // 지도 클릭으로 위치 이동
  const moveToPlace = useCallback((place: PlaceResult) => {
    if (!mapInstanceRef.current) return;
    
    const moveLatLon = new window.kakao.maps.LatLng(
      parseFloat(place.y),
      parseFloat(place.x)
    );
    mapInstanceRef.current.setCenter(moveLatLon);
    mapInstanceRef.current.setLevel(3);
  }, [mapInstanceRef]);

  return {
    displayPlaces,
    showPlaceOverlay,
    moveToPlace
  };
};