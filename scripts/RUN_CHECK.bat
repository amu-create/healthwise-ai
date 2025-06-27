@echo off
echo Starting HealthWise Environment Check...
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0check_env.ps1"
pause