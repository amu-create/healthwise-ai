@echo off
cd /d C:\Users\User\0604_jebal\healthwise

echo [Django] Starting Django server on all IPs (0.0.0.0:8000)
echo This allows network access from any device on your network
echo Access the server using:
echo   - localhost:8000
echo   - 127.0.0.1:8000
echo   - 192.168.0.28:8000 (from other devices)
echo.

python manage.py runserver 0.0.0.0:8000
