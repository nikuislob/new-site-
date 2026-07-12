# PitchPass USA — Localhost

```bash
# Optional: start Postgres with Docker
docker compose up -d

cp .env.example .env
# Start PostgreSQL and set DATABASE_URL in .env

npm install
npx prisma db push
npm run db:seed
npm run dev
```

- Site: http://localhost:3000
- Admin: http://localhost:3000/admin
- Admin login: `admin@pitchpassusa.example` / `Admin123!`

Default local DATABASE_URL example:
`postgresql://pitchpass:pitchpass@127.0.0.1:5432/pitchpass?schema=public`
