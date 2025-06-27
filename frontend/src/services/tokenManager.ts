// Token 관리를 위한 별도 모듈
class TokenManager {
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    // 초기화 시 로컬 스토리지에서 토큰 복원
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  getRefreshToken(): string | null {
    return this.refreshToken;
  }

  setTokens(access: string, refresh: string): void {
    this.accessToken = access;
    this.refreshToken = refresh;
    localStorage.setItem('accessToken', access);
    localStorage.setItem('refreshToken', refresh);
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    // 세션 쿠키도 확인
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userId');
  }

  isAuthenticated(): boolean {
    // 게스트 상태 확인 - 게스트면 무조건 false
    const isGuest = localStorage.getItem('isGuest') === 'true';
    if (isGuest) {
      console.log('[TokenManager] Guest user detected, returning false');
      return false;
    }

    // JWT 토큰이 있거나 세션 인증이 있는 경우
    if (this.accessToken) {
      return true;
    }
    
    // Django 세션 기반 인증 확인
    // 쿠키 파싱을 더 정확하게 수행
    const cookies = document.cookie.split(';').map(c => c.trim());
    const hasSessionCookie = cookies.some(cookie => {
      const [name, value] = cookie.split('=');
      return name === 'sessionid' && value && value !== '';
    });
    
    // localStorage에 인증 플래그 확인
    const isAuthenticatedFlag = localStorage.getItem('isAuthenticated') === 'true';
    
    // 둘 중 하나라도 있으면 인증된 것으로 간주
    const result = hasSessionCookie || isAuthenticatedFlag;
    
    console.log('[TokenManager] isAuthenticated check:', {
      hasAccessToken: !!this.accessToken,
      hasSessionCookie,
      isAuthenticatedFlag,
      isGuest,
      result
    });
    
    return result;
  }
  
  // 세션 기반 인증 설정
  setAuthenticated(authenticated: boolean): void {
    localStorage.setItem('isAuthenticated', authenticated.toString());
  }
}

const tokenManager = new TokenManager();
export default tokenManager;
