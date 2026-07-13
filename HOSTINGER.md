# PitchPass on Hostinger (pitchpass.shop)

## Account

| Item | Value |
|------|-------|
| Domain | `pitchpass.shop` |
| Hosting username | `u942298531` |
| Website IP | `82.25.125.231` |
| Plan | Single Web Hosting (`hostinger_starter_v3`) |
| SSL | Let's Encrypt (active for `pitchpass.shop`) |

## What works today

- Download / source-zip UI removed from the PitchPass app (`matchseat/`).
- Production bug fixes are on branch `cursor/pitchpass-hostinger-e886`.
- Hostinger DNS A `@` → `82.25.125.231` (when NS resolve).
- Static holding page on `https://pitchpass.shop/` (LiteSpeed serves `public_html/index.html`).

## Blocker: Single plan cannot run Next.js

PitchPass is **Next.js + Prisma** (SSR, API routes, SQLite). Hostinger **Node.js Web Apps** need **Business** or **Cloud** hosting.

On Single we observed:

- Node archive builds can complete via API.
- Runtime fails: `lscgid: execve():/usr/bin/node: No such file or directory`
- Without Node, LiteSpeed only serves static files from `public_html`.

### To go fully live on Hostinger

1. Upgrade hosting to **Business Web Hosting** (or Cloud) in hPanel.
2. Redeploy `matchseat/` (GitHub branch or `./scripts/deploy-hostinger-nodejs.sh`).
3. Env vars:
   - `DATABASE_URL=file:./prod.db`
   - `AUTH_SECRET` / `ADMIN_AUTH_SECRET` (long random)
   - `NEXT_PUBLIC_APP_URL=https://pitchpass.shop`
   - `NODE_ENV=production`
4. Start should be: `next start -H 0.0.0.0 -p ${PORT:-3000}` (prisma push/seed run during `npm run build`).
5. Confirm Runtime Logs show Next listening, then open `/matches` and `/admin/login`.

### API deploy helper

```bash
export HOSTINGER_API_TOKEN='…'   # hPanel → Dev Tools → API
export PITCHPASS_GIT_BRANCH='cursor/pitchpass-hostinger-e886'
./scripts/deploy-hostinger-nodejs.sh
```

## DNS notes

- Panel may show `ns1.hostinger.com` / `ns2.hostinger.com` or `ns1.dns-parking.com` / `ns2.dns-parking.com`.
- Domain lock (60-day) can delay some registry NS changes.
- Prefer Hostinger nameservers + A `@` → `82.25.125.231`, CNAME `www` → `pitchpass.shop`.

## Polapine Cash App API (pd.cash)

Checkout creates live Cash App payment pages via Polapine when these env vars are set:

```bash
POLAPINE_API_KEY=pk_...
POLAPINE_API_SECRET=sk_...
POLAPINE_API_BASE_URL=https://pay.polapine.com/api/v1
POLAPINE_BRAND_SLUG=pitchpass
```

- Keys: https://pd.cash/api-access/
- Docs: https://pd.cash/api/docs
- Webhook endpoint on PitchPass: `POST /api/webhooks/polapine`
- Set the dashboard webhook URL to `https://pitchpass.shop/api/webhooks/polapine` (also sent per payment link).

Cash App gateway limits on the account: **$5–$500** per payment.

## Security

Rotate Hostinger password, FTP password, API tokens, and Polapine keys after shared-agent setup.
