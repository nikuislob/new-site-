#!/bin/bash
cd "$(dirname "$0")"
set -e
if [ ! -f .env ]; then cp .env.example .env; fi
npm install
npx prisma db push
npx tsx prisma/seed.ts
echo ""
echo "Open http://localhost:3000"
echo "Admin: admin@pitchora.com / Admin123!"
(sleep 2; open "http://localhost:3000" 2>/dev/null || xdg-open "http://localhost:3000" 2>/dev/null || true) &
npm run dev
