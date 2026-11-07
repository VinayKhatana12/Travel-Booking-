# ✈️ Wanderly — Travel Booking Platform

A full-stack travel booking platform for **hotels + flights**, with a marketing landing page, user accounts and a PostgreSQL database. Built as a two-folder monorepo: [`client/`](client) (React) and [`server/`](server) (Node API).

> **Demo notice:** payments are simulated — nothing is ever charged. Flight search uses the Amadeus **Test** API when keys are configured, and falls back to generated sample schedules otherwise.

| Landing | Hotels | Flights |
| --- | --- | --- |
| ![Landing hero](docs/screenshots/01-landing-hero.png) | ![Hotels listing](docs/screenshots/02-hotels.png) | ![Flights search](docs/screenshots/04-flights.png) |

| Hotel detail | Checkout | My Trips | Login |
| --- | --- | --- | --- |
| ![Hotel detail](docs/screenshots/03-hotel-detail.png) | ![Checkout](docs/screenshots/06-checkout.png) | ![My Trips](docs/screenshots/07-my-trips.png) | ![Login](docs/screenshots/05-login.png) |

---

## Features

**Marketing site (`/`)**
- Sticky navbar (Home, About, Problem, Solution, Contact, Login, Sign Up) with smooth anchor scrolling
- Hero with headline, CTAs and a working quick-search box (destination + dates → hotel results)
- About section, 3 pain points (Problem) mapped 1:1 to 3 features (Solution)
- Popular destinations grid (8 cities) and a Contact form that persists to PostgreSQL with success/error states
- Footer

**App**
- `/signup` & `/login` — inline validation, show/hide password, server field errors, redirect back to where you came from
- `/hotels` & `/hotels/:id` — filters (city, price range, star rating), 5 sort orders, URL-synced search params, skeleton loaders, empty & error states
- `/flights` — route/date/adults search with URL params, sorting, sample-data notice, skeleton loaders, empty & error states
- `/checkout` (protected) — traveller details form, live price summary, two-step mock payment, confirmation with booking reference
- `/my-trips` (protected) — every booking with status badges and a two-step cancel flow
- 404 page; protected routes redirect to `/login` and return you afterwards

**Security**
- Passwords hashed with **bcrypt** (10 rounds) — never stored or returned in plain text
- JWT in an **httpOnly cookie** (`SameSite=Lax`, `Secure` in production)
- **Parameterised SQL everywhere** — no string-built queries
- Zod input validation on every route; consistent JSON error shape
- Rate limiting on auth (25/15 min), contact (8/15 min) and all API traffic (600/15 min)
- Helmet security headers; CORS locked to the configured client origin
- Server-authoritative pricing: hotel totals are recomputed from the database at booking time (client-sent amounts are ignored)
- Login timing equalised with a dummy bcrypt compare to blunt user enumeration

---

## Tech stack

| Layer | Tools |
| --- | --- |
| Client | Vite 6, React 19, React Router 7, Tailwind CSS **v4** (`@tailwindcss/vite`), Context API |
| Server | Node.js + Express 4, PostgreSQL via `pg` (plain parameterised SQL, **no ORM**), bcrypt, jsonwebtoken, zod, helmet, cors, express-rate-limit, cookie-parser |
| Database | PostgreSQL 13+ (`uuid` PKs, `jsonb` booking details, text[] amenities, indexed) |

---

## Project structure

```
├── client/                  # React SPA
│   ├── public/
│   └── src/
│       ├── components/      # Navbar, HotelCard, FlightCard, skeletons, states…
│       ├── context/         # AuthContext (session via httpOnly cookie)
│       ├── pages/           # Landing, Login, Signup, Hotels, HotelDetail,
│       │                    # Flights, Checkout, MyTrips, NotFound
│       ├── services/        # api.js fetch wrapper + per-domain services
│       └── utils/           # cities, INR/date formatting
└── server/                  # Express API
    ├── controllers/         # auth, hotels, flights, bookings, contact
    ├── middleware/          # auth (JWT), validate (zod), rate limiters, errors
    ├── routes/              # /api/auth, /api/hotels, /api/flights,
    │                        # /api/bookings, /api/contact
    ├── services/            # amadeus.js (live search + sample fallback)
    ├── db/                  # schema.sql, seed.sql, setup.js, pool.js
    ├── app.js               # express app wiring
    ├── config.js            # env handling (dev defaults, strict in prod)
    └── index.js             # entry point
```

---

## Getting started

### Prerequisites
- **Node.js 20+** (built and tested on Node 22)
- **PostgreSQL 13+** running locally (tested on PostgreSQL 16)

### 1. Install dependencies

```bash
# in one terminal
cd server && npm install

# in another
cd client && npm install
```

### 2. Configure the server environment

