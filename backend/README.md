# Aurelia Grand API

This is the Node.js/Express/Mongoose backend for the existing React + Vite app. It provides real persistence for authentication, room inventory, bookings, basic reporting, and Stripe payment processing. It is an implementation foundation, not a claim that every staff, housekeeping, promotion, review, or report workflow in the full product specification is finished.

## Requirements and setup

- Node.js 20 or newer
- MongoDB configured as a replica set (transactions are required for booking reservations)
- Stripe credentials only for payment operations

The concurrency integration test is skipped unless `MONGODB_TEST_URI` is set to a dedicated replica-set test deployment. It creates a uniquely named database and drops only that test database on completion. Never point it at a production cluster.

From this directory:

```powershell
Copy-Item .env.example .env
npm.cmd install
```

Replace `<DB_USER>`, `<URL_ENCODED_DB_PASSWORD>`, and `<CLUSTER_HOST>` in `MONGODB_URI` with your Atlas connection details, URL-encoding reserved characters in the password. Replace `JWT_SECRET` with a cryptographically random value of at least 32 characters. The URI targets the `aurelia_grand` database. Never commit `.env`. The API validates required settings before starting and connects to MongoDB before it listens.

In Windows PowerShell, use `npm.cmd` rather than `npm`: PowerShell may resolve `npm` to `npm.ps1`, which can be blocked by the machine's script execution policy. Do not weaken the execution policy just to run project scripts.

For local MongoDB, use a replica-set-enabled deployment (including a single-node replica set). Booking creation and changes return `503` when MongoDB transactions are unavailable; they do not silently fall back to unsafe writes.

## Commands

```powershell
npm.cmd run dev
npm.cmd start
npm.cmd test
npm.cmd run test:integration
```

Run the frontend separately from `..\frontend` with `npm.cmd run dev`.

Seed only clearly labeled demonstration categories and physical rooms, without deleting records:

```powershell
$env:SEED_DEMO_DATA = "true"
npm.cmd run seed
```

Create the first administrator only after connecting to the intended database. Supply `ADMIN_NAME`, `ADMIN_EMAIL`, and `ADMIN_PASSWORD` through the process environment; the password must be at least 12 characters. The script refuses to create another initial administrator when an active super administrator exists.

For the local demonstration environment, use the safe demo-admin bootstrap instead of the generic initial-admin script:

```powershell
Copy-Item .env.example .env
# Update MONGODB_URI and JWT_SECRET in .env before starting the API
npm.cmd run create-demo-admin
```

This demo-only bootstrap is restricted to local development. It defaults to the project credentials `admin@aureliagrand.local` / `AureliaDemo2026!` and refuses to run when `NODE_ENV=production`. If an active super administrator already exists, the script exits without creating a duplicate account or changing any existing password. If you want to use the demo email but the admin already exists, reset or update that existing account manually instead of overwriting it silently.

## Environment

| Variable | Purpose |
| --- | --- |
| `PORT` | API port; defaults to `4000`. |
| `API_PREFIX` | API prefix; defaults to `/api`. |
| `CLIENT_URL` | Exact allowed customer browser origin; defaults to `http://localhost:5173`. |
| `ADMIN_CLIENT_URL` | Exact allowed administrator browser origin; defaults to `http://localhost:5174`. |
| `MONGODB_URI` | Required MongoDB connection string. |
| `JWT_SECRET` | Required signing secret, minimum 32 characters. |
| `JWT_EXPIRES_IN` | Access-token lifetime; defaults to `1h`. |
| `HOTEL_TIMEZONE` | Hotel timezone label; defaults to `Asia/Kolkata`. Stay dates are stored as UTC date-only boundaries. |
| `DEFAULT_CURRENCY` | Three-letter booking currency; defaults to `INR`. |
| `STRIPE_SECRET_KEY` | Required only for creating payments/refunds. |
| `STRIPE_WEBHOOK_SECRET` | Required for verified Stripe webhooks. |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | Optional SMTP settings for password-reset email. No reset token is logged when SMTP is unavailable. |
| `UPLOAD_DIR` | Reserved local upload configuration; upload endpoints are not yet exposed. |

