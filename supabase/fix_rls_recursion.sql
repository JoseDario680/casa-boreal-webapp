-- ============================================
-- Casa Boreal — FIX: RLS infinite recursion
-- Run this in the Supabase SQL Editor
-- ============================================
-- The admin check policies on all tables query the `users` table,
-- which itself has RLS enabled. This causes infinite recursion.
-- Fix: use a SECURITY DEFINER function that bypasses RLS.

-- 1. Create helper function (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'ADMIN'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. Fix USERS table policies
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Admins can update all users" ON users;

CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  USING (public.is_admin());

-- 3. Fix PLANS table policies
DROP POLICY IF EXISTS "Admins can read all plans" ON plans;
DROP POLICY IF EXISTS "Admins can manage plans" ON plans;

CREATE POLICY "Admins can read all plans"
  ON plans FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage plans"
  ON plans FOR ALL
  USING (public.is_admin());

-- 4. Fix MEMBERSHIPS table policies
DROP POLICY IF EXISTS "Admins can manage all memberships" ON memberships;

CREATE POLICY "Admins can manage all memberships"
  ON memberships FOR ALL
  USING (public.is_admin());

-- 5. Fix CLASSES table policies
DROP POLICY IF EXISTS "Admins can manage classes" ON classes;

CREATE POLICY "Admins can manage classes"
  ON classes FOR ALL
  USING (public.is_admin());

-- 6. Fix BOOKINGS table policies
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;

CREATE POLICY "Admins can manage all bookings"
  ON bookings FOR ALL
  USING (public.is_admin());
