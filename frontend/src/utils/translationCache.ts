/**
 * 번역 캐시 및 브라우저 캐시 제거 유틸리티
 */

export const clearTranslationCache = () => {
  // localStorage에서 i18next 관련 데이터 제거
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.includes('i18next') || key.includes('i18n'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    console.log(`Removed localStorage key: ${key}`);
  });

  // sessionStorage도 정리
  for (let i = 0; i < sessionStorage.length; i++) {
    const key = sessionStorage.key(i);
    if (key && (key.includes('i18next') || key.includes('i18n'))) {
      sessionStorage.removeItem(key);
      console.log(`Removed sessionStorage key: ${key}`);
    }
  }

  // 서비스 워커 캐시 제거
  if ('caches' in window) {
    caches.keys().then(names => {
      names.forEach(name => {
        caches.delete(name);
        console.log(`Removed cache: ${name}`);
      });
    });
  }

  // 페이지 새로고침 (캐시 무시)
  window.location.reload();
};

/**
 * 개발 환경에서 번역 파일 강제 새로고침
 */
export const forceReloadTranslations = async () => {
  try {
    // 타임스탬프를 추가하여 캐시 무효화
    const timestamp = new Date().getTime();
    const languages = ['ko', 'en', 'es'];
    
    for (const lang of languages) {
      // 각 언어의 번역 파일을 강제로 다시 로드
      const response = await fetch(`/locales/${lang}/modules/pages/achievements.json?t=${timestamp}`);
      if (response.ok) {
        const data = await response.json();
        console.log(`Reloaded ${lang} achievements translations:`, data);
      }
    }
    
    // i18n 인스턴스 재초기화
    const i18n = (await import('../i18n')).default;
    await i18n.reloadResources();
    
    console.log('All translations reloaded successfully');
  } catch (error) {
    console.error('Error reloading translations:', error);
  }
};

/**
 * 현재 로드된 번역 데이터 확인
 */
export const checkLoadedTranslations = async () => {
  const i18n = (await import('../i18n')).default;
  const currentLang = i18n.language;
  
  console.log('Current language:', currentLang);
  console.log('Loaded translations:', i18n.store.data);
  
  // 전체 achievements 번역 객체 확인
  try {
    const storeData = i18n.store.data as any;
    const achievementsData = storeData[currentLang]?.translation?.pages?.achievements;
    console.log('Achievements translations:', achievementsData);
  } catch (error) {
    console.log('Error accessing achievements data:', error);
  }
  
  // 특정 키 확인
  const testKeys = [
    'pages.achievements.title',
    'pages.achievements.subtitle',
    'pages.achievements.completedAchievements',
    'pages.achievements.defaults.gymNewbie'
  ];
  
  testKeys.forEach(key => {
    try {
      // i18n의 t 함수를 직접 사용하여 번역 가져오기
      const translation = i18n.getResource(currentLang, 'translation', key);
      console.log(`${key}:`, translation || 'Key not found');
    } catch (error) {
      console.log(`${key}: Error -`, error);
    }
  });
};

// 개발 환경에서 자동으로 캐시 체크
if (process.env.NODE_ENV === 'development') {
  // 페이지 로드 시 번역 데이터 확인
  window.addEventListener('load', () => {
    console.log('Checking translation cache...');
    checkLoadedTranslations();
  });
  
  // 전역 객체에 유틸리티 함수 노출 (개발자 콘솔에서 사용 가능)
  (window as any).clearTranslationCache = clearTranslationCache;
  (window as any).forceReloadTranslations = forceReloadTranslations;
  (window as any).checkLoadedTranslations = checkLoadedTranslations;
}
