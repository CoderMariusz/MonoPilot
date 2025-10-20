-- Phase 8: Enhanced BOM & Basic Routing Migration
-- This migration adds BOM versioning, routing tables, and WO operations

-- Update BOMs table with versioning
ALTER TABLE boms
  ADD COLUMN status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'archived')),
  ADD COLUMN effective_from TIMESTAMPTZ,
  ADD COLUMN effective_to TIMESTAMPTZ,
  ADD COLUMN requires_routing BOOLEAN DEFAULT false,
  ADD COLUMN default_routing_id INTEGER,
  ADD COLUMN notes TEXT,
  ADD CONSTRAINT unique_product_version UNIQUE(product_id, version);

-- Update bom_items (unit_cost_std already added in phase 14)
ALTER TABLE bom_items
  ADD COLUMN scrap_std_pct NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN is_optional BOOLEAN DEFAULT false,
  ADD COLUMN is_phantom BOOLEAN DEFAULT false;

-- Basic routing tables
CREATE TABLE routings (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  product_id INTEGER REFERENCES products(id),
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE TABLE routing_operations (
  id SERIAL PRIMARY KEY,
  routing_id INTEGER NOT NULL REFERENCES routings(id) ON DELETE CASCADE,
  sequence_number INTEGER NOT NULL,
  operation_name VARCHAR(200) NOT NULL,
  code VARCHAR(50),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(routing_id, sequence_number)
);

CREATE INDEX idx_routing_operations_routing ON routing_operations(routing_id);

-- WO operations (links WO to routing phases)
CREATE TABLE wo_operations (
  id SERIAL PRIMARY KEY,
  wo_id INTEGER NOT NULL REFERENCES work_orders(id) ON DELETE CASCADE,
  routing_operation_id INTEGER REFERENCES routing_operations(id),
  seq_no INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED')),
  operator_id UUID REFERENCES users(id),
  device_id INTEGER REFERENCES machines(id),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(wo_id, seq_no)
);

CREATE INDEX idx_wo_operations_wo ON wo_operations(wo_id);
CREATE INDEX idx_wo_operations_status ON wo_operations(status);

-- Add FK constraint after table creation
ALTER TABLE boms ADD CONSTRAINT fk_bom_routing 
  FOREIGN KEY (default_routing_id) REFERENCES routings(id);

-- Sample routing data for existing products
INSERT INTO routings (name, product_id, is_active, notes, created_by)
SELECT 
  CONCAT('Standard ', p.description, ' Routing') as name,
  p.id as product_id,
  true as is_active,
  'Default routing for ' || p.description as notes,
  (SELECT id FROM users LIMIT 1) as created_by
FROM products p
WHERE p.product_type IN ('PR', 'FG')
  AND p.is_active = true
LIMIT 5;

-- Sample routing operations for the created routings
INSERT INTO routing_operations (routing_id, sequence_number, operation_name, code, description)
SELECT 
  r.id as routing_id,
  op.seq_no,
  op.name,
  op.code,
  op.description
FROM routings r
CROSS JOIN (
  VALUES 
    (1, 'Preparation', 'PREP', 'Prepare materials and setup'),
    (2, 'Processing', 'PROC', 'Main processing operation'),
    (3, 'Quality Check', 'QC', 'Quality control and inspection'),
    (4, 'Packaging', 'PACK', 'Final packaging and labeling')
) AS op(seq_no, name, code, description)
WHERE r.is_active = true;
