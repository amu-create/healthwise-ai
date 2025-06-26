// API 설정
const getApiUrl = () => {
  // 개발 환경에서는 현재 호스트를 기반으로 API URL 설정
  if (process.env.NODE_ENV === 'development') {
    const currentHost = window.location.hostname;
    return `http://${currentHost}:8000/api`;
  }
  // 프로덕션 환경에서는 환경 변수 사용
  return process.env.REACT_APP_API_URL || 'http://localhost:8000/api';
};

export const API_URL = getApiUrl();

// axios 기본 설정
export const axiosConfig = {
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  }
};

console.log('API URL configured:', API_URL);
