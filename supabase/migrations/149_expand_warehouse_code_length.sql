-- Migration: Expand warehouse code column length
-- Bug: BUG-010 - Warehouse Code field truncates last character on create
-- Root cause: VARCHAR(20) too short for codes like "QA-TEST-20260207-2307" (23 chars)
-- Fix: Increase to VARCHAR(50) to accommodate longer warehouse codes

-- Step 1: Drop the existing CHECK constraint
ALTER TABLE warehouses DROP CONSTRAINT IF EXISTS warehouses_code_format;

-- Step 2: Alter column to VARCHAR(50)
ALTER TABLE warehouses ALTER COLUMN code TYPE VARCHAR(50);

-- Step 3: Recreate CHECK constraint with new length limit (2-50 chars)
ALTER TABLE warehouses ADD CONSTRAINT warehouses_code_format 
    CHECK (code ~ '^[A-Z0-9-]{2,50}$');

-- Update column comment
COMMENT ON COLUMN warehouses.code IS 'Unique warehouse identifier (2-50 chars, uppercase alphanumeric + hyphens)';
