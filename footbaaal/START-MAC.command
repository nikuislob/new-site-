#!/bin/bash
cd "$(dirname "$0")"
PORT=3000
echo ""
echo "Starting website at http://localhost:$PORT"
echo "Keep this window open. Press Ctrl+C to stop."
echo ""

open_browser() {
  sleep 1
  open "http://localhost:$PORT" 2>/dev/null || xdg-open "http://localhost:$PORT" 2>/dev/null || true
}

if command -v python3 >/dev/null 2>&1; then
  open_browser &
  python3 -m http.server "$PORT"
elif command -v python >/dev/null 2>&1; then
  open_browser &
  python -m http.server "$PORT"
elif command -v node >/dev/null 2>&1; then
  open_browser &
  npx --yes serve -l "$PORT" .
else
  echo "Python/Node not found."
  echo "Opening index.html directly instead..."
  open "index.html" 2>/dev/null || xdg-open "index.html" 2>/dev/null || true
fi
