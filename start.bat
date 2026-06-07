@echo off
echo Starting Assembly Line Manager...

start cmd /k "cd backend && npm run dev"
start cmd /k "cd frontend && ng serve --configuration development"

echo Waiting for frontend to be ready...
:wait
timeout /t 2 /nobreak > nul
curl -s http://localhost:4200 > nul 2>&1
if %errorlevel% neq 0 goto wait

echo Ready. Opening browser...
start http://localhost:4200