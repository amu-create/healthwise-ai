// API URL을 동적으로 설정하는 헬퍼 함수
export const getApiUrl = () => {
  // 환경 변수에 설정된 URL이 있으면 사용
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // 현재 호스트를 기반으로 API URL 생성
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  
  // localhost나 127.0.0.1인 경우
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:8000/api';
  }
  
  // 네트워크 IP로 접속한 경우 (예: 192.168.x.x)
  if (hostname.match(/^192\.168\.\d+\.\d+$/)) {
    return `http://${hostname}:8000/api`;
  }
  
  // ngrok 등 외부 도메인으로 접속한 경우
  // API URL도 동일한 도메인 사용 (포트 변경)
  return `${protocol}//${hostname}:8000/api`;
};

// WebSocket URL을 동적으로 설정하는 헬퍼 함수
export const getWebSocketUrl = () => {
  const apiUrl = getApiUrl();
  return apiUrl.replace(/^http/, 'ws');
};
