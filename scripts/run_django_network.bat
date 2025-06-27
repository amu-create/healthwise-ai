@echo off
echo Starting Django development server on all interfaces...
cd /d C:\Users\User\0604_jebal\healthwise
call venv\Scripts\activate
echo.
echo Django server will be available at:
echo - http://localhost:8000
echo - http://127.0.0.1:8000
echo - http://192.168.0.28:8000
echo.
echo Press Ctrl+C to stop the server
echo.
python manage.py runserver 0.0.0.0:8000
pause