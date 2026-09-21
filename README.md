# Dukkan

Neighbourhood marketplace frontend: Amazon-style product pages, IndiaMART-like seller cards, and Zepto-style hyperlocal delivery.

Built with **Next.js (App Router)**, **React**, and **Tailwind CSS**. Auth, catalogue, and orders are served by the Spring Boot API in `dukkan` (PostgreSQL). `src/data/seed.ts` is catalogue fixture data only — it does not create login accounts.

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

Open [http://localhost:3000](http://localhost:3000). Create the first account at `/signup` (email + password). Phone OTP is `/login`. Sellers and admins use `/console/login` after signup (buyers cannot open the console until you set `role` to `ADMIN` or `SELLER` in PostgreSQL).

The API (`dukkan`) must be running on http://localhost:8080. See that repo’s README for Postgres and Flyway. There is no `DUKKAN_SEED_*` password — do not put login passwords in env or Secret Manager.

## Google Cloud

See **[DEPLOY.md](DEPLOY.md)**. Short version: Cloud Run for this UI, Cloud Run for the API, Secret Manager for JWT + **database** credentials, one Cloud SQL instance with database `dukkan`. After deploy, sign up on the live `/signup` page, then `UPDATE app_users SET role='ADMIN' WHERE email='...'`.

## Demo notes

- New products start as `pending` until an admin approves them
- Photos on upload are preview-only (not uploaded to a server)
- No payments, SMS, or real maps yet

## GitHub

This folder is a git repo. GitHub CLI was not available on the machine that scaffolded it. To publish:

```bash
gh repo create dukkan --private --source=. --remote=origin --push
```
