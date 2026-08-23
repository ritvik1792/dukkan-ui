# Dukkan

Neighbourhood marketplace frontend: Amazon-style product pages, IndiaMART-like seller cards, and Zepto-style hyperlocal delivery.

Built with **Next.js (App Router)**, **React**, and **Tailwind CSS** on the Vercel Next.js stack. Backend is intentionally deferred — Spring Boot will own auth, catalogue, geo, and orders later. UI state lives in the browser (`localStorage`) with mock data.

## What it does

- **Buyer** — browse products and shops **inside a delivery radius**, search, cart, checkout, orders
- **Seller** — shop overview, catalogue, **product upload**, order status
- **Admin** — activate/suspend shops, approve/reject SKUs
- **Delivery choice** — Dukkan partner riders **or** the shop’s own delivery
- **Radius** — single constant so you can switch 5 km / 10 km without a rewrite

```ts
// src/lib/constants.ts
export const DELIVERY_RADIUS_KM = 5;
```

Change location in the header (Connaught Place, Karol Bagh, Saket, Noida). Shops outside the radius (for example Noida when you are in CP) disappear from nearby results.

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Use the **Demo role** chips in the header, or `/login`, to switch buyer / seller / admin.

## Demo notes

- New products start as `pending` until an admin approves them
- Photos on upload are preview-only (not uploaded to a server)
- No payments, SMS, or real maps yet

## GitHub

This folder is a git repo. GitHub CLI was not available on the machine that scaffolded it. To publish:

```bash
gh repo create dukkan --private --source=. --remote=origin --push
```
