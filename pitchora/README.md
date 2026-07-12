# Pitchora — Football Stadium Ticket Booking

Premium football match ticket site with a real stadium map and **max 9 random available seats** from the database.

## Windows (localhost)

1. Install Node.js LTS: https://nodejs.org
2. Open the `pitchora` folder
3. Double-click **`START-WINDOWS.bat`**
4. Browser opens **http://localhost:3000**

## Mac / Linux

```bash
cd pitchora
chmod +x START.sh
./START.sh
```

## Admin

- http://localhost:3000/admin/login
- Email: `admin@pitchora.com`
- Password: `Admin123!`

## What you get

- Football stadium SVG seating map (pitch + stands)
- Backend picks up to **9 random AVAILABLE seats** per load
- Temporary seat holds (15 min) before payment
- Seats become **SOLD only after payment confirmation**
- Apple Pay / Cash App payment links (admin-editable)
- Admin seat inventory (AVAILABLE / HELD / SOLD)

## Manual setup

```bash
cd pitchora
npm install
npx prisma db push
npm run db:seed
npm run dev
```
