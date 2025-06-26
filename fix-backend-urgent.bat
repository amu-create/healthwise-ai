@echo off
chcp 65001 > nul
echo.
echo ============================================
echo    HealthWise AI - 백엔드 오류 긴급 수정
echo ============================================
echo.

cd /d "%~dp0"

echo [1/5] Windows 줄바꿈 문제 해결 중...
echo LF 형식으로 변환...

REM PowerShell을 사용하여 CRLF를 LF로 변환
powershell -Command "(Get-Content backend\docker-entrypoint.sh -Raw) -replace '`r`n', '`n' | Set-Content -NoNewline backend\docker-entrypoint.sh"

echo ✅ 파일 형식 변환 완료!
echo.

echo [2/5] Git 설정 업데이트...
cd backend
git config core.autocrlf input
git update-index --chmod=+x docker-entrypoint.sh
cd ..
echo ✅ Git 설정 완료!
echo.

echo [3/5] 기존 컨테이너 정리...
docker-compose -f docker-compose.dev.yml stop backend
docker-compose -f docker-compose.dev.yml rm -f backend
echo ✅ 정리 완료!
echo.

echo [4/5] 백엔드 재빌드...
docker-compose -f docker-compose.dev.yml build --no-cache backend
if errorlevel 1 (
    echo ❌ 빌드 실패!
    pause
    exit /b 1
)
echo ✅ 빌드 성공!
echo.

echo [5/5] 전체 서비스 재시작...
docker-compose -f docker-compose.dev.yml up -d
echo.

timeout /t 10 /nobreak > nul

echo 상태 확인...
docker ps --format "table {{.Names}}\t{{.Status}}"
echo.

echo 백엔드 로그 확인 (마지막 20줄)...
docker logs healthwise_backend --tail 20
echo.

echo ============================================
echo    완료! 백엔드가 정상 작동해야 합니다.
echo ============================================
echo.
pause
