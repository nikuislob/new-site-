# Pitchora (footbaaal) — Easy Localhost Guide

## 1) Download

Download **`footbaaal.zip`**, then unzip it.

Direct download (from this repo branch):
https://github.com/nikuislob/new-site-/raw/cursor/pitchora-ticket-platform-ae89/footbaaal.zip

## 2) Install Node.js (one time)

Install **Node.js LTS** from https://nodejs.org  
Restart your terminal after installing.

## 3) Setup + start

Open a terminal in the unzipped folder and run:

```bash
cd pitchora
npm run setup
npm run dev
```

## 4) Open in your browser

| Page | URL |
|---|---|
| Website | http://localhost:3000 |
| Admin login | http://localhost:3000/admin/login |

**Admin credentials**
- Email: `admin@pitchora.com`
- Password: `Admin123!`

## Stop the server

Press `Ctrl + C` in the terminal.

---

### Manual commands (same result)

```bash
cd pitchora
npm install
npx prisma db push
npm run db:seed
npm run dev
```

### If something fails

- `npm` not found → install Node.js LTS and reopen the terminal
- Port 3000 already used → `npm run dev -- -p 3001` then open http://localhost:3001
- Database issues → `npm run db:reset`
