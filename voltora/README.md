# PitchPass USA

Next.js ticketing platform for upcoming international football matches at USA venues.

**Independent marketplace — not affiliated with FIFA or any governing body.**

## Stack
- Next.js 15 + TypeScript + Tailwind CSS 4
- Prisma + **PostgreSQL** (local / Supabase / Neon / Railway)
- Admin dashboard for match scheduling + manual Apple Pay / Cash App payment links

## Ticket rules
- Standard View: **$85**
- Premium View: **$150**
- Max **2 tickets** per online order (enforced frontend + backend)
- Quantity > 2 shows bulk support chat CTA
- Checkout creates `pending_link` orders; admin pastes payment links → `awaiting_payment` → `completed`

## Local setup (PostgreSQL)

```bash
# 1. Ensure Postgres is running and create DB (example):
# createdb pitchpass

cp .env.example .env
# Edit DATABASE_URL for your Postgres / Supabase connection string

npm install
npx prisma db push
npm run db:seed
npm run dev
```

Open http://localhost:3000

### Admin
- URL: http://localhost:3000/admin
- Email: `admin@pitchpassusa.example`
- Password: `Admin123!`

### Supabase
1. Create a Supabase project
2. Paste the connection string into `DATABASE_URL`
3. Run `npx prisma db push` (or apply `prisma/migrations/0001_init.sql` in the SQL editor)
4. `npm run db:seed`

## API
- `GET /api/matches` — upcoming matches only (`match_date > NOW()`)
- `POST /api/checkout` — rejects `quantity > 2` with HTTP 400
