@echo off
chcp 65001 > nul
echo.
echo 🏥 HealthWise 개발 환경 설정
echo ===============================
echo.

REM 필수 프로그램 확인
echo 필수 프로그램 확인 중...
python --version >nul 2>&1 || (echo ❌ Python이 설치되어 있지 않습니다. && exit /b 1)
node --version >nul 2>&1 || (echo ❌ Node.js가 설치되어 있지 않습니다. && exit /b 1)
docker --version >nul 2>&1 || echo ⚠️  Docker가 설치되어 있지 않습니다. (선택사항)
echo ✅ 필수 프로그램 확인 완료
echo.

REM Backend 설정
echo 📦 Backend 설정 중...
cd backend
if not exist venv (
    python -m venv venv
)
call venv\Scripts\activate
pip install -r requirements.txt
if not exist .env (
    copy .env.example .env
    echo ⚠️  backend\.env 파일에 API 키를 설정해주세요!
)
echo ✅ Backend 설정 완료
cd ..
echo.

REM Frontend 설정
echo 📦 Frontend 설정 중...
cd frontend
call npm install
if not exist .env (
    copy .env.example .env
    echo ⚠️  frontend\.env 파일에 API 키를 설정해주세요!
)
echo ✅ Frontend 설정 완료
cd ..
echo.

echo 🎉 설정 완료!
echo.
echo 다음 단계:
echo 1. backend\.env 파일 편집 (API 키 설정)
echo 2. frontend\.env 파일 편집 (Firebase 설정)
echo 3. 개발 서버 실행:
echo    - Docker: make dev
echo    - 수동: 
echo      Backend: cd backend ^&^& venv\Scripts\activate ^&^& python manage.py runserver
echo      Frontend: cd frontend ^&^& npm start
echo.
pause
