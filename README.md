# PitchPass — FIFA-style US Match Ticket Site

New project lives in [`matchseat/`](./matchseat/).

```bash
cd matchseat
cp .env.example .env
npm install
npx prisma db push
npm run db:seed
npm run dev
```

- Store: http://localhost:3000  
- Admin: http://localhost:3000/admin/login  

**Pricing:** Basic $70 · Premium $140 · max 2 tickets/customer  
**Payments:** Cash App + Apple Pay links auto-matched to cart total ($70 / $140 / $210 / $280)

See [`matchseat/README.md`](./matchseat/README.md) for operator docs and setup.

Also includes the earlier [`voltora/`](./voltora/) electronics marketplace demo.
