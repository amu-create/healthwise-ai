@echo off
chcp 65001 > nul
echo.
echo ╔══════════════════════════════════════╗
echo ║     Docker 정리 및 최적화 도구       ║
echo ╚══════════════════════════════════════╝
echo.

:menu
echo 1. Docker 상태 확인
echo 2. 사용하지 않는 이미지/컨테이너 정리
echo 3. 전체 Docker 시스템 정리 (주의!)
echo 4. HealthWise 컨테이너만 정리
echo 5. Docker 캐시 정리
echo 6. 종료
echo.
set /p choice="선택하세요 (1-6): "

if "%choice%"=="1" goto status
if "%choice%"=="2" goto clean_unused
if "%choice%"=="3" goto clean_all
if "%choice%"=="4" goto clean_healthwise
if "%choice%"=="5" goto clean_cache
if "%choice%"=="6" goto end
goto menu

:status
echo.
echo [Docker 디스크 사용량]
docker system df
echo.
echo [실행 중인 컨테이너]
docker ps
echo.
echo [모든 컨테이너]
docker ps -a
echo.
pause
cls
goto menu

:clean_unused
echo.
echo [사용하지 않는 리소스 정리 중...]
docker container prune -f
docker image prune -f
docker volume prune -f
docker network prune -f
echo.
echo 정리 완료!
pause
cls
goto menu

:clean_all
echo.
echo *** 경고: 모든 Docker 데이터가 삭제됩니다! ***
set /p confirm="정말로 계속하시겠습니까? (y/n): "
if /i "%confirm%"=="y" (
    echo.
    echo [전체 시스템 정리 중...]
    docker stop $(docker ps -aq) 2>nul
    docker system prune -a --volumes -f
    echo.
    echo 정리 완료!
) else (
    echo 취소되었습니다.
)
pause
cls
goto menu

:clean_healthwise
echo.
echo [HealthWise 관련 컨테이너 정리 중...]
docker-compose -f docker-compose.dev.yml down -v --remove-orphans
docker-compose -f docker-compose.dev-optimized.yml down -v --remove-orphans
echo.
echo 정리 완료!
pause
cls
goto menu

:clean_cache
echo.
echo [Docker 빌드 캐시 정리 중...]
docker builder prune -f
echo.
echo 정리 완료!
pause
cls
goto menu

:end
echo.
echo Docker 정리 도구를 종료합니다.
pause
