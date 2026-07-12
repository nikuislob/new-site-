#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/pitchpass-tickets.zip"
cd "$ROOT"
rm -f "$OUT"
zip -r "$OUT" matchseat \
  -x 'matchseat/node_modules/*' \
  -x 'matchseat/.next/*' \
  -x 'matchseat/prisma/*.db' \
  -x 'matchseat/prisma/*.db-journal' \
  -x 'matchseat/tsconfig.tsbuildinfo' \
  -x 'matchseat/.env'
echo "Created $OUT"
ls -lh "$OUT"
