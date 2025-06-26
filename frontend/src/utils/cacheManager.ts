// 캐시 무효화 유틸리티
export const cacheManager = {
  // 버전 관리를 통한 캐시 무효화
  version: process.env.REACT_APP_VERSION || '1.0.0',
  
  // 강제 새로고침
  forceRefresh: function() {
    // 모든 캐시 삭제
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          caches.delete(name);
        });
      });
    }
    
    // 서비스 워커 업데이트
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(registrations => {
        registrations.forEach(registration => {
          registration.unregister();
        });
      });
    }
    
    // 캐시된 데이터 클리어
    localStorage.removeItem('cached_data');
    sessionStorage.clear();
  },
  
  // API 요청시 캐시 방지 헤더 추가
  getNoCacheHeaders: () => ({
    'Cache-Control': 'no-cache, no-store, must-revalidate',
    'Pragma': 'no-cache'
    // 'Expires' 헤더 제거 - CORS 오류 원인
  }),
  
  // URL에 버전 파라미터 추가
  addVersionToUrl: function(url: string) {
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}v=${cacheManager.version}`;
  }
};

// 앱 시작시 캐시 체크
export const checkCacheOnStartup = () => {
  const storedVersion = localStorage.getItem('app_version');
  const currentVersion = cacheManager.version;
  
  if (!storedVersion || storedVersion !== currentVersion) {
    console.log('New version detected, clearing cache...');
    // 버전 업데이트 먼저!
    localStorage.setItem('app_version', currentVersion);
    
    // 캐시 클리어
    cacheManager.forceRefresh();
    
    // 이전 버전이 있었을 때만 새로고침 (최초 실행이 아닐 때)
    if (storedVersion && storedVersion !== currentVersion) {
      console.log('Reloading for version update...');
      setTimeout(() => {
        window.location.reload();
      }, 100);
    }
  }
};
