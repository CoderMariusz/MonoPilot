-- Migration 107: Fix RLS Policies for Settings Tables
-- Purpose: Add missing RLS policies for all Settings tables
-- Date: 2025-11-16
-- Issue: 403 errors on Settings tables due to missing RLS policies

-- Drop existing policies if they exist (idempotent)
DROP POLICY IF EXISTS "authenticated_users_all" ON warehouses;
DROP POLICY IF EXISTS "authenticated_users_all" ON locations;
DROP POLICY IF EXISTS "authenticated_users_all" ON settings_tax_codes;
DROP POLICY IF EXISTS "authenticated_users_all" ON allergens;
DROP POLICY IF EXISTS "authenticated_users_all" ON machines;
DROP POLICY IF EXISTS "authenticated_users_all" ON production_lines;
DROP POLICY IF EXISTS "authenticated_users_all" ON suppliers;
DROP POLICY IF EXISTS "authenticated_users_all" ON routing_operation_names;

-- Create policies allowing authenticated users full access
-- These are basic policies for MVP - more granular role-based policies can be added later

CREATE POLICY "authenticated_users_all" ON warehouses
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_users_all" ON locations
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_users_all" ON settings_tax_codes
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_users_all" ON allergens
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_users_all" ON machines
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_users_all" ON production_lines
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_users_all" ON suppliers
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "authenticated_users_all" ON routing_operation_names
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON POLICY "authenticated_users_all" ON warehouses IS 'Allow authenticated users full access to warehouses table';
COMMENT ON POLICY "authenticated_users_all" ON locations IS 'Allow authenticated users full access to locations table';
COMMENT ON POLICY "authenticated_users_all" ON settings_tax_codes IS 'Allow authenticated users full access to tax codes table';
COMMENT ON POLICY "authenticated_users_all" ON allergens IS 'Allow authenticated users full access to allergens table';
COMMENT ON POLICY "authenticated_users_all" ON machines IS 'Allow authenticated users full access to machines table';
COMMENT ON POLICY "authenticated_users_all" ON production_lines IS 'Allow authenticated users full access to production lines table';
COMMENT ON POLICY "authenticated_users_all" ON suppliers IS 'Allow authenticated users full access to suppliers table';
COMMENT ON POLICY "authenticated_users_all" ON routing_operation_names IS 'Allow authenticated users full access to routing operation names table';
