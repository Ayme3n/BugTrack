@echo off
REM BugTrack Environment Setup Helper (Windows)
REM This script helps you create your .env file

echo.
echo ==============================
echo   BugTrack Environment Setup
echo ==============================
echo.

REM Check if .env already exists
if exist .env (
    echo WARNING: .env file already exists!
    set /p OVERWRITE="Do you want to overwrite it? (y/N): "
    if /i not "%OVERWRITE%"=="y" (
        echo.
        echo Aborted. Your existing .env file was not modified.
        pause
        exit /b 0
    )
)

echo.
echo I'll help you create your .env file.
echo.
echo You'll need:
echo   1. Supabase Project URL
echo   2. Supabase Anon Key
echo   3. Supabase Service Role Key
echo   4. Database Connection String
echo.
echo Get these from: https://supabase.com -^> Your Project -^> Settings
echo.
echo.

REM Collect information
set /p SUPABASE_URL="Enter Supabase URL (e.g., https://xxxxx.supabase.co): "
set /p ANON_KEY="Enter Supabase Anon Key: "
set /p SERVICE_KEY="Enter Supabase Service Role Key: "
set /p DATABASE_URL="Enter Database URL (postgresql://...): "

echo.
echo Generating encryption key...
echo (You can also run: openssl rand -hex 32)
set /p ENCRYPTION_KEY="Enter encryption key (or leave blank to set later): "

REM Create .env file
(
echo # ============================================================================
echo # BugTrack Environment Configuration
echo # ============================================================================
echo # Generated on %DATE% %TIME%
echo.
echo # Supabase Configuration
echo NEXT_PUBLIC_SUPABASE_URL=%SUPABASE_URL%
echo NEXT_PUBLIC_SUPABASE_ANON_KEY=%ANON_KEY%
echo SUPABASE_SERVICE_ROLE_KEY=%SERVICE_KEY%
echo.
echo # Database Configuration
echo DATABASE_URL=%DATABASE_URL%
echo DIRECT_URL=%DATABASE_URL%
echo.
echo # Application Configuration
echo NODE_ENV=development
echo NEXT_PUBLIC_APP_URL=http://localhost:3000
echo.
echo # Encryption Key
echo ENCRYPTION_KEY=%ENCRYPTION_KEY%
) > .env

echo.
echo ============================================
echo   .env file created successfully!
echo ============================================
echo.
echo Next steps:
echo   1. Run: npx prisma db push
echo   2. Run: npm run dev
echo   3. Visit: http://localhost:3000
echo.
echo For more help, see: QUICK_FIX.md
echo.
pause

