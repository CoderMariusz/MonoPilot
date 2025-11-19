-- Migration: Sync product_type enum with TypeScript granular types
-- Purpose: Add granular product types for better categorization
--
-- Expiry date rules:
--   WITH expiry: RM_MEAT, DG_ING, DG_SAUCE, PR, FG
--   WITHOUT expiry: DG_WEB, DG_LABEL, DG_BOX, DG_OTHER

-- Add all granular type values to enum
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'RM_MEAT';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'DG_WEB';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'DG_LABEL';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'DG_BOX';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'DG_ING';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'DG_SAUCE';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'DG_OTHER';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'PR';
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'FG';

-- Add comment for documentation
COMMENT ON TYPE product_type IS 'Product types: RM_MEAT (raw material, expiry req), DG_WEB/DG_LABEL/DG_BOX/DG_OTHER (packaging, no expiry), DG_ING/DG_SAUCE (consumables, expiry req), PR (semi-finished), FG (finished good). Legacy values: Raw Material, Semi-Finished, Finished Good, Packaging, By-Product';
