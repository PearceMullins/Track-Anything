@echo off
setlocal enabledelayedexpansion
cd /d "%~dp0"

rem ============================================================
rem  Track Anything launcher
rem
rem    run.bat            build the web UI if it is out of date, then run the app
rem    run.bat rebuild    force a rebuild of the web UI, then run
rem    run.bat dev        run the API and the hot-reload UI in two windows
rem
rem  Requires Python 3.11+ and (for building) Node.js 18+.
rem ============================================================

echo ==================================================
echo   Track Anything
echo ==================================================

where python >nul 2>nul
if errorlevel 1 (
  echo [X] Python was not found on PATH. Install Python 3.11+ and try again.
  pause
  exit /b 1
)

python -c "import uvicorn, fastapi" >nul 2>nul
if errorlevel 1 (
  echo [*] Installing Python dependencies...
  python -m pip install -r requirements.txt
  if errorlevel 1 (
    echo [X] Could not install the Python dependencies.
    pause
    exit /b 1
  )
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [X] Node.js and npm were not found on PATH. Install Node.js 18+ and try again.
  pause
  exit /b 1
)

if /i "%~1"=="dev" goto dev

if not exist "frontend\node_modules" (
  echo [*] Installing frontend dependencies ^(first run, this takes a minute^)...
  pushd frontend
  call npm install
  if errorlevel 1 (
    popd
    echo [X] npm install failed.
    pause
    exit /b 1
  )
  popd
)

set NEED_BUILD=0
if /i "%~1"=="rebuild" set NEED_BUILD=1
if not exist "frontend\dist\index.html" set NEED_BUILD=1

if "!NEED_BUILD!"=="0" (
  set STALE=
  for /f "usebackq delims=" %%A in (`powershell -NoProfile -Command "$s=(Get-ChildItem -Recurse -File 'frontend\src','frontend\index.html','frontend\package.json','frontend\vite.config.ts' -ErrorAction SilentlyContinue | Sort-Object LastWriteTimeUtc -Descending | Select-Object -First 1).LastWriteTimeUtc; $d=(Get-Item 'frontend\dist\index.html').LastWriteTimeUtc; if ($s -gt $d) { 'yes' } else { 'no' }"`) do set STALE=%%A
  if /i "!STALE!"=="yes" (
    echo [*] Web UI is out of date with the source.
    set NEED_BUILD=1
  )
)

if "!NEED_BUILD!"=="1" (
  echo [*] Building the web UI...
  pushd frontend
  call npm run build
  if errorlevel 1 (
    popd
    echo [X] The web UI build failed.
    pause
    exit /b 1
  )
  popd
)

echo [*] Starting Track Anything at http://127.0.0.1:8000
echo     Leave this window open. Press Ctrl+C here to stop.
echo.
python main.py
goto end

:dev
if not exist "frontend\node_modules" (
  echo [*] Installing frontend dependencies ^(first run^)...
  pushd frontend
  call npm install
  popd
)

echo [*] Starting the API on http://127.0.0.1:8000
start "Track Anything API" cmd /k "python main.py --dev-frontend"

pushd frontend
echo [*] Starting the UI dev server on http://localhost:5173
start "Track Anything UI" cmd /k "npm run dev"
popd

echo.
echo Two windows opened: close both to stop the app.
goto end

:end
endlocal
