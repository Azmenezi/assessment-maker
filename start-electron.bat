@echo off
echo Starting Assessment Maker for Windows...
echo.
echo Please make sure you have Node.js installed and npm is available in your PATH.
echo.

REM Check if node is available
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is available
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not available
    echo Please make sure Node.js is properly installed
    pause
    exit /b 1
)

echo Node.js and npm are available
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

echo Starting React development server and Electron...
echo.
echo IMPORTANT: 
echo - React will start first (usually on port 3000, 3001, or 3002)
echo - Wait for "Compiled successfully!" message
echo - Then Electron will start automatically
echo.
echo If Electron doesn't start, try these alternatives:
echo 1. npm run start-electron-3002
echo 2. npm run win-dev
echo.
echo Press Ctrl+C to stop both processes
echo.

npm run start-electron 