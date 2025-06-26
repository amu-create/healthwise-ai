@echo off
chcp 65001 > nul

echo ======================================================
echo   HealthWise Docker 백엔드 문제 해결 확인
echo ======================================================
echo.

echo 1. logs 디렉토리 생성 확인...
if exist "backend\logs" (
    echo    ✓ logs 디렉토리가 생성되었습니다.
) else (
    echo    × logs 디렉토리가 없습니다. 생성 중...
    mkdir backend\logs
)
echo.

echo 2. Docker 설정 파일 확인...
if exist "backend\healthwise\settings_docker.py" (
    echo    ✓ settings_docker.py 파일이 존재합니다.
) else (
    echo    × settings_docker.py 파일이 없습니다!
)
echo.

echo 3. Docker 컨테이너 재시작...
echo    기존 컨테이너 중지...
docker-compose -f docker-compose.dev.yml down
echo.
echo    컨테이너 다시 시작...
docker-compose -f docker-compose.dev.yml up -d --build backend
echo.

echo 4. 로그 확인 (10초 대기)...
timeout /t 10 /nobreak > nul
echo.
docker-compose -f docker-compose.dev.yml logs --tail=50 backend

echo.
echo ======================================================
echo   확인 완료
echo ======================================================
pause
