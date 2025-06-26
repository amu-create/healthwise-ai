// scripts/update-django-template.js
const fs = require('fs');
const path = require('path');

// 빌드된 index.html을 Django templates로 복사
const sourcePath = path.join(__dirname, '../build/index.html');
const targetPath = path.join(__dirname, '../../backend/templates/index.html');

// 파일이 존재하는지 확인
if (fs.existsSync(sourcePath)) {
  // 디렉토리가 없으면 생성
  const targetDir = path.dirname(targetPath);
  if (!fs.existsSync(targetDir)) {
    fs.mkdirSync(targetDir, { recursive: true });
  }
  
  // 파일 복사
  fs.copyFileSync(sourcePath, targetPath);
  console.log('✅ index.html copied to Django templates');
  
  // 빌드 시간 추가 (디버깅용)
  const buildInfo = {
    buildTime: new Date().toISOString(),
    version: process.env.npm_package_version || '0.1.0'
  };
  
  fs.writeFileSync(
    path.join(__dirname, '../build/build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );
  console.log('✅ Build info saved');
} else {
  console.error('❌ Build file not found:', sourcePath);
  process.exit(1);
}
