// 다국어 지원을 위한 유틸리티 함수들

export const dateFormats = {
  ko: {
    short: 'MM월 DD일',
    long: 'YYYY년 MM월 DD일',
    time: 'HH:mm',
    datetime: 'YYYY년 MM월 DD일 HH:mm',
  },
  en: {
    short: 'MMM DD',
    long: 'MMMM DD, YYYY',
    time: 'h:mm A',
    datetime: 'MMMM DD, YYYY h:mm A',
  },
  es: {
    short: 'DD MMM',
    long: 'DD [de] MMMM [de] YYYY',
    time: 'HH:mm',
    datetime: 'DD [de] MMMM [de] YYYY HH:mm',
  },
};

export const numberFormats = {
  ko: {
    decimal: ',',
    thousand: ',',
    precision: 0,
  },
  en: {
    decimal: '.',
    thousand: ',',
    precision: 0,
  },
  es: {
    decimal: ',',
    thousand: '.',
    precision: 0,
  },
};

export const formatNumber = (value: number, locale: string = 'ko'): string => {
  return new Intl.NumberFormat(locale).format(value);
};

export const formatCurrency = (value: number, locale: string = 'ko'): string => {
  const currencies = {
    ko: 'KRW',
    en: 'USD',
    es: 'EUR',
  };
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencies[locale as keyof typeof currencies] || 'USD',
  }).format(value);
};

export const formatCalories = (value: number, locale: string = 'ko'): string => {
  const units = {
    ko: 'kcal',
    en: 'kcal',
    es: 'kcal',
  };
  
  return `${formatNumber(value, locale)} ${units[locale as keyof typeof units]}`;
};

export const formatDuration = (minutes: number, locale: string = 'ko'): string => {
  const translations = {
    ko: { hour: '시간', minute: '분' },
    en: { hour: 'hour', minute: 'min' },
    es: { hour: 'hora', minute: 'min' },
  };
  
  const t = translations[locale as keyof typeof translations] || translations.en;
  
  if (minutes < 60) {
    return `${minutes} ${t.minute}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours} ${t.hour}`;
  }
  
  return `${hours} ${t.hour} ${mins} ${t.minute}`;
};

export const getRelativeTime = (date: Date | string, locale: string = 'ko'): string => {
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' });
  const now = new Date();
  const target = new Date(date);
  const diffInSeconds = (target.getTime() - now.getTime()) / 1000;
  
  const units: [string, number][] = [
    ['year', 31536000],
    ['month', 2592000],
    ['week', 604800],
    ['day', 86400],
    ['hour', 3600],
    ['minute', 60],
    ['second', 1],
  ];
  
  for (const [unit, seconds] of units) {
    const diff = Math.round(diffInSeconds / seconds);
    if (Math.abs(diff) >= 1) {
      return rtf.format(diff, unit as Intl.RelativeTimeFormatUnit);
    }
  }
  
  return rtf.format(0, 'second');
};
