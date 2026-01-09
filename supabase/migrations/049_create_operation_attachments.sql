-- Migration: 049_create_operation_attachments.sql
-- Description: Create operation_attachments table for routing operation file attachments (Story 02.8, FR-2.45)
-- Date: 2026-01-08
-- Author: Backend Dev Agent
-- Related: Story 02.8, FR-2.45 (Operation Attachments), ADR-013 (RLS Org Isolation)

-- =============================================================================
-- PURPOSE
-- =============================================================================
-- Create the operation_attachments table to store file attachments for routing operations:
-- - PDFs, images (PNG, JPG), and documents (DOCX) for work instructions
-- - Max 5 attachments per operation, 10MB each
-- - Supabase Storage integration for file storage
-- - Multi-tenant isolation via org_id and RLS

BEGIN;

-- =============================================================================
-- CREATE TABLE: operation_attachments
-- =============================================================================

CREATE TABLE IF NOT EXISTS operation_attachments (
  -- Primary key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Multi-tenant isolation
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Foreign key to routing_operations table
  operation_id UUID NOT NULL REFERENCES routing_operations(id) ON DELETE CASCADE,

  -- File metadata
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,  -- Supabase storage path: {org_id}/{routing_id}/{operation_id}/{timestamp}_{filename}
  file_size INTEGER,        -- File size in bytes
  mime_type TEXT,           -- MIME type (application/pdf, image/png, etc.)

  -- Audit fields
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- CONSTRAINTS
-- =============================================================================

-- File size must be positive and <= 10MB (10485760 bytes)
ALTER TABLE operation_attachments
ADD CONSTRAINT operation_attachments_file_size_valid
CHECK (file_size IS NULL OR (file_size > 0 AND file_size <= 10485760));

-- File name cannot be empty
ALTER TABLE operation_attachments
ADD CONSTRAINT operation_attachments_file_name_not_empty
CHECK (length(trim(file_name)) > 0);

-- File path cannot be empty
ALTER TABLE operation_attachments
ADD CONSTRAINT operation_attachments_file_path_not_empty
CHECK (length(trim(file_path)) > 0);

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Primary lookup: attachments by org_id (for RLS performance)
CREATE INDEX IF NOT EXISTS idx_operation_attachments_org_id
ON operation_attachments(org_id);

-- Lookup attachments for an operation
CREATE INDEX IF NOT EXISTS idx_operation_attachments_operation_id
ON operation_attachments(operation_id);

-- Combined index for org + operation queries
CREATE INDEX IF NOT EXISTS idx_operation_attachments_org_operation
ON operation_attachments(org_id, operation_id);

-- =============================================================================
-- TRIGGER: Limit attachments per operation (max 5)
-- =============================================================================

CREATE OR REPLACE FUNCTION check_operation_attachment_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM operation_attachments WHERE operation_id = NEW.operation_id) >= 5 THEN
    RAISE EXCEPTION 'Maximum 5 attachments per operation';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_operation_attachment_limit ON operation_attachments;
CREATE TRIGGER trigger_operation_attachment_limit
BEFORE INSERT ON operation_attachments
FOR EACH ROW
EXECUTE FUNCTION check_operation_attachment_limit();

-- =============================================================================
-- ENABLE RLS
-- =============================================================================

ALTER TABLE operation_attachments ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owner (prevents bypassing RLS even for service role)
ALTER TABLE operation_attachments FORCE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES (ADR-013 Pattern)
-- =============================================================================

-- SELECT: Users can read attachments for operations in their organization
CREATE POLICY operation_attachments_select
ON operation_attachments
FOR SELECT
TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- INSERT: Users with technical write permission can upload attachments
CREATE POLICY operation_attachments_insert
ON operation_attachments
FOR INSERT
TO authenticated
WITH CHECK (
  -- Must be user's org
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    -- User must have Create permission on technical module
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('owner', 'admin', 'production_manager')
  )
);

-- UPDATE: Only uploader or admin can update attachment metadata
CREATE POLICY operation_attachments_update
ON operation_attachments
FOR UPDATE
TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    -- Uploader can update their own attachments
    uploaded_by = auth.uid()
    OR
    -- Admin/owner can update any attachment
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('owner', 'admin')
  )
);