```bash
cd server
cp .env.example .env
```

Edit `server/.env`:

```ini
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/wanderly
JWT_SECRET=<any long random string>
```

Generate a secret with:
```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

### 3. Create + seed the database

```bash
cd server
npm run db:setup
```

This creates the `wanderly` database if missing, applies `server/db/schema.sql` (4 tables + indexes) and seeds **48 hotels (6 × 8 cities)**. It is idempotent — run it again any time to re-seed hotels (users and bookings are preserved). Use `npm run db:reset` to also wipe users/bookings.

### 4. Run the app

```bash
# terminal 1 — API on http://localhost:5000
cd server && npm start          # (or `npm run dev` for nodemon reload)

# terminal 2 — client on http://localhost:5173 (proxies /api → :5000)
cd client && npm run dev
```

Open **http://localhost:5173** — sign up and you're in. A development test account from our smoke tests exists too: `aditi@example.com` / `passport123`.

### 5. Production build

```bash
cd client && npm run build      # outputs client/dist
cd server && npm start
```

---

## Getting Amadeus API keys (optional)

Flight search works out of the box with generated sample data. For live schedules:

1. Create a free account at [developers.amadeus.com](https://developers.amadeus.com/)
2. **Self-Service → Create an app** — you get a *Test environment* key + secret
3. Put them in `server/.env`:
   ```ini
   AMADEUS_CLIENT_ID=your_key
   AMADEUS_CLIENT_SECRET=your_secret
   ```
4. Restart the server. If the API is unreachable or rate-limited, Wanderly automatically falls back to sample schedules with a notice banner — the secret never reaches the browser either way.

---

## Scripts

| Where | Script | What it does |
| --- | --- | --- |
| server | `npm start` | Start the API (port 5000) |
| server | `npm run dev` | Start the API with nodemon |
| server | `npm run db:setup` | Create DB + schema + seed hotels (idempotent) |
| server | `npm run db:reset` | db:setup + wipe users, bookings, messages |
| client | `npm run dev` | Vite dev server (port 5173, proxies `/api`) |
| client | `npm run build` | Production build → `client/dist` |
| client | `npm run preview` | Preview the production build |

---

## API reference

All endpoints return consistent JSON; errors use `{ "error": string, "fields"?: {field: message} }`.

| Method | Endpoint | Auth | Notes |
| --- | --- | --- | --- |
| POST | `/api/auth/signup` | – | `{name,email,password}` → sets JWT cookie, 201 |
| POST | `/api/auth/login` | – | Sets JWT cookie |
| POST | `/api/auth/logout` | – | Clears cookie |
| GET | `/api/auth/me` | 🍪 | Current user |
| GET | `/api/hotels` | – | `?city=&minPrice=&maxPrice=&stars=5,4&sort=` |
| GET | `/api/hotels/:id` | – | Full detail incl. description |
| GET | `/api/flights` | – | `?from=DEL&to=DXB&date=YYYY-MM-DD&adults=` (Amadeus or sample) |
| POST | `/api/bookings` | 🍪 | `{type:'hotel'\|'flight', details}` → 201 + booking; hotel total computed server-side |
| GET | `/api/bookings` | 🍪 | Current user's bookings, newest first |
| PATCH | `/api/bookings/:ref/cancel` | 🍪 | e.g. `/WND-1A2B3C4D/cancel` |
| POST | `/api/contact` | – | `{name,email,message}` → saved to `contact_messages` |
| GET | `/api/health` | – | Liveness probe |

---

## Database schema

```
users(id uuid pk, name, email unique, password_hash, created_at)
hotels(id, city_code idx, name, stars, rating, price_per_night, amenities text[], image_url, description)
bookings(id uuid pk, ref unique, user_id fk→users idx, type 'hotel'|'flight',
         status 'confirmed'|'cancelled', total_amount, details jsonb, created_at idx)
contact_messages(id uuid pk, name, email, message, created_at)
```

---

## Demo walkthrough (2 minutes)

1. Open http://localhost:5173 — browse the landing page, try the hero search box
2. Sign up (any email + password with 8+ chars incl. a letter and number)
3. Search hotels → filter Goa → open a stay → **Reserve** for next week
4. Checkout: traveller details → mock payment (`4111 1111 1111 1111`, any future MM/YY, any CVV) → confirmation with a `WND-XXXXXXXX` reference
5. **My Trips** → see the booking → **Cancel booking** → status flips to cancelled
6. Try **Flights** → search Delhi → Dubai → select → checkout

---

## Screenshots

All UI screenshots live in [`docs/screenshots/`](docs/screenshots) and are embedded above.

## Known limitations (by design)

- Payments are mocked — no gateway integration
- One test API call per flight search (no caching of results)
- Single-server deployment; the client expects the `/api` proxy in dev
