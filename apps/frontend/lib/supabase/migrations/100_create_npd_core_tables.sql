-- =============================================
-- Migration 100: Create Core NPD Tables
-- =============================================
-- Epic: NPD-6 (Database Schema & Infrastructure)
-- Story: NPD-6.1 - Create Core NPD Tables
-- Purpose: Foundation tables for NPD Module (projects, formulations, items)
-- Date: 2025-11-16
-- Dependencies: products table (for formulation items reference)
-- Pattern: Follows master_migration.sql conventions (UUID PKs, org_id, TIMESTAMPTZ, TEXT CHECK constraints)
-- =============================================

-- =============================================
-- TABLE: npd_projects
-- =============================================
CREATE TABLE IF NOT EXISTS npd_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id INTEGER NOT NULL,
  project_number TEXT UNIQUE NOT NULL,
  project_name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'idea' CHECK (status IN ('idea', 'concept', 'development', 'testing', 'on_hold', 'launched', 'cancelled')),
  current_gate TEXT DEFAULT 'G0' CHECK (current_gate IN ('G0', 'G1', 'G2', 'G3', 'G4', 'Launched')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  portfolio_category TEXT,
  owner_id UUID REFERENCES users(id),
  target_launch_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_npd_projects_org_id_status ON npd_projects(org_id, status);
CREATE INDEX idx_npd_projects_owner ON npd_projects(owner_id);
CREATE INDEX idx_npd_projects_target_launch ON npd_projects(target_launch_date);
CREATE INDEX idx_npd_projects_number ON npd_projects(project_number);

COMMENT ON TABLE npd_projects IS 'NPD projects tracking Stage-Gate workflow (G0-G4) for new product development. Premium add-on module.';
COMMENT ON COLUMN npd_projects.status IS 'Project lifecycle: idea → concept → development → testing → launched/cancelled';
COMMENT ON COLUMN npd_projects.current_gate IS 'Stage-Gate position: G0 (Ideation) → G1 (Scoping) → G2 (Business Case) → G3 (Development) → G4 (Launch) → Launched';
COMMENT ON COLUMN npd_projects.project_number IS 'Auto-generated unique identifier (e.g., NPD-00001)';
COMMENT ON COLUMN npd_projects.org_id IS 'Multi-tenant isolation - RLS policies enforce org_id filtering (Story 6.3)';

-- =============================================
-- TABLE: npd_formulations
-- =============================================
CREATE TABLE IF NOT EXISTS npd_formulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id INTEGER NOT NULL,
  npd_project_id UUID NOT NULL REFERENCES npd_projects(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  effective_from DATE,
  effective_to DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'superseded')),
  locked_at TIMESTAMPTZ,
  locked_by UUID REFERENCES users(id),
  parent_formulation_id UUID REFERENCES npd_formulations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

CREATE INDEX idx_npd_formulations_org_id ON npd_formulations(org_id);
CREATE INDEX idx_npd_formulations_project_id_version ON npd_formulations(npd_project_id, version);
CREATE INDEX idx_npd_formulations_status ON npd_formulations(status);
CREATE INDEX idx_npd_formulations_effective_dates ON npd_formulations(effective_from, effective_to);
CREATE INDEX idx_npd_formulations_parent ON npd_formulations(parent_formulation_id);

COMMENT ON TABLE npd_formulations IS 'Multi-version formulations with effective date ranges and immutability support (locked_at). Temporal versioning enforced by Story 6.5.';
COMMENT ON COLUMN npd_formulations.version IS 'Version identifier (e.g., v1.0, v1.1, v2.0)';
COMMENT ON COLUMN npd_formulations.effective_from IS 'Start date for this formulation version (temporal versioning with EXCLUDE constraint in Story 6.5)';
COMMENT ON COLUMN npd_formulations.effective_to IS 'End date for this formulation version (NULL = current version)';
COMMENT ON COLUMN npd_formulations.locked_at IS 'Timestamp when formulation was locked for compliance (FDA 21 CFR Part 11 immutability)';
COMMENT ON COLUMN npd_formulations.parent_formulation_id IS 'Parent formulation for lineage tracking (v1 → v2 → v3 evolution)';

-- =============================================
-- TABLE: npd_formulation_items
-- =============================================
CREATE TABLE IF NOT EXISTS npd_formulation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  npd_formulation_id UUID NOT NULL REFERENCES npd_formulations(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  qty NUMERIC(12,4) NOT NULL CHECK (qty > 0),
  uom TEXT NOT NULL,
  sequence INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_npd_formulation_items_formulation_id ON npd_formulation_items(npd_formulation_id);
CREATE INDEX idx_npd_formulation_items_product_id ON npd_formulation_items(product_id);
CREATE INDEX idx_npd_formulation_items_sequence ON npd_formulation_items(npd_formulation_id, sequence);

COMMENT ON TABLE npd_formulation_items IS 'Formulation ingredients/components with qty, UoM, and product reference. Linked to MonoPilot products table.';
COMMENT ON COLUMN npd_formulation_items.sequence IS 'Display order for formulation items in UI (1, 2, 3...)';
COMMENT ON COLUMN npd_formulation_items.product_id IS 'Reference to products table (ingredients/components). RESTRICT prevents deletion if used in formulation.';
COMMENT ON COLUMN npd_formulation_items.qty IS 'Quantity of ingredient required (always positive)';

-- =============================================
-- SEQUENCE: Auto-generate project_number
-- =============================================
CREATE SEQUENCE IF NOT EXISTS npd_project_number_seq START WITH 1;

-- Set default for project_number to use sequence
ALTER TABLE npd_projects
  ALTER COLUMN project_number SET DEFAULT ('NPD-' || LPAD(nextval('npd_project_number_seq')::text, 5, '0'));

COMMENT ON SEQUENCE npd_project_number_seq IS 'Auto-generates NPD project numbers in format NPD-00001, NPD-00002, etc.';

-- =============================================
-- END OF MIGRATION 100
-- =============================================
-- Summary:
--   Tables created: 3 (npd_projects, npd_formulations, npd_formulation_items)
--   Foreign keys: 5 (CASCADE for ownership, RESTRICT for products)
--   Indexes: 11 (performance optimization)
--   Sequence: 1 (auto project_number)
-- Next Story:
--   6.2 - Create Supporting NPD Tables (npd_costing, npd_risks, npd_documents, npd_events)
-- =============================================
