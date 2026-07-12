@echo off
echo ========================================
echo    TransitOps Full-Stack Application
echo ========================================
echo.
echo Starting Backend and Frontend...
echo.

REM Start Backend in new window
start "TransitOps Backend" cmd /k "cd transitops-backend && uvicorn app.main:app --reload"

REM Wait 3 seconds
timeout /t 3 /nobreak >nul

REM Start Frontend in new window
start "TransitOps Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ========================================
echo Both servers are starting!
echo ========================================
echo.
echo Backend:  http://127.0.0.1:8000
echo Frontend: http://localhost:5173
echo.
echo Login with:
echo   Email: fleetmanager@transitops.com
echo   Password: password123
echo.
echo Press any key to exit this window...
pause >nul
