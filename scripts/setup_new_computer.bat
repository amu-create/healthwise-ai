@echo off
chcp 65001
echo ===================================
echo Healthwise 프로젝트 초기 설정
echo ===================================
echo.

echo 현재 위치: %CD%
echo.

:: Python 설치 확인
echo Python 설치 확인 중...
python --version
if errorlevel 1 (
    echo Python이 설치되어 있지 않습니다!
    echo https://www.python.org 에서 Python을 설치해주세요.
    pause
    exit /b 1
)

:: Node.js 설치 확인
echo.
echo Node.js 설치 확인 중...
node --version
if errorlevel 1 (
    echo Node.js가 설치되어 있지 않습니다!
    echo https://nodejs.org 에서 Node.js를 설치해주세요.
    pause
    exit /b 1
)

echo.
echo ===================================
echo 백엔드 설정 시작...
echo ===================================
cd backend

:: 가상환경 확인 및 생성
if not exist "venv" (
    echo Python 가상환경 생성 중...
    python -m venv venv
)

:: 가상환경 활성화
echo 가상환경 활성화 중...
call venv\Scripts\activate.bat

:: 패키지 설치
echo.
echo Python 패키지 설치 중...
pip install -r requirements.txt

:: 데이터베이스 마이그레이션
echo.
echo 데이터베이스 마이그레이션 중...
python manage.py makemigrations
python manage.py migrate

:: 정적 파일 수집
echo.
echo 정적 파일 수집 중...
python manage.py collectstatic --noinput

:: 미디어 폴더 생성
if not exist "media" mkdir media
if not exist "static" mkdir static

echo.
echo ===================================
echo 프론트엔드 설정 시작...
echo ===================================
cd ..\frontend

:: Node 패키지 설치
echo Node.js 패키지 설치 중... (시간이 걸릴 수 있습니다)
npm install

echo.
echo ===================================
echo IP 주소 확인
echo ===================================
echo 현재 컴퓨터의 IP 주소:
for /f "tokens=2 delims=:" %%a in ('ipconfig ^| findstr /C:"IPv4"') do echo %%a

echo.
echo ===================================
echo 설정 완료!
echo ===================================
echo.
echo 다음 단계:
echo 1. frontend/.env 파일을 열어서 REACT_APP_API_URL을 수정하세요
echo    예: REACT_APP_API_URL=http://위의IP주소:8000/api
echo.
echo 2. backend/settings.py의 ALLOWED_HOSTS에 IP 추가
echo.
echo 3. run_servers.bat 실행하여 서버 시작
echo.
pause