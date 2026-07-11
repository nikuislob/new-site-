# Voltora Delivery Report

Premium US electronics marketplace built on Next.js 15, Prisma, and SQLite (dev) with a modular payment architecture, Assisted Payment workflow, and real-time support chat (polling).

---

## 1. Bugs found

| Area | Issue |
|------|--------|
| Checkout | Form posted to wrong endpoint / double JSON parse → client “JSON error” |
| Cart | Mutations returned incomplete payloads; coupon posted to wrong route; stock not re-checked on PATCH |
| Orders | Guest order pages leaked PII without auth; payment could be started without guest token |
| Payments | Stock/coupon decremented at checkout (before payment); webhook lacked amount verification |
| Auth | Admin middleware checked cookie presence only (not JWT); production secrets could be empty |
| Admin | Order detail field mapping mismatches; Assist Payment missing |
| Support | Wrong response shape; no polling; order linking without ownership check |
| Catalog | Broken Unsplash image URLs |
| Tests | `generateOrderNumber()` could emit `_` from default nanoid alphabet |
| Support API | PATCH silently ignored reply bodies (unknown keys stripped) |

## 2. Bugs fixed

- Server-authoritative checkout totals; inventory commit deferred to payment confirmation
- Guest order access via HMAC `accessToken` + email
- Modular payment providers (`stripe`, `ggusone`, `external_link`) with webhook amount checks
- Assisted Payment API + RBAC (`PAYMENT_MANAGER`, Super Admin)
- JWT verification in middleware; fail-fast auth secrets in production
- Support Chat Now polling + admin inbox reply; ownership checks on order link
- Alphanumeric order numbers; strict PATCH schema for support conversations
- Marketplace header/nav/homepage redesign; famous-brand catalog at 80% off MSRP
- Hardcoded GGUSONE secrets removed from start scripts (`.env` only)

## 3. Tests performed

- Unit: Vitest (`tests/critical-flows.test.ts`) — utils, RBAC, cart totals, guest tokens, payment invariants, ggusone sign
- Production build (`npm run build`)
- Manual/API E2E via curl: homepage, products, search, cart, checkout, order gate, payment initiation, assist payment, duplicate ref, support RBAC, payment-manager assist, Chat Now create/reply/history, unauthorized payment change, invalid webhook

## 4. Test results

| Suite | Result |
|-------|--------|
| Vitest | **13/13 passed** |
| Production build | **Succeeded** |
| E2E customer → checkout → assist → stock decrement | **Passed** |
| Support agent blocked from assist | **Passed** |
| Payment Manager assist | **Passed** |
| Chat create → admin reply → history | **Passed** |
| No customer-facing crypto methods in DB | **Passed** |
| Invalid webhook rejected | **Passed** (400 / signature fail) |

## 5. Known remaining limitations

- Email delivery (verify/forgot-password) is stubbed — configure an ESP for production
- Tax calculation is not jurisdiction-aware (taxAmount = 0)
- Chat uses **3s polling**, not WebSockets/SSE
- Stripe adapter uses Checkout Session API; full `constructEvent` webhook path requires `STRIPE_WEBHOOK_SECRET`
- Hyperswitch is **evaluated and architecturally compatible** but **not self-hosted** in this deploy
- SQLite is fine for demo/dev; use PostgreSQL for multi-instance production
- Unpaid-order TTL auto-cancel not implemented
- CSRF double-submit tokens not implemented (SameSite cookies + origin checks relied on)
- ggusone live API may return TIMESTAMP ERROR; falls back to configured HTTPS URL; order stays PENDING until webhook/assist/admin confirm

## 6. UI/UX improvements

- Dense marketplace header: utility strip, category + search, account/orders/wishlist/cart
- Secondary navy category nav (Deals, Smartphones, Laptops, …)
- Rich homepage: announcement, hero carousel, category grid, rails (trending/deals/bestsellers/new), benefits, newsletter, multi-column footer
- Product cards with price, discount %, badges, stock-aware CTAs
- Mobile drawer + large touch targets
- Admin navy shell with role-aware nav

## 7. US marketplace UX patterns used as inspiration

Patterns studied (not copied): Amazon (search-first header, dense rails), Walmart (category clarity), Best Buy (electronics taxonomy, deals), Target (clean promo bands), Newegg (spec-forward product discovery). Brand identity **Voltora** is original.

## 8. Architecture changes

```
Storefront (App Router)
  → API routes (auth, cart, checkout, orders, search, support, payments)
  → Prisma / SQLite
  → Payment Service (provider interface)
       → Stripe | ggusone | external_link adapters
  → confirmOrderPayment() (idempotent inventory + status)
Admin panel (RBAC) → products, orders, assisted payment, support, content, payments config
```

## 9. Database architecture

Prisma models include: User, Address, AdminUser, Product (+ images/variants), Category, Brand, Cart/CartItem, Wishlist, Order/OrderItem, OrderStatusHistory, PaymentMethod, PaymentEvent, Coupon, Conversation/Message, SiteSetting, AdminActivityLog, NewsletterSubscriber. Foreign keys, indexes, timestamps; critical paths use transactions.

## 10. Authentication architecture

- Customers: bcrypt passwords, JWT in httpOnly cookie (`AUTH_SECRET`)
- Admins: separate JWT cookie (`ADMIN_AUTH_SECRET`), role claims, lockout after failed attempts
- Guest orders: HMAC access token bound to order number + email
- Middleware JWT-verifies admin routes (not cookie presence alone)

## 11. Open-source payment projects evaluated

