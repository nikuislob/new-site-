#!/bin/bash
cd "$(dirname "$0")"
echo ""
echo "Starting local website on http://localhost:3000"
echo "Keep this window open. Press Ctrl+C to stop."
echo ""
(sleep 1; open "http://localhost:3000" 2>/dev/null || xdg-open "http://localhost:3000" 2>/dev/null || true) &
python3 -m http.server 3000
