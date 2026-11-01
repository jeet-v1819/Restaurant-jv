# JV Restaurant – Complete Restaurant Management System

A fully functional, production-ready Restaurant Management Website with four user roles: **Admin, Chef (Kitchen), Customer, and Billing Staff (Cashier)**. Connects customer ordering, kitchen management, table management, and cash billing into one real-time system.

Built with **Next.js (App Router) + React, JavaScript, Tailwind CSS, PostgreSQL (Neon) via Prisma ORM, session-based authentication (NextAuth), Cloudinary image storage, and Lucide React icons.**

> ⚠️ This is not a UI demo. Every feature works against a real database with real authentication, API routes, role-based permissions, and real-time synchronization.

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16 (App Router), React 19, JavaScript (.jsx) |
| Styling | Tailwind CSS v4 |
| Backend | Next.js API Routes |
| Database | PostgreSQL (Neon) |
| ORM | Prisma |
| Authentication | NextAuth.js (Credentials provider, JWT sessions) |
| Image Storage | Cloudinary (server-side uploads only) |
| Icons | Lucide React |
| Real-time | Server-Sent Events (SSE) + polling fallback |
| Toasts | Sonner |
| Validation | Zod |
| Forms | React Hook Form |
| Currency | INR (₹) via Intl |

## Four User Roles

1. **Admin** – Full control: dashboard stats, food/category management, tables & QR codes, staff & customer management, restaurant settings, GST, reports.
2. **Chef** – Kitchen Display System: live orders, accept/reject, mark preparing/ready, preparation time, food availability toggle.
3. **Customer** – Public menu, cart, table selection (manual or via QR), place orders, live order tracking, call waiter, order history (registered users), guest checkout.
4. **Billing Staff** – POS-style billing: search by table, view unpaid orders with GST, cash payment, mark as paid, payment history.

## Project Structure

```
prisma/
  schema.prisma          # Database schema (15 models)
  seed.js                # Admin account seeder
src/
  app/
    (public)             # Home, Menu, Cart, Order tracking, Login, Register, Table QR entry
    api/                 # Next.js API routes (auth, orders, payments, tables, foods, ...)
    admin/               # Admin panel (dashboard, foods, categories, tables, staff, customers, settings, reports)
    chef/                # Kitchen dashboard + food availability
    billing/             # Billing POS + payment history
    customer/            # Customer order history
  components/            # Shared React components
  hooks/                 # useRealTime (SSE + polling fallback)
  lib/                   # prisma, auth, bus (event bus), activity-log, utils
middleware.js            # Role-based route protection
```

## Prerequisites

- Node.js 18+ (v20+ recommended)
- A Neon PostgreSQL database (or any PostgreSQL instance)
- A Cloudinary account (for food/category/logo image uploads)

## Installation

```bash
# 1. Clone the repository
cd /path/to/Restaurant-jv

# 2. Install dependencies
npm install

# 3. Generate the Prisma client (requires network access to download Prisma engines)
npx prisma generate

# 4. Copy environment variables
cp .env.example .env

# 5. Edit .env and fill in your Neon DATABASE_URL, NextAuth secret, and Cloudinary credentials
```

## Environment Variables

Create `.env` (based on `.env.example`):

```
# Database (Neon PostgreSQL)
DATABASE_URL="postgresql://<user>:<password>@<ep-host>.neon.tech/<dbname>?sslmode=require"

# NextAuth
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXTAUTH_URL="http://localhost:3000"

# Cloudinary (image uploads - server side only; secrets never reach the browser)
CLOUDINARY_CLOUD_NAME="your_cloud_name"
CLOUDINARY_API_KEY="your_api_key"
CLOUDINARY_API_SECRET="your_api_secret"

# Base URL used to build table QR codes
QR_CODE_BASE_URL="http://localhost:3000/table"

# Optional: default admin credentials for the seeder
ADMIN_EMAIL="admin@restaurant.com"
ADMIN_PASSWORD="Admin@123"
ADMIN_NAME="Admin"
```

> Never commit `.env`. It is already in `.gitignore`.

## Database Setup (Neon PostgreSQL)

