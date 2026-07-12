# PitchPass on Hostinger (pitchpass.shop)

## Account (configured)

| Item | Value |
|------|-------|
| Domain | `pitchpass.shop` |
| Hosting username | `u942298531` |
| Website IP | `82.25.125.231` |
| Nameservers | `ns1.dns-parking.com`, `ns2.dns-parking.com` |
| DNS A (@) | `82.25.125.231` |
| DNS CNAME (www) | `pitchpass.shop` |
| SSL | Lifetime SSL (auto-install after DNS) |
| Plan | Single Web Hosting (`hostinger_starter_v3`) |

## Important: Node.js / Web Apps

PitchPass is a **Next.js** app (SSR + API routes + Prisma). Hostinger **Web Apps / Node.js** requires a **Business or Cloud** plan. The current Single plan blocks the Web Apps UI.

After upgrading to Business:

1. Deploy `matchseat/` as the app root (ZIP or GitHub subdirectory).
2. Node 20 · install `npm ci` · build `npm run build` · start `npm run start`
3. Set env vars from `matchseat/.env.example` (use strong secrets; `NEXT_PUBLIC_APP_URL=https://pitchpass.shop`)
4. First boot runs `prisma db push` via `npm start`. Then run seed once: `npm run db:seed`
5. Confirm SSL is active and `https://pitchpass.shop` loads.

### API deploy helper

Uploads a tiny bootstrap archive; Hostinger then pulls `matchseat/` from this GitHub branch during `npm run build`.

```bash
export HOSTINGER_API_TOKEN='…'   # from hPanel → Dev Tools → API
export PITCHPASS_GIT_BRANCH='cursor/pitchpass-hostinger-e886'
./scripts/deploy-hostinger-nodejs.sh
```

Required Hostinger env vars (Website → Deployments → Environment):

- `DATABASE_URL=file:./prod.db`
- `AUTH_SECRET` / `ADMIN_AUTH_SECRET` (long random)
- `NEXT_PUBLIC_APP_URL=https://pitchpass.shop`
- `NODE_ENV=production`

## DNS note

Nameservers were switched from Cloudflare to Hostinger. Global DNS can take up to 24 hours. Until then, some resolvers may still show Cloudflare NS.
