@echo off
chcp 65001 > nul
echo.
echo ============================================
echo    Docker 정리 스크립트
echo ============================================
echo.

echo [현재 상황]
echo - HealthWise 프로젝트 이미지: 4개
echo - 불필요한 이미지: 2개
echo.

echo [정리할 이미지]
echo 1. ghcr.io/github/github-mcp-server (GitHub MCP)
echo 2. redis:6-alpine (구버전)
echo.

echo ============================================
echo    정리를 진행하시겠습니까? (Y/N)
echo ============================================
set /p confirm=선택: 

if /i "%confirm%"=="Y" (
    echo.
    echo [1/3] 사용하지 않는 컨테이너 정리...
    docker container prune -f
    
    echo.
    echo [2/3] 특정 이미지 삭제...
    docker rmi ghcr.io/github/github-mcp-server -f
    docker rmi redis:6-alpine -f
    
    echo.
    echo [3/3] 사용하지 않는 볼륨 정리...
    docker volume prune -f
    
    echo.
    echo ✅ 정리 완료!
) else (
    echo.
    echo 정리를 취소했습니다.
)

echo.
echo [현재 디스크 사용량]
docker system df
echo.
pause
