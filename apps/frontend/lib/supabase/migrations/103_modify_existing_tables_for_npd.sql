-- =============================================
-- Migration 103: Extend Existing Tables for NPD Integration
-- =============================================
-- Epic: NPD-6 (Database Schema & Infrastructure)
-- Story: NPD-6.4 - Modify Existing Tables for NPD Integration
-- Purpose: Add optional NPD foreign keys to enable Handoff Wizard (NPD → Production)
-- Date: 2025-11-16
-- Dependencies: Migration 100 (npd_projects, npd_formulations tables)
-- Pattern: Nullable FKs with ON DELETE SET NULL = loose coupling (NPD optional)
-- =============================================

-- =============================================
-- TABLE: work_orders
-- =============================================
-- Add pilot WO type + optional NPD project link

ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'regular' CHECK (type IN ('regular', 'pilot'));

ALTER TABLE work_orders
  ADD COLUMN IF NOT EXISTS npd_project_id UUID REFERENCES npd_projects(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_work_orders_npd_project_id ON work_orders(npd_project_id);
CREATE INDEX IF NOT EXISTS idx_work_orders_type ON work_orders(type);

COMMENT ON COLUMN work_orders.type IS 'Work order type: regular (standard production) or pilot (NPD trial run). Pilot WOs link to NPD projects.';
COMMENT ON COLUMN work_orders.npd_project_id IS 'Optional FK to npd_projects. Populated by Handoff Wizard when creating pilot WO from NPD project. NULL = regular production WO.';

-- =============================================
-- TABLE: products
-- =============================================
-- Add product source tracking + optional NPD project link

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS npd_project_id UUID REFERENCES npd_projects(id) ON DELETE SET NULL;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'npd_handoff', 'import'));

CREATE INDEX IF NOT EXISTS idx_products_npd_project_id ON products(npd_project_id);
CREATE INDEX IF NOT EXISTS idx_products_source ON products(source);

COMMENT ON COLUMN products.npd_project_id IS 'Optional FK to npd_projects. Populated by Handoff Wizard when product created from NPD project. NULL = manually created product.';
COMMENT ON COLUMN products.source IS 'Product origin: manual (created in Technical module), npd_handoff (created by Handoff Wizard from NPD project), import (bulk import).';

-- =============================================
-- TABLE: boms
-- =============================================
-- Add BOM source tracking + optional NPD formulation link

ALTER TABLE boms
  ADD COLUMN IF NOT EXISTS npd_formulation_id UUID REFERENCES npd_formulations(id) ON DELETE SET NULL;

ALTER TABLE boms
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'npd_handoff'));

CREATE INDEX IF NOT EXISTS idx_boms_npd_formulation_id ON boms(npd_formulation_id);
CREATE INDEX IF NOT EXISTS idx_boms_source ON boms(source);

COMMENT ON COLUMN boms.npd_formulation_id IS 'Optional FK to npd_formulations. Populated by Handoff Wizard when BOM created from NPD formulation. NULL = manually created BOM. Enables BOM lineage tracking back to NPD R&D.';
COMMENT ON COLUMN boms.source IS 'BOM origin: manual (created in Technical module), npd_handoff (created by Handoff Wizard from NPD formulation). Links production recipe to R&D formulation.';

-- =============================================
-- TABLE: production_outputs
-- =============================================
-- Add production output type tracking + future NPD trial link

ALTER TABLE production_outputs
  ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'production' CHECK (type IN ('production', 'trial'));

ALTER TABLE production_outputs
  ADD COLUMN IF NOT EXISTS npd_trial_id UUID;

CREATE INDEX IF NOT EXISTS idx_production_outputs_type ON production_outputs(type);

COMMENT ON COLUMN production_outputs.type IS 'Output type: production (regular WO output) or trial (pilot WO / NPD trial run). Trial outputs may have different quality checks or regulatory tracking.';
COMMENT ON COLUMN production_outputs.npd_trial_id IS 'Reserved for future use. Intended to link trial outputs to specific NPD trial/batch records. Currently nullable, no FK constraint.';

-- =============================================
-- END OF MIGRATION 103
-- =============================================
-- Summary:
--   Tables modified: 4 (work_orders, products, boms, production_outputs)
--   Columns added: 8 (type, npd_project_id, source, npd_formulation_id, npd_trial_id)
--   Foreign keys: 4 (all ON DELETE SET NULL for loose coupling)
--   Indexes: 7 (FK indexes + type/source indexes)
--   Existing data: Unaffected (all columns nullable with defaults)
-- Design:
--   Nullable FKs = NPD module optional (MonoPilot works standalone)
--   ON DELETE SET NULL = if NPD project deleted, core data remains (orphaned but valid)
--   TEXT CHECK constraints = flexible enums (vs rigid PostgreSQL ENUM type)
-- Enables:
--   Epic NPD-3: Handoff Wizard (NPD → Production)
--   Product lineage: NPD Project → Product → BOM → Pilot WO → Production
-- Next Story:
--   6.5 - Create Temporal Versioning Constraints (EXCLUDE constraints for date ranges)
-- =============================================
