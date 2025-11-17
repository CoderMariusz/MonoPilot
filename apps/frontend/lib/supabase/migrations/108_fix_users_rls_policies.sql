-- Migration 108: Fix RLS Policies for Users Table
-- Purpose: Add missing RLS policies for users table
-- Date: 2025-11-17
-- Issue: Users table has RLS enabled but NO policies, blocking all operations

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "users_select_own" ON users;
DROP POLICY IF EXISTS "users_insert_own" ON users;
DROP POLICY IF EXISTS "users_update_own" ON users;
DROP POLICY IF EXISTS "users_select_all" ON users;
DROP POLICY IF EXISTS "users_update_all" ON users;

-- Allow users to read their own record
CREATE POLICY "users_select_own" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

-- Allow users to read all users (needed for dropdowns, assignments, etc.)
CREATE POLICY "users_select_all" ON users
  FOR SELECT TO authenticated
  USING (true);

-- Allow users to insert their own record (during signup)
CREATE POLICY "users_insert_own" ON users
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);

-- Allow users to update their own record
CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Allow authenticated users to update any user (needed for admin/manager operations)
-- TODO: Later restrict this to admin/manager roles only
CREATE POLICY "users_update_all" ON users
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON POLICY "users_select_own" ON users IS 'Allow users to read their own record';
COMMENT ON POLICY "users_select_all" ON users IS 'Allow users to read all users (for dropdowns, assignments)';
COMMENT ON POLICY "users_insert_own" ON users IS 'Allow users to insert their own record during signup';
COMMENT ON POLICY "users_update_own" ON users IS 'Allow users to update their own record';
COMMENT ON POLICY "users_update_all" ON users IS 'Allow authenticated users to update any user (admin operations)';
