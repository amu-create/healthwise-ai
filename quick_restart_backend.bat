@echo off
chcp 65001 > nul

echo ======================================================
echo   백엔드 빠른 재시작 (이미지 다시 안받음)
echo ======================================================
echo.

cd /d "%~dp0"

echo 1. 백엔드 컨테이너만 재생성...
docker-compose -f docker-compose.dev.yml up -d --force-recreate --no-deps backend

echo.
echo 2. 10초 대기...
timeout /t 10 /nobreak > nul

echo.
echo 3. 백엔드 로그 확인...
docker-compose -f docker-compose.dev.yml logs --tail=30 backend

echo.
echo 4. 실행 상태 확인...
docker ps --filter name=healthwise_backend

echo.
echo ======================================================
echo   완료! 브라우저에서 http://localhost:3000 접속
echo ======================================================
pause
