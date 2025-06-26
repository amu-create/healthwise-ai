@echo off
chcp 65001 > nul

echo ======================================================
echo   백엔드 상태 진단 및 해결
echo ======================================================
echo.

echo 1. 도커 컨테이너 상태 확인...
docker ps -a --filter name=healthwise_backend --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo 2. 백엔드 로그 확인 (최근 30줄)...
docker-compose -f docker-compose.dev.yml logs --tail=30 backend
echo.

echo 3. 백엔드 재시작 시도...
docker-compose -f docker-compose.dev.yml restart backend
echo.

echo 4. 10초 대기...
timeout /t 10 /nobreak > nul
echo.

echo 5. 재시작 후 상태 확인...
docker ps --filter name=healthwise_backend
echo.

echo 6. API 테스트...
curl -I http://localhost:8000/api/ 2>nul || echo API 응답 없음
echo.

echo ======================================================
echo   진단 완료
echo ======================================================
echo.
echo 문제가 지속되면 다음 명령어를 실행하세요:
echo docker-compose -f docker-compose.dev.yml down
echo docker-compose -f docker-compose.dev.yml up -d
echo.
pause
