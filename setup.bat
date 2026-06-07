@echo off
echo ============================================
echo  Line Manager - First Time Setup
echo ============================================
echo.
echo This will:
echo  1. Install Angular CLI globally
echo  2. Install backend dependencies
echo  3. Install frontend dependencies
echo.
pause

echo Checking Node.js...
node --version > nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js not found.
    echo.
    echo Please download and install Node.js 18+ from:
    echo https://nodejs.org
    echo.
    echo After installing, run this setup again.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VER=%%i
echo Found Node.js %NODE_VER%
echo.

echo [1/3] Checking Angular CLI...
call ng version > nul 2>&1
if %errorlevel% equ 0 (
    echo Already installed. Skipping.
) else (
    echo Installing Angular CLI...
    call npm install -g @angular/cli
    if %errorlevel% neq 0 (
        echo ERROR: Angular CLI install failed.
        pause
        exit /b 1
    )
)

echo.
echo [2/3] Installing backend dependencies...
if exist backend\node_modules (
    echo Already installed. Skipping.
) else (
cd backend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Backend install failed.
    pause
    exit /b 1
)
cd ..
)
echo Done.

echo.
echo [3/3] Installing frontend dependencies...
if exist frontend\node_modules (
    echo Already installed. Skipping.
) else (
cd frontend
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Frontend install failed.
    pause
    exit /b 1
)
cd ..
)
echo Done.

echo.
echo ============================================
echo  Setup complete. Starting application...
echo ============================================
echo.
call start.bat
