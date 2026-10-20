@echo off
rem Double-click launcher: starts the RackFlow server + database, opens the app.
start "" powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve.ps1" -Port 8082
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:8082/"
