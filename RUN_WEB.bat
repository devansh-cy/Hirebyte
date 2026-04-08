@echo off
cd /d "%~dp0"
title HireByte Everything-Launcher
color 0B

echo ===================================================
echo       HIREBYTE SYSTEM DIAGNOSTIC ^& STARTUP
echo ===================================================
echo.

echo 1. Cleaning up previous sessions...
taskkill /F /IM python.exe >nul 2>&1
taskkill /F /IM node.exe >nul 2>&1
timeout /t 1 /nobreak >nul

echo 2. Clearing Frontend Cache...
if exist "frontend\node_modules\.vite" (
    rd /s /q "frontend\node_modules\.vite"
    echo [OK] Vite cache cleared
)

echo 3. Checking Python Environment...
if exist "%~dp0..\.venv\Scripts\python.exe" (
    set PY_EXE="%~dp0..\.venv\Scripts\python.exe"
) else if exist "%~dp0backend\venv\Scripts\python.exe" (
    set PY_EXE="%~dp0backend\venv\Scripts\python.exe"
) else (
    echo [ERROR] Python environment not found! 
    echo Tried: %~dp0..\.venv and %~dp0backend\venv
    pause
    exit /b
)
echo [OK] Using Python: %PY_EXE%

echo 4. Launching Backend Server...
start "HireByte Backend" cmd /k "cd /d "%~dp0backend" && %PY_EXE% main.py || pause"

echo 5. Waiting for Backend to be Ready...
:WAIT_BACKEND
timeout /t 2 /nobreak >nul
netstat -ano | findstr :9000 | findstr LISTENING >nul
if errorlevel 1 (
    echo [WAIT] Backend still starting...
    goto WAIT_BACKEND
)
echo [OK] Backend is listening on port 9000

echo 6. Launching Frontend Server...
start "HireByte Frontend" cmd /k "cd /d "%~dp0" && cd frontend && npm run dev || pause"

echo 7. Finalizing...
timeout /t 3 /nobreak >nul
echo.
echo ===================================================
echo       SYSTEMS ONLINE!
echo.
echo       Backend:  http://127.0.0.1:9000
echo       Frontend: http://127.0.0.1:5173
echo.
echo       (Keep all windows open while using the app)
echo ===================================================
echo.
start http://127.0.0.1:5173
pause
