#!/bin/bash
set -e

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

HOST="${HOST:-127.0.0.1}"
PORT="${PORT:-8011}"
VENV_DIR="$PROJECT_DIR/.venv"

if [ ! -d "$VENV_DIR" ]; then
  echo "Creating Python virtual environment in $VENV_DIR..."
  python3 -m venv "$VENV_DIR"
fi

. "$VENV_DIR/bin/activate"

echo "Installing project dependencies..."
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

if curl -fsS "http://$HOST:$PORT" >/dev/null 2>&1; then
  echo "Public Infrastructure Damage Reporting System is already running on http://$HOST:$PORT"
  exit 0
fi

echo "Starting Public Infrastructure Damage Reporting System on http://$HOST:$PORT..."
HOST="$HOST" PORT="$PORT" python app.py
