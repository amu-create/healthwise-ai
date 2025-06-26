@echo off
chcp 65001 > nul
echo.
echo ============================================
echo    HealthWise AI - 완전 자동 배포 v2.0
echo ============================================
echo.
echo 이 스크립트는 모든 문제를 자동으로 해결합니다!
echo.

REM 프로젝트 루트 설정
set PROJECT_ROOT=%cd%

echo [1/10] Git 최신 코드 동기화...
git fetch origin
git reset --hard origin/main
if errorlevel 1 (
    echo ❌ Git 동기화 실패!
    echo 해결방법: 
    echo 1. 인터넷 연결 확인
    echo 2. Git 설치 확인
    pause
    exit /b 1
)
echo ✅ 코드 동기화 완료!
echo.

echo [2/10] docker-entrypoint.sh 권한 수정...
cd backend
git update-index --chmod=+x docker-entrypoint.sh
cd ..
echo ✅ 파일 권한 설정 완료!
echo.

echo [3/10] 기존 컨테이너 정리...
docker-compose -f docker-compose.dev.yml down -v
docker system prune -f
echo ✅ 정리 완료!
echo.

echo [4/10] .env 파일 생성...
if not exist ".env" (
    copy ".env.example" ".env"
    echo ✅ .env 파일 생성 완료!
) else (
    echo ✅ .env 파일 이미 존재!
)
echo.

echo [5/10] Backend .env 파일 생성...
cd backend
if not exist ".env" (
    copy ".env.example" ".env"
    echo ✅ Backend .env 생성 완료!
) else (
    echo ✅ Backend .env 이미 존재!
)
cd ..
echo.

echo [6/10] Frontend .env 파일 생성...
cd frontend
if not exist ".env" (
    copy ".env.example" ".env"
    echo ✅ Frontend .env 생성 완료!
) else (
    echo ✅ Frontend .env 이미 존재!
)
cd ..
echo.

echo [7/10] Docker 이미지 빌드 (5-10분 소요)...
docker-compose -f docker-compose.dev.yml build --no-cache
if errorlevel 1 (
    echo ❌ 빌드 실패!
    echo 일반적인 문제:
    echo 1. Docker Desktop이 실행 중인지 확인
    echo 2. 디스크 공간 확인 (최소 10GB)
    echo 3. 메모리 확인 (Docker Desktop 설정에서 4GB 이상)
    pause
    exit /b 1
)
echo ✅ 이미지 빌드 성공!
echo.

echo [8/10] 서비스 시작...
docker-compose -f docker-compose.dev.yml up -d
if errorlevel 1 (
    echo ❌ 서비스 시작 실패!
    pause
    exit /b 1
)
echo ✅ 모든 서비스 시작!
echo.

echo [9/10] 서비스 상태 확인 (30초 대기)...
timeout /t 30 /nobreak > nul
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
echo.

echo [10/10] 헬스체크...
curl -s -o nul -w "Frontend: %%{http_code}\n" http://localhost:3000 2>nul || echo Frontend: 시작 중...
curl -s -o nul -w "Backend: %%{http_code}\n" http://localhost:8000/api/health 2>nul || echo Backend: 시작 중...
echo.

echo ============================================
echo    ✅ 배포 완료!
echo ============================================
echo.
echo 접속 주소:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:8000/api
echo - API 문서: http://localhost:8000/docs
echo - 관리자: http://localhost:8000/admin
echo.
echo 다음 단계:
echo 1. 브라우저에서 http://localhost:3000 접속
echo 2. 회원가입/로그인 테스트
echo 3. 기능 테스트
echo.
echo 문제 발생 시:
echo - 로그 확인: docker logs healthwise_backend
echo - 재시작: docker-compose -f docker-compose.dev.yml restart
echo.
pause
