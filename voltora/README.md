# Arena Nights — Premium Football Ticket Booking Platform

Arena Nights is a production-ready international football ticket booking experience with an interactive stadium map, secure inventory reservations, admin-configurable payment link mappings, manual payment verification, QR ticket passes, and live support chat.

**This is an independent ticket experience and is not affiliated with FIFA or any official tournament organizer.**

## Tech Stack

- **Frontend/Backend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS 4
- **Database:** SQLite via Prisma 5
- **Auth:** HTTP-only JWT admin sessions (jose) + bcrypt
- **QR:** `qrcode` data URLs with secure random tokens
- **Tests:** Vitest

## Quick Start

```bash
cd voltora
cp .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open:

- Public site: http://localhost:3000
- Admin panel: http://localhost:3000/admin/login

### Demo admin accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@arenanights.example` | `Admin123!` |
| Ticket Manager | `tickets@arenanights.example` | `Admin123!` |
| Support Agent | `support@arenanights.example` | `Admin123!` |

## Core Product Flow

1. Landing page with featured match + real countdown + live availability
2. Interactive stadium zone selection (SVG) + accessible list alternative
3. Quantity 1–2 (group requests open live chat)
4. Checkout collects name/email and payment method
5. Backend creates pending order, reserves inventory, resolves payment link mapping
6. Customer pays on external HTTPS destination (Apple Pay / Cash App)
7. Opening the link does **not** mark the order paid
8. Admin verifies payment → tickets + QR passes issued

## Payment Link Mappings

Admin → **Payment Links** configures every combination:

| Category | Qty | Method |
|----------|-----|--------|
| STANDARD VIEW | 1 / 2 | Apple Pay / Cash App |
| GOOD VIEW | 1 / 2 | Apple Pay / Cash App |

Seeded example URLs point to `https://example.com/pay/...` — replace them with real provider destinations before production use.

## Scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run test
npm run db:push
npm run db:seed
npm run db:reset
```

## Security notes

- Prices and totals are calculated on the backend only
- Quantity > 2 is rejected by schema validation and inventory rules
- Payment status changes require authorized admin actions and are audit-logged
- QR payloads contain opaque tokens, not customer PII
- Support chat blocks card/password patterns
- Inactive payment links are never returned to customers

## Environment

See `.env.example`. For production:

1. Set strong `ADMIN_AUTH_SECRET` (32+ chars)
2. Set `NEXT_PUBLIC_APP_URL` to your HTTPS domain
3. Replace seeded payment URLs in admin
4. Optionally switch Prisma provider to PostgreSQL for scale
