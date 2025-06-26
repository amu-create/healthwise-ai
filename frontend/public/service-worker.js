// 서비스 워커 설정
/* eslint-disable no-restricted-globals */

// 버전 관리
const CACHE_VERSION = 'v1.0.0';
const CACHE_NAME = `healthwise-${CACHE_VERSION}`;

// 캐시하지 않을 URL 패턴
const NO_CACHE_PATTERNS = [
  /\/api\//,  // API 요청
  /\.json$/,  // JSON 파일
  /manifest\.json$/,
  /\/sockjs-node\//,  // 개발 서버 WebSocket
];

// 캐시할 정적 리소스
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/bundle.js',
];

// Install 이벤트
self.addEventListener('install', (event) => {
  console.log('Service Worker installing with version:', CACHE_VERSION);
  
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_CACHE_URLS).catch((error) => {
        console.error('Failed to cache static resources:', error);
      });
    })
  );
  
  // 즉시 활성화
  self.skipWaiting();
});

// Activate 이벤트
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // 이전 버전 캐시 삭제
          if (cacheName !== CACHE_NAME && cacheName.startsWith('healthwise-')) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  // 모든 클라이언트 즉시 제어
  self.clients.claim();
});

// Fetch 이벤트
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // 캐시하지 않을 URL 체크
  const shouldNotCache = NO_CACHE_PATTERNS.some(pattern => pattern.test(url.pathname));
  
  if (shouldNotCache) {
    // 네트워크 요청만 사용 (캐시 없음)
    event.respondWith(fetch(request));
    return;
  }
  
  // 네트워크 우선 전략
  event.respondWith(
    fetch(request)
      .then((response) => {
        // 성공적인 응답이면 캐시에 저장
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        
        return response;
      })
      .catch(() => {
        // 네트워크 실패시 캐시에서 가져오기
        return caches.match(request);
      })
  );
});

// 메시지 수신 (강제 업데이트 등)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      })
    );
  }
});
