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
    console.log(`✓ ${lang}.json 파일 로드 완료 - ${keys.length}개 키 발견`);
  } catch (error) {
    console.error(`✗ ${lang}.json 파일 읽기 실패:`, error.message);
  }
});

console.log(`\n총 ${allKeys.size}개의 고유 키가 발견되었습니다.\n`);

// 누락된 키 찾기
const missingKeys = {};
let totalMissing = 0;

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
      totalMissing++;
    }
  });
  
  if (missingKeys[lang].length > 0) {
    console.log(`\n${lang}.json에서 누락된 키 (${missingKeys[lang].length}개):`);
    missingKeys[lang].forEach(key => {
      console.log(`  - ${key}`);
    });
  } else {
    console.log(`\n✓ ${lang}.json: 모든 키가 존재합니다.`);
  }
});

// 중복된 최상위 키 확인
console.log('\n=== 중복된 최상위 키 확인 ===');
languages.forEach(lang => {
  const topLevelKeys = Object.keys(translations[lang]);
  const duplicates = topLevelKeys.filter((key, index) => topLevelKeys.indexOf(key) !== index);
  if (duplicates.length > 0) {
    console.log(`\n${lang}.json에서 중복된 최상위 키:`, duplicates);
  }
});

// achievements 관련 키만 확인
console.log('\n=== Achievements 관련 키 확인 ===');
const achievementKeys = Array.from(allKeys).filter(key => key.includes('achievements'));
console.log(`\nAchievements 관련 키 (${achievementKeys.length}개):`);
achievementKeys.forEach(key => {
  console.log(`  - ${key}`);
});

// 요약
console.log('\n=== 요약 ===');
console.log(`총 누락된 키: ${totalMissing}개`);
languages.forEach(lang => {
  const missing = missingKeys[lang].length;
  const total = allKeys.size;
  const percentage = ((total - missing) / total * 100).toFixed(1);
  console.log(`${lang}: ${percentage}% 완성 (${missing}개 누락)`);
});

// 페이지별 통계
console.log('\n=== 페이지별 번역 상태 ===');
const pageStats = {};
allKeys.forEach(key => {
  if (key.startsWith('pages.')) {
    const page = key.split('.')[1];
    if (!pageStats[page]) {
      pageStats[page] = { total: 0, missing: {} };
      languages.forEach(lang => pageStats[page].missing[lang] = 0);
    }
    pageStats[page].total++;
    
    languages.forEach(lang => {
      if (missingKeys[lang].includes(key)) {
        pageStats[page].missing[lang]++;
      }
    });
  }
});

Object.entries(pageStats).forEach(([page, stats]) => {
  console.log(`\n${page} 페이지:`);
  console.log(`  총 키: ${stats.total}개`);
  languages.forEach(lang => {
    const missing = stats.missing[lang];
    const percentage = ((stats.total - missing) / stats.total * 100).toFixed(1);
    console.log(`  ${lang}: ${percentage}% (${missing}개 누락)`);
  });
});
