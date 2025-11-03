-- Migration 045: Add Missing RLS Policies
-- Purpose: Add RLS policies for settings_tax_codes, machines, and allergens tables
-- Date: 2025-01-28
-- 
-- These tables have RLS enabled but no policies, which blocks all operations.
-- This migration adds policies consistent with other tables in the system.

-- Settings Tax Codes
CREATE POLICY "authenticated_users_settings_tax_codes_all" ON settings_tax_codes
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Machines
CREATE POLICY "authenticated_users_machines_all" ON machines
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Allergens
CREATE POLICY "authenticated_users_allergens_all" ON allergens
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

