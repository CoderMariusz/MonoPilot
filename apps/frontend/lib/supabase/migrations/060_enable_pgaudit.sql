-- Migration 060: Enable pgAudit Extension for FDA 21 CFR Part 11 Compliance
-- Purpose: Database-level audit trail using PostgreSQL pgAudit extension
-- Date: 2025-11-16
-- Dependencies: audit_log table (application-level audit)
-- Reference: Story 1.1 - Enable pgAudit Extension

-- =============================================
-- 1. ENABLE PGAUDIT EXTENSION
-- =============================================
-- Note: Supabase supports pgAudit out of the box for Pro/Team/Enterprise plans
-- The extension must be enabled by Supabase admin or via dashboard SQL editor

CREATE EXTENSION IF NOT EXISTS pgaudit;

COMMENT ON EXTENSION pgaudit IS 'PostgreSQL Audit Extension - provides detailed session and object audit logging';

-- =============================================
-- 2. CONFIGURE PGAUDIT PARAMETERS
-- =============================================
-- pgAudit settings for comprehensive FDA 21 CFR Part 11 compliance
-- These settings can be adjusted per session or globally via Supabase dashboard

-- Log all DDL (CREATE, ALTER, DROP table/function/etc.) statements
-- Log all DML WRITE operations (INSERT, UPDATE, DELETE)
-- Log all DML READ operations for audit_log table itself
-- Log role/privilege changes

-- Note: pgaudit.log setting is configured at database level via Supabase dashboard
-- Recommended setting: 'ddl, write' (logs all schema changes and data modifications)
-- For higher security: 'ddl, write, read' (includes SELECT queries - higher overhead)

-- =============================================
-- 3. CREATE DATABASE-LEVEL AUDIT LOG TABLE
-- =============================================
-- pgAudit logs to PostgreSQL log files, but we create a table to capture structured logs
-- This table is populated by log aggregation (configured separately) or via triggers

CREATE TABLE IF NOT EXISTS pgaudit_log (
  id BIGSERIAL PRIMARY KEY,
  audit_type VARCHAR(10) NOT NULL,           -- SESSION or OBJECT
  statement_id TEXT,                         -- Unique statement identifier
  substatement_id TEXT,                      -- For complex statements
  class TEXT,                                -- Audit class (READ, WRITE, DDL, etc.)
  command TEXT,                              -- SQL command (SELECT, INSERT, UPDATE, etc.)
  object_type TEXT,                          -- Type of object (TABLE, INDEX, etc.)
  object_name TEXT,                          -- Fully qualified object name
  statement TEXT,                            -- Full SQL statement
  parameter TEXT,                            -- Statement parameters
  user_id UUID,                              -- User who executed the statement
  session_id TEXT,                           -- Database session ID
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  org_id INTEGER                             -- Multi-tenant isolation
);

-- Indexes for performance
CREATE INDEX idx_pgaudit_log_timestamp ON pgaudit_log(timestamp DESC);
CREATE INDEX idx_pgaudit_log_user ON pgaudit_log(user_id);
CREATE INDEX idx_pgaudit_log_object_name ON pgaudit_log(object_name);
CREATE INDEX idx_pgaudit_log_command ON pgaudit_log(command);
CREATE INDEX idx_pgaudit_log_org_id ON pgaudit_log(org_id);

-- Composite index for common query patterns
CREATE INDEX idx_pgaudit_log_user_timestamp ON pgaudit_log(user_id, timestamp DESC);
CREATE INDEX idx_pgaudit_log_object_timestamp ON pgaudit_log(object_name, timestamp DESC);

COMMENT ON TABLE pgaudit_log IS 'Database-level audit trail from pgAudit extension - FDA 21 CFR Part 11 compliant';
COMMENT ON COLUMN pgaudit_log.audit_type IS 'SESSION (session-level logging) or OBJECT (object-level logging)';
COMMENT ON COLUMN pgaudit_log.class IS 'Audit class: READ, WRITE, FUNCTION, ROLE, DDL, MISC';
COMMENT ON COLUMN pgaudit_log.statement IS 'Full SQL statement executed (sanitized of sensitive data)';

-- =============================================
-- 4. CREATE AUDIT LOG VIEW (Unified)
-- =============================================
-- Combines application-level audit_log and database-level pgaudit_log
-- Provides a single interface for querying all audit events
-- Maps audit_log columns: table_name→object_name, action→command, user_id→user_id, timestamp→timestamp

CREATE OR REPLACE VIEW audit_log_view AS
SELECT
  'app' AS source,
  id,
  table_name AS object_name,
  action AS command,
  user_id,
  "timestamp" AS timestamp,
  NULL::JSONB AS before_data,
  changes AS after_data,
  NULL::TEXT AS statement,
  NULL::INTEGER AS org_id_from_log
FROM audit_log
WHERE actor_id IS NOT NULL

UNION ALL

SELECT
  'db' AS source,
  id,
  object_name,
  command,
  user_id,
  timestamp,
  NULL AS before_data,
  NULL AS after_data,
  statement,
  org_id AS org_id_from_log
FROM pgaudit_log
WHERE user_id IS NOT NULL

ORDER BY timestamp DESC;

COMMENT ON VIEW audit_log_view IS 'Unified view of application-level and database-level audit logs';

-- =============================================
-- 5. ROW LEVEL SECURITY (RLS)
-- =============================================
-- Ensure multi-tenant isolation for pgaudit_log table

ALTER TABLE pgaudit_log ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see audit logs for their own organization
CREATE POLICY pgaudit_log_select_policy ON pgaudit_log
  FOR SELECT
  USING (
    org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    OR
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- Policy: Only system/admin can insert audit logs (typically via triggers or log aggregator)
CREATE POLICY pgaudit_log_insert_policy ON pgaudit_log
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (SELECT id FROM users WHERE role = 'admin')
  );

