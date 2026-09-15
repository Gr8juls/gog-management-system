@echo off
:: GOG Management System - Local MongoDB Startup Script
:: Runs a single-node replica set (required by Prisma for MongoDB)

set MONGO_DIR=%USERPROFILE%\mongodb-local\bin
set DATA_DIR=%USERPROFILE%\mongodb-local\data\db
set LOG_DIR=%USERPROFILE%\mongodb-local\log

if not exist "%LOG_DIR%" mkdir "%LOG_DIR%"
if not exist "%DATA_DIR%" mkdir "%DATA_DIR%"

:: Check if mongod is already running
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [GOG] MongoDB is already running on this machine.
    pause
    exit /b 0
)

:: If not running, clean up any stale lock file from previous abnormal termination
if exist "%DATA_DIR%\mongod.lock" (
    echo [GOG] Removing stale lock file...
    del /f /q "%DATA_DIR%\mongod.lock"
)

echo [GOG] Starting local MongoDB replica set on port 27017...
"%MONGO_DIR%\mongod.exe" ^
  --dbpath "%DATA_DIR%" ^
  --logpath "%LOG_DIR%\mongod.log" ^
  --port 27017 ^
  --replSet rs0 ^
  --bind_ip 127.0.0.1 ^
  --logappend

pause
