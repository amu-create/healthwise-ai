import api from './api';
import tokenManager from './tokenManager';

export interface LoginData {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  password2: string;
  age: number;
  height: number;
  weight: number;
  gender: 'M' | 'F' | 'O';
  exercise_experience: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  diseases?: string[];
  allergies?: string[];
}

export interface User {
  id: number;
  email: string;
  username: string;
  created_at?: string;
  profile?: {
    age: number;
    height: number;
    weight: number;
    gender: string;
    exercise_experience: string;
    diseases: string[];
    allergies: string[];
    profile_image?: string;
  };
}

export interface HealthOptions {
  diseases: string[];
  allergies: string[];
}

class AuthService {

  // 로그인
  async login(data: LoginData) {
    const response = await api.post('/auth/login/', data);
    if (response.data.access && response.data.refresh) {
      // JWT 토큰 방식
      tokenManager.setTokens(response.data.access, response.data.refresh);
    } else {
      // 세션 기반 인증
      tokenManager.setAuthenticated(true);
      // 사용자 ID 저장
      if (response.data.user && response.data.user.id) {
        localStorage.setItem('userId', response.data.user.id.toString());
      }
      // 세션 ID가 있으면 로그에 출력
      if (response.data.session_id) {
        console.log('Session ID received:', response.data.session_id);
      }
    }
    return response.data;
  }

  // 회원가입
  async register(data: RegisterData) {
    const response = await api.post('/auth/register/', data);
    return response.data;
  }

  // 로그아웃
  async logout() {
    try {
      const response = await api.post('/auth/logout/');
      tokenManager.clearTokens();
      tokenManager.setAuthenticated(false);
      return response.data;
    } catch (error) {
      // 로그아웃 실패해도 로컬 토큰은 삭제
      console.error('Logout API call failed:', error);
      tokenManager.clearTokens();
      tokenManager.setAuthenticated(false);
    }
  }

  // 현재 사용자 정보 가져오기
  async getCurrentUser() {
    const response = await api.get('/user/profile/');
    return response.data;
  }

  // 프로필 업데이트
  async updateProfile(data: {
    age?: number;
    height?: number;
    weight?: number;
    gender?: string;
    exercise_experience?: string;
    diseases?: string[];
    allergies?: string[];
  }) {
    const response = await api.patch('/user/profile/', data);
    return response.data;
  }

  // 비밀번호 변경
  async changePassword(oldPassword: string, newPassword: string, newPassword2: string) {
    const response = await api.post('/user/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      new_password2: newPassword2,
    });
    return response.data;
  }

  // 이메일 중복 확인
  async checkEmail(email: string) {
    const response = await api.get(`/auth/check-email/?email=${email}`);
    return response.data;
  }

  // 건강 옵션 가져오기
  async getHealthOptions(): Promise<HealthOptions> {
    // 현재 언어 가져오기
    const currentLang = localStorage.getItem('i18nextLng') || 'ko';
    const response = await api.get(`/options/health/?lang=${currentLang}`);
    return response.data;
  }
}

// 인증 헤더 생성 함수
export function getAuthHeaders() {
  // 게스트 모드 확인
  const isGuest = localStorage.getItem('isGuest') === 'true';
  if (isGuest) {
    return {
      'X-Guest-ID': localStorage.getItem('guestId') || '',
      'X-Is-Guest': 'true'
    };
  }

  // 일반 사용자 토큰 확인
  const token = tokenManager.getAccessToken();
  if (token) {
    return {
      'Authorization': `Bearer ${token}`
    };
  }

  return {};
}

const authService = new AuthService();
export default authService;
