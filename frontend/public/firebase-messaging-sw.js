// Firebase Service Worker for push notifications
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// 버전 정보 - 변경 시 Service Worker가 업데이트됨
const CACHE_VERSION = 'v2-' + Date.now();

// Firebase 설정
const firebaseConfig = {
  apiKey: "AIzaSyB0EFSo1-2hfyPnqd8vn-oyX-Gc70-djK4",
  authDomain: "lubertpot.firebaseapp.com",
  projectId: "lubertpot",
  storageBucket: "lubertpot.firebasestorage.app",
  messagingSenderId: "697852430189",
  appId: "1:697852430189:web:df8b2048d9830ba24d3c64"
};

// Firebase 초기화
firebase.initializeApp(firebaseConfig);

// Firebase Messaging 인스턴스 가져오기
const messaging = firebase.messaging();

// 백그라운드 메시지 처리
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || 'HealthWise';
  const notificationOptions = {
    body: payload.notification.body || '새로운 알림이 있습니다.',
    icon: '/icon-192x192.png',
    badge: '/badge-72x72.png',
    tag: payload.data?.type || 'general',
    data: payload.data,
    vibrate: [200, 100, 200],
    actions: []
  };

  // 알림 타입에 따른 액션 추가
  if (payload.data?.type === 'workout_reminder') {
    notificationOptions.actions = [
      {
        action: 'start-workout',
        title: '운동 시작',
        icon: '/icons/workout.png'
      },
      {
        action: 'snooze',
        title: '나중에',
        icon: '/icons/snooze.png'
      }
    ];
  } else if (payload.data?.type === 'social_activity') {
    notificationOptions.actions = [
      {
        action: 'view',
        title: '확인',
        icon: '/icons/view.png'
      }
    ];
  }

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('[Service Worker] Notification click Received.');
  
  event.notification.close();

  let targetUrl = '/';
  
  // deep_link가 있으면 해당 URL로 이동
  if (event.notification.data && event.notification.data.deep_link) {
    targetUrl = event.notification.data.deep_link;
  }
  
  // 액션에 따른 처리
  if (event.action === 'start-workout') {
    targetUrl = '/workout';
  } else if (event.action === 'view') {
    targetUrl = event.notification.data?.deep_link || '/social';
  } else if (event.action === 'snooze') {
    // 스누즈 처리 (예: 30분 후 다시 알림)
    self.registration.showNotification('알림 예약', {
      body: '30분 후에 다시 알려드릴게요!',
      icon: '/icon-192x192.png',
      tag: 'snooze-confirm'
    });
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // 이미 열려있는 창이 있으면 포커스
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: targetUrl
          });
          return;
        }
      }
      
      // 열려있는 창이 없으면 새 창 열기
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// 푸시 이벤트 처리 (FCM 이외의 푸시 알림)
self.addEventListener('push', (event) => {
  console.log('[Service Worker] Push Received.');
  
  if (!event.data) {
    console.log('[Service Worker] Push event but no data');
    return;
  }

  try {
    const data = event.data.json();
    const title = data.title || 'HealthWise 알림';
    const options = {
      body: data.body || '새로운 알림이 있습니다.',
      icon: data.icon || '/icon-192x192.png',
      badge: data.badge || '/badge-72x72.png',
      data: data.data || {},
      vibrate: [200, 100, 200]
    };

    event.waitUntil(
      self.registration.showNotification(title, options)
    );
  } catch (error) {
    console.error('[Service Worker] Error parsing push data:', error);
  }
});

// Service Worker 설치 - 즉시 활성화
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  console.log('[Service Worker] Version:', CACHE_VERSION);
  
  // 모든 캐시 삭제
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[Service Worker] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[Service Worker] Skip waiting');
      return self.skipWaiting();
    })
  );
});

// Service Worker 활성화
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  console.log('[Service Worker] Version:', CACHE_VERSION);
  
  event.waitUntil(
    // 모든 캐시 삭제
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('[Service Worker] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients');
      return clients.claim();
    })
  );
});

// Fetch 이벤트 - 캐싱하지 않음
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // 모든 요청을 네트워크에서 가져옴 (캐시 사용 안 함)
  event.respondWith(
    fetch(request, { 
      cache: 'no-store',
      credentials: 'same-origin'
    }).catch((error) => {
      console.error('[Service Worker] Fetch failed:', error);
      // 오프라인 페이지 반환 가능
      return new Response('오프라인 상태입니다.', {
        status: 503,
        statusText: 'Service Unavailable',
        headers: new Headers({
          'Content-Type': 'text/plain; charset=utf-8'
        })
      });
    })
  );
});
