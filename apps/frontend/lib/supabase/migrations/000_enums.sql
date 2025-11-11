-- Migration 000: Create ENUMs
-- Purpose: Define custom ENUM types used across the database
-- Date: 2025-01-11
-- Dependencies: None

-- =============================================
-- ENUM TYPES
-- =============================================

-- Product classification enums
CREATE TYPE product_group AS ENUM ('MEAT', 'DRYGOODS', 'COMPOSITE');
CREATE TYPE product_type AS ENUM ('RM_MEAT', 'PR', 'FG', 'DG_WEB', 'DG_LABEL', 'DG_BOX', 'DG_ING', 'DG_SAUCE');

-- BOM lifecycle status
CREATE TYPE bom_status AS ENUM ('draft', 'active', 'archived');

-- Comments
COMMENT ON TYPE product_group IS 'High-level product grouping: MEAT, DRYGOODS, or COMPOSITE (mixed)';
COMMENT ON TYPE product_type IS 'Detailed product type classification for app taxonomy';
COMMENT ON TYPE bom_status IS 'BOM lifecycle status: draft (editable), active (in use), archived (historical)';

