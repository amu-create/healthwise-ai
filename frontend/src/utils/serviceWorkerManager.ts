// 서비스 워커 등록 및 관리
export const serviceWorkerManager = {
  register: async () => {
    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      try {
        const registration = await navigator.serviceWorker.register('/service-worker.js');
        
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // 새 버전 발견
                console.log('New version available! Please refresh.');
                
                // 사용자에게 알림
                if (window.confirm('새로운 버전이 있습니다. 페이지를 새로고침하시겠습니까?')) {
                  newWorker.postMessage({ type: 'SKIP_WAITING' });
                  window.location.reload();
                }
              }
            });
          }
        });
        
        // 주기적으로 업데이트 확인 (1시간마다)
        setInterval(() => {
          registration.update();
        }, 1000 * 60 * 60);
        
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  },
  
  unregister: async () => {
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
      }
    }
  },
  
  clearCache: async () => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'CLEAR_CACHE' });
    }
  }
};
