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
echo This will open two processes:
echo 1. React development server (http://localhost:3000)
echo 2. Electron desktop application
echo.
echo Press Ctrl+C to stop both processes
echo.

npm run start-electron 