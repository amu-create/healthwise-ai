// 프로필 이미지 URL을 가져오는 유틸리티 함수

interface UserWithProfile {
  id: number;
  username?: string;
  email?: string;
  profile_picture_url?: string;
  profile?: {
    profile_image?: string;
  };
  profile_image?: string;
  avatar_url?: string;
  user?: {
    id: number;
    username: string;
    email: string;
  };
}

export const getProfileImageUrl = (user: UserWithProfile | null | undefined | any): string | undefined => {
  if (!user) return undefined;

  // 1. profile_picture_url 확인 (Social 프로필)
  if (user.profile_picture_url) {
    return user.profile_picture_url;
  }
  
  // 2. profile.profile_image 확인 (메인 프로필)
  if (user.profile?.profile_image) {
    // 이미 절대 URL인 경우
    if (user.profile.profile_image.startsWith('http')) {
      return user.profile.profile_image;
    }
    // 상대 URL인 경우
    return `http://localhost:8000${user.profile.profile_image}`;
  }
  
  // 3. profile_image 직접 확인
  if (user.profile_image) {
    if (user.profile_image.startsWith('http')) {
      return user.profile_image;
    }
    return `http://localhost:8000${user.profile_image}`;
  }
  
  // 4. avatar_url 확인 (호환성)
  if (user.avatar_url) {
    if (user.avatar_url.startsWith('http')) {
      return user.avatar_url;
    }
    return `http://localhost:8000${user.avatar_url}`;
  }
  
  return undefined;
};

// 네트워크 환경에 따른 URL 생성
export const getApiUrl = (path: string): string => {
  const hostname = window.location.hostname;
  
  // 로컬호스트가 아닌 경우 (네트워크 접속)
  if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
    return `http://${hostname}:8000${path}`;
  }
  
  // 로컬호스트인 경우
  return `http://localhost:8000${path}`;
};

// 프로필 이미지 URL을 네트워크 환경에 맞게 조정
export const getNetworkAwareProfileImageUrl = (user: UserWithProfile | null | undefined | any): string | undefined => {
  const imageUrl = getProfileImageUrl(user);
  
  if (!imageUrl) return undefined;
  
  // 이미 절대 URL인 경우
  if (imageUrl.startsWith('http')) {
    // localhost를 현재 호스트로 변경
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return imageUrl.replace('http://localhost:8000', `http://${hostname}:8000`);
    }
  }
  
  return imageUrl;
};
