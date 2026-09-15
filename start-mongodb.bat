@echo off
:: GOG Management System - Local MongoDB Startup Script
:: Runs a single-node replica set (required by Prisma for MongoDB)

set MONGO_DIR=%USERPROFILE%\mongodb-local\bin
set DATA_DIR=%USERPROFILE%\mongodb-local\data\db
set LOG_DIR=%USERPROFILE%\mongodb-local\log

echo [GOG] Starting local MongoDB replica set on port 27017...
"%MONGO_DIR%\mongod.exe" ^
  --dbpath "%DATA_DIR%" ^
  --logpath "%LOG_DIR%\mongod.log" ^
  --port 27017 ^
  --replSet rs0 ^
  --bind_ip 127.0.0.1 ^
  --logappend

pause
