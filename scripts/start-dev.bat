@echo off
echo Stopping any existing processes on port 5000...
call scripts\kill-port-5000.bat

echo.
echo Starting application on port 5000...
cd apps\frontend
pnpm dev

