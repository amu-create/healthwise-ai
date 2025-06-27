// 위치 변경 이력 관리 유틸리티

export interface LocationHistory {
  timestamp: Date;
  location: {
    lat: number;
    lng: number;
    accuracy?: number;
    source?: string;
  };
  label?: string;
  url: string;
  event: string;
}

const HISTORY_KEY = 'healthwise_location_history';
const MAX_HISTORY = 50; // 최대 저장 개수

export const locationHistory = {
  // 위치 변경 기록 저장
  addHistory: (location: any, label?: string, event: string = 'manual') => {
    try {
      const history = locationHistory.getHistory();
      const newEntry: LocationHistory = {
        timestamp: new Date(),
        location: {
          lat: location.lat,
          lng: location.lng,
          accuracy: location.accuracy,
          source: location.source
        },
        label,
        url: window.location.href,
        event
      };
      
      history.unshift(newEntry);
      
      // 최대 개수 제한
      if (history.length > MAX_HISTORY) {
        history.length = MAX_HISTORY;
      }
      
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
      console.log('[LocationHistory] Saved:', newEntry);
    } catch (error) {
      console.error('[LocationHistory] Failed to save:', error);
    }
  },

  // 이력 가져오기
  getHistory: (): LocationHistory[] => {
    try {
      const stored = localStorage.getItem(HISTORY_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('[LocationHistory] Failed to load:', error);
    }
    return [];
  },

  // 이력 초기화
  clearHistory: () => {
    localStorage.removeItem(HISTORY_KEY);
    console.log('[LocationHistory] History cleared');
  },

  // 최근 이력 출력 (디버깅용)
  printRecentHistory: (count: number = 10) => {
    const history = locationHistory.getHistory();
    const recent = history.slice(0, count);
    
    console.group('[LocationHistory] Recent ' + count + ' entries:');
    recent.forEach((entry, index) => {
      console.log(`${index + 1}. ${new Date(entry.timestamp).toLocaleString()}`);
      console.log(`   Location: ${entry.location.lat}, ${entry.location.lng}`);
      console.log(`   Source: ${entry.location.source}, Accuracy: ${entry.location.accuracy}m`);
      console.log(`   Label: ${entry.label || 'N/A'}`);
      console.log(`   Event: ${entry.event}`);
      console.log(`   URL: ${entry.url}`);
    });
    console.groupEnd();
  }
};

// 전역에서 사용할 수 있도록 window 객체에 추가
if (typeof window !== 'undefined') {
  (window as any).locationHistory = locationHistory;
}
