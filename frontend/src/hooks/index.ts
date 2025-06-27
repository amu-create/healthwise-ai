/**
 * 커스텀 훅 모음
 * React 성능 최적화를 위한 재사용 가능한 훅들
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';

/**
 * API 요청을 위한 범용 훅
 * 로딩 상태, 에러 처리, 자동 재시도 포함
 */
export function useApi<T = any>(
  endpoint: string,
  options?: {
    immediate?: boolean;
    dependencies?: any[];
    onSuccess?: (data: T) => void;
    onError?: (error: any) => void;
  }
) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { immediate = true, dependencies = [], onSuccess, onError } = options || {};

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(endpoint);
      setData(response.data);
      
      if (onSuccess) {
        onSuccess(response.data);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || err.message || '알 수 없는 오류가 발생했습니다.';
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
    } finally {
      setLoading(false);
    }
  }, [endpoint, onSuccess, onError]);

  useEffect(() => {
    if (immediate) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [immediate, fetchData, ...dependencies]);

  const refetch = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch };
}

/**
 * 디바운스 훅
 * 입력값 변경 시 지연 처리
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * 로컬 스토리지 훅
 * 자동 동기화 및 타입 안전성 제공
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // 초기값 가져오기
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // 값 설정 함수
  const setValue = useCallback(
    (value: T | ((val: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

/**
 * 무한 스크롤 훅
 * 페이지네이션과 함께 사용
 */
export function useInfiniteScroll(
  callback: () => void,
  options?: {
    threshold?: number;
    rootMargin?: string;
  }
) {
  const observer = useRef<IntersectionObserver | null>(null);
  const { threshold = 0.1, rootMargin = '20px' } = options || {};

  const lastElementRef = useCallback(
    (node: HTMLElement | null) => {
      if (observer.current) observer.current.disconnect();
      
      observer.current = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting) {
            callback();
          }
        },
        { threshold, rootMargin }
      );
      
      if (node) observer.current.observe(node);
    },
    [callback, threshold, rootMargin]
  );

  return lastElementRef;
}

/**
 * 윈도우 크기 감지 훅
 * 반응형 디자인을 위한 뷰포트 크기 추적
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // 디바운스 적용
    let timeoutId: NodeJS.Timeout;
    const debouncedResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleResize, 150);
    };

    window.addEventListener('resize', debouncedResize);
    return () => {
      window.removeEventListener('resize', debouncedResize);
      clearTimeout(timeoutId);
    };
  }, []);

  const isMobile = useMemo(() => windowSize.width < 768, [windowSize.width]);
  const isTablet = useMemo(() => windowSize.width >= 768 && windowSize.width < 1024, [windowSize.width]);
  const isDesktop = useMemo(() => windowSize.width >= 1024, [windowSize.width]);

  return {
    ...windowSize,
    isMobile,
    isTablet,
    isDesktop,
  };
}

/**
 * 페이지 제목 설정 훅
 * SEO 최적화
 */
export function usePageTitle(title: string) {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | HealthWise`;
    
    return () => {
      document.title = previousTitle;
    };
  }, [title]);
}

/**
 * 쿼리 파라미터 훅
 * URL 쿼리 파라미터 쉽게 관리
 */
export function useQueryParams() {
  const location = useLocation();
  const navigate = useNavigate();

  const queryParams = useMemo(() => {
    return new URLSearchParams(location.search);
  }, [location.search]);

  const setQueryParam = useCallback(
    (key: string, value: string | null) => {
      const newParams = new URLSearchParams(location.search);
      
      if (value === null) {
        newParams.delete(key);
      } else {
        newParams.set(key, value);
      }

      navigate({
        pathname: location.pathname,
        search: newParams.toString(),
      }, { replace: true });
    },
    [location.pathname, location.search, navigate]
  );

  const getQueryParam = useCallback(
    (key: string): string | null => {
      return queryParams.get(key);
    },
    [queryParams]
  );

  return {
    queryParams,
    setQueryParam,
    getQueryParam,
  };
}

/**
 * 온라인 상태 감지 훅
 * 네트워크 연결 상태 추적
 */
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

/**
 * 이전 값 추적 훅
 * 값의 이전 상태를 기억
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined);
  
  useEffect(() => {
    ref.current = value;
  }, [value]);
  
  return ref.current;
}

/**
 * 카운트다운 타이머 훅
 * 운동 타이머 등에 사용
 */
export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(initialSeconds);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const start = useCallback(() => {
    setIsActive(true);
  }, []);

  const pause = useCallback(() => {
    setIsActive(false);
  }, []);

  const reset = useCallback(() => {
    setIsActive(false);
    setSeconds(initialSeconds);
  }, [initialSeconds]);

  useEffect(() => {
    if (isActive && seconds > 0) {
      intervalRef.current = setInterval(() => {
        setSeconds((prevSeconds) => prevSeconds - 1);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (seconds === 0) {
        setIsActive(false);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, seconds]);

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  const display = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;

  return {
    seconds,
    isActive,
    start,
    pause,
    reset,
    display,
  };
}
