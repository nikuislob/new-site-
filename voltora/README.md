# Voltora

Premium US electronics marketplace (Next.js 15 + Prisma).

## Quick start

1. Install [Node.js LTS](https://nodejs.org)
2. Copy env: `cp .env.example .env` and set `AUTH_SECRET` / `ADMIN_AUTH_SECRET`
3. Windows: `start.bat` · Mac/Linux: `./start.sh`  
   Or: `npm install && npx prisma db push && npm run db:seed && npm run dev`
4. Open http://localhost:3000

## Demo logins

| Role | Email | Password |
|------|-------|----------|
| Super Admin | admin@voltora.example | Admin123! |
| Payment Manager | payments@voltora.example | Admin123! |
| Support Agent | support@voltora.example | Admin123! |
| Customer | demo@customer.example | Customer123! |

## Features

- Marketplace storefront (search, categories, cart, wishlist, checkout)
- Server-side prices, inventory validation, coupons
- Hosted card / Apple Pay / Google Pay architecture (Stripe adapter) — **no customer crypto**
- Optional ggusonepay link adapter (configure in `.env` only — never commit keys)
- Assisted Payment for authorized payment staff
- Chat Now + admin live inbox (DB-backed, polling)
- Admin RBAC: Super Admin, Product/Order/Payment Manager, Support Agent

## Payments

Orders stay **Payment Pending** until a verified webhook or Assisted Payment confirmation. Opening a payment link alone does not mark an order paid.

Configure:

```env
PAYMENT_PROVIDER=auto
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
# Optional:
# GGUSONE_HOST=https://www.ggusonepay.com
# GGUSONE_MCH_NO=
# GGUSONE_KEY=
```

Webhook: `POST /api/payments/webhook`

## Tests

```bash
npm test
npm run build
```

## Full delivery notes

See [DELIVERY-REPORT.md](./DELIVERY-REPORT.md) for audit results, payment research, settlement notes, security, and deployment.
