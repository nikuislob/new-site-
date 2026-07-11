# Voltora — Premium US Electronics Marketplace

Voltora is a production-ready e-commerce platform for selling trending electronics in the United States. It includes a full customer storefront, secure authentication, cart/checkout with **exactly four configurable external payment links**, order management with manual payment confirmation, customer support chat, and a role-based admin panel.

## Features

- Premium responsive storefront (homepage, catalog, filters, product pages, search)
- Customer accounts (register, email verification, password reset, addresses, orders)
- Cart + wishlist with coupon support and inventory checks
- Multi-step checkout → order created as **Payment Pending**
- Exactly **4 admin-configurable HTTPS payment method slots** (no card/CVV collection)
- Opening a payment link **never** marks an order as paid
- Admin manually confirms payment, then updates shipping statuses
- Floating support chat + admin support inbox
- CMS for homepage hero, banners, announcement bar, delivery/footer content
- Roles: Super Admin, Product Manager, Order Manager, Support Agent
- SQLite database (easy local setup), Prisma ORM, Next.js App Router

## Tech Stack

- **Frontend/Backend:** Next.js 15 (App Router) + TypeScript + Tailwind CSS
- **Database:** SQLite via Prisma 5
- **Auth:** HTTP-only JWT cookies (jose) + bcrypt password hashing
- **Tests:** Vitest

## Quick Start (localhost)

```bash
# From the voltora project directory
cp .env.example .env   # already present in the zip with safe defaults
npm install
npx prisma db push
npx tsx prisma/seed.ts
npm run dev
```

Open:

- Storefront: http://localhost:3000
- Admin panel: http://localhost:3000/admin/login

### Demo accounts

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `admin@voltora.example` | `Admin123!` |
| Product Manager | `products@voltora.example` | `Admin123!` |
| Order Manager | `orders@voltora.example` | `Admin123!` |
| Support Agent | `support@voltora.example` | `Admin123!` |
| Customer | `demo@customer.example` | `Customer123!` |

### Demo coupons

- `WELCOME10` — 10% off (min $50)
- `SAVE25` — $25 off (min $200)

## Scripts

```bash
npm run dev          # Start development server (Turbopack)
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run test         # Vitest critical-flow tests
npm run db:push      # Apply Prisma schema
npm run db:seed      # Seed demo catalog, admins, payment slots
npm run db:reset     # Push schema + seed
```

## Payment workflow (important)

1. Customer completes shipping info and places the order.
2. Order status becomes **Payment Pending** (payment status **Pending**).
3. Customer selects one of up to four active external payment methods.
4. Site shows **Order ID** and **exact amount due**.
5. Customer is redirected to the HTTPS URL configured in admin.
6. Payment happens **outside** Voltora.
7. Opening/returning from the link does **not** mark the order paid.
8. Admin reviews payment externally and manually sets **Payment Confirmed**.

Admins configure the four slots under **Admin → Payments** (name, icon, HTTPS URL, button text, instructions, active toggle).

## Security notes

- Passwords are bcrypt-hashed and never shown in the admin UI
- No card numbers, CVV, banking passwords, or third-party OTPs are collected
- Support chat blocks sensitive credential patterns
- Admin routes are cookie-protected with role checks and login rate limiting
- Secrets live in environment variables (see `.env.example`)

## Project structure

```
voltora/
├── prisma/schema.prisma   # Database models
├── prisma/seed.ts         # Demo data
├── public/                # Static assets + uploads
├── src/app/(store)/       # Customer storefront pages
├── src/app/admin/         # Admin panel
├── src/app/api/           # REST API routes
├── src/components/        # UI components
├── src/lib/               # Auth, cart, db, settings
└── tests/                 # Automated tests
```

## Deployment

1. Set strong `AUTH_SECRET` and `ADMIN_AUTH_SECRET` (32+ random chars).
2. Set `NEXT_PUBLIC_APP_URL` to your HTTPS domain.
3. For production scale, switch `DATABASE_URL` to PostgreSQL and update `provider` in `prisma/schema.prisma`.
4. Run `npx prisma migrate deploy` (or `db push`) and seed if needed.
5. `npm run build && npm run start` (or deploy to Vercel/Node host).
6. Serve behind HTTPS. Keep uploads backed up (`public/uploads`).

## Environment variables

See `.env.example` for the full list.

## License

Demo / portfolio project. Replace payment URLs and branding before any real commerce use.
