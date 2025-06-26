import { PlaceResult } from '../../types/map';

// 오버레이 콘텐츠 생성 함수
export const createPlaceOverlay = (place: PlaceResult, categoryIcon: string, locationType: string, directionsText: string) => {
  return `
    <div style="
      position: relative;
      background: white;
      border-radius: 12px;
      padding: 0;
      box-shadow: 0 2px 16px rgba(0,0,0,0.15);
      min-width: 320px;
      max-width: 360px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      overflow: hidden;
    ">
      <div style="
        position: absolute;
        bottom: -8px;
        left: 50%;
        transform: translateX(-50%);
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 8px solid white;
        z-index: 1;
      "></div>
      
      <div style="
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 16px;
        display: flex;
        align-items: center;
        gap: 12px;
      ">
        <div style="
          width: 48px;
          height: 48px;
          background: rgba(255,255,255,0.2);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        ">
          ${categoryIcon}
        </div>
        <div style="flex: 1;">
          <div style="
            color: rgba(255,255,255,0.9);
            font-size: 12px;
            margin-bottom: 2px;
          ">
            ${locationType}
          </div>
          <h3 style="
            margin: 0;
            font-size: 18px;
            font-weight: 600;
            color: white;
            line-height: 1.2;
          ">
            ${place.place_name}
          </h3>
        </div>
      </div>
      
      <div style="padding: 16px;">
        
        <div style="display: flex; align-items: center; gap: 4px; font-size: 14px; color: #666; margin-bottom: 6px;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          ${place.road_address_name || place.address_name}
        </div>
        
        ${place.phone ? `
          <div style="display: flex; align-items: center; gap: 4px; font-size: 14px; color: #666; margin-bottom: 6px;">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" stroke-width="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
            ${place.phone}
          </div>
        ` : ''}
        
        <div style="
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #eee;
        ">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span style="
              background: #e3f2fd;
              color: #1976d2;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 13px;
              font-weight: 500;
            ">
              ${(place.calculatedDistance ? place.calculatedDistance / 1000 : 0).toFixed(1)}km
            </span>
            <span style="
              font-size: 12px;
              color: #999;
            ">
              ${place.category_name.split('>').pop()?.trim() || ''}
            </span>
          </div>
          
          <button onclick="window.open('${place.place_url}', '_blank')" style="
            background: #0068c3;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 14px;
            cursor: pointer;
            font-weight: 500;
            display: flex;
            align-items: center;
            gap: 4px;
            transition: background 0.2s;
          "
          onmouseover="this.style.backgroundColor='#0052a3'"
          onmouseout="this.style.backgroundColor='#0068c3'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2">
              <path d="M3 12h18m0 0l-6-6m6 6l-6 6"/>
            </svg>
            ${directionsText}
          </button>
        </div>
      </div>
      
      <button onclick="this.parentElement.style.display='none'" style="
        position: absolute;
        top: 12px;
        right: 12px;
        background: rgba(255,255,255,0.9);
        border: none;
        width: 28px;
        height: 28px;
        border-radius: 50%;
        font-size: 16px;
        cursor: pointer;
        color: #666;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        line-height: 1;
      "
      onmouseover="this.style.backgroundColor='rgba(255,255,255,1)'; this.style.transform='scale(1.1)'"
      onmouseout="this.style.backgroundColor='rgba(255,255,255,0.9)'; this.style.transform='scale(1)'"
      >×</button>
    </div>
  `;
};

// 카테고리 아이콘 선택
export const getCategoryIcon = (categoryName: string, locationType: string): string => {
  const lowerCaseName = categoryName.toLowerCase();
  const lowerCaseType = locationType.toLowerCase();
  
  // Check both category name and location type for better matching
  if (lowerCaseName.includes('gym') || lowerCaseName.includes('fitness') || 
      lowerCaseName.includes('헬스') || lowerCaseName.includes('피트니스') ||
      lowerCaseType.includes('gym') || lowerCaseType.includes('fitness')) {
    return '🏋️';
  } else if (lowerCaseName.includes('yoga') || lowerCaseName.includes('요가') ||
            lowerCaseType.includes('yoga')) {
    return '🧘';
  } else if (lowerCaseName.includes('pilates') || lowerCaseName.includes('필라테스') ||
            lowerCaseType.includes('pilates')) {
    return '🤸';
  } else if (lowerCaseName.includes('swim') || lowerCaseName.includes('수영') ||
            lowerCaseType.includes('swim')) {
    return '🏊';
  } else if (lowerCaseName.includes('crossfit') || lowerCaseName.includes('크로스핏') ||
            lowerCaseType.includes('crossfit')) {
    return '🎪';
  } else if (lowerCaseName.includes('martial') || lowerCaseName.includes('무술') ||
            lowerCaseName.includes('태권도') || lowerCaseType.includes('martial')) {
    return '🥋';
  } else if (lowerCaseName.includes('dance') || lowerCaseName.includes('댄스') ||
            lowerCaseType.includes('dance')) {
    return '💃';
  }
  return '📍';
};