| Project | Notes |
|---------|--------|
| **Hyperswitch** (Juspay) | Actively maintained (Apache 2.0), Rust orchestrator, Docker/self-host, connectors incl. Stripe, Apple Pay / Google Pay docs, webhooks. **Orchestrator only — not an acquirer.** |
| Direct Stripe SDK | Production-ready hosted Checkout; cards + wallets when enabled on Stripe account |
| ggusonepay | Merchant link/gateway adapter already integrated for Cash App–style flows |

## 12. Payment orchestration selected and why

**Application-level provider interface** (`createPayment`, `getPaymentStatus`, `handleWebhook`, refund/cancel stubs) with adapters. Hyperswitch is the recommended long-term self-hosted orchestrator if multi-PSP routing is required; for this release, **direct Stripe Checkout adapter + ggusone adapter** avoid deploying a full Hyperswitch cluster while remaining swappable.

## 13. Actual processor selected and why

**Primary recommendation: Stripe** (hosted Checkout) for US card, Apple Pay, and Google Pay — mature KYC, webhooks, refunds, documentation. **ggusonepay** remains an optional configured adapter for merchant-approved alternate rails. Processor choice for live money movement requires merchant KYC approval; the app does not invent settlement.

## 14. Card, Apple Pay, and Google Pay architecture

Customer never enters PAN/CVV into Voltora forms. Flow: order created server-side → provider `createPayment()` → hosted checkout URL → wallet buttons appear when processor + device support them → webhook verifies signature + amount → `confirmOrderPayment()`.

## 15. Indian bank settlement options verified

Per Stripe India docs: registered Indian businesses can receive **INR payouts to an Indian bank account** after KYC (PAN, entity bank account in legal name, purpose codes for export). Eligibility and schedule are determined by Stripe account onboarding — not by this codebase.

## 16. Merchant-side USDT payout options verified

Stripe Connect **stablecoin payouts** (USDC, private preview) are for **US-based Connect platforms** paying eligible connected accounts — **not** a general merchant USDT settlement path for this storefront, and **not USDT**. No verified official Stripe product that settles this merchant’s card revenue as USDT to an arbitrary wallet was found for general use. **Do not promise USDT settlement** without a separately contracted, licensed provider and legal review. Customer checkout has **no crypto option**.

## 17. Confirmation: crypto is not customer-facing

Seeded methods: Card (Hosted Checkout), Apple Pay, Google Pay, Cash App. Payment API rejects method names/instructions matching crypto/bitcoin/USDT patterns.

## 18. Assisted Payment workflow

Unpaid order → Chat Now / support → authorized Payment Manager/Super Admin opens order → server shows verified amount → staff uses external POS / Virtual Terminal / MOTO → records transaction reference + method + optional note → `confirmOrderPayment` + immutable admin activity log → customer sees confirmed status. Duplicate refs blocked; Support Agents cannot confirm.

## 19. Chat Now architecture

Client widget → `POST /api/support` creates DB-backed conversation + message → admin inbox `GET /api/admin/support` → reply `POST /api/admin/support/[id]` → customer polls conversation. Unread counters; order link ownership validated. **Not** localStorage-as-database (IDs only cached for reconnect).

## 20. Admin roles and permissions

| Role | Capabilities |
|------|----------------|
| SUPER_ADMIN | Full access |
| PRODUCT_MANAGER | Catalog |
| ORDER_MANAGER | Orders/shipping |
| PAYMENT_MANAGER | Payments + Assisted Payment |
| SUPPORT_AGENT | Chat + orders:read; **no** payment confirm |

## 21. Security improvements

Password hashing; httpOnly secure cookies; server RBAC; rate-limited login; guest order tokens; no client prices; webhook signature verification; sensitive chat content blocked; admin audit logs; production secret fail-fast; removed hardcoded gateway keys from scripts.

## 22. Environment variables

See `.env.example`: `DATABASE_URL`, `NEXT_PUBLIC_APP_URL`, `AUTH_SECRET`, `ADMIN_AUTH_SECRET`, session/lockout settings, `PAYMENT_PROVIDER`, optional `STRIPE_*`, optional `GGUSONE_*`.

## 23. Database migration instructions

```bash
cd voltora
npx prisma db push
npm run db:seed
```

For production Postgres: set `DATABASE_URL` to Postgres and change `provider` in `prisma/schema.prisma`, then `prisma migrate deploy`.

## 24. Local development instructions

```bash
cd voltora
cp .env.example .env   # set secrets
npm install
npx prisma db push && npm run db:seed
npm run dev            # http://localhost:3000
# or: ./start.sh / start.bat
```

Demo: `admin@voltora.example` / `Admin123!` · `demo@customer.example` / `Customer123!`  
Also: `products@`, `orders@`, `payments@`, `support@` (Admin123!).

## 25. Production deployment instructions

1. Set strong `AUTH_SECRET` / `ADMIN_AUTH_SECRET` and `NEXT_PUBLIC_APP_URL=https://…`
2. Use managed Postgres; configure Stripe keys + webhook to `/api/payments/webhook`
3. `npm run build && npm run start` (or platform adapter: Vercel/Docker)
4. Complete processor KYC; enable Apple Pay / Google Pay in processor dashboard
5. TLS termination; restrict admin origins; rotate secrets; backup DB

## 26. Remaining merchant/KYC configuration

- Create/approve Stripe (or chosen acquirer) merchant account
- Bank payout details (e.g. Indian INR account if using Stripe India)
- Apple Pay domain verification / Google Pay merchant enrollment as required by processor
- Optional: deploy Hyperswitch for multi-PSP routing
- Optional ggusone credentials only if that gateway is contractually approved
- ESP for transactional email
- Legal: privacy policy, terms, refund policy URLs in content settings
