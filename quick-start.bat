@echo off
echo.
echo ========================================
echo   HealthWise 빠른 시작 (캐시 활용)
echo ========================================
echo.

rem 이미지가 있는지 확인
docker images | findstr healthwise_backend >nul 2>&1
if %errorlevel% neq 0 (
    echo 첫 실행 감지 - 이미지 빌드 중... (10-20분 소요)
    docker-compose -f docker-compose.fast.yml build
) else (
    echo 기존 이미지 사용 - 빠른 시작!
)

echo.
echo 서비스 시작 중...
docker-compose -f docker-compose.fast.yml up -d

echo.
echo ========================================
echo   실행 완료!
echo ========================================
echo.
echo Frontend: http://localhost:3000
echo Backend: http://localhost:8000
echo Admin: http://localhost:8000/admin
echo.
echo 팁: 코드만 수정했다면 재빌드 필요 없음!
echo     docker-compose -f docker-compose.fast.yml restart
echo.
pause
