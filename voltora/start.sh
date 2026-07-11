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
  echo "Created .env from .env.example"
  echo "Edit .env to add STRIPE_SECRET_KEY or GGUSONE_* payment credentials."
fi

echo "Step 1/4 - Installing packages..."
npm install

echo "Step 2/4 - Setting up database..."
npx prisma generate
npx prisma db push

echo "Step 3/4 - Loading demo catalog..."
npm run db:seed

echo "Step 4/4 - Starting website..."
echo ""
echo "Store:  http://localhost:3000"
echo "Admin:  http://localhost:3000/admin/login"
echo ""
npm run dev
