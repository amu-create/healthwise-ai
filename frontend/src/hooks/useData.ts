/**
 * 데이터 fetching을 위한 전문 훅들
 * SWR 패턴 구현 (stale-while-revalidate)
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../services/api';

interface FetchState<T> {
  data: T | null;
  error: Error | null;
  loading: boolean;
  isValidating: boolean;
}

interface UseFetchOptions {
  revalidateOnFocus?: boolean;
  revalidateOnReconnect?: boolean;
  refreshInterval?: number;
  dedupingInterval?: number;
  initialData?: any;
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
}

// 전역 캐시
const cache = new Map<string, { data: any; timestamp: number }>();

/**
 * 데이터 fetching 훅 (SWR 패턴)
 * 캐싱, 재검증, 에러 재시도 등 포함
 */
export function useFetch<T = any>(
  key: string | null,
  fetcher?: () => Promise<T>,
  options: UseFetchOptions = {}
): FetchState<T> & { mutate: (data?: T) => void; revalidate: () => Promise<void> } {
  const {
    revalidateOnFocus = true,
    revalidateOnReconnect = true,
    refreshInterval,
    dedupingInterval = 2000,
    initialData,
    onSuccess,
    onError,
  } = options;

  // 캐시에서 초기 데이터 가져오기
  const getCachedData = useCallback(() => {
    if (!key) return null;
    const cached = cache.get(key);
    if (cached && Date.now() - cached.timestamp < dedupingInterval) {
      return cached.data;
    }
    return initialData || null;
  }, [key, dedupingInterval, initialData]);

  const [state, setState] = useState<FetchState<T>>({
    data: getCachedData(),
    error: null,
    loading: !getCachedData(),
    isValidating: false,
  });

  const mountedRef = useRef(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  // 데이터 가져오기
  const fetchData = useCallback(async (shouldRevalidate = false) => {
    if (!key || !fetcherRef.current) return;

    try {
      setState(prev => ({
        ...prev,
        loading: !prev.data,
        isValidating: shouldRevalidate,
        error: null,
      }));

      const data = await fetcherRef.current();

      if (mountedRef.current) {
        // 캐시 업데이트
        cache.set(key, { data, timestamp: Date.now() });
        
        setState({
          data,
          error: null,
          loading: false,
          isValidating: false,
        });

        onSuccess?.(data);
      }
    } catch (error) {
      if (mountedRef.current) {
        setState(prev => ({
          ...prev,
          error: error as Error,
          loading: false,
          isValidating: false,
        }));

        onError?.(error as Error);
      }
    }
  }, [key, onSuccess, onError]);

  // 재검증
  const revalidate = useCallback(async () => {
    await fetchData(true);
  }, [fetchData]);

  // 뮤테이션 (낙관적 업데이트)
  const mutate = useCallback((newData?: T) => {
    if (!key) return;
    
    if (newData !== undefined) {
      cache.set(key, { data: newData, timestamp: Date.now() });
      setState(prev => ({ ...prev, data: newData }));
    } else {
      revalidate();
    }
  }, [key, revalidate]);

  // 초기 데이터 로드
  useEffect(() => {
    mountedRef.current = true;
    fetchData();

    return () => {
      mountedRef.current = false;
    };
  }, [key, fetchData]);

  // 포커스 시 재검증
  useEffect(() => {
    if (!revalidateOnFocus || !key) return;

    const handleFocus = () => {
      if (document.visibilityState === 'visible') {
        revalidate();
      }
    };

    document.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, [revalidateOnFocus, key, revalidate]);

  // 재연결 시 재검증
  useEffect(() => {
    if (!revalidateOnReconnect || !key) return;

    const handleOnline = () => {
      revalidate();
    };

    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [revalidateOnReconnect, key, revalidate]);

  // 주기적 재검증
  useEffect(() => {
    if (!refreshInterval || !key) return;

    const interval = setInterval(() => {
      revalidate();
    }, refreshInterval);

    return () => {
      clearInterval(interval);
    };
  }, [refreshInterval, key, revalidate]);

  return {
    ...state,
    mutate,
    revalidate,
  };
}

/**
 * 사용자 통계 데이터 훅
 */
export function useUserStatistics(days: number = 30) {
  return useFetch(
    `/users/me/statistics?days=${days}`,
    async () => {
      const response = await api.get(`/users/me/statistics?days=${days}`);
      return response.data;
    },
    {
      refreshInterval: 60000, // 1분마다 갱신
    }
  );
}

/**
 * 운동 기록 훅
 */
export function useWorkoutLogs(filters?: {
  startDate?: string;
  endDate?: string;
  type?: string;
}) {
  const queryString = new URLSearchParams(
    Object.entries(filters || {}).filter(([_, v]) => v != null) as [string, string][]
  ).toString();

  return useFetch(
    `/workouts${queryString ? `?${queryString}` : ''}`,
    async () => {
      const response = await api.get(`/workouts${queryString ? `?${queryString}` : ''}`);
      return response.data;
    }
  );
}

/**
 * 식단 기록 훅
 */
export function useDietLogs(filters?: {
  startDate?: string;
  endDate?: string;
  mealType?: string;
}) {
  const queryString = new URLSearchParams(
    Object.entries(filters || {}).filter(([_, v]) => v != null) as [string, string][]
  ).toString();

  return useFetch(
    `/nutrition${queryString ? `?${queryString}` : ''}`,
    async () => {
      const response = await api.get(`/nutrition${queryString ? `?${queryString}` : ''}`);
      return response.data;
    }
  );
}

/**
 * 운동 영상 목록 훅
 */
export function useWorkoutVideos(params?: {
  category?: string;
  difficulty?: string;
  search?: string;
  sort?: string;
}) {
  const queryString = new URLSearchParams(
    Object.entries(params || {}).filter(([_, v]) => v != null) as [string, string][]
  ).toString();

  return useFetch(
    `/workout-videos${queryString ? `?${queryString}` : ''}`,
    async () => {
      const response = await api.get(`/workout-videos${queryString ? `?${queryString}` : ''}`);
      return response.data;
    }
  );
}

/**
 * 운동 장소 검색 훅
 */
export function useExerciseLocations(params?: {
  latitude?: number;
  longitude?: number;
  radius?: number;
  type?: string;
}) {
  const queryString = new URLSearchParams(
    Object.entries(params || {}).filter(([_, v]) => v != null).map(([k, v]) => [k, String(v)])
  ).toString();

  return useFetch(
    params?.latitude && params?.longitude
      ? `/map/exercise-locations?${queryString}`
      : null,
    async () => {
      const response = await api.get(`/map/exercise-locations?${queryString}`);
      return response.data;
    }
  );
}

/**
 * 오늘의 추천 훅
 */
export function useDailyRecommendations() {
  return useFetch(
    '/recommendations/today',
    async () => {
      const response = await api.get('/recommendations/today');
      return response.data;
    },
    {
      refreshInterval: 3600000, // 1시간마다 갱신
    }
  );
}

/**
 * 영양 분석 훅
 */
export function useNutritionAnalysis(days: number = 7) {
  return useFetch(
    `/nutrition/balance-analysis?days=${days}`,
    async () => {
      const response = await api.get(`/nutrition/balance-analysis?days=${days}`);
      return response.data;
    }
  );
}

/**
 * 운동 연속 기록 훅
 */
export function useWorkoutStreak() {
  return useFetch(
    '/workouts/streak',
    async () => {
      const response = await api.get('/workouts/streak');
      return response.data;
    },
    {
      refreshInterval: 300000, // 5분마다 갱신
    }
  );
}

// 캐시 클리어 함수
export function clearCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}

// 캐시 프리페치 함수
export async function prefetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<void> {
  try {
    const data = await fetcher();
    cache.set(key, { data, timestamp: Date.now() });
  } catch (error) {
    console.error(`Prefetch failed for key: ${key}`, error);
  }
}
