@echo off
title Footbaaal / Pitchora
cd /d "%~dp0"
echo.
echo Starting local website on http://localhost:3000
echo Keep this window open. Press Ctrl+C to stop.
echo.
where py >nul 2>nul && (
  start "" "http://localhost:3000"
  py -m http.server 3000
  goto :eof
)
where python >nul 2>nul && (
  start "" "http://localhost:3000"
  python -m http.server 3000
  goto :eof
)
echo Python not found.
echo EASY OPTION: just double-click index.html instead.
echo.
pause
