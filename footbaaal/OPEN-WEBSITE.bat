@echo off
cd /d "%~dp0"
echo Opening website in your browser...
start "" "%~dp0index.html"
echo.
echo If it did not open, right-click index.html and choose Open with Chrome/Edge.
pause
