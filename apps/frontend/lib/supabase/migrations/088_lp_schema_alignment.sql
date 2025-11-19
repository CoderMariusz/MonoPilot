-- ============================================================================
-- Migration 088: LP Schema Alignment
-- Story: 0-17-lp-database-api-alignment
-- Purpose: Add missing QA/traceability columns to license_plates table
-- ============================================================================

-- Phase 1: Add missing columns to license_plates
ALTER TABLE license_plates
  ADD COLUMN IF NOT EXISTS qa_status VARCHAR(20) DEFAULT 'pending'
    CHECK (qa_status IN ('pending', 'passed', 'failed', 'on_hold')),
  ADD COLUMN IF NOT EXISTS stage_suffix VARCHAR(10)
    CHECK (stage_suffix IS NULL OR stage_suffix ~ '^[A-Z]{2}$'),
  ADD COLUMN IF NOT EXISTS lp_type VARCHAR(20)
    CHECK (lp_type IN ('PR', 'FG', 'PALLET', 'RM', 'WIP')),
  ADD COLUMN IF NOT EXISTS origin_type VARCHAR(50),
  ADD COLUMN IF NOT EXISTS origin_ref JSONB,
  ADD COLUMN IF NOT EXISTS parent_lp_number TEXT,
  ADD COLUMN IF NOT EXISTS consumed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pallet_id BIGINT REFERENCES pallets(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES users(id);

-- Create indexes for QA status and type queries
CREATE INDEX IF NOT EXISTS idx_license_plates_qa_status ON license_plates(qa_status);
CREATE INDEX IF NOT EXISTS idx_license_plates_lp_type ON license_plates(lp_type);
CREATE INDEX IF NOT EXISTS idx_license_plates_pallet_id ON license_plates(pallet_id);
CREATE INDEX IF NOT EXISTS idx_license_plates_origin_type ON license_plates(origin_type);

-- Phase 2: Backfill origin_type based on existing references
UPDATE license_plates
SET origin_type = CASE
  WHEN grn_id IS NOT NULL THEN 'GRN'
  WHEN wo_id IS NOT NULL THEN 'PRODUCTION'
  WHEN parent_lp_id IS NOT NULL THEN 'SPLIT'
  ELSE 'MANUAL'
END
WHERE origin_type IS NULL;

-- Phase 3: Backfill lp_type based on product type
-- Note: Using product_type enum values from DB
UPDATE license_plates lp
SET lp_type = CASE
  WHEN p.product_type = 'Finished Good' THEN 'FG'
  WHEN p.product_type = 'Raw Material' THEN 'RM'
  WHEN p.product_type = 'Semi-Finished' THEN 'WIP'
  WHEN p.product_type = 'By-Product' THEN 'PR'
  ELSE 'PR'
END
FROM products p
WHERE lp.product_id = p.id
  AND lp.lp_type IS NULL;

-- Phase 4: Backfill parent_lp_number for existing parent references
UPDATE license_plates child
SET parent_lp_number = parent.lp_number
FROM license_plates parent
WHERE child.parent_lp_id = parent.id
  AND child.parent_lp_number IS NULL;

-- Phase 5: Set consumed_at for consumed LPs
UPDATE license_plates
SET consumed_at = updated_at
WHERE consumed_by_wo_id IS NOT NULL
  AND consumed_at IS NULL;

-- Phase 6: Set default qa_status for existing LPs without it
UPDATE license_plates
SET qa_status = 'passed'
WHERE qa_status IS NULL;
