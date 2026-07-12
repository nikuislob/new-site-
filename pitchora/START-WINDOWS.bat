@echo off
title Pitchora Football Tickets
cd /d "%~dp0"

echo.
echo ========================================
echo   Pitchora - Football Ticket Platform
echo ========================================
echo.

where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is required.
  echo Download LTS from https://nodejs.org then run this again.
  pause
  exit /b 1
)

if not exist .env (
  copy .env.example .env >nul
  echo Created .env
)

echo Installing packages...
call npm install
if errorlevel 1 (
  echo npm install failed
  pause
  exit /b 1
)

echo Setting up database...
call npx prisma db push
call npx tsx prisma/seed.ts

echo.
echo Starting server at http://localhost:3000
echo Admin: http://localhost:3000/admin/login
echo Login: admin@pitchora.com / Admin123!
echo.
start "" "http://localhost:3000"
call npm run dev
pause