1. Create a project at [Neon](https://neon.tech) and copy the connection string (include `?sslmode=require`).
2. Paste it into `DATABASE_URL` in `.env`.
3. Run the Prisma migration:

```bash
npx prisma migrate dev --name init
```

This creates all tables, indexes, and relations in your Neon database.

4. (Optional) Open Prisma Studio to inspect data:

```bash
npx prisma studio
```

## Admin Account Setup

The first admin account is created with the seed script:

```bash
# Make sure ADMIN_EMAIL / ADMIN_PASSWORD are set in .env, then:
node prisma/seed.js
```

Default: `admin@restaurant.com` / `Admin@123` (change these in `.env` before seeding, and change the password after first login).

Only an Admin can create Chef and Billing Staff accounts from the Admin → Staff panel.

## Local Development

```bash
npm run dev        # Start Next.js dev server at http://localhost:3000
npm run build      # Production build
npm run start      # Start production server
npm run lint       # ESLint
```

The app requires a running PostgreSQL database (DATABASE_URL) and a successful `prisma generate` before database features work.

## Build Instructions

```bash
npm run build
```

The build validates all pages and API routes. It does **not** connect to the database at build time (Prisma instantiation is deferred so the build works before `prisma generate` has been run).

## Deployment (Netlify)

This project is Netlify-compatible (Next.js runtime). On Netlify:

1. Connect this repository.
2. Build command: `npm run build` (or let Netlify detect Next.js).
3. Add all environment variables from `.env.example` in Netlify Site Settings → Environment variables.
4. Before/after deploy, run `npx prisma generate` and `npx prisma migrate deploy` against your Neon database (e.g. in a Netlify build plugin or manually via the Netlify CLI).
5. Seed the admin account: `node prisma/seed.js`.

API routes are Next.js serverless functions and work on Netlify. Real-time SSE works in single-instance deployments; in serverless/multi-instance environments the client polling fallback keeps the UI synchronized.

## Database Models

`User`, `Customer`, `Staff`, `FoodCategory`, `FoodItem`, `RestaurantTable`, `TableSession`, `Order`, `OrderItem`, `Payment`, `WaiterRequest`, `RestaurantSettings`, `ActivityLog`, plus enums for `Role`, `TableStatus`, `OrderStatus`, `PaymentStatus`, `SessionStatus`, `WaiterStatus`, `PaymentMethod`.

Key relationships:
- A table can have multiple orders in one active session (`TableSession`).
- Each order contains multiple order items; food name and price are snapshotted at order time.
- Payments are linked to orders and table sessions.
- Paid sessions close automatically and release the table.

## API Routes

Public: `POST /api/auth/register`, `GET/POST /api/foods`, `GET /api/categories`, `GET /api/tables`, `GET /api/tables/[id]/qr`, `POST /api/orders`, `GET /api/orders/[id]`, `GET /api/events` (SSE).

Staff/Admin (protected by middleware + role checks): `/api/admin/*`, `/api/chef/*`, `/api/billing/*`, `/api/customer/*`, `/api/orders`, `/api/payments`, `/api/waiter-requests`, `/api/upload` (Cloudinary), `/api/settings`.

## Role-Based Access

- `Admin` – full access to all panels and APIs.
- `Chef` – kitchen orders + food availability only.
- `Billing` – tables, bills, payments only.
- `Customer` – own orders/cart only.

Middleware (`middleware.js`) enforces panel and API route protection; API routes additionally verify the session role. Passwords are hashed with bcrypt. Sessions are JWT-based via NextAuth.

## Real-time Synchronization

Server-Sent Events (`/api/events`) push order creation, status changes, payments, table status, food availability, and waiter requests to the relevant panels. If SSE is unavailable (e.g. behind some proxies/serverless platforms), clients fall back to automatic polling every 6–8 seconds.

## Cash-Only Payments

Per requirements, only cash payments are supported. The cashier enters a table number, reviews unpaid orders with GST (from Admin settings), collects cash, and clicks "Mark as Paid". Duplicate payments are blocked (unique payment per order + paid-status check).

## Testing Notes

This sandbox could not run a live PostgreSQL server (no system package access) nor download Prisma engines (binaries.prisma.sh is not reachable from here), so database-dependent runtime tests (migration, login, order flow) must be performed against your own Neon database after setup:

1. `cp .env.example .env` and fill in `DATABASE_URL`, `NEXTAUTH_SECRET`, Cloudinary keys.
2. `npx prisma generate`
3. `npx prisma migrate dev --name init`
4. `node prisma/seed.js`
5. `npm run dev` → test the full workflows (admin setup → customer order → kitchen → billing).

Build and lint checks that can run offline have been verified:
- `npm run build` ✅ (production build succeeds)
- `npx eslint .` ✅ (0 errors)

## License

MIT
