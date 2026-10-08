@echo off
setlocal

set "PROJECT_DIR=%~dp0"
set "HOST=%HOST:=%"
if "%HOST%"=="" set "HOST=127.0.0.1"
set "PORT=%PORT:=%"
if "%PORT%"=="" set "PORT=8011"
set "VENV_DIR=%PROJECT_DIR%.venv"

if not exist "%VENV_DIR%\Scripts\python.exe" (
    echo Creating Python virtual environment in %VENV_DIR%...
    python -m venv "%VENV_DIR%"
)

call "%VENV_DIR%\Scripts\activate.bat"

echo Installing project dependencies...
python -m pip install --upgrade pip
python -m pip install -r "%PROJECT_DIR%requirements.txt"

echo Starting Public Infrastructure Damage Reporting System on http://%HOST%:%PORT%...
set "HOST=%HOST%"
set "PORT=%PORT%"
python "%PROJECT_DIR%app.py"

pause
