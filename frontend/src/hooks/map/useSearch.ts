import { useState, useCallback } from 'react';
import { PlaceResult, LocationType } from '../../types/map';
import { calculateDistance } from '../../utils/map/locationUtils';
import { getSearchKeywords, filterPlaceByType } from '../../utils/map/searchUtils';

interface UseSearchProps {
  mapInstanceRef: React.MutableRefObject<any>;
  placesServiceRef: React.MutableRefObject<any>;
  onPlacesFound?: (places: PlaceResult[]) => void;
}

export const useSearch = ({
  mapInstanceRef,
  placesServiceRef,
  onPlacesFound
}: UseSearchProps) => {
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 카테고리로 장소 검색
  const searchPlacesByCategory = useCallback((
    locationType: LocationType,
    radius: number
  ) => {
    if (!placesServiceRef.current || !mapInstanceRef.current) return;
    
    setLoading(true);
    setError(null);
    setPlaces([]);
    
    const center = mapInstanceRef.current.getCenter();
    const searchKeywords = getSearchKeywords(locationType);
    
    let allResults: PlaceResult[] = [];
    let searchedKeywords = 0;
    const uniquePlaceIds = new Set<string>();
    
    const searchNextKeyword = () => {
      if (searchedKeywords >= searchKeywords.length) {
        const sortedResults = allResults.sort((a, b) => 
          (a.calculatedDistance || 0) - (b.calculatedDistance || 0)
        );
        setPlaces(sortedResults);
        onPlacesFound?.(sortedResults);
        setLoading(false);
        return;
      }
      
      const currentKeyword = searchKeywords[searchedKeywords];
      
      const callback = (result: PlaceResult[], status: string, pagination: any) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const filteredResults = result.filter(place => 
            filterPlaceByType(place, locationType)
          );
          
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
  }, [mapInstanceRef, placesServiceRef, onPlacesFound]);

  // 키워드로 장소 검색
  const searchPlacesByKeyword = useCallback((keyword: string) => {
    if (!placesServiceRef.current || !keyword) return;
    
    setLoading(true);
    setError(null);
    
    const callback = (result: PlaceResult[], status: string) => {
      if (status === window.kakao.maps.services.Status.OK) {
        // 현재 지도 중심에서 거리 계산
        const center = mapInstanceRef.current.getCenter();
        const placesWithDistance = result.map(place => {
          const distance = calculateDistance(
            center.getLat(),
            center.getLng(),
            parseFloat(place.y),
            parseFloat(place.x)
          );
          return { ...place, calculatedDistance: distance };
        });
        
        setPlaces(placesWithDistance);
        onPlacesFound?.(placesWithDistance);
      } else if (status === window.kakao.maps.services.Status.ZERO_RESULT) {
        setPlaces([]);
        setError('검색 결과가 없습니다.');
      } else {
        setError('장소 검색 중 오류가 발생했습니다.');
      }
      setLoading(false);
    };
    
    placesServiceRef.current.keywordSearch(keyword, callback);
  }, [mapInstanceRef, placesServiceRef, onPlacesFound]);

  return {
    places,
    loading,
    error,
    searchPlacesByCategory,
    searchPlacesByKeyword
  };
};