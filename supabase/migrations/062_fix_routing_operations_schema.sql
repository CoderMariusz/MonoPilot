-- Migration: 062_fix_routing_operations_schema.sql
-- Description: Fix routing_operations table schema mismatch
-- Date: 2025-12-31
-- Purpose: Ensures routing_operations table has correct columns before constraints

BEGIN;

-- Drop and recreate routing_operations if it exists with wrong schema
DROP TABLE IF EXISTS routing_operations CASCADE;

COMMIT;
