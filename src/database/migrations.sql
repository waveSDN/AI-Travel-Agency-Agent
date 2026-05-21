-- ============================================================
-- AI Travel Agency Agent — Supabase Schema
-- Run this in the Supabase SQL editor to bootstrap the database
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- customers
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  phone         VARCHAR(20) UNIQUE NOT NULL,
  name          VARCHAR(255),
  email         VARCHAR(255),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  last_message  TIMESTAMPTZ DEFAULT NOW(),
  is_vip        BOOLEAN DEFAULT FALSE,
  lead_score    INTEGER DEFAULT 0 CHECK (lead_score >= 0 AND lead_score <= 100),
  escalated     BOOLEAN DEFAULT FALSE,
  notes         TEXT
);

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers(phone);

-- ============================================================
-- conversations
-- ============================================================
CREATE TABLE IF NOT EXISTS conversations (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  message      TEXT NOT NULL,
  role         VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  timestamp    TIMESTAMPTZ DEFAULT NOW(),
  metadata     JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_conversations_customer_id ON conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_conversations_timestamp ON conversations(timestamp);

-- ============================================================
-- travel_requests
-- ============================================================
CREATE TABLE IF NOT EXISTS travel_requests (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id      UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  departure_city   VARCHAR(255),
  destination_city VARCHAR(255),
  travel_date      DATE,
  return_date      DATE,
  traveler_count   INTEGER DEFAULT 1,
  budget           DECIMAL(10, 2),
  budget_currency  VARCHAR(3) DEFAULT 'USD',
  hotel_preference VARCHAR(100),
  travel_class     VARCHAR(50),
  intent           VARCHAR(100),
  status           VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending','quoted','confirmed','cancelled','completed')),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  raw_entities     JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_travel_requests_customer_id ON travel_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_travel_requests_status ON travel_requests(status);

-- ============================================================
-- follow_ups
-- ============================================================
CREATE TABLE IF NOT EXISTS follow_ups (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id  UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  sent_at      TIMESTAMPTZ,
  message      TEXT NOT NULL,
  status       VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','sent','cancelled')),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_follow_ups_status_scheduled ON follow_ups(status, scheduled_at);
CREATE INDEX IF NOT EXISTS idx_follow_ups_customer_id ON follow_ups(customer_id);

-- ============================================================
-- Trigger: auto-update updated_at on travel_requests
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_travel_requests_updated_at ON travel_requests;
CREATE TRIGGER set_travel_requests_updated_at
  BEFORE UPDATE ON travel_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
