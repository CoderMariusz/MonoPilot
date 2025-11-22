-- Migration 005: Upgrade users table from minimal to full version
-- Story: 1.2 User Management - CRUD
-- Date: 2025-11-22
-- Purpose: Add missing columns to users table (status, created_by, updated_by, last_login_at)

-- ============================================================================
-- ADD MISSING COLUMNS
-- ============================================================================

-- Add status column (invited, active, inactive)
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'active';

-- Add audit columns
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id);

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.users(id);

-- ============================================================================
-- ADD CONSTRAINTS
-- ============================================================================

-- Drop old constraint if exists and add new one with status check
DO $$
BEGIN
  -- Drop existing constraint if it exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_status_check'
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT users_status_check;
  END IF;

  -- Add new constraint
  ALTER TABLE public.users
  ADD CONSTRAINT users_status_check CHECK (status IN ('invited', 'active', 'inactive'));
END $$;

-- ============================================================================
-- CREATE INDEXES FOR NEW COLUMNS
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);
CREATE INDEX IF NOT EXISTS idx_users_org_status ON public.users(org_id, status);
CREATE INDEX IF NOT EXISTS idx_users_created_by ON public.users(created_by);

-- ============================================================================
-- UPDATE EXISTING DATA
-- ============================================================================

-- Set status to 'active' for all existing users (they're already in the system)
UPDATE public.users
SET status = 'active'
WHERE status IS NULL OR status = '';

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.users.status IS 'User status lifecycle: invited → active → inactive';
COMMENT ON COLUMN public.users.last_login_at IS 'Timestamp of last successful login';
COMMENT ON COLUMN public.users.created_by IS 'User ID who created this record (audit trail)';
COMMENT ON COLUMN public.users.updated_by IS 'User ID who last updated this record (audit trail)';
