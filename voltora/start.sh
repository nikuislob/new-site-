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

if ! grep -q "GGUSONE_MCH_NO" .env 2>/dev/null; then
  cat >> .env <<'EOF'

GGUSONE_HOST="https://www.ggusonepay.com"
GGUSONE_MCH_NO="2026069382"
GGUSONE_KEY="1hY97a2Z2A3uGPpw1a4t3a1FY43S51X8"
EOF
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
