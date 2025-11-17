-- =============================================
-- Migration 102: RLS Policies for NPD Tables
-- =============================================
-- Epic: NPD-6 (Database Schema & Infrastructure)
-- Story: NPD-6.3 - Implement RLS Policies
-- Purpose: Multi-tenant isolation + role-based access for NPD Module
-- Date: 2025-11-16
-- Dependencies: Migrations 100, 101 (all 7 npd_* tables)
-- Security: FIRST MonoPilot tables with PROPER org_id isolation (vs global authenticated access)
-- =============================================

-- =============================================
-- SECTION 1: ENABLE RLS ON ALL NPD TABLES
-- =============================================

ALTER TABLE npd_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE npd_formulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE npd_formulation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE npd_costing ENABLE ROW LEVEL SECURITY;
ALTER TABLE npd_risks ENABLE ROW LEVEL SECURITY;
ALTER TABLE npd_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE npd_events ENABLE ROW LEVEL SECURITY;

COMMENT ON TABLE npd_projects IS 'RLS enabled - org_id isolation enforced at PostgreSQL level';
COMMENT ON TABLE npd_formulations IS 'RLS enabled - inherits org_id from npd_projects via FK';
COMMENT ON TABLE npd_formulation_items IS 'RLS enabled - inherits org_id via npd_formulations chain';
COMMENT ON TABLE npd_costing IS 'RLS enabled - inherits org_id from npd_projects via FK';
COMMENT ON TABLE npd_risks IS 'RLS enabled - inherits org_id from npd_projects via FK';
COMMENT ON TABLE npd_documents IS 'RLS enabled - direct org_id column';
COMMENT ON TABLE npd_events IS 'RLS enabled - direct org_id column';

-- =============================================
-- SECTION 2: BASE POLICIES (ORG_ID ISOLATION)
-- =============================================
-- Session variable app.org_id is set by middleware.ts
-- All policies filter by: org_id = current_setting('app.org_id')::INTEGER
-- =============================================

-- NPD_PROJECTS (has direct org_id column)
CREATE POLICY npd_projects_select_own_org ON npd_projects
  FOR SELECT
  TO authenticated
  USING (org_id = current_setting('app.org_id', true)::INTEGER);

CREATE POLICY npd_projects_insert_own_org ON npd_projects
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id = current_setting('app.org_id', true)::INTEGER);

CREATE POLICY npd_projects_update_own_org ON npd_projects
  FOR UPDATE
  TO authenticated
  USING (org_id = current_setting('app.org_id', true)::INTEGER)
  WITH CHECK (org_id = current_setting('app.org_id', true)::INTEGER);

CREATE POLICY npd_projects_delete_own_org ON npd_projects
  FOR DELETE
  TO authenticated
  USING (org_id = current_setting('app.org_id', true)::INTEGER);

-- NPD_FORMULATIONS (inherits org_id via FK to npd_projects)
CREATE POLICY npd_formulations_select_own_org ON npd_formulations
  FOR SELECT
  TO authenticated
  USING (org_id = current_setting('app.org_id', true)::INTEGER);

CREATE POLICY npd_formulations_insert_own_org ON npd_formulations
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id = current_setting('app.org_id', true)::INTEGER);

CREATE POLICY npd_formulations_update_own_org ON npd_formulations
  FOR UPDATE
  TO authenticated
  USING (org_id = current_setting('app.org_id', true)::INTEGER)
  WITH CHECK (org_id = current_setting('app.org_id', true)::INTEGER);

CREATE POLICY npd_formulations_delete_own_org ON npd_formulations
  FOR DELETE
  TO authenticated
  USING (org_id = current_setting('app.org_id', true)::INTEGER);

-- NPD_FORMULATION_ITEMS (joins through npd_formulations to get org_id)
CREATE POLICY npd_formulation_items_select_own_org ON npd_formulation_items
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM npd_formulations
    WHERE npd_formulations.id = npd_formulation_items.npd_formulation_id
      AND npd_formulations.org_id = current_setting('app.org_id', true)::INTEGER
  ));

CREATE POLICY npd_formulation_items_insert_own_org ON npd_formulation_items
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM npd_formulations
    WHERE npd_formulations.id = npd_formulation_items.npd_formulation_id
      AND npd_formulations.org_id = current_setting('app.org_id', true)::INTEGER
  ));

CREATE POLICY npd_formulation_items_update_own_org ON npd_formulation_items
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM npd_formulations
    WHERE npd_formulations.id = npd_formulation_items.npd_formulation_id
      AND npd_formulations.org_id = current_setting('app.org_id', true)::INTEGER
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM npd_formulations
    WHERE npd_formulations.id = npd_formulation_items.npd_formulation_id
      AND npd_formulations.org_id = current_setting('app.org_id', true)::INTEGER
  ));

CREATE POLICY npd_formulation_items_delete_own_org ON npd_formulation_items
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM npd_formulations
    WHERE npd_formulations.id = npd_formulation_items.npd_formulation_id
      AND npd_formulations.org_id = current_setting('app.org_id', true)::INTEGER
  ));

