@echo off
title RajuHero Ticket Website
cd /d "%~dp0"

echo.
echo ========================================
echo   Opening your website...
echo ========================================
echo.

REM Prefer a real localhost server when possible
where py >nul 2>nul && goto USE_PY
where python >nul 2>nul && goto USE_PYTHON
where node >nul 2>nul && goto USE_NODE

REM No Python/Node: use built-in PowerShell server (works on Windows)
goto USE_POWERSHELL

:USE_PY
echo Using Python...
start "" "http://localhost:3000"
py -m http.server 3000
goto END

:USE_PYTHON
echo Using Python...
start "" "http://localhost:3000"
python -m http.server 3000
goto END

:USE_NODE
echo Using Node...
start "" "http://localhost:3000"
npx --yes serve -l 3000 .
goto END

:USE_POWERSHELL
echo Using Windows PowerShell server...
echo Website: http://localhost:3000
echo Keep this window open. Press Ctrl+C to stop.
echo.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0server.ps1"
goto END

:END
echo.
echo If the browser did not open, go to: http://localhost:3000
echo Or double-click OPEN-WEBSITE.bat
pause
