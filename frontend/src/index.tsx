import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import './styles/globalScrollbar.css'; // 전역 스크롤바 스타일
import './styles/muiScrollbar.css'; // MUI 테마 스크롤바 스타일
import App from './App';
import reportWebVitals from './reportWebVitals';

// Service Worker 강제 업데이트
if ('serviceWorker' in navigator) {
  // 기존 Service Worker 제거
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    for (let registration of registrations) {
      registration.unregister().then(() => {
        console.log('Service Worker unregistered:', registration.scope);
      });
    }
  });
  
  // 캐시 삭제
  if ('caches' in window) {
    caches.keys().then((names) => {
      for (let name of names) {
        caches.delete(name).then(() => {
          console.log('Cache deleted:', name);
        });
      }
    });
  }
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

// 개발 환경에서 StrictMode 비활성화 (캐시 문제 디버깅용)
if (process.env.NODE_ENV === 'development') {
  root.render(<App />);
} else {
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
