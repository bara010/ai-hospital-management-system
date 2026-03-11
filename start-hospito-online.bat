@echo off
setlocal EnableExtensions
cd /d "%~dp0"
powershell -ExecutionPolicy Bypass -File "%~dp0start-hospito-online.ps1"
endlocal
