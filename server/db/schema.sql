-- ═══════════════════════════════════════════════════════════════════════════
-- Wanderly database schema
-- Applied by `npm run db:setup` (idempotent — safe to run repeatedly).
-- Requires PostgreSQL 13+ for gen_random_uuid() (or the pgcrypto extension).
-- ═══════════════════════════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name          text        NOT NULL,
  email         text        NOT NULL UNIQUE,
  password_hash text        NOT NULL,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS hotels (
  id              integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  city_code       text    NOT NULL,
  name            text    NOT NULL,
  stars           integer NOT NULL CHECK (stars BETWEEN 1 AND 5),
  rating          numeric(2, 1) NOT NULL CHECK (rating >= 0 AND rating <= 5),
  price_per_night integer NOT NULL CHECK (price_per_night > 0),
  amenities       text[]  NOT NULL DEFAULT '{}',
  image_url       text,
  description     text    NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS bookings (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ref          text        NOT NULL UNIQUE,
  user_id      uuid        NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  type         text        NOT NULL CHECK (type IN ('hotel', 'flight')),
  status       text        NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  total_amount integer     NOT NULL CHECK (total_amount >= 0),
  details      jsonb       NOT NULL DEFAULT '{}'::jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS contact_messages (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text        NOT NULL,
  email      text        NOT NULL,
  message    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bookings_user_id    ON bookings (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hotels_city_code    ON hotels (city_code);
