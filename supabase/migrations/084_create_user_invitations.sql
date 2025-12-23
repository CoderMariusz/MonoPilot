-- Migration 084: Create user_invitations table
-- Story: 01.16 - User Invitations (Email)
-- Description: Invitation tracking with 64-char crypto tokens, 7-day expiry, RLS enforcement
-- Date: 2025-12-23

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
CREATE INDEX idx_user_invitations_token ON user_invitations(token) WHERE status = 'pending';
CREATE INDEX idx_user_invitations_org_status ON user_invitations(org_id, status);
CREATE INDEX idx_user_invitations_expiry ON user_invitations(expires_at) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Org isolation for SELECT
CREATE POLICY "invitations_org_isolation" ON user_invitations
FOR SELECT USING (
  org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  OR status = 'pending'  -- Allow public token lookup for pending invitations
);

-- RLS Policy: Admin/Super Admin can write
CREATE POLICY "invitations_admin_write" ON user_invitations
FOR ALL USING (
  org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
  AND EXISTS (
    SELECT 1 FROM users u
    JOIN roles r ON u.role_id = r.id
    WHERE u.id = auth.uid() AND r.code IN ('SUPER_ADMIN', 'ADMIN')
  )
);

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

-- Comments
COMMENT ON TABLE user_invitations IS 'User invitation records with secure 64-char crypto tokens';
COMMENT ON COLUMN user_invitations.token IS 'Secure 64-character hex token (crypto.randomBytes(32))';
COMMENT ON COLUMN user_invitations.status IS 'Invitation status: pending, accepted, expired, cancelled';
COMMENT ON COLUMN user_invitations.expires_at IS 'Invitation expiry (7 days from creation)';
