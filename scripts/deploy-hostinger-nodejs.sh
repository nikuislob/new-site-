#!/usr/bin/env bash
# Deploy PitchPass bootstrap (pulls matchseat/ from GitHub during build) to Hostinger Node.js.
set -euo pipefail

TOKEN="${HOSTINGER_API_TOKEN:?Set HOSTINGER_API_TOKEN}"
USERNAME="${HOSTINGER_USERNAME:-u942298531}"
DOMAIN="${HOSTINGER_DOMAIN:-pitchpass.shop}"
BASE="${HOSTINGER_API_BASE:-https://developers.hostinger.com}"
BRANCH="${PITCHPASS_GIT_BRANCH:-cursor/pitchpass-hostinger-e886}"
ZIP="/tmp/pitchpass-gh-bootstrap.zip"

python3 - "$BRANCH" "$ZIP" <<'PY'
import json, zipfile, os, sys
branch, zip_path = sys.argv[1], sys.argv[2]
prepare = f"""
const {{ execSync }} = require('child_process');
const fs = require('fs');
if (!fs.existsSync('src/app')) {{
  const url = 'https://codeload.github.com/nikuislob/new-site-/tar.gz/{branch}';
  execSync('curl -fsSL -o repo.tgz ' + JSON.stringify(url), {{ stdio: 'inherit' }});
  execSync('tar xzf repo.tgz', {{ stdio: 'inherit' }});
  const dir = fs.readdirSync('.').find((n) => n.startsWith('new-site-') && fs.existsSync(n + '/matchseat/package.json'));
  if (!dir) throw new Error('extracted repo dir not found: ' + fs.readdirSync('.').join(','));
  execSync('cp -a ' + dir + '/matchseat/. .', {{ stdio: 'inherit' }});
  fs.rmSync(dir, {{ recursive: true, force: true }});
  try {{ fs.rmSync('repo.tgz', {{ force: true }}); }} catch {{}}
  console.log('source synced from GitHub via', dir);
}}
"""
pkg = {
  "name": "webapp",
  "private": True,
  "scripts": {
    "build": "node prepare.js && npm install --include=dev && npx prisma generate && npx next build",
    "start": "npx prisma db push && npx tsx scripts/ensure-seed.ts && npx next start -p ${PORT:-3000}",
  },
  "dependencies": {
    "next": "15.5.20",
    "react": "19.1.0",
    "react-dom": "19.1.0",
  },
}
if os.path.exists(zip_path):
  os.remove(zip_path)
with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED) as z:
  z.writestr("package.json", json.dumps(pkg, indent=2))
  z.writestr("prepare.js", prepare.strip() + "\n")
print(zip_path)
PY

ls -lh "$ZIP"
HTTP=$(curl -sS -o /tmp/pitchpass-deploy-response.json -w "%{http_code}" -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  -H "User-Agent: hostinger-api-sdk/1.5.2" \
  -F "archive=@$ZIP;filename=pitchpass-$(date +%s).zip;type=application/zip" \
  -F "node_version=20" \
  -F "package_manager=npm" \
  -F "build_script=build" \
  "$BASE/api/hosting/v1/accounts/$USERNAME/websites/$DOMAIN/nodejs/builds/from-archive")
echo "HTTP $HTTP"
python3 -m json.tool /tmp/pitchpass-deploy-response.json 2>/dev/null || cat /tmp/pitchpass-deploy-response.json
echo
UUID=$(python3 -c 'import json; u=json.load(open("/tmp/pitchpass-deploy-response.json")).get("uuid"); assert u, "no uuid"; print(u)')
echo "BUILD_UUID=$UUID"
for i in $(seq 1 100); do
  sleep 12
  STATUS=$(curl -sS -H "Authorization: Bearer $TOKEN" -H "User-Agent: hostinger-api-sdk/1.5.2" \
    "$BASE/api/hosting/v1/accounts/$USERNAME/websites/$DOMAIN/nodejs/builds" | UUID="$UUID" python3 -c 'import json,os,sys; u=os.environ["UUID"];
[print(b["state"]) for b in json.load(sys.stdin).get("data",[]) if b.get("uuid")==u]')
  curl -sS -H "Authorization: Bearer $TOKEN" -H "User-Agent: hostinger-api-sdk/1.5.2" \
    "$BASE/api/hosting/v1/accounts/$USERNAME/websites/$DOMAIN/nodejs/builds/$UUID/logs" | python3 -c 'import json,sys; d=json.load(sys.stdin); print((d.get("logs") or "")[-2000:])'
  echo "[poll $i] state=$STATUS"
  [[ "$STATUS" == "completed" ]] && exit 0
  [[ "$STATUS" == "failed" ]] && exit 1
done
echo "Timed out"
exit 1
