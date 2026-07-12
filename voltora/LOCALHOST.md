# Arena Nights — Run on Localhost

## Requirements
- Node.js 20+ (recommended)
- npm

## Setup (Mac / Linux / Windows)

```bash
# 1. Unzip, then open the folder
cd arena-nights-localhost   # or whatever you named the unzipped folder

# 2. Install dependencies
npm install

# 3. Create env file
cp .env.example .env

# 4. Create database + seed demo data
npx prisma db push
npm run db:seed

# 5. Start the app
npm run dev
```

Open:
- Website: http://localhost:3000
- Admin: http://localhost:3000/admin/login

## Demo admin login
- Email: `admin@arenanights.example`
- Password: `Admin123!`

Also available:
- `tickets@arenanights.example` / `Admin123!`
- `support@arenanights.example` / `Admin123!`

## Notes
- Payment links are demo URLs (`https://example.com/pay/...`). Change them in Admin → Payment Links.
- This project is independent branding and is not affiliated with FIFA.
- To reset the database: `npm run db:reset`