-- DELETE: Uploader or admin can delete attachments
CREATE POLICY operation_attachments_delete
ON operation_attachments
FOR DELETE
TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    -- Uploader can delete their own attachments
    uploaded_by = auth.uid()
    OR
    -- Admin/owner can delete any attachment
    (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid())
    IN ('owner', 'admin')
  )
);

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE operation_attachments IS 'File attachments for routing operations (PDFs, images, documents). FR-2.45';

COMMENT ON COLUMN operation_attachments.id IS 'Primary key UUID';
COMMENT ON COLUMN operation_attachments.org_id IS 'Organization ID for multi-tenant isolation (ADR-013)';
COMMENT ON COLUMN operation_attachments.operation_id IS 'Foreign key to parent routing_operation (CASCADE delete)';
COMMENT ON COLUMN operation_attachments.file_name IS 'Original file name as uploaded';
COMMENT ON COLUMN operation_attachments.file_path IS 'Supabase storage path: {org_id}/{routing_id}/{operation_id}/{timestamp}_{filename}';
COMMENT ON COLUMN operation_attachments.file_size IS 'File size in bytes (max 10MB = 10485760)';
COMMENT ON COLUMN operation_attachments.mime_type IS 'MIME type (application/pdf, image/png, image/jpeg, application/vnd.openxmlformats-officedocument.wordprocessingml.document)';
COMMENT ON COLUMN operation_attachments.uploaded_by IS 'User who uploaded the attachment';
COMMENT ON COLUMN operation_attachments.created_at IS 'Upload timestamp';

COMMENT ON POLICY operation_attachments_select ON operation_attachments IS
  'All authenticated users can read attachments within their organization';

COMMENT ON POLICY operation_attachments_insert ON operation_attachments IS
  'Only owner, admin, and production_manager can upload attachments';

COMMENT ON POLICY operation_attachments_update ON operation_attachments IS
  'Uploader or admin/owner can update attachment metadata';

COMMENT ON POLICY operation_attachments_delete ON operation_attachments IS
  'Uploader or admin/owner can delete attachments';

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant access to authenticated users (RLS will control row access)
GRANT SELECT, INSERT, UPDATE, DELETE ON operation_attachments TO authenticated;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES (run manually after migration)
-- =============================================================================
--
-- Check table exists:
-- SELECT * FROM information_schema.tables WHERE table_name = 'operation_attachments';
--
-- Check columns:
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'operation_attachments'
-- ORDER BY ordinal_position;
--
-- Check constraints:
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'operation_attachments';
--
-- Check indexes:
-- SELECT indexname FROM pg_indexes WHERE tablename = 'operation_attachments';
--
-- Check RLS policies:
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'operation_attachments';
--
-- Test attachment limit trigger:
-- INSERT INTO operation_attachments (org_id, operation_id, file_name, file_path)
-- VALUES ('org-uuid', 'op-uuid', 'test1.pdf', 'path1'),
--        ('org-uuid', 'op-uuid', 'test2.pdf', 'path2'),
--        ('org-uuid', 'op-uuid', 'test3.pdf', 'path3'),
--        ('org-uuid', 'op-uuid', 'test4.pdf', 'path4'),
--        ('org-uuid', 'op-uuid', 'test5.pdf', 'path5');
-- (Should succeed)
-- INSERT INTO operation_attachments (org_id, operation_id, file_name, file_path)
-- VALUES ('org-uuid', 'op-uuid', 'test6.pdf', 'path6');
-- (Should fail with "Maximum 5 attachments per operation")

-- =============================================================================
-- ROLLBACK SCRIPT (for reference)
-- =============================================================================
--
-- BEGIN;
-- DROP TRIGGER IF EXISTS trigger_operation_attachment_limit ON operation_attachments;
-- DROP FUNCTION IF EXISTS check_operation_attachment_limit();
-- DROP POLICY IF EXISTS operation_attachments_select ON operation_attachments;
-- DROP POLICY IF EXISTS operation_attachments_insert ON operation_attachments;
-- DROP POLICY IF EXISTS operation_attachments_update ON operation_attachments;
-- DROP POLICY IF EXISTS operation_attachments_delete ON operation_attachments;
-- DROP TABLE IF EXISTS operation_attachments;
-- COMMIT;
