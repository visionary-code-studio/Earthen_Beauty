@echo off
title Earthen Beauty - Admin Studio Portal
echo =======================================================
echo   Earthen Beauty - Opening Studio Admin Portal
echo =======================================================
echo.

powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/health' -TimeoutSec 1; exit 0 } catch { exit 1 }"
if %errorlevel% neq 0 (
    echo Starting local server on http://127.0.0.1:8000 ...
    start "" /B "%~dp0backend\php\php.exe" -S 127.0.0.1:8000 "%~dp0router.php"
    timeout /t 2 /nobreak >nul
)

echo Opening Admin Portal in your default browser...
start http://127.0.0.1:8000/admin.html

echo.
echo =======================================================
echo   Admin Portal URL: http://127.0.0.1:8000/admin.html
echo   Email:            earthenbeauty@gmail.com
echo   Password:         EARTHENBEAUTY
echo =======================================================
echo.
timeout /t 5 >nul
