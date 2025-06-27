@echo off
title HealthWise AI Environment Check
color 0A
chcp 65001 > nul

echo.
echo ====================================
echo    HealthWise AI Environment Check
echo ====================================
echo.

echo Checking Python...
python --version
echo.

echo Checking Node.js...
node --version
npm --version
echo.

echo Checking Docker...
docker --version
docker-compose --version
echo.

echo Checking Git...
git --version
echo.

echo Checking Ports...
echo Port 3000 (Frontend):
netstat -an | find ":3000" | find "LISTENING"
if errorlevel 1 echo   [FREE]
echo.
echo Port 8000 (Backend):
netstat -an | find ":8000" | find "LISTENING"
if errorlevel 1 echo   [FREE]
echo.
echo Port 5432 (PostgreSQL):
netstat -an | find ":5432" | find "LISTENING"
if errorlevel 1 echo   [FREE]
echo.

echo ====================================
echo Check complete!
echo ====================================
echo.
echo Press any key to close this window...
pause > nul