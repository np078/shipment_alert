@echo off
REM ============================================
REM ShipAlert - Quick Setup Script for Windows
REM ============================================

echo.
echo %ESC%[95m╔════════════════════════════════════════════════════════════╗%ESC%[0m
echo %ESC%[95m║    ShipAlert - AI Early Warning System for Shipments       ║%ESC%[0m
echo %ESC%[95m╚════════════════════════════════════════════════════════════╝%ESC%[0m
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js first.
    exit /b 1
)

REM Check if Python is installed
where python >nul 2>nul
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python first.
    exit /b 1
)

echo [✓] Node.js found
echo [✓] Python found
echo.

REM Install dependencies
echo [1/3] Installing AI Model dependencies...
cd ai-model
pip install -r requirements.txt >nul 2>&1
cd ..
echo [✓] AI Model ready

echo.
echo [2/3] Installing Backend dependencies...
cd backend
call npm install >nul 2>&1
cd ..
echo [✓] Backend ready

echo.
echo [3/3] Installing Frontend dependencies...
cd frontend
call npm install >nul 2>&1
cd ..
echo [✓] Frontend ready

echo.
echo %ESC%[92m╔════════════════════════════════════════════════════════════╗%ESC%[0m
echo %ESC%[92m║             Setup Complete! Ready to Run                 ║%ESC%[0m
echo %ESC%[92m╚════════════════════════════════════════════════════════════╝%ESC%[0m
echo.
echo Next Steps:
echo.
echo   Terminal 1:  cd ai-model && python app.py
echo   Terminal 2:  cd backend && npm start
echo   Terminal 3:  cd frontend && npm run dev
echo.
echo Then open: http://localhost:5173
echo.
echo Demo Login: 
echo   Email: admin@infinite.com
echo   OTP: Check Terminal 2 console
echo.
