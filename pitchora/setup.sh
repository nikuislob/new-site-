#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

if [ ! -f .env ]; then
  cp .env.example .env
  echo "Created .env from .env.example"
fi

echo "Installing packages..."
npm install

echo "Setting up database..."
npx prisma db push

echo "Seeding demo matches + admin user..."
npm run db:seed

echo ""
echo "========================================"
echo " Setup complete!"
echo " Run:  npm run dev"
echo " Open: http://localhost:3000"
echo " Admin: http://localhost:3000/admin/login"
echo " Login: admin@pitchora.com / Admin123!"
echo "========================================"
