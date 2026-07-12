# FIFA Match Tickets + Voltora

This repository contains:

| Project | Path | Description |
|---------|------|-------------|
| **FIFA Match Tickets** | [`fifa-tickets/`](./fifa-tickets/) | Full-stack FIFA ticket selling platform (public + admin) |
| Voltora | [`voltora/`](./voltora/) | US electronics e-commerce marketplace |

## FIFA Match Tickets (primary)

```bash
cd fifa-tickets
npm install
npx prisma db push
npm run db:seed
npm run dev
```

- Store: http://localhost:3000  
- Admin: http://localhost:3000/admin/login  
- Credentials: `admin@fifatickets.com` / `Admin@FIFA2026!`

Downloadable package: **`fifa-tickets-platform.zip`**

See [`fifa-tickets/README.md`](./fifa-tickets/README.md) for full documentation.
