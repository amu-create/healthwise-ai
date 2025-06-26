@echo off
rem Quick setup for first time users

rem Create .env files if they don't exist
if not exist backend\.env (
    copy backend\.env.example backend\.env
    echo Created backend/.env
)

if not exist frontend\.env (
    copy frontend\.env.example frontend\.env
    echo Created frontend/.env
    echo.
    echo Please edit frontend/.env and add your Firebase configuration!
    pause
)

rem Run Docker
echo Starting services...
docker-compose -f docker-compose.dev.yml up --build -d

echo.
echo Setup complete!
echo Frontend: http://localhost:3000
echo Backend: http://localhost:8000
pause
