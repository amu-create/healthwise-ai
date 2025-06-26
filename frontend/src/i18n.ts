import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// 모듈화된 번역 파일 import
import koTranslations from './locales/ko';
import enTranslations from './locales/en';
import esTranslations from './locales/es';

const resources = {
  ko: koTranslations,
  en: enTranslations,
  es: esTranslations,
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ko',
    debug: process.env.NODE_ENV === 'development',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    load: 'currentOnly',
    ns: ['translation'],
    defaultNS: 'translation',
    react: {
      useSuspense: false
    },
    // 개발 환경에서 캐시 비활성화
    cache: {
      enabled: process.env.NODE_ENV !== 'development'
    }
  });

export default i18n;
