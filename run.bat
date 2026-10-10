@echo off
title Aureon Internet Banking System - DBMS Group D4
cls
echo =======================================================================
echo          Aureon - Internet Banking System (Course: 23CSE202 DBMS)
echo        Department of CSE - Amrita School of Computing, Amritapuri
echo =======================================================================
echo.
echo [*] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python from https://www.python.org/downloads/
    echo (Make sure to check the box "Add python.exe to PATH" during installation)
    echo.
    pause
    exit /b 1
)

echo [*] Checking and installing required packages (flask, flask-cors, pymysql)...
python -m pip install -r requirements.txt --quiet --no-warn-script-location

echo [*] Launching Aureon Banking System...
python start_server.py
pause
