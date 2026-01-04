-- Migration 082: Create user_invitations table
-- Story: 01.16 - User Invitations (Email)
-- Description: Create table for managing user invitations with secure tokens
-- Author: BACKEND-DEV
-- Date: 2025-12-23

-- Create user_invitations table
CREATE TABLE IF NOT EXISTS user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  token VARCHAR(64) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  invited_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  accepted_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Only one pending invitation per email per org
  CONSTRAINT unique_pending_invitation UNIQUE(org_id, email, status),

  -- Status constraint
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
);

-- Indexes for performance
-- Index for token lookups (public endpoint) - only pending invitations
CREATE INDEX idx_user_invitations_token ON user_invitations(token) WHERE status = 'pending';

-- Index for org listing
CREATE INDEX idx_user_invitations_org_status ON user_invitations(org_id, status);

-- Index for expiry cron job
CREATE INDEX idx_user_invitations_expiry ON user_invitations(expires_at) WHERE status = 'pending';

-- Enable Row Level Security
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Org isolation for SELECT
-- Users can only see invitations for their organization
CREATE POLICY "invitations_org_isolation_select" ON user_invitations
FOR SELECT
USING (org_id = (SELECT org_id FROM users WHERE id = auth.uid()));

-- RLS Policy: Admin/Super Admin can write
-- Only ADMIN and SUPER_ADMIN roles can INSERT, UPDATE, DELETE
CREATE POLICY "invitations_admin_write" ON user_invitations
FOR ALL
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
  AND (
    SELECT r.code FROM roles r
    JOIN users u ON u.role_id = r.id
    WHERE u.id = auth.uid()
  ) IN ('SUPER_ADMIN', 'ADMIN')
);

-- RLS Policy: Public token lookup for invitation acceptance
-- Allow anyone to read pending invitations by token (for accept page)
CREATE POLICY "invitations_public_token_lookup" ON user_invitations
FOR SELECT
USING (status = 'pending');

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_invitations_updated_at
  BEFORE UPDATE ON user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_invitations_updated_at();

-- Comments for documentation
COMMENT ON TABLE user_invitations IS 'Stores user invitation records with secure tokens for email-based onboarding';
COMMENT ON COLUMN user_invitations.token IS 'Secure 64-character hex token for invitation acceptance';
COMMENT ON COLUMN user_invitations.status IS 'Invitation status: pending, accepted, expired, cancelled';
COMMENT ON COLUMN user_invitations.expires_at IS 'Invitation expiry timestamp (7 days from creation)';