The frontend should use `VITE_API_URL=http://localhost:4000/api`. `VITE_` variables are public and must never contain server secrets. The separate admin app runs on port 5174 and uses its own `VITE_API_URL`; the CORS allowlist includes `CLIENT_URL` and `ADMIN_CLIENT_URL`.

## Implemented API

All responses use `{ success, message, data, meta? }`; errors use `{ success: false, message, errors }`.

| Method | Path | Access | Purpose |
| --- | --- | --- | --- |
| `GET` | `/api/health` | Public | Application and MongoDB status; returns 503 if MongoDB is disconnected. |
| `POST` | `/api/auth/register` | Public | Creates a customer account; submitted roles are rejected. |
| `POST` | `/api/auth/login` | Public, rate limited | Returns a short-lived bearer access token and safe user data. |
| `POST` | `/api/auth/admin-login` | Public, rate limited | Administrator-only sign-in; customer credentials are rejected. |
| `PATCH` | `/api/auth/profile` | Authenticated | Updates the current account's name and phone only. |
| `POST` | `/api/auth/logout` | Authenticated | Revokes issued access tokens for the account. |
| `GET` | `/api/auth/me` | Authenticated | Returns the current safe user record. |
| `POST` | `/api/auth/forgot-password` | Public, rate limited | Enumeration-safe reset request; sends email only when SMTP is configured. |
| `POST` | `/api/auth/reset-password` | Public, rate limited | Uses a single-use hashed reset token. |
| `GET` | `/api/rooms` | Public | Paginated room inventory with active categories. |
| `GET` | `/api/rooms/categories` | Public | Active room categories. |
| `GET` | `/api/rooms/availability` | Public | Availability by dates, capacity, and optional category. |
| `POST` | `/api/bookings/quote` | Public | Server-calculated quote; client-supplied totals are not accepted. |
| `POST` | `/api/bookings` | Authenticated, rate limited | Requires `Idempotency-Key`; creates a short-lived pending booking hold, and payment is needed to confirm. |
| `GET` | `/api/bookings/my` | Authenticated | Current account's bookings only. |
| `POST` | `/api/bookings/:id/cancel` | Authenticated, owner only | Cancels eligible unpaid booking holds. |
| `GET` | `/api/payments/my` | Authenticated | Current account's payment records only. |
| `POST` | `/api/payments/intents` | Authenticated | Creates a Stripe PaymentIntent for an owned booking; requires Stripe setup and an `Idempotency-Key`. |
| `POST` | `/api/payments/webhook` | Stripe signature | Verifies the raw Stripe body and synchronizes payment/booking state. |
| `GET` | `/api/settings/public` | Public | Safe name, timezone, and currency defaults. |
| `GET` | `/api/admin/dashboard` | Admin, manager, receptionist | Database-derived inventory, booking, arrivals/departures, and net payment summaries. |
| `GET`, `POST` | `/api/admin/rooms` | Super admin, hotel manager | List/create rooms. |
| `PATCH`, `DELETE` | `/api/admin/rooms/:id` | Super admin, hotel manager | Update/deactivate rooms. |
| `POST`, `PATCH`, `DELETE` | `/api/admin/room-categories[/:id]` | Super admin, hotel manager | Manage room categories. |
| `GET`, `PATCH` | `/api/admin/bookings[/:id/status]` | Admin, manager, receptionist | List bookings/change permitted lifecycle states. |
| `GET` | `/api/admin/guests` | Admin, manager, receptionist | Paginated guest directory derived from bookings. |
| `GET` | `/api/admin/reports/reservations` | Super admin, hotel manager | Filterable reservation report. |
| `GET` | `/api/admin/reports/revenue` | Super admin, hotel manager | Payments-derived net revenue records, excluding failed payments. |
| `GET`, `POST` | `/api/admin/payments[/:id/refund]` | Super admin, hotel manager | List payment records/request Stripe refunds. Refund status changes only after provider webhook confirmation. |
| `GET`, `POST`, `PATCH` | `/api/admin/staff[/:id]` | Super admin | List, create, update, and disable staff accounts. Staff roles cannot grant super-admin privileges. |
| `GET`, `POST`, `PATCH`, `DELETE` | `/api/admin/services[/:id]` | Super admin, hotel manager | Manage hotel service catalog entries; deletion deactivates the entry. |
| `GET`, `PUT` | `/api/admin/settings` | Read: super admin, hotel manager; update: super admin | Read or update hotel profile settings. |

