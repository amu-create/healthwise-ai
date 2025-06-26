// 게스트 사용자 기능 제한 관리 서비스

interface GuestUsage {
  AI_WORKOUT: number;
  AI_CHAT: number;
  AI_MUSIC: number;
  EXERCISE_MAP: number;
  lastReset: string;
}

const DAILY_LIMITS = {
  AI_WORKOUT: 3,  // 백엔드 GUEST_API_LIMIT = 3과 동일
  AI_CHAT: 3,
  AI_MUSIC: 3,
  EXERCISE_MAP: 3,
};

class GuestLimitsService {
  private readonly STORAGE_KEY = 'guestUsage';
  private readonly GUEST_ID_KEY = 'guestId';

  // 게스트 ID 가져오기 (없으면 생성)
  getGuestId(): string {
    // sessionStorage에서 먼저 확인 (페이지 새로고침 시 유지)
    let guestId = sessionStorage.getItem('guest_id');
    
    // localStorage에서 확인 (브라우저 재시작 시 유지)
    if (!guestId) {
      guestId = localStorage.getItem(this.GUEST_ID_KEY);
    }
    
    // 없으면 새로 생성
    if (!guestId) {
      // UUID v4 형식으로 생성
      guestId = crypto.randomUUID();
      sessionStorage.setItem('guest_id', guestId);
      localStorage.setItem(this.GUEST_ID_KEY, guestId);
    } else {
      // 두 저장소에 모두 저장
      sessionStorage.setItem('guest_id', guestId);
      localStorage.setItem(this.GUEST_ID_KEY, guestId);
    }
    
    return guestId;
  }

  // 사용 기록 가져오기
  private getUsage(): GuestUsage {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      return this.createInitialUsage();
    }

    const usage = JSON.parse(stored);
    
    // 날짜가 바뀌었으면 초기화
    if (this.shouldReset(usage.lastReset)) {
      return this.createInitialUsage();
    }

    return usage;
  }

  // 초기 사용 기록 생성
  private createInitialUsage(): GuestUsage {
    const usage = {
      AI_WORKOUT: 0,
      AI_CHAT: 0,
      AI_MUSIC: 0,
      EXERCISE_MAP: 0,
      lastReset: new Date().toDateString(),
    };
    this.saveUsage(usage);
    return usage;
  }

  // 사용 기록 저장
  private saveUsage(usage: GuestUsage): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(usage));
  }

  // 리셋 필요 여부 확인
  private shouldReset(lastReset: string): boolean {
    const today = new Date().toDateString();
    return lastReset !== today;
  }

  // 기능 사용 가능 여부 확인
  canUseFeature(feature: keyof typeof DAILY_LIMITS): boolean {
    const usage = this.getUsage();
    return usage[feature] < DAILY_LIMITS[feature];
  }

  // 남은 사용 횟수 반환
  getRemainingUses(feature: keyof typeof DAILY_LIMITS): number {
    const usage = this.getUsage();
    return Math.max(0, DAILY_LIMITS[feature] - usage[feature]);
  }

  // 사용 횟수 증가
  incrementUsage(feature: keyof typeof DAILY_LIMITS): boolean {
    const usage = this.getUsage();
    if (usage[feature] < DAILY_LIMITS[feature]) {
      usage[feature]++;
      this.saveUsage(usage);
      return true;
    }
    return false;
  }

  // 사용한 횟수 가져오기
  getUsedCount(feature: keyof typeof DAILY_LIMITS): number {
    const usage = this.getUsage();
    return usage[feature];
  }

  // 모든 사용 기록 초기화
  resetAllUsage(): void {
    this.createInitialUsage();
  }

  // 특정 기능의 사용 기록 초기화
  resetFeatureUsage(feature: keyof typeof DAILY_LIMITS): void {
    const usage = this.getUsage();
    usage[feature] = 0;
    this.saveUsage(usage);
  }

  // 모든 기능의 남은 사용 횟수 가져오기
  getAllRemainingUses(): Record<keyof typeof DAILY_LIMITS, number> {
    const usage = this.getUsage();
    return {
      AI_WORKOUT: Math.max(0, DAILY_LIMITS.AI_WORKOUT - usage.AI_WORKOUT),
      AI_CHAT: Math.max(0, DAILY_LIMITS.AI_CHAT - usage.AI_CHAT),
      AI_MUSIC: Math.max(0, DAILY_LIMITS.AI_MUSIC - usage.AI_MUSIC),
      EXERCISE_MAP: Math.max(0, DAILY_LIMITS.EXERCISE_MAP - usage.EXERCISE_MAP),
    };
  }

  // 디버깅용 - 현재 사용 상태 출력
  debugUsage(): void {
    const usage = this.getUsage();
    console.log('Guest Usage Status:', {
      usage,
      limits: DAILY_LIMITS,
      remaining: this.getAllRemainingUses(),
    });
  }

  // 특정 기능의 사용 횟수를 최대치로 설정 (백엔드와 동기화)
  setFeatureUsageToMax(feature: keyof typeof DAILY_LIMITS): void {
    const usage = this.getUsage();
    usage[feature] = DAILY_LIMITS[feature];
    this.saveUsage(usage);
  }
}

export const guestLimitsService = new GuestLimitsService();
