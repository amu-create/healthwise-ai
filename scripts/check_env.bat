@echo off
chcp 65001 > nul
setlocal enabledelayedexpansion

cls
echo ========================================
echo HealthWise AI Environment Check Script
echo ========================================
echo Date: %date% %time%
echo Computer: %COMPUTERNAME%
echo User: %USERNAME%
echo ========================================
echo.

echo [1] Python Check
echo ----------------
python --version 2>nul
if !errorlevel! == 0 (
    where python 2>nul
) else (
    echo Python not found in PATH
)
echo.

echo [2] Node.js Check  
echo -----------------
node --version 2>nul
if !errorlevel! == 0 (
    where node 2>nul
    npm --version 2>nul
) else (
    echo Node.js not found in PATH
)
echo.

echo [3] Docker Check
echo ----------------
docker --version 2>nul
if !errorlevel! == 0 (
    docker-compose --version 2>nul
) else (
    echo Docker not found in PATH
)
echo.

echo [4] Git Check
echo -------------
git --version 2>nul
if !errorlevel! == 0 (
    echo Current directory: %cd%
    git branch --show-current 2>nul
) else (
    echo Git not found in PATH
)
echo.

echo [5] Port Usage Check
echo --------------------
netstat -an | findstr :3000 | findstr LISTENING >nul 2>&1
if !errorlevel! == 0 (
    echo Port 3000: IN USE
) else (
    echo Port 3000: FREE
)

netstat -an | findstr :8000 | findstr LISTENING >nul 2>&1
if !errorlevel! == 0 (
    echo Port 8000: IN USE
) else (
    echo Port 8000: FREE
)

netstat -an | findstr :5432 | findstr LISTENING >nul 2>&1
if !errorlevel! == 0 (
    echo Port 5432: IN USE
) else (
    echo Port 5432: FREE
)
echo.

echo [6] Project Files Check
echo -----------------------
if exist "..\docker-compose.dev.yml" (
    echo docker-compose.dev.yml: FOUND
) else (
    echo docker-compose.dev.yml: NOT FOUND
)

if exist "..\backend\requirements.txt" (
    echo backend/requirements.txt: FOUND
) else (
    echo backend/requirements.txt: NOT FOUND
)

if exist "..\frontend\package.json" (
    echo frontend/package.json: FOUND
) else (
    echo frontend/package.json: NOT FOUND
)
echo.

echo [7] Docker Status
echo -----------------
docker ps >nul 2>&1
if !errorlevel! == 0 (
    echo Docker is running
    docker ps --format "table {{.Names}}\t{{.Status}}" 2>nul
) else (
    echo Docker is not running or not accessible
)
echo.

echo ========================================
echo Check Complete!
echo ========================================
echo.
echo Press any key to exit...
pause >nul
exit /b 0