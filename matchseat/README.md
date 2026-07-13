# PitchPass — US Match Ticket Marketplace

Independent ticket storefront for upcoming international soccer matches in the United States, with Cash App / Apple Pay amount-based payment links, customer accounts, Chat Now support, and a full operator admin panel.

**Not affiliated with FIFA.** Demo / portfolio project — replace payment URLs before any real commerce use.

## Features

- Upcoming match schedule with venues, stages, and seating stock
- **Basic seats $70** · **Premium seats $140** · **Max 2 tickets per customer**
- Cart auto-calculates totals: $70 / $140 / $210 / $280
- Payment URL templates with `{amount}` so you need fewer Cash App / Apple Pay links
- Optional per-amount URL overrides in admin
- Orders stay **Payment Pending** until an admin confirms payment manually
- Floating **Chat Now** widget + admin support inbox
- Role-based admin: Super Admin, Match Manager, Order Manager, Support Agent

## Quick start

```bash
cd matchseat
cp .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

- Storefront: http://localhost:3000  
- Admin: http://localhost:3000/admin/login  

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@pitchpass.example` | `Admin123!` |
| Match Manager | `matches@pitchpass.example` | `Admin123!` |
| Order Manager | `orders@pitchpass.example` | `Admin123!` |
| Support Agent | `support@pitchpass.example` | `Admin123!` |
| Customer | `demo@customer.example` | `Customer123!` |

## Payment links (fewer destinations)

Configure under **Admin → Payments**:

1. Set Cash App template, e.g. `https://cash.app/$YourCashtag/{amount}`
2. Set Apple Pay template, e.g. `https://your-pay-page.example/{amount}`
3. Checkout replaces `{amount}` with `70`, `140`, `210`, or `280` from the cart total
4. Optionally add fixed overrides for a specific amount if a template is not enough

Opening a payment link **never** marks an order paid. Confirm in **Admin → Orders**.

## Scripts

```bash
npm run dev        # Development server
npm run build      # Production build
npm run start      # Production server
npm run lint       # ESLint
npm run test       # Vitest
npm run db:push    # Apply schema
npm run db:seed    # Seed matches, admins, payment methods
npm run db:reset   # Reset DB + seed
```

## Zip archive (operators only)

From the repo root:

```bash
./scripts/make-pitchpass-zip.sh
```

Do not expose the zip on the public website.

## Tech

Next.js 15 · TypeScript · Tailwind CSS · Prisma · SQLite · JWT cookies · Vitest
