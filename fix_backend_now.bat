@echo off
chcp 65001 > nul

echo ======================================================
echo   백엔드 실행 문제 해결
echo ======================================================
echo.

echo 1. 백엔드 컨테이너 재시작...
docker-compose -f docker-compose.dev.yml up -d --force-recreate --no-deps backend

echo.
echo 2. 15초 대기 (마이그레이션 및 서버 시작)...
timeout /t 15 /nobreak > nul

echo.
echo 3. 실행 상태 확인...
docker ps --filter name=healthwise_backend

echo.
echo 4. 백엔드 로그 확인 (최근 20줄)...
docker-compose -f docker-compose.dev.yml logs --tail=20 backend

echo.
echo 5. API 테스트...
curl -I http://localhost:8000/api/ 2>nul && echo API 정상 작동! || echo API 응답 없음

echo.
echo ======================================================
echo   완료! 브라우저에서 http://localhost:3000 접속
echo ======================================================
pause
