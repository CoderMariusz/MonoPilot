@echo off
REM Script to run migrations 081-084 on Windows
REM Date: 2025-12-23

echo =================================
echo Running migrations 081-084
echo =================================
echo.

REM Check if Docker is running
docker ps >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not running!
    echo Please start Docker Desktop first
    pause
    exit /b 1
)

REM Check if Supabase is running
npx supabase status >nul 2>&1
if errorlevel 1 (
    echo Starting Supabase...
    npx supabase start
    if errorlevel 1 (
        echo ERROR: Failed to start Supabase
        pause
        exit /b 1
    )
)

echo.
echo Supabase is running. Choose an option:
echo.
echo 1. Reset database (runs ALL migrations 001-084) - RECOMMENDED
echo 2. Run only migrations 081-084
echo 3. Cancel
echo.

set /p choice="Enter choice (1/2/3): "

if "%choice%"=="1" (
    echo.
    echo Running database reset...
    npx supabase db reset
    echo.
    echo ✅ Database reset completed!
    pause
    exit /b 0
)

if "%choice%"=="2" (
    echo.
    echo Running migration 081...
    npx supabase db execute -f supabase/migrations/081_create_user_sessions.sql

    echo Running migration 082...
    npx supabase db execute -f supabase/migrations/082_create_password_history.sql

    echo Running migration 083...
    npx supabase db execute -f supabase/migrations/083_add_session_password_fields.sql

    echo Running migration 084...
    npx supabase db execute -f supabase/migrations/084_create_user_invitations.sql

    echo.
    echo ✅ Migrations 081-084 completed!
    pause
    exit /b 0
)

echo No action taken.
pause
