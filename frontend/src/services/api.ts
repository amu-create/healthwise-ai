// services/api.ts
import axios, { AxiosError } from 'axios';
import tokenManager from './tokenManager';
import i18n from '../i18n';

// 비회원 API 엔드포인트 맵핑
const GUEST_API_ENDPOINTS: { [key: string]: string } = {
  '/ai-workout/': '/guest/ai-workout/',
  '/music/ai-keywords/': '/guest/ai-keywords/',
  '/music/youtube-search/': '/guest/youtube-search/',
  '/user/profile/': '/guest/profile/',
  '/chatbot/sessions/': '/guest/chatbot/sessions/',
  '/chatbot/sessions/active/': '/guest/chatbot/sessions/active/',
  '/chatbot/status/': '/guest/chatbot/status/',
  '/chatbot/': '/guest/chatbot/',
  // '/routines/': '/guest/routines/',  // 제거: 일반 회원도 게스트 API 호출하는 문제 방지
  '/fitness-profile/': '/guest/fitness-profile/',
  '/daily-nutrition/': '/guest/daily-nutrition/',
  '/nutrition-statistics/': '/guest/nutrition-statistics/',
  '/workout-logs/': '/guest/workout-logs/',
  '/recommendations/daily/': '/guest/recommendations/daily/',
};

// 동적 API URL 설정 - 현재 호스트를 기반으로 자동 감지
const getApiBaseUrl = () => {
  // 환경 변수가 설정된 경우 우선 사용
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // 현재 브라우저 URL의 호스트를 기반으로 API URL 생성
  const { protocol, hostname, port } = window.location;
  
  // 프론트엔드가 3000 포트로 실행중인 경우 -> 백엔드는 8000 포트
  if (port === '3000') {
    // 같은 호스트의 8000 포트로 연결
    return `${protocol}//${hostname}:8000/api`;
  }
  
  // localhost 또는 127.0.0.1인 경우
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api';
  }
  
  // 다른 경우 (프로덕션 등)
  return `${protocol}//${hostname}:8000/api`;
};

const API_BASE_URL = getApiBaseUrl();
console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// getAuthHeaders 함수 추가
export const getAuthHeaders = () => {
  const token = tokenManager.getAccessToken();
  const headers: any = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  
  // 현재 언어 설정 추가
  const currentLanguage = i18n.language || 'en';
  headers['Accept-Language'] = currentLanguage;
  
  // localStorage에 저장된 사용자 ID 추가
  const userId = localStorage.getItem('userId');
  if (userId && localStorage.getItem('isAuthenticated') === 'true') {
    headers['X-Auth-User'] = userId;
  }
  
  return headers;
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // 토큰 추가
    const token = tokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // 현재 언어 설정 추가
    const currentLanguage = i18n.language || 'en';
    config.headers['Accept-Language'] = currentLanguage;
    
    // localStorage에 저장된 사용자 ID 추가
    const userId = localStorage.getItem('userId');
    if (userId && localStorage.getItem('isAuthenticated') === 'true') {
      config.headers['X-Auth-User'] = userId;
    }
    
    // 인증 상태 디버깅
    const isAuthenticated = tokenManager.isAuthenticated();
    console.log('[API Request]', config.url, { 
      isAuthenticated, 
      hasToken: !!token,
      hasSessionCookie: document.cookie.includes('sessionid='),
      isAuthFlag: localStorage.getItem('isAuthenticated')
    });
    
    // 비회원인 경우 엔드포인트 변경
    // isAuthFlag가 true이면 로그인한 사용자로 간주하고 게스트 엔드포인트로 리다이렉트하지 않음
    if (!isAuthenticated && config.url && localStorage.getItem('isAuthenticated') !== 'true') {
      // 원래 URL을 비회원용 URL로 변경
      const originalUrl = config.url;
      
      // 특정 패턴에 맞는 URL 처리
      let guestUrl = GUEST_API_ENDPOINTS[originalUrl];
      
      // daily-nutrition의 경우 날짜 파라미터 처리
      if (!guestUrl && originalUrl.startsWith('/daily-nutrition/') && originalUrl !== '/daily-nutrition/') {
        guestUrl = `/guest${originalUrl}`;
      }
      
      if (guestUrl) {
        console.log(`Redirecting to guest endpoint: ${originalUrl} -> ${guestUrl}`);
        config.url = guestUrl;
        
        // 게스트 세션 ID 추가
        const guestId = sessionStorage.getItem('guest_id');
        if (guestId) {
          config.headers['X-Guest-ID'] = guestId;
        }
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // 게스트 정보가 있으면 세션에 저장
    if (response.data?.guest_id) {
      sessionStorage.setItem('guest_id', response.data.guest_id);
    }
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest: any = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        const refreshToken = tokenManager.getRefreshToken();
        if (refreshToken) {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          
          tokenManager.setTokens(response.data.access, response.data.refresh);
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          
          return api(originalRequest);
        }
      } catch (refreshError) {
        tokenManager.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }
    
    // 403 에러 처리 - 비회원에게 친화적인 메시지
    if (error.response?.status === 403) {
      const isAuthenticated = tokenManager.isAuthenticated();
      if (!isAuthenticated) {
        // 비회원인 경우 특별 처리
        console.log('Guest user received 403 - redirecting to guest endpoint');
        
        // 원래 요청이 이미 게스트 엔드포인트인지 확인
        if (!originalRequest.url?.includes('/guest/')) {
          // 게스트 엔드포인트로 재시도
          const originalUrl = originalRequest.url || '';
          const guestUrl = GUEST_API_ENDPOINTS[originalUrl];
          
          if (guestUrl) {
            originalRequest.url = guestUrl;
            return api(originalRequest);
          }
        }
        
        // 게스트 제한 오류로 변환
        error.response.data = {
          ...(error.response.data as any),
          error: '비회원은 이 기능을 사용할 수 없습니다.',
          message: '회원가입 후 모든 기능을 이용해보세요.',
          isGuestLimit: true,
        };
      }
    }
    
    // 429 에러 처리 - 사용 제한
    if (error.response?.status === 429) {
      const data = error.response.data as any;
      console.log('429 Error:', data);
      
      // 게스트 제한 오류로 변환
      error.response.data = {
        ...data,
        error: data.error || '오늘의 사용 횟수를 모두 사용하셨습니다.',
        message: data.message || '회원가입 후 무제한으로 이용해보세요.',
        isGuestLimit: true,
        remaining: 0,
      };
    }
    
    return Promise.reject(error);
  }
);

export default api;
