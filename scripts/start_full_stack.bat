@echo off
chcp 65001 > nul
echo ======================================
echo Healthwise 전체 스택 실행 스크립트
echo ======================================
echo.

cd /d "%~dp0\.."

echo [1/5] Redis 서버 확인 및 실행...
redis-cli ping >nul 2>&1
if %errorlevel% neq 0 (
    echo Redis가 실행되고 있지 않습니다. Redis를 시작합니다...
    start "Redis Server" cmd /k "redis-server"
    echo 5초 대기 중...
    timeout /t 5 /nobreak > nul
) else (
    echo Redis가 이미 실행 중입니다.
)

echo.
echo [2/5] Python 가상환경 활성화...
call venv\Scripts\activate

echo.
echo [3/5] Django 백엔드 서버 시작 (포트 8000)...
start "Django Backend" cmd /k "cd /d %CD% && venv\Scripts\activate && python manage.py runserver 0.0.0.0:8000"

echo.
echo [4/5] 백엔드 서버 초기화 대기 (5초)...
timeout /t 5 /nobreak > nul

echo.
echo [5/5] React 프론트엔드 서버 시작 (포트 3000)...
cd frontend
start "React Frontend" cmd /k "npm start"

echo.
echo ======================================
echo 모든 서비스가 시작되었습니다!
echo.
echo [실행 중인 서비스]
echo - Redis Server: localhost:6379
echo - Django Backend: http://localhost:8000
echo - React Frontend: http://localhost:3000
echo.
echo [유용한 URL]
echo - 메인 애플리케이션: http://localhost:3000
echo - Django Admin: http://localhost:8000/admin/
echo - API 엔드포인트: http://localhost:8000/api/
echo.
echo [종료 방법]
echo 각 CMD 창을 닫거나 Ctrl+C로 종료하세요.
echo ======================================
pause
