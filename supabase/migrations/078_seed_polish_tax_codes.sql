-- Migration: Seed Polish tax codes for all existing organizations
-- Story: 01.13 - Tax Codes CRUD
-- Description: Insert 5 common Polish VAT rates (23%, 8%, 5%, 0%, Exempt)
-- Date: 2025-12-23

-- =============================================================================
-- SEED POLISH TAX CODES
-- =============================================================================

-- NOTE: This migration is idempotent - safe to run multiple times
-- Uses ON CONFLICT DO NOTHING to avoid duplicate inserts

-- =============================================================================
-- 1. Seed VAT23 (Default) - 23% Standard Rate
-- =============================================================================

INSERT INTO tax_codes (
  org_id,
  code,
  name,
  rate,
  country_code,
  valid_from,
  valid_to,
  is_default,
  created_by,
  updated_by
)
SELECT
  o.id AS org_id,
  'VAT23' AS code,
  'VAT 23%' AS name,
  23.00 AS rate,
  'PL' AS country_code,
  '2011-01-01'::DATE AS valid_from,
  NULL AS valid_to,
  true AS is_default,
  (SELECT id FROM users WHERE org_id = o.id AND role_id IN (SELECT id FROM roles WHERE code = 'SUPER_ADMIN') ORDER BY created_at LIMIT 1) AS created_by,
  (SELECT id FROM users WHERE org_id = o.id AND role_id IN (SELECT id FROM roles WHERE code = 'SUPER_ADMIN') ORDER BY created_at LIMIT 1) AS updated_by
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM tax_codes tc
  WHERE tc.org_id = o.id
    AND tc.code = 'VAT23'
    AND tc.country_code = 'PL'
    AND tc.is_deleted = false
)
ON CONFLICT (org_id, code, country_code) WHERE is_deleted = false DO NOTHING;

-- =============================================================================
-- 2. Seed Additional Polish VAT Rates
-- =============================================================================

-- Insert VAT8, VAT5, VAT0, ZW for all orgs that don't have them yet
INSERT INTO tax_codes (
  org_id,
  code,
  name,
  rate,
  country_code,
  valid_from,
  valid_to,
  is_default,
  created_by,
  updated_by
)
SELECT
  o.id AS org_id,
  tc.code,
  tc.name,
  tc.rate,
  'PL' AS country_code,
  '2011-01-01'::DATE AS valid_from,
  NULL AS valid_to,
  false AS is_default,
  (SELECT id FROM users WHERE org_id = o.id AND role_id IN (SELECT id FROM roles WHERE code = 'SUPER_ADMIN') ORDER BY created_at LIMIT 1) AS created_by,
  (SELECT id FROM users WHERE org_id = o.id AND role_id IN (SELECT id FROM roles WHERE code = 'SUPER_ADMIN') ORDER BY created_at LIMIT 1) AS updated_by
FROM organizations o
CROSS JOIN (
  VALUES
    ('VAT8', 'VAT 8%', 8.00),
    ('VAT5', 'VAT 5%', 5.00),
    ('VAT0', 'VAT 0%', 0.00),
    ('ZW', 'Zwolniony (Exempt)', 0.00)
) AS tc(code, name, rate)
WHERE NOT EXISTS (
  SELECT 1 FROM tax_codes existing
  WHERE existing.org_id = o.id
    AND existing.code = tc.code
    AND existing.country_code = 'PL'
    AND existing.is_deleted = false
)
ON CONFLICT (org_id, code, country_code) WHERE is_deleted = false DO NOTHING;

-- =============================================================================
-- Migration complete: 078_seed_polish_tax_codes.sql
-- =============================================================================
-- Seeded 5 Polish VAT codes for all organizations:
-- - VAT23 (23%, default)
-- - VAT8 (8%)
-- - VAT5 (5%)
-- - VAT0 (0%)
-- - ZW (0%, Exempt)
--
-- Valid from: 2011-01-01 (Polish VAT Act effective date)
-- Valid to: NULL (no expiry)
-- Created by: First SUPER_ADMIN user in each org
-- Idempotent: Safe to re-run, uses ON CONFLICT DO NOTHING
