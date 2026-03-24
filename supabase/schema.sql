-- ============================================
-- Casa Boreal — Supabase Database Schema
-- Run this in the Supabase SQL Editor
-- ============================================

-- 1. Custom ENUMs
CREATE TYPE user_role AS ENUM ('ADMIN', 'INSTRUCTOR', 'CLIENTE');
CREATE TYPE membership_status AS ENUM ('ACTIVE', 'EXPIRED', 'CANCELLED');
CREATE TYPE booking_status AS ENUM ('CONFIRMED', 'CANCELLED', 'WAITLIST');
CREATE TYPE class_recurrence AS ENUM ('WEEKLY', 'NONE');

-- 2. Users table (linked to Supabase Auth)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  avatar_url TEXT,
  phone TEXT,
  role user_role NOT NULL DEFAULT 'CLIENTE',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Plans table
CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  classes_per_month INTEGER, -- NULL = unlimited
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. Memberships table
CREATE TABLE memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  credits_remaining INTEGER, -- NULL = unlimited
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status membership_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. Classes table
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  instructor_id UUID REFERENCES users(id) ON DELETE SET NULL,
  level TEXT NOT NULL DEFAULT 'Principiante',
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 15,
  recurrence class_recurrence NOT NULL DEFAULT 'NONE',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
  status booking_status NOT NULL DEFAULT 'CONFIRMED',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, class_id) -- prevent double booking
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_classes_start_time ON classes(start_time);
CREATE INDEX idx_classes_instructor ON classes(instructor_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_class_id ON bookings(class_id);
CREATE INDEX idx_bookings_status ON bookings(status);

-- ============================================
-- AUTO-UPDATE updated_at TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Plans table (public read, admin write)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active plans"
  ON plans FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can read all plans"
  ON plans FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

CREATE POLICY "Admins can manage plans"
  ON plans FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Memberships table
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own memberships"
  ON memberships FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all memberships"
  ON memberships FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Classes table (public read, admin/instructor write)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active classes"
  ON classes FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage classes"
  ON classes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- Bookings table
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bookings"
  ON bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookings"
  ON bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can cancel own bookings"
  ON bookings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all bookings"
  ON bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'ADMIN'
    )
  );

-- ============================================
-- SEED DATA — Plans
-- ============================================
INSERT INTO plans (name, description, price_cents, classes_per_month, is_active) VALUES
  ('Barre Básico', '4 clases al mes para comenzar tu transformación', 89900, 4, true),
  ('Barre Plus', '8 clases al mes para resultados visibles', 149900, 8, true),
  ('Barre Ilimitado', 'Clases ilimitadas para las más dedicadas', 199900, NULL, true),
  ('Clase Individual', 'Una sola clase para probar la experiencia', 29900, 1, true);

-- ============================================
-- SEED DATA — Sample Classes (next week)
-- ============================================
INSERT INTO classes (name, level, start_time, end_time, capacity, recurrence, is_active) VALUES
  ('Barre Fundamentals', 'Principiante', now() + interval '1 day' + time '09:00', now() + interval '1 day' + time '10:00', 15, 'WEEKLY', true),
  ('Barre Sculpt', 'Intermedio', now() + interval '1 day' + time '10:30', now() + interval '1 day' + time '11:30', 12, 'WEEKLY', true),
  ('Barre Intenso', 'Avanzado', now() + interval '1 day' + time '17:00', now() + interval '1 day' + time '18:00', 10, 'WEEKLY', true),
  ('Barre Flow', 'Principiante', now() + interval '2 days' + time '09:00', now() + interval '2 days' + time '10:00', 15, 'WEEKLY', true),
  ('Barre & Stretch', 'Intermedio', now() + interval '2 days' + time '18:00', now() + interval '2 days' + time '19:00', 12, 'WEEKLY', true),
  ('Barre Power', 'Avanzado', now() + interval '3 days' + time '07:00', now() + interval '3 days' + time '08:00', 10, 'WEEKLY', true),
  ('Barre Basics', 'Principiante', now() + interval '3 days' + time '10:00', now() + interval '3 days' + time '11:00', 15, 'WEEKLY', true),
  ('Barre Express', 'Intermedio', now() + interval '4 days' + time '12:00', now() + interval '4 days' + time '12:45', 15, 'NONE', true),
  ('Barre Total Body', 'Avanzado', now() + interval '5 days' + time '09:00', now() + interval '5 days' + time '10:00', 10, 'WEEKLY', true),
  ('Barre Weekend', 'Principiante', now() + interval '6 days' + time '10:00', now() + interval '6 days' + time '11:00', 20, 'WEEKLY', true);
