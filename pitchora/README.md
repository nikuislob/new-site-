# Pitchora — Premium Football Ticket Booking

Production-ready Next.js ticket platform with interactive seat maps, automatic upcoming-match filtering, Apple Pay / Cash App checkout links, and a secure admin dashboard.

## Quick start

```bash
cd pitchora
npm install
npx prisma db push
npm run db:seed
npm run dev
```

- Storefront: http://localhost:3000
- Admin: http://localhost:3000/admin/login

### Demo admin

- Email: `admin@pitchora.com`
- Password: `Admin123!`

## Features

- Dark premium sports theme (black / white / gold / emerald)
- Upcoming matches only (auto-hide completed, sort by nearest kickoff)
- Live countdown timers
- Interactive stadium seat map (available / selected / reserved / sold)
- Max **2 tickets** per online order
- Bulk request flow for 3+ tickets → admin dashboard
- Apple Pay & Cash App payment links (editable in admin)
- Optional unique payment verification amount (&lt; $3)
- QR ticket + printable/downloadable confirmation
- Admin: matches, tickets, payments, orders, customers, bulk requests, CMS

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS 4 · Framer Motion · Prisma + SQLite · Zustand · Zod · Jose (JWT)

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run db:seed` | Seed demo data |
| `npm run db:reset` | Reset DB + seed |

## Notes

Original Pitchora branding only — no FIFA trademarks or official logos.
