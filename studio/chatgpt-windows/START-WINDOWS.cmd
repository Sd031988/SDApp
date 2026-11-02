@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
 py -3 sd_bridge_windows.py
 goto :done
)
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
 python sd_bridge_windows.py
 goto :done
)
echo Python 3.9+ fehlt: https://www.python.org/downloads/windows/
pause
exit /b 1
:done
if errorlevel 1 pause