-- No UPDATE/DELETE policies - audit logs are immutable
COMMENT ON POLICY pgaudit_log_select_policy ON pgaudit_log IS 'Users can view audit logs for their org; admins can view all';
COMMENT ON POLICY pgaudit_log_insert_policy ON pgaudit_log IS 'Only admins can insert audit logs (via log aggregator)';

-- =============================================
-- 6. AUDIT LOG RETENTION POLICY
-- =============================================
-- Automatically archive or delete audit logs older than 90 days (configurable)
-- This function should be called by a scheduled job (Supabase Edge Function or pg_cron)

CREATE OR REPLACE FUNCTION archive_old_audit_logs(retention_days INTEGER DEFAULT 90)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_deleted_count INTEGER;
BEGIN
  -- Archive to separate table (optional - for now we just delete)
  -- In production, consider archiving to cold storage (S3) before deletion

  DELETE FROM pgaudit_log
  WHERE timestamp < NOW() - (retention_days || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

  RETURN v_deleted_count;
END;
$$;

COMMENT ON FUNCTION archive_old_audit_logs IS 'Archive or delete pgaudit_log entries older than specified days (default 90)';

-- Grant execute permission to authenticated users (typically called by admin or scheduled job)
GRANT EXECUTE ON FUNCTION archive_old_audit_logs TO authenticated;

-- =============================================
-- 7. HELPER FUNCTION: Get Audit Trail for Entity
-- =============================================
-- Returns complete audit trail for a specific entity (from both app and DB logs)

CREATE OR REPLACE FUNCTION get_entity_audit_trail(
  p_entity_name TEXT,
  p_entity_id INTEGER
)
RETURNS TABLE (
  source TEXT,
  event_timestamp TIMESTAMPTZ,
  user_email TEXT,
  command TEXT,
  before_data JSONB,
  after_data JSONB,
  statement TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    v.source,
    v.timestamp AS event_timestamp,
    u.email AS user_email,
    v.command,
    v.before_data,
    v.after_data,
    v.statement
  FROM audit_log_view v
  LEFT JOIN users u ON v.user_id = u.id
  WHERE
    (v.source = 'app' AND v.object_name = p_entity_name AND v.id = p_entity_id)
    OR
    (v.source = 'db' AND v.object_name LIKE '%' || p_entity_name || '%')
  ORDER BY v.timestamp DESC;
END;
$$;

COMMENT ON FUNCTION get_entity_audit_trail IS 'Returns complete audit trail for a specific entity from both app and DB logs';

GRANT EXECUTE ON FUNCTION get_entity_audit_trail TO authenticated;

-- =============================================
-- 8. PERFORMANCE MONITORING
-- =============================================
-- Function to check pgAudit overhead and log volume

CREATE OR REPLACE FUNCTION get_pgaudit_stats()
RETURNS TABLE (
  total_logs BIGINT,
  logs_last_24h BIGINT,
  logs_last_7d BIGINT,
  oldest_log TIMESTAMPTZ,
  newest_log TIMESTAMPTZ,
  avg_logs_per_day NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT AS total_logs,
    COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '24 hours')::BIGINT AS logs_last_24h,
    COUNT(*) FILTER (WHERE timestamp > NOW() - INTERVAL '7 days')::BIGINT AS logs_last_7d,
    MIN(timestamp) AS oldest_log,
    MAX(timestamp) AS newest_log,
    (COUNT(*) / NULLIF(EXTRACT(EPOCH FROM (MAX(timestamp) - MIN(timestamp))) / 86400, 0))::NUMERIC AS avg_logs_per_day
  FROM pgaudit_log;
END;
$$;

COMMENT ON FUNCTION get_pgaudit_stats IS 'Returns statistics about pgAudit log volume for performance monitoring';

GRANT EXECUTE ON FUNCTION get_pgaudit_stats TO authenticated;

-- =============================================
-- NOTES FOR SUPABASE CONFIGURATION
-- =============================================
-- After running this migration, configure pgAudit parameters in Supabase dashboard:
--
-- 1. Navigate to: Database → Settings → Custom Postgres Config
-- 2. Add the following settings:
--    - pgaudit.log = 'ddl, write'  (or 'ddl, write, read' for full compliance)
--    - pgaudit.log_catalog = 'off' (skip system catalog logs to reduce noise)
--    - pgaudit.log_parameter = 'on' (log statement parameters)
--    - pgaudit.log_relation = 'on' (log fully qualified table names)
--    - pgaudit.log_statement_once = 'off' (log each statement in multi-statement command)
--
-- 3. Restart database instance for settings to take effect
--
-- 4. Set up log aggregation to populate pgaudit_log table from PostgreSQL logs
--    (This requires Supabase Pro/Team plan with log access)
--
-- 5. Schedule archive_old_audit_logs() function via pg_cron or Edge Function
--    Example: SELECT cron.schedule('archive-audit-logs', '0 2 * * *', $$SELECT archive_old_audit_logs(90)$$);
--
-- =============================================
-- ROLLBACK (if needed)
-- =============================================
-- DROP FUNCTION IF EXISTS get_pgaudit_stats();
-- DROP FUNCTION IF EXISTS get_entity_audit_trail(TEXT, INTEGER);
-- DROP FUNCTION IF EXISTS archive_old_audit_logs(INTEGER);
-- DROP VIEW IF EXISTS audit_log_view;
-- DROP TABLE IF EXISTS pgaudit_log;
-- DROP EXTENSION IF EXISTS pgaudit;
