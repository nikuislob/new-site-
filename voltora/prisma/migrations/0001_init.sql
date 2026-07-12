-- PitchPass USA — PostgreSQL schema (Supabase-compatible)
-- Mirrors prisma/schema.prisma

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  venue TEXT NOT NULL,
  stadium_view_url TEXT NOT NULL,
  match_date TIMESTAMPTZ NOT NULL,
  standard_available INT NOT NULL,
  premium_available INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS matches_match_date_idx ON matches (match_date);

CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  ticket_type VARCHAR(20) NOT NULL CHECK (ticket_type IN ('standard', 'premium')),
  quantity INT NOT NULL CHECK (quantity >= 1),
  total_price DECIMAL(10, 2) NOT NULL,
  payment_status VARCHAR(32) NOT NULL CHECK (
    payment_status IN ('pending_link', 'awaiting_payment', 'completed')
  ),
  payment_link_sent TEXT,
  assigned_seats TEXT[] NOT NULL DEFAULT '{}',
  link_workflow VARCHAR(20) NOT NULL DEFAULT '1_ticket',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders (payment_status);
CREATE INDEX IF NOT EXISTS orders_customer_email_idx ON orders (customer_email);

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