## Authentication and roles

Clients pass the returned access token as `Authorization: Bearer <token>`. Tokens are held by clients in memory, not localStorage. Logout increments the user's token version, revoking existing tokens. Public registration always creates the `customer` role. Admin-only operations require server-side roles; customer booking/payment reads are scoped to the authenticated user.

Roles currently used are `customer`, `super_admin`, `hotel_manager`, `receptionist`, and `housekeeping_staff`. Housekeeping and staff workflows are not implemented yet.

## Booking, availability, and pricing

Stay dates use `YYYY-MM-DD`, with check-in inclusive and check-out exclusive. Prices are copied to the booking at creation and are not recalculated later. Tax and discounts currently default to zero; no frontend subtotal is trusted.

Pending reservations hold inventory for 15 minutes. MongoDB stores one inventory record per room per night with a unique `(room, night)` index. Booking, room reservation locks, and inventory writes run in a MongoDB transaction; an idempotency key makes retried booking requests return the original booking. Competing requests cannot both reserve the same room. Expired holds are excluded by the availability service and are removed by MongoDB's TTL monitor. A verified Stripe success webhook confirms a still-live hold; an expired/invalid hold is not confirmed. Room maintenance/deactivation changes also use transactions and are blocked when an active reservation uses that room.

Dates currently use UTC date-only boundaries. Report `startDate` and `endDate` filters are inclusive calendar dates, interpreted as UTC. `HOTEL_TIMEZONE` is returned in public settings but full timezone-aware dashboard boundaries and configurable policies still need implementation before operating across timezones.

## Payments and email

Without Stripe credentials, payment operations return a configuration error and never simulate success. Configure `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and the public `VITE_STRIPE_PUBLISHABLE_KEY`, then point the Stripe endpoint to `POST /api/payments/webhook`. The webhook is signature-verified against the unparsed request body and deduplicated by event ID. The browser confirms payment with Stripe Elements, but booking status remains pending until the backend verifies the webhook.

Configure SMTP for reset email. If SMTP is absent, the reset request remains enumeration-safe and no token is written to logs; the actual email cannot be delivered until SMTP is configured.

## Frontend and remaining work

The frontend example environment sets `VITE_DEMO_MODE=false` to use the implemented API. Set it to `true` only for the explicitly labeled visual demonstration. Auth uses an in-memory bearer token (not localStorage); room category browsing, booking creation, Stripe Elements checkout, and selected admin dashboard/list pages use the API. The marketing homepage and some admin sections still render demonstration data and are not backed by implemented endpoints.

Not yet implemented: full staff administration, housekeeping task workflows, promotions/redemption, reviews/moderation, hotel settings persistence, image upload, CSV exports, full occupancy/cancellation/room-performance reports, review-specific authorization cases, and end-to-end transaction/concurrency tests against a replica-set test database. Do not deploy as a complete hotel-management system until those workflows, operational policy, and production controls are completed and tested.

## Security and production notes

Helmet, exact-origin CORS, rate limiting, bounded JSON bodies, Zod input validation, allowlisted writes, bcrypt password hashes, JWT validation, role and ownership checks, safe errors, and audit records for key booking/room actions are included. Configure HTTPS, secrets, MongoDB backups, monitoring, SMTP, Stripe webhooks, retention, and deployment-specific proxy settings before production. No proxy trust is enabled by default.
