// 디버깅 유틸리티
export const debugAuth = () => {
  console.log('=== Authentication Debug Info ===');
  console.log('Access Token:', localStorage.getItem('accessToken'));
  console.log('Refresh Token:', localStorage.getItem('refreshToken'));
  console.log('Is Authenticated Flag:', localStorage.getItem('isAuthenticated'));
  console.log('Session Cookie:', document.cookie);
  console.log('Has sessionid cookie:', document.cookie.includes('sessionid='));
  console.log('Guest ID:', sessionStorage.getItem('guest_id'));
  console.log('================================');
};

// 윈도우 객체에 디버그 함수 추가
if (typeof window !== 'undefined') {
  (window as any).debugAuth = debugAuth;
}
