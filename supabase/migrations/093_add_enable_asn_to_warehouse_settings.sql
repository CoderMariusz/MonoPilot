-- Migration 093: Add enable_asn to Warehouse Settings (Story 05.8)
-- Purpose: Feature flag for ASN functionality
-- Phase: GREEN

-- Add enable_asn column to warehouse_settings
ALTER TABLE warehouse_settings
ADD COLUMN IF NOT EXISTS enable_asn BOOLEAN DEFAULT false;

-- Comment
COMMENT ON COLUMN warehouse_settings.enable_asn IS 'Feature flag to enable ASN functionality (Story 05.8)';
