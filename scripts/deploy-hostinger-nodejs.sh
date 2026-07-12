#!/usr/bin/env bash
# Deploy PitchPass bootstrap (pulls source from GitHub during build) to Hostinger Node.js.
set -euo pipefail

TOKEN="${HOSTINGER_API_TOKEN:?Set HOSTINGER_API_TOKEN}"
USERNAME="${HOSTINGER_USERNAME:-u942298531}"
DOMAIN="${HOSTINGER_DOMAIN:-pitchpass.shop}"
BASE="${HOSTINGER_API_BASE:-https://developers.hostinger.com}"
BRANCH="${PITCHPASS_GIT_BRANCH:-cursor/pitchpass-hostinger-e886}"
ZIP="/tmp/pitchpass-gh-bootstrap.zip"

python3 - "$BRANCH" "$ZIP" <<'PY'
import json, zipfile, sys
branch, zip_path = sys.argv[1], sys.argv[2]
prepare = f'''
const {{ execSync }} = require('child_process');
const fs = require('fs');
if (!fs.existsSync('src/app')) {{
  execSync('curl -fsSL -o repo.tgz https://codeload.github.com/nikuislob/new-site-/tar.gz/{branch}', {{ stdio: 'inherit' }});
  execSync('tar xzf repo.tgz', {{ stdio: 'inherit' }});
  const dir = fs.readdirSync('.').find((n) => n.startsWith('new-site--') || n.includes('pitchpass-hostinger') || n.includes('fifa-ticket'));
  if (!dir) throw new Error('extracted repo dir not found');
  execSync(`cp -a "${{dir}}/matchseat/." .`, {{ stdio: 'inherit' }});
  console.log('source synced from GitHub');
}}
'''
pkg = {
  "name": "webapp",
  "private": True,
  "scripts": {
    "build": "node prepare.js && npm install && npx prisma generate && npx next build",
    "start": "npx prisma db push && npx next start -p ${PORT:-3000}"
  },
  "dependencies": {
    "next": "15.5.20",
    "react": "19.1.0",
    "react-dom": "19.1.0"
  }
}
import os
if os.path.exists(zip_path):
  os.remove(zip_path)
with zipfile.ZipFile(zip_path, 'w', compression=zipfile.ZIP_DEFLATED) as z:
  z.writestr('package.json', json.dumps(pkg, indent=2))
  z.writestr('prepare.js', prepare.strip() + '\n')
print(zip_path)
PY

ls -lh "$ZIP"
HTTP=$(curl -sS -o /tmp/pitchpass-deploy-response.json -w "%{http_code}" -X POST \
  -H "Authorization: Bearer $TOKEN" \
  -H "Accept: application/json" \
  -H "User-Agent: hostinger-api-sdk/1.5.2" \
  -F "archive=@$ZIP;filename=pitchpass-gh-bootstrap.zip;type=application/zip" \
  -F "node_version=20" \
  -F "package_manager=npm" \
  -F "build_script=build" \
  "$BASE/api/hosting/v1/accounts/$USERNAME/websites/$DOMAIN/nodejs/builds/from-archive")
echo "HTTP $HTTP"
python3 -m json.tool /tmp/pitchpass-deploy-response.json 2>/dev/null || cat /tmp/pitchpass-deploy-response.json
echo
UUID=$(python3 -c 'import json; print(json.load(open("/tmp/pitchpass-deploy-response.json")).get("uuid",""))')
[[ -n "$UUID" ]] || exit 1
echo "BUILD_UUID=$UUID"
for i in $(seq 1 120); do
  sleep 8
  curl -sS -H "Authorization: Bearer $TOKEN" -H "User-Agent: hostinger-api-sdk/1.5.2" \
    "$BASE/api/hosting/v1/accounts/$USERNAME/websites/$DOMAIN/nodejs/builds" > /tmp/pitchpass-builds.json
  STATUS=$(python3 - <<'PY'
import json
u=open('/tmp/pitchpass-build-uuid','w')
PY
)
  STATUS=$(UUID="$UUID" python3 - <<'PY'
import json, os
u=os.environ['UUID']
d=json.load(open('/tmp/pitchpass-builds.json'))
for b in d.get('data',[]):
  if b.get('uuid')==u:
    print(b.get('state','')); break
PY
)
  curl -sS -H "Authorization: Bearer $TOKEN" -H "User-Agent: hostinger-api-sdk/1.5.2" \
    "$BASE/api/hosting/v1/accounts/$USERNAME/websites/$DOMAIN/nodejs/builds/$UUID/logs" > /tmp/pitchpass-logs.json
  python3 - <<'PY'
import json
d=json.load(open('/tmp/pitchpass-logs.json'))
logs=(d.get('logs') or '')
if logs.strip():
  print(logs[-3000:])
PY
  echo "[poll $i] state=$STATUS"
  [[ "$STATUS" == "completed" ]] && exit 0
  [[ "$STATUS" == "failed" ]] && exit 1
done
exit 1
