@echo off
chcp 65001 >nul
setlocal EnableDelayedExpansion

:: 색상 정의
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

echo %BLUE%🏥 HealthWise AI - 자동 환경 설정%NC%
echo %BLUE%========================================%NC%
echo.

:: 1. Git 저장소 확인
if not exist ".git" (
    echo %RED%❌ Git 저장소가 아닙니다. 먼저 저장소를 클론하세요:%NC%
    echo    git clone https://github.com/amu-create/healthwise-ai.git
    pause
    exit /b 1
)

echo %GREEN%✅ Git 저장소 확인 완료%NC%

:: 2. Docker 설치 확인
docker --version >nul 2>&1
if errorlevel 1 (
    echo %RED%❌ Docker가 설치되지 않았습니다. Docker Desktop을 설치하세요:%NC%
    echo    https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

echo %GREEN%✅ Docker 설치 확인 완료%NC%

:: 3. .env 파일 생성
if exist ".env" (
    echo %YELLOW%⚠️  .env 파일이 이미 존재합니다. 덮어쓸까요? (y/N):%NC%
    set /p "overwrite="
    if /i not "!overwrite!"=="y" (
        echo %BLUE%ℹ️  기존 .env 파일을 사용합니다%NC%
        goto :check_env
    )
)

echo %BLUE%📝 .env 파일 생성 중...%NC%
copy ".env.example" ".env" >nul
echo %GREEN%✅ .env 파일 생성 완료%NC%

:check_env
:: 4. 환경변수 검증
echo %BLUE%🔍 환경변수 검증 중...%NC%

findstr /c:"your-super-secret-django-key-here" ".env" >nul
if not errorlevel 1 (
    echo %YELLOW%⚠️  SECRET_KEY를 설정해야 합니다%NC%
    echo %BLUE%ℹ️  자동으로 SECRET_KEY를 생성할까요? (Y/n):%NC%
    set /p "generate_key="
    if /i not "!generate_key!"=="n" (
        :: Python을 사용해 SECRET_KEY 생성
        python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())" > temp_key.txt 2>nul
        if exist "temp_key.txt" (
            set /p SECRET_KEY=<temp_key.txt
            del temp_key.txt
            powershell -Command "(Get-Content '.env') -replace 'your-super-secret-django-key-here', '!SECRET_KEY!' | Set-Content '.env'"
            echo %GREEN%✅ SECRET_KEY 자동 생성 완료%NC%
        ) else (
            echo %YELLOW%⚠️  Python을 찾을 수 없습니다. 수동으로 SECRET_KEY를 설정하세요%NC%
            echo %BLUE%   https://djecrety.ir/ 에서 생성 가능%NC%
        )
    )
)

findstr /c:"your-openai-api-key-here" ".env" >nul
if not errorlevel 1 (
    echo %YELLOW%⚠️  OPENAI_API_KEY를 설정해야 합니다%NC%
    echo %BLUE%ℹ️  https://platform.openai.com/api-keys 에서 발급 후 .env 파일을 수정하세요%NC%
    echo %YELLOW%   (챗봇 기능을 사용하지 않으면 건너뛸 수 있습니다)%NC%
)

:: 5. Docker Compose 파일 확인
if not exist "docker-compose.dev.yml" (
    echo %RED%❌ docker-compose.dev.yml 파일을 찾을 수 없습니다%NC%
    pause
    exit /b 1
)

echo %GREEN%✅ Docker Compose 설정 확인 완료%NC%

:: 6. 포트 충돌 확인
echo %BLUE%🔍 포트 사용 확인 중...%NC%

netstat -an | findstr ":3000" >nul
if not errorlevel 1 (
    echo %YELLOW%⚠️  포트 3000이 이미 사용 중입니다%NC%
    echo %BLUE%ℹ️  다른 React 앱을 종료하거나 docker-compose.dev.yml에서 포트를 변경하세요%NC%
)

netstat -an | findstr ":8000" >nul
if not errorlevel 1 (
    echo %YELLOW%⚠️  포트 8000이 이미 사용 중입니다%NC%
    echo %BLUE%ℹ️  다른 서버를 종료하거나 docker-compose.dev.yml에서 포트를 변경하세요%NC%
)

:: 7. Docker 실행
echo.
echo %BLUE%🚀 Docker 컨테이너를 시작할까요? (Y/n):%NC%
set /p "start_docker="
if /i not "!start_docker!"=="n" (
    echo %BLUE%🔨 Docker 컨테이너 빌드 및 시작 중...%NC%
    echo %YELLOW%   (첫 실행시 5-10분 소요될 수 있습니다)%NC%
    
    docker-compose -f docker-compose.dev.yml up --build -d
    
    if errorlevel 1 (
        echo %RED%❌ Docker 실행 실패%NC%
        echo %BLUE%ℹ️  로그 확인: docker-compose -f docker-compose.dev.yml logs%NC%
        pause
        exit /b 1
    )
    
    echo %GREEN%✅ Docker 컨테이너 시작 완료%NC%
    
    :: 컨테이너 상태 확인
    echo %BLUE%📊 컨테이너 상태 확인 중...%NC%
    timeout /t 10 /nobreak >nul
    docker-compose -f docker-compose.dev.yml ps
    
    echo.
    echo %GREEN%🎉 설정 완료! 다음 URL에서 접속하세요:%NC%
    echo %BLUE%   🌐 프론트엔드: http://localhost:3000%NC%
    echo %BLUE%   🔧 백엔드 API: http://localhost:8000/api%NC%
    echo %BLUE%   📊 관리자 페이지: http://localhost:8000/admin%NC%
    echo %BLUE%      - 개발용 계정: admin / admin123%NC%
    echo.
    echo %BLUE%📋 유용한 명령어:%NC%
    echo %BLUE%   - 로그 확인: docker-compose -f docker-compose.dev.yml logs -f%NC%
    echo %BLUE%   - 컨테이너 재시작: docker-compose -f docker-compose.dev.yml restart%NC%
    echo %BLUE%   - 컨테이너 중지: docker-compose -f docker-compose.dev.yml down%NC%
    echo %BLUE%   - 데이터베이스 초기화: docker-compose -f docker-compose.dev.yml down -v%NC%
    echo.
)

echo %GREEN%✨ 설정이 완료되었습니다!%NC%
echo %BLUE%📞 문제 발생시 팀 채널에 스크린샷과 함께 문의하세요%NC%
pause
