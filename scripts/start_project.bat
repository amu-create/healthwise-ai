@echo off
chcp 65001 > nul
echo ======================================
echo Healthwise 프로젝트 시작 스크립트
echo ======================================
echo.

:: 프로젝트 루트 디렉토리로 이동
cd /d "%~dp0\.."

echo [1/4] Python 가상환경 활성화 중...
call venv\Scripts\activate

echo [2/4] Django 서버 시작 중...
start cmd /k "cd /d %CD% && venv\Scripts\activate && python manage.py runserver 0.0.0.0:8000"

echo [3/4] 3초 대기 중...
timeout /t 3 /nobreak > nul

echo [4/4] React 개발 서버 시작 중 (HTTP 모드)...
cd frontend
start cmd /k "npm start"

echo.
echo ======================================
echo 서버가 시작되었습니다!
echo.
echo Django 백엔드: http://localhost:8000
echo React 프론트엔드: http://localhost:3000
echo.
echo API 문서: http://localhost:8000/api/
echo Django Admin: http://localhost:8000/admin/
echo ======================================
echo.
echo 종료하려면 각 창을 닫아주세요.
pause
