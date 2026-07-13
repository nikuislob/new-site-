# PitchPass

PitchPass is an independent, full-stack ticket marketplace focused on the remaining FIFA World Cup 2026 matches. It is not affiliated with or endorsed by FIFA.

## Architecture

- Next.js 15 App Router with TypeScript and responsive React interfaces
- Prisma 5 with SQLite locally; PostgreSQL is recommended for production concurrency
- HTTP-only JWT customer/admin sessions with role-protected API routes
- Provider-synchronized match records kept separate from admin-controlled ticket inventory
- Atomic inventory holds with expiry, server-side totals, booking snapshots, and payment idempotency
- Cash App/provider adapter with signed webhooks and no browser-trusted success state
- Order-linked support conversations and allowlisted, staff-audited external payment links
- Private PDF ticket storage with authenticated download routes

## Local setup

```bash
cp .env.example .env
npm ci
npx prisma db push
npm run db:seed
npm run dev
```

Open:

- Marketplace: `http://localhost:3000`
- Admin: `http://localhost:3000/admin/login`

Demo users:

- Admin: `admin@pitchpass.example` / `Admin123!`
- Customer: `demo@pitchpass.example` / `Customer123!`

## Match data

Configure `MATCH_API_URL` to the exact World Cup fixture endpoint documented by your sports-data provider, plus `MATCH_API_KEY` and `CRON_SECRET`. Schedule:

```text
GET /api/cron/sync-matches
Authorization: Bearer <CRON_SECRET>
```

The sync updates teams, status, kickoff, and round by provider ID. It never deletes stored matches, ticket inventory, or orders when the provider fails. Customer sales require a visible, future match with an active status and available admin inventory.

## Cash App/provider setup

No undocumented endpoint is assumed. Configure the values supplied by your Cash App-compatible provider:

- `CASH_APP_API_BASE_URL`
- `CASH_APP_CREATE_PAYMENT_PATH`
- `CASH_APP_API_KEY`
- `CASH_APP_WEBHOOK_SECRET`

The backend creates payments using the database total and idempotency key. Signed webhooks are the only automatic path to `PAID`. Google Pay, Apple Pay, and cards create an order-linked support conversation; clicking an external payment link never marks an order paid.

## Production notes

- Move Prisma to PostgreSQL and run migrations rather than `db push`.
- Use persistent encrypted object storage for `.ticket-files` and retain authenticated download authorization.
- Configure transactional email before enabling customer notifications.
- Replace the starter legal text with counsel-approved policies.
- Use a distributed rate limiter and scheduled reservation cleanup when running multiple instances.
- Rotate all authentication, cron, provider, and webhook secrets.

## Validation

```bash
npm test
npm run lint
npm run build
```

The test suite covers match eligibility, payment status normalization, reservation expiry, and concurrent attempts against the final available ticket.