-- NPD_COSTING (joins to npd_projects for org_id)
CREATE POLICY npd_costing_select_own_org ON npd_costing
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM npd_projects
    WHERE npd_projects.id = npd_costing.npd_project_id
      AND npd_projects.org_id = current_setting('app.org_id', true)::INTEGER
  ));

CREATE POLICY npd_costing_insert_own_org ON npd_costing
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM npd_projects
    WHERE npd_projects.id = npd_costing.npd_project_id
      AND npd_projects.org_id = current_setting('app.org_id', true)::INTEGER
  ));

CREATE POLICY npd_costing_update_own_org ON npd_costing
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM npd_projects
    WHERE npd_projects.id = npd_costing.npd_project_id
      AND npd_projects.org_id = current_setting('app.org_id', true)::INTEGER
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM npd_projects
    WHERE npd_projects.id = npd_costing.npd_project_id
      AND npd_projects.org_id = current_setting('app.org_id', true)::INTEGER
  ));

CREATE POLICY npd_costing_delete_own_org ON npd_costing
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM npd_projects
    WHERE npd_projects.id = npd_costing.npd_project_id
      AND npd_projects.org_id = current_setting('app.org_id', true)::INTEGER
  ));

-- NPD_RISKS (joins to npd_projects for org_id)
CREATE POLICY npd_risks_select_own_org ON npd_risks
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM npd_projects
    WHERE npd_projects.id = npd_risks.npd_project_id
      AND npd_projects.org_id = current_setting('app.org_id', true)::INTEGER
  ));

CREATE POLICY npd_risks_insert_own_org ON npd_risks
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM npd_projects
    WHERE npd_projects.id = npd_risks.npd_project_id
      AND npd_projects.org_id = current_setting('app.org_id', true)::INTEGER
  ));

CREATE POLICY npd_risks_update_own_org ON npd_risks
  FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM npd_projects
    WHERE npd_projects.id = npd_risks.npd_project_id
      AND npd_projects.org_id = current_setting('app.org_id', true)::INTEGER
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM npd_projects
    WHERE npd_projects.id = npd_risks.npd_project_id
      AND npd_projects.org_id = current_setting('app.org_id', true)::INTEGER
  ));

CREATE POLICY npd_risks_delete_own_org ON npd_risks
  FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM npd_projects
    WHERE npd_projects.id = npd_risks.npd_project_id
      AND npd_projects.org_id = current_setting('app.org_id', true)::INTEGER
  ));

-- NPD_DOCUMENTS (has direct org_id column)
CREATE POLICY npd_documents_select_own_org ON npd_documents
  FOR SELECT
  TO authenticated
  USING (org_id = current_setting('app.org_id', true)::INTEGER);

CREATE POLICY npd_documents_insert_own_org ON npd_documents
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id = current_setting('app.org_id', true)::INTEGER);

CREATE POLICY npd_documents_update_own_org ON npd_documents
  FOR UPDATE
  TO authenticated
  USING (org_id = current_setting('app.org_id', true)::INTEGER)
  WITH CHECK (org_id = current_setting('app.org_id', true)::INTEGER);

CREATE POLICY npd_documents_delete_own_org ON npd_documents
  FOR DELETE
  TO authenticated
  USING (org_id = current_setting('app.org_id', true)::INTEGER);

-- NPD_EVENTS (has direct org_id column)
CREATE POLICY npd_events_select_own_org ON npd_events
  FOR SELECT
  TO authenticated
  USING (org_id = current_setting('app.org_id', true)::INTEGER);

CREATE POLICY npd_events_insert_own_org ON npd_events
  FOR INSERT
  TO authenticated
  WITH CHECK (org_id = current_setting('app.org_id', true)::INTEGER);

CREATE POLICY npd_events_update_own_org ON npd_events
  FOR UPDATE
  TO authenticated
  USING (org_id = current_setting('app.org_id', true)::INTEGER)
  WITH CHECK (org_id = current_setting('app.org_id', true)::INTEGER);

CREATE POLICY npd_events_delete_own_org ON npd_events
  FOR DELETE
  TO authenticated
  USING (org_id = current_setting('app.org_id', true)::INTEGER);

-- =============================================
-- END OF MIGRATION 102
-- =============================================
-- Summary:
--   RLS enabled: 7 tables (all npd_*)
--   Base policies: 28 (SELECT/INSERT/UPDATE/DELETE × 7 tables)
--   Security: org_id isolation enforced at PostgreSQL level
--   Session variable: app.org_id (set by middleware.ts)
-- Note:
--   Role-based policies (NPD Lead, R&D, Finance, Regulatory, Production)
--   can be added in future migration if needed for fine-grained access control
-- Next Story:
--   6.4 - Modify Existing Tables (add npd_project_id to WO/Products/BOMs)
-- =============================================
