@echo off
chcp 65001 > nul
echo ========================================
echo HealthWise AI Environment Check Script
echo ========================================
echo.

echo [1] Docker Version Check
docker --version
docker-compose --version
echo.

echo [2] Docker Service Status
sc query "Docker Desktop Service" | findstr STATE
echo.

echo [3] Running Containers
docker ps
echo.

echo [4] All Containers (including stopped)
docker ps -a
echo.

echo [5] Docker Networks
docker network ls
echo.

echo [6] Port Usage Status
echo Frontend (3000):
netstat -an | findstr :3000
echo Backend (8000):
netstat -an | findstr :8000
echo PostgreSQL (5432):
netstat -an | findstr :5432
echo.

echo [7] Firewall Rules
netsh advfirewall firewall show rule name="HealthWise Frontend"
netsh advfirewall firewall show rule name="HealthWise Backend"
echo.

echo [8] Environment Variables
echo DOCKER_HOST: %DOCKER_HOST%
echo COMPOSE_PROJECT_NAME: %COMPOSE_PROJECT_NAME%
echo.

echo ========================================
echo Check Complete! 
echo Please copy and share this result.
echo ========================================
pause