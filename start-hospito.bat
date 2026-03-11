@echo off
setlocal EnableExtensions

cd /d "%~dp0"

set "BACKEND_DIR=%CD%\backend"
set "FRONTEND_DIR=%CD%\frontend"
set "FRONTEND_URL=http://localhost:5173"
set "BACKEND_URL=http://localhost:8080"

set "ENV_FILE=%BACKEND_DIR%\.env.local"
if exist "%ENV_FILE%" (
  for /f "usebackq eol=# tokens=1,* delims==" %%A in ("%ENV_FILE%") do (
    if not "%%A"=="" set "%%A=%%B"
  )
)

echo =========================================
echo            HOSPITO One-Click Start
echo =========================================
echo.

if not exist "%BACKEND_DIR%\pom.xml" (
  echo [ERROR] Backend project not found at: "%BACKEND_DIR%"
  goto :fail
)

if not exist "%FRONTEND_DIR%\package.json" (
  echo [ERROR] Frontend project not found at: "%FRONTEND_DIR%"
  goto :fail
)

where java >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Java is not installed or not added to PATH.
  goto :fail
)

where mvn >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Maven is not installed or not added to PATH.
  goto :fail
)

where npm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] Node.js/NPM is not installed or not added to PATH.
  goto :fail
)

if "%DB_URL%"=="" set "DB_URL=jdbc:postgresql://localhost:5432/hospito"
if "%DB_USER%"=="" set "DB_USER=postgres"
if "%DB_PASSWORD%"=="" set "DB_PASSWORD=postgres"
if "%DDL_AUTO%"=="" set "DDL_AUTO=create"
set "DEFAULT_FIREBASE_FILE=%BACKEND_DIR%\secrets\firebase-service-account.json"
if "%FIREBASE_SERVICE_ACCOUNT%"=="" if exist "%DEFAULT_FIREBASE_FILE%" set "FIREBASE_SERVICE_ACCOUNT=%DEFAULT_FIREBASE_FILE%"

echo Database URL: %DB_URL%
echo Database User: %DB_USER%
echo DDL Mode  : %DDL_AUTO%
if not "%FIREBASE_SERVICE_ACCOUNT%"=="" echo Firebase SA: %FIREBASE_SERVICE_ACCOUNT%
echo.

if not exist "%FRONTEND_DIR%\node_modules" (
  echo Installing frontend dependencies...
  pushd "%FRONTEND_DIR%"
  call npm install
  if errorlevel 1 (
    popd
    echo [ERROR] npm install failed.
    goto :fail
  )
  popd
)

echo Launching backend...
start "HOSPITO Backend" cmd /k "cd /d ""%BACKEND_DIR%"" && mvn spring-boot:run"

echo Launching frontend...
start "HOSPITO Frontend" cmd /k "cd /d ""%FRONTEND_DIR%"" && npm run dev"

echo Waiting for frontend server...
timeout /t 8 /nobreak >nul

echo Opening browser at %FRONTEND_URL%
start "" "%FRONTEND_URL%"

echo.
echo HOSPITO started:
echo 1) Frontend: %FRONTEND_URL%
echo 2) Backend API: %BACKEND_URL%
echo.
echo Note: For one-time schema reset, run:
echo       set DDL_AUTO=create ^&^& start-hospito.bat

goto :end

:fail
echo.
echo Startup failed. Fix the error and run this file again.
pause
exit /b 1

:end
exit /b 0
