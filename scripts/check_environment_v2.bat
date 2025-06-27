@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

echo ========================================
echo HealthWise AI Environment Check Script
echo ========================================
echo Date: %date% %time%
echo Computer: %COMPUTERNAME%
echo User: %USERNAME%
echo ========================================
echo.

echo [1] Python Check
python --version 2>nul
if errorlevel 1 (
    echo Python not found in PATH
) else (
    echo Python Location: 
    where python
)
echo.

echo [2] Node.js Check
node --version 2>nul
if errorlevel 1 (
    echo Node.js not found in PATH
) else (
    echo Node Location:
    where node
    echo NPM Version:
    npm --version
)
echo.

echo [3] Docker Check
docker --version 2>nul
if errorlevel 1 (
    echo Docker not found in PATH
) else (
    docker-compose --version 2>nul
    echo.
    echo Docker Service Status:
    sc query "Docker Desktop Service" 2>nul | findstr /C:"STATE"
    if errorlevel 1 (
        echo Docker Desktop Service not found
    )
)
echo.

echo [4] Git Check
git --version 2>nul
if errorlevel 1 (
    echo Git not found in PATH
) else (
    echo Current Branch:
    git branch --show-current 2>nul
    echo Remote URL:
    git remote get-url origin 2>nul
)
echo.

echo [5] Port Usage Check
echo Checking ports...
echo.
echo Port 3000 (Frontend):
netstat -an | findstr :3000 | findstr LISTENING
if errorlevel 1 echo   - Port 3000 is free
echo.
echo Port 8000 (Backend):
netstat -an | findstr :8000 | findstr LISTENING
if errorlevel 1 echo   - Port 8000 is free
echo.
echo Port 5432 (PostgreSQL):
netstat -an | findstr :5432 | findstr LISTENING
if errorlevel 1 echo   - Port 5432 is free
echo.

echo [6] Firewall Rules Check
echo Checking firewall rules...
netsh advfirewall firewall show rule name="HealthWise Frontend" >nul 2>&1
if errorlevel 1 (
    echo   - HealthWise Frontend rule: NOT FOUND
) else (
    echo   - HealthWise Frontend rule: FOUND
)
netsh advfirewall firewall show rule name="HealthWise Backend" >nul 2>&1
if errorlevel 1 (
    echo   - HealthWise Backend rule: NOT FOUND
) else (
    echo   - HealthWise Backend rule: FOUND
)
echo.

echo [7] Project Files Check
echo Checking project structure...
if exist "..\docker-compose.dev.yml" (
    echo   - docker-compose.dev.yml: FOUND
) else (
    echo   - docker-compose.dev.yml: NOT FOUND
)
if exist "..\backend\requirements.txt" (
    echo   - backend/requirements.txt: FOUND
) else (
    echo   - backend/requirements.txt: NOT FOUND
)
if exist "..\frontend\package.json" (
    echo   - frontend/package.json: FOUND
) else (
    echo   - frontend/package.json: NOT FOUND
)
echo.

echo [8] Docker Container Status
docker ps -a --format "table {{.Names}}\t{{.Status}}" 2>nul
if errorlevel 1 (
    echo Docker is not running or not accessible
)
echo.

echo ========================================
echo Check Complete!
echo ========================================
echo.
echo Next Steps:
echo 1. If Docker is not running, start Docker Desktop
echo 2. If ports are in use, stop conflicting services
echo 3. If firewall rules are missing, run as Administrator
echo ========================================
pause