@echo off
chcp 65001 > nul

echo ======================================================
echo   백엔드 완전 초기화 및 재시작
echo ======================================================
echo.

echo 1. 백엔드 컨테이너 중지 및 삭제...
docker-compose -f docker-compose.dev.yml stop backend
docker-compose -f docker-compose.dev.yml rm -f backend

echo.
echo 2. 백엔드 볼륨 정리 (선택사항)...
REM docker volume prune -f

echo.
echo 3. 백엔드 이미지 재빌드 및 시작...
docker-compose -f docker-compose.dev.yml up -d --build backend

echo.
echo 4. 20초 대기 (데이터베이스 초기화)...
timeout /t 20 /nobreak > nul

echo.
echo 5. 백엔드 상태 확인...
docker ps --filter name=healthwise_backend

echo.
echo 6. 백엔드 로그 확인 (최근 50줄)...
docker-compose -f docker-compose.dev.yml logs --tail=50 backend

echo.
echo 7. API 테스트...
curl -I http://localhost:8000/api/ 2>nul && (
    echo.
    echo ✓ API가 정상적으로 응답합니다!
) || (
    echo.
    echo × API 응답 없음. 로그를 확인하세요.
)

echo.
echo ======================================================
echo   완료! 브라우저에서 http://localhost:3000 접속
echo ======================================================
pause
