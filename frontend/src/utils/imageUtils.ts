/**
 * 이미지 URL 유틸리티 함수
 */

/**
 * 백엔드에서 받은 이미지 URL을 전체 URL로 변환
 */
export const getFullImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return '';
  
  // 이미 전체 URL인 경우 그대로 반환
  if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
    return imageUrl;
  }
  
  // 상대 경로인 경우 백엔드 URL과 결합
  const backendHost = window.location.hostname;
  const backendPort = 8000;
  const baseUrl = `http://${backendHost}:${backendPort}`;
  
  // '/media/'로 시작하지 않으면 추가
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`;
  
  return `${baseUrl}${path}`;
};

/**
 * 이미지 로드 에러 처리를 위한 대체 이미지 URL 반환
 */
export const getFallbackImageUrl = (): string => {
  return ''; // 대체 이미지가 없으면 빈 문자열 반환
};

/**
 * 이미지 캐시 버스팅을 위한 타임스탬프 추가
 */
export const addCacheBuster = (url: string): string => {
  if (!url) return '';
  
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}t=${Date.now()}`;
};
