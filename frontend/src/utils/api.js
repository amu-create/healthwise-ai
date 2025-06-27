import axios from 'axios';

// API 기본 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// axios 인스턴스 생성
export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
api.interceptors.request.use(
  (config) => {
    // CSRF 토큰 추가
    const csrfToken = getCookie('csrftoken');
    if (csrfToken) {
      config.headers['X-CSRFToken'] = csrfToken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // 인증 오류 처리
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// CSRF 토큰 가져오기
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// API 엔드포인트
export const endpoints = {
  // 인증
  login: '/api/auth/login/',
  logout: '/api/auth/logout/',
  register: '/api/auth/register/',
  profile: '/api/user/profile/',
  
  // 챗봇
  chatbot: '/api/chatbot/',
  chatbotHistory: '/api/chatbot/history/',
  chatbotStatus: '/api/chatbot/status/',
  
  // 추천
  dailyRecommendations: '/api/recommendations/daily/',
  
  // 기타
  healthOptions: '/api/options/health/',
};

export default api;
