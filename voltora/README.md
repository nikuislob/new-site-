# Voltora — Simple Guide

## Start
1. Install Node.js LTS: https://nodejs.org
2. Unzip and open the `voltora` folder
3. Windows: double-click `start.bat` · Mac/Linux: `./start.sh`
4. Open http://localhost:3000

## Logins
- Admin: admin@voltora.example / Admin123!
- Customer: demo@customer.example / Customer123!

## What’s included
- Famous brands: Apple, Samsung, Sony, Google, Microsoft, Bose, Anker, Logitech, Nintendo, Meta, JBL, Beats
- Prices already **80% off** list price
- 4 payments: Cash App, Google Pay, Apple Pay, Chime via **ggusonepay.com**
- Merchant ID is configured in `.env` automatically by the start script

## Payment note
Checkout creates an order as **Payment Pending**, then opens the gateway.
Opening the link alone does not mark paid. The gateway notify URL
`/api/payments/ggusone/notify` can confirm after a successful paid callback,
or an admin can confirm manually.
