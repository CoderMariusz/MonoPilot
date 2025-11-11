-- Migration 010: BOMs Table
-- Purpose: Bill of Materials - product composition definitions
-- Date: 2025-01-11
-- Dependencies: 000_enums, 009_products

CREATE TABLE boms (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id),
  version VARCHAR(50) NOT NULL,
  
  -- BOM Lifecycle
  status bom_status NOT NULL DEFAULT 'draft',
  archived_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  
  -- BOM Configuration
  requires_routing BOOLEAN DEFAULT false,
  default_routing_id INTEGER,
  notes TEXT,
  effective_from TIMESTAMPTZ,
  effective_to TIMESTAMPTZ,
  
  -- Packaging
  boxes_per_pallet INTEGER,
  
  -- Line restrictions
  line_id INTEGER[],
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraint: Single active BOM per product
  CONSTRAINT boms_single_active UNIQUE (product_id) WHERE status = 'active'
);

-- Indexes
CREATE INDEX idx_boms_product_status ON boms(product_id, status);
CREATE INDEX idx_boms_status ON boms(status);
CREATE INDEX idx_boms_routing ON boms(default_routing_id);

-- Comments
COMMENT ON TABLE boms IS 'Bill of Materials - defines product composition and manufacturing recipe';
COMMENT ON COLUMN boms.status IS 'BOM lifecycle: draft (editable), active (in use), archived (historical)';
COMMENT ON COLUMN boms.boxes_per_pallet IS 'Full pallet capacity in boxes (for FG products)';
COMMENT ON COLUMN boms.line_id IS 'Array of production line IDs. NULL = available on all lines';
COMMENT ON CONSTRAINT boms_single_active ON boms IS 'Ensures only one active BOM per product at a time';

