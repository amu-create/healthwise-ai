@echo off
chcp 65001 > nul
echo.
echo ============================================
echo    HealthWise AI - npm 오류 자동 해결
echo ============================================
echo.

REM 현재 디렉토리 저장
set CURRENT_DIR=%cd%

echo [1/5] Git 최신 코드 가져오기...
git fetch origin
if errorlevel 1 (
    echo ❌ Git fetch 실패! 인터넷 연결을 확인하세요.
    pause
    exit /b 1
)

git reset --hard origin/main
echo ✅ 최신 코드 동기화 완료!
echo.

echo [2/5] Docker 컨테이너 정리 중...
docker-compose -f docker-compose.dev.yml down
echo ✅ 컨테이너 중지 완료!
echo.

echo [3/5] Docker 캐시 정리 중...
docker system prune -f
echo ✅ 캐시 정리 완료!
echo.

echo [4/5] Frontend 재빌드 중... (5-10분 소요)
docker-compose -f docker-compose.dev.yml build --no-cache frontend
if errorlevel 1 (
    echo ❌ 빌드 실패! 로그를 확인하세요.
    pause
    exit /b 1
)
echo ✅ Frontend 빌드 완료!
echo.

echo [5/5] 전체 서비스 시작 중...
docker-compose -f docker-compose.dev.yml up -d
if errorlevel 1 (
    echo ❌ 서비스 시작 실패!
    pause
    exit /b 1
)

echo.
echo ============================================
echo    ✅ 모든 작업이 완료되었습니다!
echo ============================================
echo.
echo 접속 URL:
echo - Frontend: http://localhost:3000
echo - Backend: http://localhost:8000
echo.
echo 서비스 상태 확인:
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.
pause
