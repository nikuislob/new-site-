# FIFA Match Tickets Platform

Production-ready full-stack ticket selling website for FIFA matches — public storefront + secure admin panel.

## Features

### Public site
- Browse upcoming FIFA matches with date, time, opponent, venue, and stadium name
- Full-bleed stadium hero imagery on match pages
- Interactive seat map (available / selected / sold)
- Two ticket categories: **Basic ($70.50)** and **Premium ($141)**
- Max **2 tickets** per online checkout
- **3+ tickets** disables checkout and shows **Chat Now** → contact form for bulk orders
- Dynamic payment redirects (Apple Pay / Cash App URLs):

| Package | Amount | Payment key |
|---------|--------|-------------|
| 1 Basic | $70.50 | `BASIC_1` |
| 2 Basic | $141.00 | `BASIC_2` |
| 1 Premium | $141.00 | `PREMIUM_1` |
| 2 Premium | $282.00 | `PREMIUM_2` |

### Admin panel
- Secure cookie/JWT login
- Matches CRUD (date, time, opponent, venue, stadium, image)
- Ticket category pricing
- Visual seat inventory management
- Payment link configuration for all four packages
- Orders with customer info + payment status updates
- Customers list
- Bulk inquiry inbox
- Sales reports + **CSV export**

## Tech stack

- **Next.js 15** (App Router) — frontend + API routes
- **React 19** + **Tailwind CSS 4**
- **Prisma 5** + **SQLite** (swap `DATABASE_URL` for PostgreSQL in production)
- **jose** + **bcryptjs** for admin auth

## Quick start

```bash
cd fifa-tickets
npm install
npx prisma db push
npm run db:seed
npm run dev
```

Or one-shot:

```bash
cd fifa-tickets
npm run setup
npm run dev
```

- Storefront: http://localhost:3000  
- Admin: http://localhost:3000/admin/login  

### Demo admin credentials

```
Email:    admin@fifatickets.com
Password: Admin@FIFA2026!
```

## Environment

Copy `.env.example` to `.env`:

```env
DATABASE_URL="file:./dev.db"
AUTH_SECRET="change-me-to-a-long-random-string"
ADMIN_AUTH_SECRET="change-me-to-another-long-random-string"
NEXT_PUBLIC_APP_NAME="FIFA Match Tickets"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

For PostgreSQL production:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/fifa_tickets?schema=public"
```

Then update `prisma/schema.prisma` datasource `provider` to `postgresql`, run `npx prisma db push` and `npm run db:seed`.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Generate Prisma client + production build |
| `npm start` | Run production server |
| `npm run db:push` | Sync schema to database |
| `npm run db:seed` | Seed matches, seats, admin, payment links |
| `npm run db:reset` | Reset DB and re-seed |
| `npm run setup` | Install + push + seed |

## Project structure

```
fifa-tickets/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── public/images/          # Stadium SVG assets
├── src/
│   ├── app/
│   │   ├── (public)/       # Home, matches, checkout, contact
│   │   ├── admin/          # Admin login + panel
│   │   └── api/            # Checkout, contact, admin APIs
│   ├── components/
│   ├── lib/                # db, auth, payments, validators
│   └── middleware.ts
├── .env.example
└── README.md
```

## Deployment notes

1. Set strong `ADMIN_AUTH_SECRET` / `AUTH_SECRET`
2. Point `DATABASE_URL` at your production database
3. Update the four payment link URLs in **Admin → Payment Links** to real Apple Pay / Cash App endpoints
4. Build and start:

```bash
npm run build
npm start
```

Compatible with Vercel, Railway, Render, Docker, or any Node host.

## ZIP package

A deployment ZIP is generated at the repository root:

```
fifa-tickets-platform.zip
```

It includes source, Prisma schema, assets, and lockfile. After unzipping, run `npm install`, `npx prisma db push`, `npm run db:seed`, then `npm run dev`.

## License

Demo / deployment starter for FIFA match ticket sales operations.
