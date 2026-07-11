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
  echo Download it from https://nodejs.org
  pause
  exit /b 1
)

if not exist ".env" (
  copy ".env.example" ".env" >nul
  echo Created .env from .env.example
  echo Edit .env to add payment credentials ^(STRIPE_SECRET_KEY or GGUSONE_*^).
)

echo Step 1/4 - Installing packages...
call npm install
if errorlevel 1 (
  echo Install failed.
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

echo Step 3/4 - Loading demo catalog...
call npm run db:seed
if errorlevel 1 (
  echo Seed failed.
  pause
  exit /b 1
)

echo Step 4/4 - Starting website...
echo.
echo Store: http://localhost:3000
echo Admin: http://localhost:3000/admin/login
echo.
call npm run dev
pause
