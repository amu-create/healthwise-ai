@echo off
chcp 65001 > nul

echo ======================================================
echo   백엔드 상태 확인
echo ======================================================
echo.

echo 1. 컨테이너 상태 확인...
docker ps --filter name=healthwise_backend --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo.
echo 2. API 헬스체크...
curl -s http://localhost:8000/api/ || echo API 응답 실패

echo.
echo 3. 최근 로그 확인...
docker-compose -f docker-compose.dev.yml logs --tail=10 backend | findstr /i "error warning running started"

echo.
echo ======================================================
echo   프론트엔드에서 http://localhost:3000 접속하세요
echo ======================================================
pause
