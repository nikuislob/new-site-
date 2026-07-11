#!/usr/bin/env bash
set -e
cd "$(dirname "$0")"

echo ""
echo "========================================"
echo "  VOLTORA - Easy Start"
echo "========================================"
echo ""

if ! command -v node >/dev/null 2>&1; then
  echo "ERROR: Node.js is not installed."
  echo "Download it from https://nodejs.org then run this again."
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env file"
fi

echo "Step 1/4 - Installing packages (first time can take a few minutes)..."
npm install

echo "Step 2/4 - Setting up database..."
npx prisma generate
npx prisma db push

echo "Step 3/4 - Loading products and demo accounts..."
npm run db:seed

echo "Step 4/4 - Starting website..."
echo ""
echo "Open your browser to:  http://localhost:3000"
echo "Admin panel:           http://localhost:3000/admin/login"
echo ""
echo "Keep this window OPEN. Press Ctrl+C to stop."
echo ""
npm run dev
