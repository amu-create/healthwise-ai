const fs = require('fs');
const path = require('path');

// 번역 파일 경로
const localesPath = path.join(__dirname, '../locales');
const languages = ['ko', 'en', 'es'];

// 모든 번역 키를 재귀적으로 추출
function extractKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const newKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      keys = keys.concat(extractKeys(obj[key], newKey));
    } else {
      keys.push(newKey);
    }
  }
  return keys;
}

// 각 언어별 번역 파일 읽기
const translations = {};
const allKeys = new Set();

languages.forEach(lang => {
  const filePath = path.join(localesPath, lang, 'translation.json');
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    translations[lang] = JSON.parse(content);
    const keys = extractKeys(translations[lang]);
    keys.forEach(key => allKeys.add(key));
  } catch (error) {
    console.error(`✗ ${lang}.json 파일 읽기 실패:`, error.message);
  }
});

// 누락된 키 찾기
const missingKeys = {};
languages.forEach(lang => {
  missingKeys[lang] = [];
  allKeys.forEach(key => {
    const keys = key.split('.');
    let obj = translations[lang];
    let found = true;
    
    for (const k of keys) {
      if (obj && typeof obj === 'object' && k in obj) {
        obj = obj[k];
      } else {
        found = false;
        break;
      }
    }
    
    if (!found) {
      missingKeys[lang].push(key);
    }
  });
});

// 결과 요약
console.log('=== 다국어화 현황 요약 ===\n');
console.log(`총 번역 키: ${allKeys.size}개\n`);

languages.forEach(lang => {
  const missing = missingKeys[lang].length;
  const total = allKeys.size;
  const percentage = ((total - missing) / total * 100).toFixed(1);
  console.log(`${lang === 'ko' ? '한국어' : lang === 'en' ? '영어' : '스페인어'}: ${percentage}% 완성 (${missing}개 누락)`);
});

// 페이지별 통계
console.log('\n=== 주요 페이지 누락 키 ===\n');
const pageStats = {};
missingKeys.ko.forEach(key => {
  if (key.startsWith('pages.')) {
    const page = key.split('.')[1];
    if (!pageStats[page]) {
      pageStats[page] = 0;
    }
    pageStats[page]++;
  }
});

Object.entries(pageStats).forEach(([page, count]) => {
  if (count > 0) {
    console.log(`${page} 페이지: ${count}개 키 누락`);
  }
});

// 구체적인 누락 키 표시
if (missingKeys.ko.length > 0) {
  console.log('\n=== 한국어 누락 키 (상위 10개) ===');
  missingKeys.ko.slice(0, 10).forEach(key => {
    console.log(`  - ${key}`);
  });
  if (missingKeys.ko.length > 10) {
    console.log(`  ... 그 외 ${missingKeys.ko.length - 10}개`);
  }
}

console.log('\n검사 완료!');
