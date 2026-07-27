@echo off
setlocal
cd /d "%~dp0"
echo Checking python dependencies...
python -c "import webview" 2>nul
if %errorlevel% neq 0 (
    echo Installing pywebview...
    python -m pip install pywebview --quiet
)
echo Launching Liquid Glass Anki Desktop App...
start "" pythonw main.py
exit
