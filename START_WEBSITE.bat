@echo off
title Earthen Beauty - Studio & Storefront Server
echo =======================================================
echo   Earthen Beauty by Nupur - Starting PHP Backend
echo =======================================================
echo.
echo Starting local PHP server on http://127.0.0.1:8000 ...
echo.

:: Check if server is already running
powershell -Command "try { $r = Invoke-WebRequest -Uri 'http://127.0.0.1:8000/api/health' -TimeoutSec 1; exit 0 } catch { exit 1 }"
if %errorlevel% neq 0 (
    start "" /B "%~dp0backend\php\php.exe" -S 127.0.0.1:8000 "%~dp0router.php"
    timeout /t 2 /nobreak >nul
)

echo Opening Earthen Beauty Storefront in your browser...
start http://127.0.0.1:8000/index.html

echo.
echo =======================================================
echo   Storefront:    http://127.0.0.1:8000/index.html
echo   Admin Portal:  http://127.0.0.1:8000/admin.html
echo.
echo   Admin Email:    earthenbeauty@gmail.com
echo   Admin Password: EARTHENBEAUTY
echo =======================================================
echo.
echo Leave this window open while testing. Press any key to close.
pause >nul
