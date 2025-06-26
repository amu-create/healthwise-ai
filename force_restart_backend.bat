@echo off
chcp 65001 > nul

echo ======================================================
echo   백엔드 강제 재시작 (전체)
echo ======================================================
echo.

echo 1. 모든 컨테이너 중지...
docker-compose -f docker-compose.dev.yml down
echo.

echo 2. 백엔드만 다시 시작...
docker-compose -f docker-compose.dev.yml up -d db redis
timeout /t 5 /nobreak > nul
docker-compose -f docker-compose.dev.yml up -d backend
echo.

echo 3. 백엔드 로그 실시간 확인 (Ctrl+C로 종료)...
docker-compose -f docker-compose.dev.yml logs -f backend
