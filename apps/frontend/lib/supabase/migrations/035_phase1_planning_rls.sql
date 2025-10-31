-- Migration 035: Phase 1 Planning RLS Policies
-- Purpose: Implement role-based Row Level Security for Planning Module
-- Date: 2025-01-21

-- =============================================
-- 1. ENABLE RLS ON PLANNING TABLES
-- =============================================

-- Enable RLS on all planning tables
ALTER TABLE po_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE po_correction ENABLE ROW LEVEL SECURITY;
ALTER TABLE to_header ENABLE ROW LEVEL SECURITY;
ALTER TABLE to_line ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. PO HEADER RLS POLICIES
-- =============================================

-- Planner: CRUD on DRAFT POs only
CREATE POLICY "planner_po_draft_crud" ON po_header
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Planner'
    )
    AND status = 'draft'
  );

-- Planner Approver: CRUD on DRAFT, can approve/close/reopen
CREATE POLICY "planner_approver_po_all" ON po_header
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Admin', 'Planner')
    )
  );

-- Warehouse: Read-only access to all POs
CREATE POLICY "warehouse_po_read" ON po_header
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Warehouse'
    )
  );

-- Finance: Read access, can create corrections
CREATE POLICY "finance_po_read" ON po_header
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Admin', 'Purchasing')
    )
  );

-- =============================================
-- 3. PO LINE RLS POLICIES
-- =============================================

-- Planner: CRUD on lines of DRAFT POs only
CREATE POLICY "planner_po_line_draft_crud" ON po_line
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Planner'
    )
    AND EXISTS (
      SELECT 1 FROM po_header 
      WHERE po_header.id = po_line.po_id 
      AND po_header.status = 'draft'
    )
  );

-- Planner Approver: CRUD on all lines
CREATE POLICY "planner_approver_po_line_all" ON po_line
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Admin', 'Planner')
    )
  );

-- Warehouse: Read-only access to all lines
CREATE POLICY "warehouse_po_line_read" ON po_line
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Warehouse'
    )
  );

-- Finance: Read access to all lines
CREATE POLICY "finance_po_line_read" ON po_line
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Admin', 'Purchasing')
    )
  );

-- =============================================
-- 4. PO CORRECTION RLS POLICIES
-- =============================================

-- Finance: CRUD on corrections
CREATE POLICY "finance_po_correction_crud" ON po_correction
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Admin', 'Purchasing')
    )
  );

-- Planner Approver: Read access to corrections
CREATE POLICY "planner_approver_po_correction_read" ON po_correction
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Admin', 'Planner')
    )
  );

-- =============================================
-- 5. TO HEADER RLS POLICIES
-- =============================================

-- Planner: CRUD on DRAFT TOs only
CREATE POLICY "planner_to_draft_crud" ON to_header
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Planner'
    )
    AND status = 'draft'
  );

-- Planner Approver: CRUD on all TOs
CREATE POLICY "planner_approver_to_all" ON to_header
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Admin', 'Planner')
    )
  );

-- Warehouse: Read-only access to all TOs
CREATE POLICY "warehouse_to_read" ON to_header
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Warehouse'
    )
  );

-- =============================================
-- 6. TO LINE RLS POLICIES
-- =============================================

-- Planner: CRUD on lines of DRAFT TOs only
CREATE POLICY "planner_to_line_draft_crud" ON to_line
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Planner'
    )
    AND EXISTS (
      SELECT 1 FROM to_header 
      WHERE to_header.id = to_line.to_id 
      AND to_header.status = 'draft'
    )
  );

-- Planner Approver: CRUD on all lines
CREATE POLICY "planner_approver_to_line_all" ON to_line
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role IN ('Admin', 'Planner')
    )
  );

-- Warehouse: Read-only access to all lines
CREATE POLICY "warehouse_to_line_read" ON to_line
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.role = 'Warehouse'
    )
  );

-- =============================================
-- 7. AUDIT LOG RLS POLICIES
-- =============================================

-- All authenticated users can read audit logs
CREATE POLICY "audit_log_read_all" ON audit_log
  FOR SELECT
  TO authenticated
  USING (true);

-- Only system can insert audit logs (via API)
CREATE POLICY "audit_log_insert_system" ON audit_log
  FOR INSERT
  TO authenticated
  USING (true);

-- =============================================
-- 8. DELETE PREVENTION TRIGGERS
-- =============================================

-- Prevent physical DELETE on po_header
CREATE OR REPLACE FUNCTION prevent_po_header_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Physical DELETE on po_header is forbidden. Use soft delete or status change instead.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_po_header_delete
  BEFORE DELETE ON po_header
  FOR EACH ROW
  EXECUTE FUNCTION prevent_po_header_delete();

-- Prevent physical DELETE on to_header
CREATE OR REPLACE FUNCTION prevent_to_header_delete()
RETURNS TRIGGER AS $$
BEGIN
  RAISE EXCEPTION 'Physical DELETE on to_header is forbidden. Use soft delete or status change instead.';
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_to_header_delete
  BEFORE DELETE ON to_header
  FOR EACH ROW
  EXECUTE FUNCTION prevent_to_header_delete();

-- =============================================
-- 9. ROLE-BASED PERMISSION HELPERS
-- =============================================

-- Function to check if user has planner role
CREATE OR REPLACE FUNCTION is_planner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Planner'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has planner_approver role
CREATE OR REPLACE FUNCTION is_planner_approver()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('Admin', 'Planner')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has warehouse role
CREATE OR REPLACE FUNCTION is_warehouse()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role = 'Warehouse'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has finance role
CREATE OR REPLACE FUNCTION is_finance()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid() 
    AND users.role IN ('Admin', 'Purchasing')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 10. COMMENTS FOR DOCUMENTATION
-- =============================================

COMMENT ON POLICY "planner_po_draft_crud" ON po_header IS 'Planners can CRUD only DRAFT POs';
COMMENT ON POLICY "planner_approver_po_all" ON po_header IS 'Planner approvers can CRUD all POs and perform status transitions';
COMMENT ON POLICY "warehouse_po_read" ON po_header IS 'Warehouse users have read-only access to all POs';
COMMENT ON POLICY "finance_po_read" ON po_header IS 'Finance users have read access and can create corrections';

COMMENT ON POLICY "planner_to_draft_crud" ON to_header IS 'Planners can CRUD only DRAFT TOs';
COMMENT ON POLICY "planner_approver_to_all" ON to_header IS 'Planner approvers can CRUD all TOs and perform status transitions';
COMMENT ON POLICY "warehouse_to_read" ON to_header IS 'Warehouse users have read-only access to all TOs';

COMMENT ON POLICY "finance_po_correction_crud" ON po_correction IS 'Finance users can create and manage PO corrections';
COMMENT ON POLICY "audit_log_read_all" ON audit_log IS 'All authenticated users can read audit logs';
COMMENT ON POLICY "audit_log_insert_system" ON audit_log IS 'System can insert audit log entries via API';

-- =============================================
-- 11. VALIDATION QUERIES
-- =============================================

-- Verify RLS is enabled
DO $$
DECLARE
  rls_enabled BOOLEAN;
BEGIN
  SELECT relrowsecurity INTO rls_enabled 
  FROM pg_class 
  WHERE relname = 'po_header';
  
  IF NOT rls_enabled THEN
    RAISE EXCEPTION 'RLS not enabled on po_header';
  END IF;
  
  RAISE NOTICE 'RLS policies created successfully for Phase 1 Planning Module';
END $$;
