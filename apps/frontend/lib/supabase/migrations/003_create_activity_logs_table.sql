-- Migration 003: Create activity_logs table for dashboard activity feed
-- Story: 1.13 Main Dashboard - AC-012.3
-- Date: 2025-11-21

-- ============================================================================
-- CREATE ACTIVITY_LOGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  entity_code VARCHAR(100) NOT NULL,
  description TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT activity_logs_activity_type_check CHECK (activity_type IN (
    'wo_status_change', 'wo_started', 'wo_paused', 'wo_resumed', 'wo_completed',
    'po_created', 'po_approved', 'po_rejected', 'po_received',
    'lp_created', 'lp_received', 'lp_moved', 'lp_split', 'lp_merged',
    'ncr_created', 'ncr_resolved', 'ncr_closed',
    'to_created', 'to_shipped', 'to_received',
    'qa_hold_created', 'qa_hold_released',
    'shipment_created', 'shipment_shipped',
    'user_invited', 'user_activated', 'user_deactivated',
    'module_enabled', 'module_disabled'
  )),
  CONSTRAINT activity_logs_entity_type_check CHECK (entity_type IN (
    'work_order', 'purchase_order', 'transfer_order', 'license_plate',
    'ncr', 'shipment', 'user', 'organization', 'module'
  ))
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

-- Performance indexes for common queries
-- Index for dashboard activity feed (org-specific, sorted by date DESC)
CREATE INDEX IF NOT EXISTS idx_activity_logs_org_created ON public.activity_logs(org_id, created_at DESC);

-- Index for entity-specific activity lookup
CREATE INDEX IF NOT EXISTS idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);

-- Index for user activity tracking
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);

-- Index for activity type filtering
CREATE INDEX IF NOT EXISTS idx_activity_logs_type ON public.activity_logs(activity_type);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- CREATE RLS POLICIES
-- ============================================================================

-- Policy: Service role bypass RLS (for admin operations)
CREATE POLICY "Service role bypass RLS"
  ON public.activity_logs
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy: Users can only see activities from their own organization
CREATE POLICY "Users can view org activities"
  ON public.activity_logs
  FOR SELECT
  TO authenticated
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Policy: Authenticated users can insert activities for their organization
CREATE POLICY "Users can insert org activities"
  ON public.activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id = (auth.jwt() ->> 'org_id')::uuid
    AND user_id = auth.uid()
  );

-- Policy: No updates allowed (activity logs are immutable)
-- Policy: No deletes allowed by regular users (only service_role for maintenance)

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant permissions to authenticated users
GRANT SELECT, INSERT ON public.activity_logs TO authenticated;
GRANT ALL ON public.activity_logs TO service_role;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.activity_logs IS 'Activity log for dashboard activity feed - tracks user actions across all modules';
COMMENT ON COLUMN public.activity_logs.id IS 'Primary key (UUID)';
COMMENT ON COLUMN public.activity_logs.org_id IS 'Organization FK for multi-tenancy isolation';
COMMENT ON COLUMN public.activity_logs.user_id IS 'User who performed the action';
COMMENT ON COLUMN public.activity_logs.activity_type IS 'Type of activity (e.g., wo_started, po_approved, lp_received)';
COMMENT ON COLUMN public.activity_logs.entity_type IS 'Type of entity (e.g., work_order, purchase_order, license_plate)';
COMMENT ON COLUMN public.activity_logs.entity_id IS 'UUID of the entity (polymorphic reference)';
COMMENT ON COLUMN public.activity_logs.entity_code IS 'Human-readable entity code for display (e.g., WO-2024-001, PO-2024-042)';
COMMENT ON COLUMN public.activity_logs.description IS 'Human-readable activity description (e.g., "WO-2024-001 started by John Doe")';
COMMENT ON COLUMN public.activity_logs.metadata IS 'Additional context as JSONB (optional)';
COMMENT ON COLUMN public.activity_logs.created_at IS 'Timestamp when activity occurred';

-- ============================================================================
-- SEED DATA (Example activities for testing)
-- ============================================================================

-- Example: Insert sample activities if default organization exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.organizations WHERE id = '00000000-0000-0000-0000-000000000001') THEN
    -- Only insert if not already present
    IF NOT EXISTS (SELECT 1 FROM public.activity_logs WHERE entity_code = 'WO-2024-001') THEN
      INSERT INTO public.activity_logs (
        org_id,
        user_id,
        activity_type,
        entity_type,
        entity_id,
        entity_code,
        description,
        metadata,
        created_at
      )
      SELECT
        '00000000-0000-0000-0000-000000000001'::uuid,
        u.id,
        'wo_started',
        'work_order',
        '00000000-0000-0000-0000-000000000010'::uuid,
        'WO-2024-001',
        'Work Order WO-2024-001 started',
        jsonb_build_object('line_id', 'LINE-01', 'product_code', 'PROD-001'),
        NOW() - INTERVAL '2 minutes'
      FROM public.users u
      WHERE u.org_id = '00000000-0000-0000-0000-000000000001'
      AND u.role = 'admin'
      LIMIT 1;

      INSERT INTO public.activity_logs (
        org_id,
        user_id,
        activity_type,
        entity_type,
        entity_id,
        entity_code,
        description,
        metadata,
        created_at
      )
      SELECT
        '00000000-0000-0000-0000-000000000001'::uuid,
        u.id,
        'po_approved',
        'purchase_order',
        '00000000-0000-0000-0000-000000000020'::uuid,
        'PO-2024-042',
        'Purchase Order PO-2024-042 approved',
        jsonb_build_object('supplier', 'Supplier XYZ', 'total', 5000.00),
        NOW() - INTERVAL '15 minutes'
      FROM public.users u
      WHERE u.org_id = '00000000-0000-0000-0000-000000000001'
      AND u.role = 'admin'
      LIMIT 1;

      INSERT INTO public.activity_logs (
        org_id,
        user_id,
        activity_type,
        entity_type,
        entity_id,
        entity_code,
        description,
        metadata,
        created_at
      )
      SELECT
        '00000000-0000-0000-0000-000000000001'::uuid,
        u.id,
        'lp_received',
        'license_plate',
        '00000000-0000-0000-0000-000000000030'::uuid,
        'LP-00123',
        'License Plate LP-00123 received at WH-01',
        jsonb_build_object('warehouse', 'WH-01', 'location', 'RCV-01'),
        NOW() - INTERVAL '1 hour'
      FROM public.users u
      WHERE u.org_id = '00000000-0000-0000-0000-000000000001'
      AND u.role = 'admin'
      LIMIT 1;
    END IF;
  END IF;
END $$;
