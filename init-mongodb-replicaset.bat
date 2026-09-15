@echo off
:: GOG Management System - Initialize MongoDB Replica Set
:: Run this ONCE after starting MongoDB for the first time

echo [GOG] Initializing replica set 'rs0'...
call npm run replica:init

echo.
echo [GOG] Replica set ready! Now run: npm run seed
pause
