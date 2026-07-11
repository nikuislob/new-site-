@echo off
title Voltora Store - Starting...
cd /d "%~dp0"

echo.
echo ========================================
echo   VOLTORA - Easy Start
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed.
  echo Download it from https://nodejs.org  then run this file again.
  echo.
  pause
  exit /b 1
)

if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo Created .env file
)

findstr /C:"GGUSONE_MCH_NO" .env >nul 2>nul
if errorlevel 1 (
  echo.>>.env
  echo GGUSONE_HOST=https://www.ggusonepay.com>>.env
  echo GGUSONE_MCH_NO=2026069382>>.env
  echo GGUSONE_KEY=1hY97a2Z2A3uGPpw1a4t3a1FY43S51X8>>.env
)
echo Step 1/4 - Installing packages (first time can take a few minutes)...
call npm install
if errorlevel 1 (
  echo Install failed. Check your internet connection.
  pause
  exit /b 1
)

echo Step 2/4 - Setting up database...
call npx prisma generate
call npx prisma db push
if errorlevel 1 (
  echo Database setup failed.
  pause
  exit /b 1
)

echo Step 3/4 - Loading products and demo accounts...
call npm run db:seed
if errorlevel 1 (
  echo Seed failed.
  pause
  exit /b 1
)

echo Step 4/4 - Starting website...
echo.
echo Open your browser to:  http://localhost:3000
echo Admin panel:           http://localhost:3000/admin/login
echo.
echo Keep this window OPEN. Press Ctrl+C to stop.
echo.
call npm run dev
pause
