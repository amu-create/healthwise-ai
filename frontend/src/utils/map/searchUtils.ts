import { LocationType } from '../../types/map';

// 카테고리별 검색 키워드
export const getSearchKeywords = (locationType: LocationType): string[] => {
  switch (locationType) {
    case '헬스장':
      return ['헬스장', '피트니스', '체육관', '운동센터', '스포츠센터'];
    case '요가원':
      return ['요가', '요가원', '필라테스'];
    case '필라테스':
      return ['필라테스'];
    case '크로스핏':
      return ['크로스핏', 'crossfit'];
    case '수영장':
      return ['수영장', '스위밍'];
    case '무술도장':
      return ['태권도', '합기도', '유도', '검도', '무술'];
    case '댄스학원':
      return ['댄스', '무용', '댄스학원'];
    default:
      return [locationType];
  }
};

// 장소 필터링
export const filterPlaceByType = (place: any, locationType: LocationType): boolean => {
  const name = place.place_name.toLowerCase();
  const category = place.category_name.toLowerCase();
  
  switch (locationType) {
    case '헬스장':
      return name.includes('헬스') || name.includes('피트니스') || name.includes('짐') || 
             category.includes('헬스') || category.includes('스포츠');
    case '요가원':
      return name.includes('요가') || category.includes('요가');
    case '필라테스':
      return name.includes('필라테스') || category.includes('필라테스');
    case '크로스핏':
      return name.includes('크로스핏') || name.includes('crossfit');
    case '수영장':
      return name.includes('수영') || category.includes('수영');
    case '무술도장':
      return name.includes('무술') || name.includes('태권도') || name.includes('합기도') || 
             name.includes('유도') || name.includes('검도') || category.includes('무술');
    case '댄스학원':
      return name.includes('댄스') || name.includes('무용') || category.includes('댄스');
    default:
      return true;
  }
};

// 검색 반경에 따른 줌 레벨
export const getZoomLevelByRadius = (radius: number): number => {
  if (radius <= 0.5) return 5;
  if (radius <= 1) return 4;
  if (radius <= 2) return 3;
  if (radius <= 3) return 2;
  return 1;
};