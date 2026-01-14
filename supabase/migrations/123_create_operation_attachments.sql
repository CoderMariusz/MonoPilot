-- Migration: 121_create_operation_attachments.sql
-- Description: Create operation_attachments table for routing operation files (Story 02.8 FR-2.45)
-- Date: 2026-01-14
-- Author: Backend Dev Agent
-- Related: Story 02.8, FR-2.45, ADR-013 (RLS)

-- =============================================================================
-- PURPOSE
-- =============================================================================
-- Create the operation_attachments table to store file attachments for routing
-- operations. Files are stored in Supabase Storage, this table tracks metadata.
-- Supports: work instructions, diagrams, photos, reference documents
-- Limit: 5 attachments per operation, 10MB max file size (enforced in service)

BEGIN;

-- =============================================================================
-- CREATE TABLE: operation_attachments
-- =============================================================================

CREATE TABLE IF NOT EXISTS operation_attachments (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenant isolation
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Foreign key to parent operation
  operation_id UUID NOT NULL REFERENCES routing_operations(id) ON DELETE CASCADE,

  -- File metadata
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  storage_path TEXT NOT NULL,

  -- Audit
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- CONSTRAINTS
-- =============================================================================

-- Ensure file_name is not empty
ALTER TABLE operation_attachments
ADD CONSTRAINT operation_attachments_file_name_not_empty
CHECK (LENGTH(TRIM(file_name)) > 0);

-- Ensure storage_path is not empty
ALTER TABLE operation_attachments
ADD CONSTRAINT operation_attachments_storage_path_not_empty
CHECK (LENGTH(TRIM(storage_path)) > 0);

-- Ensure positive file size
ALTER TABLE operation_attachments
ADD CONSTRAINT operation_attachments_file_size_positive
CHECK (file_size > 0);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary lookup: attachments by operation
CREATE INDEX IF NOT EXISTS idx_operation_attachments_operation_id
ON operation_attachments(operation_id);

-- Multi-tenant filter
CREATE INDEX IF NOT EXISTS idx_operation_attachments_org_id
ON operation_attachments(org_id);

-- Uploaded by user lookup
CREATE INDEX IF NOT EXISTS idx_operation_attachments_uploaded_by
ON operation_attachments(uploaded_by) WHERE uploaded_by IS NOT NULL;

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE operation_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE operation_attachments FORCE ROW LEVEL SECURITY;

-- SELECT: All authenticated users can read attachments for their org
CREATE POLICY operation_attachments_select
ON operation_attachments
FOR SELECT
TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- INSERT: Users with technical write permission can create attachments
CREATE POLICY operation_attachments_insert
ON operation_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('owner', 'admin', 'production_manager')
  )
);

-- UPDATE: Users with technical update permission can modify attachments
CREATE POLICY operation_attachments_update
ON operation_attachments
FOR UPDATE
TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('owner', 'admin', 'production_manager', 'quality_manager')
  )
);

-- DELETE: Only admins can delete attachments
CREATE POLICY operation_attachments_delete
ON operation_attachments
FOR DELETE
TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('owner', 'admin')
  )
);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE operation_attachments IS 'File attachments for routing operations (work instructions, diagrams, photos). Max 5 per operation.';

COMMENT ON COLUMN operation_attachments.id IS 'Primary key UUID';
COMMENT ON COLUMN operation_attachments.org_id IS 'Organization for multi-tenant isolation';
COMMENT ON COLUMN operation_attachments.operation_id IS 'Foreign key to parent routing_operation';
COMMENT ON COLUMN operation_attachments.file_name IS 'Original file name as uploaded';
COMMENT ON COLUMN operation_attachments.file_type IS 'File extension/type (pdf, jpg, png, etc.)';
COMMENT ON COLUMN operation_attachments.file_size IS 'File size in bytes';
COMMENT ON COLUMN operation_attachments.storage_path IS 'Path in Supabase Storage bucket';
COMMENT ON COLUMN operation_attachments.uploaded_by IS 'User who uploaded the file';
COMMENT ON COLUMN operation_attachments.created_at IS 'Upload timestamp';

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON operation_attachments TO authenticated;

-- =============================================================================
-- COMMENTS ON POLICIES
-- =============================================================================

COMMENT ON POLICY operation_attachments_select ON operation_attachments IS
  'All authenticated users can read attachments within their organization';

COMMENT ON POLICY operation_attachments_insert ON operation_attachments IS
  'Only owner, admin, and production_manager can upload attachments';

COMMENT ON POLICY operation_attachments_update ON operation_attachments IS
  'Only owner, admin, production_manager, and quality_manager can update attachments';

COMMENT ON POLICY operation_attachments_delete ON operation_attachments IS
  'Only owner and admin can delete attachments';

COMMIT;

-- =============================================================================
-- ROLLBACK SCRIPT (for reference)
-- =============================================================================
--
-- BEGIN;
-- DROP POLICY IF EXISTS operation_attachments_select ON operation_attachments;
-- DROP POLICY IF EXISTS operation_attachments_insert ON operation_attachments;
-- DROP POLICY IF EXISTS operation_attachments_update ON operation_attachments;
-- DROP POLICY IF EXISTS operation_attachments_delete ON operation_attachments;
-- DROP TABLE IF EXISTS operation_attachments;
-- COMMIT;
