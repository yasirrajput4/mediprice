-- MediPrice — Full database schema
-- Run: node src/config/migrate.js

-- ── Extensions ──────────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";  -- fuzzy search fallback

-- ── Users ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  uuid          UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  name          VARCHAR(100) NOT NULL,
  phone         VARCHAR(15) UNIQUE,
  email         VARCHAR(150) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          VARCHAR(20) NOT NULL DEFAULT 'patient' CHECK (role IN ('patient', 'hospital_admin', 'super_admin')),
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ── Refresh Tokens ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         SERIAL PRIMARY KEY,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Service Categories ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_categories (
  id   SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  icon VARCHAR(50),
  slug VARCHAR(100) UNIQUE NOT NULL
);

-- ── Services (master list) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS services (
  id            SERIAL PRIMARY KEY,
  category_id   INTEGER REFERENCES service_categories(id),
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  preparation   TEXT,        -- "Fasting required for 8 hours", etc.
  report_time   VARCHAR(50), -- "Same day", "24 hours"
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_services_name_trgm ON services USING GIN (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category_id);

-- ── Hospitals ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hospitals (
  id            SERIAL PRIMARY KEY,
  uuid          UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  name          VARCHAR(200) NOT NULL,
  description   TEXT,
  address       TEXT NOT NULL,
  city          VARCHAR(100) NOT NULL,
  state         VARCHAR(100) NOT NULL,
  pincode       VARCHAR(10),
  lat           DECIMAL(10, 7),
  lng           DECIMAL(10, 7),
  phone         VARCHAR(20),
  email         VARCHAR(150),
  website       VARCHAR(255),
  logo_url      VARCHAR(500),
  accreditations TEXT[],       -- ["NABH", "NABL", "JCI"]
  facilities    TEXT[],        -- ["24x7 Radiology", "Parking", "Cafe"]
  is_active     BOOLEAN DEFAULT TRUE,
  is_verified   BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hospitals_city ON hospitals(city);
CREATE INDEX IF NOT EXISTS idx_hospitals_location ON hospitals(lat, lng);

-- ── Hospital Admins (many-to-many) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hospital_admins (
  hospital_id INTEGER REFERENCES hospitals(id) ON DELETE CASCADE,
  user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (hospital_id, user_id)
);

-- ── Hospital Services (prices per hospital) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS hospital_services (
  id              SERIAL PRIMARY KEY,
  hospital_id     INTEGER REFERENCES hospitals(id) ON DELETE CASCADE,
  service_id      INTEGER REFERENCES services(id) ON DELETE CASCADE,
  price           INTEGER NOT NULL CHECK (price >= 0),  -- in paise (₹1 = 100 paise)
  discounted_price INTEGER,                             -- null if no discount
  wait_time_min   INTEGER DEFAULT 20,                   -- estimated wait in minutes
  is_available    BOOLEAN DEFAULT TRUE,
  last_updated    TIMESTAMPTZ DEFAULT NOW(),
  updated_by      INTEGER REFERENCES users(id),
  UNIQUE (hospital_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_hs_hospital ON hospital_services(hospital_id);
CREATE INDEX IF NOT EXISTS idx_hs_service ON hospital_services(service_id);

-- ── Price History ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS price_history (
  id              SERIAL PRIMARY KEY,
  hospital_service_id INTEGER REFERENCES hospital_services(id) ON DELETE CASCADE,
  old_price       INTEGER NOT NULL,
  new_price       INTEGER NOT NULL,
  changed_by      INTEGER REFERENCES users(id),
  changed_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Time Slots ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS time_slots (
  id          SERIAL PRIMARY KEY,
  hospital_id INTEGER REFERENCES hospitals(id) ON DELETE CASCADE,
  service_id  INTEGER REFERENCES services(id),
  slot_date   DATE NOT NULL,
  slot_time   TIME NOT NULL,
  capacity    INTEGER DEFAULT 1,
  booked      INTEGER DEFAULT 0,
  UNIQUE (hospital_id, service_id, slot_date, slot_time)
);

CREATE INDEX IF NOT EXISTS idx_slots_date ON time_slots(hospital_id, service_id, slot_date);

-- ── Bookings ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bookings (
  id              SERIAL PRIMARY KEY,
  uuid            UUID DEFAULT uuid_generate_v4() UNIQUE NOT NULL,
  user_id         INTEGER REFERENCES users(id),
  hospital_id     INTEGER REFERENCES hospitals(id),
  service_id      INTEGER REFERENCES services(id),
  time_slot_id    INTEGER REFERENCES time_slots(id),
  patient_name    VARCHAR(100) NOT NULL,
  patient_phone   VARCHAR(15) NOT NULL,
  patient_relation VARCHAR(20) DEFAULT 'self',
  slot_date       DATE NOT NULL,
  slot_time       TIME NOT NULL,
  service_price   INTEGER NOT NULL,  -- price at time of booking (paise)
  platform_fee    INTEGER NOT NULL,
  total_amount    INTEGER NOT NULL,
  status          VARCHAR(20) DEFAULT 'pending'
                  CHECK (status IN ('pending','confirmed','cancelled','completed','no_show')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_hospital ON bookings(hospital_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(slot_date);

-- ── Payments ──────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id                  SERIAL PRIMARY KEY,
  booking_id          INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
  razorpay_order_id   VARCHAR(100) UNIQUE,
  razorpay_payment_id VARCHAR(100) UNIQUE,
  razorpay_signature  VARCHAR(255),
  amount              INTEGER NOT NULL,  -- paise
  currency            VARCHAR(5) DEFAULT 'INR',
  method              VARCHAR(30),       -- 'upi', 'card', 'netbanking', 'pay_at_hospital'
  status              VARCHAR(20) DEFAULT 'created'
                      CHECK (status IN ('created','paid','failed','refunded')),
  paid_at             TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Ratings & Reviews ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id          SERIAL PRIMARY KEY,
  booking_id  INTEGER REFERENCES bookings(id) ON DELETE CASCADE UNIQUE,
  user_id     INTEGER REFERENCES users(id),
  hospital_id INTEGER REFERENCES hospitals(id),
  rating      SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review_text TEXT,
  is_verified BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reviews_hospital ON reviews(hospital_id);

-- ── Materialized View: Hospital Stats ─────────────────────────────────────────
CREATE MATERIALIZED VIEW IF NOT EXISTS hospital_stats AS
SELECT
  h.id AS hospital_id,
  COALESCE(AVG(r.rating), 0)::DECIMAL(3,2) AS avg_rating,
  COUNT(r.id) AS review_count,
  COUNT(b.id) FILTER (WHERE b.status = 'confirmed') AS total_bookings,
  COALESCE(AVG(hs.wait_time_min), 20)::INTEGER AS avg_wait_min,
  -- Fairness score: lower price variance = higher score
  GREATEST(0, LEAST(100,
    100 - COALESCE(STDDEV(hs.price)::DECIMAL / NULLIF(AVG(hs.price)::DECIMAL, 0) * 100, 0)
  ))::INTEGER AS fairness_score
FROM hospitals h
LEFT JOIN reviews r ON r.hospital_id = h.id
LEFT JOIN bookings b ON b.hospital_id = h.id
LEFT JOIN hospital_services hs ON hs.hospital_id = h.id AND hs.is_available = TRUE
GROUP BY h.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_hospital_stats_id ON hospital_stats(hospital_id);

-- ── Trigger: updated_at ────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_users_updated_at') THEN
    CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_hospitals_updated_at') THEN
    CREATE TRIGGER trg_hospitals_updated_at BEFORE UPDATE ON hospitals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_bookings_updated_at') THEN
    CREATE TRIGGER trg_bookings_updated_at BEFORE UPDATE ON bookings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END $$;
