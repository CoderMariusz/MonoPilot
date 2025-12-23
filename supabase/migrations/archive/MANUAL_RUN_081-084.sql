-- ============================================================================
-- MANUAL MIGRATION SCRIPT: 081-084
-- ============================================================================
-- Purpose: Run migrations 081-084 manually when Docker is unavailable
-- Date: 2025-12-23
-- How to run:
--   1. Start Docker Desktop manually
--   2. Run: npx supabase start
--   3. Run: npx supabase db execute -f supabase/migrations/MANUAL_RUN_081-084.sql
-- ============================================================================

-- ============================================================================
-- MIGRATION 081: user_sessions table
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Session identification
  session_token VARCHAR(255) UNIQUE NOT NULL,

  -- Device information
  device_type VARCHAR(50),
  device_name VARCHAR(255),
  ip_address INET,
  user_agent TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,

  -- Revocation tracking
  revoked_by UUID REFERENCES users(id),
  revocation_reason VARCHAR(100)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_org_id ON user_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id) WHERE revoked_at IS NULL;

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_sessions' AND policyname = 'sessions_own_read') THEN
    CREATE POLICY "sessions_own_read" ON user_sessions
    FOR SELECT USING (
      user_id = auth.uid()
      OR (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid()) IN ('SUPER_ADMIN', 'ADMIN')
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_sessions' AND policyname = 'sessions_own_delete') THEN
    CREATE POLICY "sessions_own_delete" ON user_sessions
    FOR UPDATE USING (
      user_id = auth.uid()
      OR (
        org_id = (SELECT org_id FROM users WHERE id = auth.uid())
        AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid()) IN ('SUPER_ADMIN', 'ADMIN')
      )
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_sessions' AND policyname = 'sessions_insert') THEN
    CREATE POLICY "sessions_insert" ON user_sessions
    FOR INSERT WITH CHECK (
      org_id = (SELECT org_id FROM users WHERE id = auth.uid())
    );
  END IF;
END $$;

COMMENT ON TABLE user_sessions IS 'User sessions for multi-device support and session management';

-- ============================================================================
-- MIGRATION 082: password_history table
-- ============================================================================

CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, password_hash)
);

-- Index
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Block ALL user access
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'password_history' AND policyname = 'password_history_none') THEN
    CREATE POLICY "password_history_none" ON password_history FOR ALL USING (false);
  END IF;
END $$;

-- Trigger function
CREATE OR REPLACE FUNCTION maintain_password_history()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM password_history
  WHERE user_id = NEW.user_id
  AND id NOT IN (
    SELECT id FROM password_history
    WHERE user_id = NEW.user_id
    ORDER BY created_at DESC
    LIMIT 5
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS password_history_cleanup ON password_history;
CREATE TRIGGER password_history_cleanup
AFTER INSERT ON password_history
FOR EACH ROW
EXECUTE FUNCTION maintain_password_history();

COMMENT ON TABLE password_history IS 'Password history for preventing reuse (last 5 passwords). Service role only.';

-- ============================================================================
-- MIGRATION 083: session and password fields
-- ============================================================================

-- Add to organizations
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS session_timeout_hours INTEGER DEFAULT 24 CHECK (session_timeout_hours >= 1 AND session_timeout_hours <= 720),
ADD COLUMN IF NOT EXISTS password_expiry_days INTEGER DEFAULT NULL CHECK (password_expiry_days IS NULL OR password_expiry_days >= 30),
ADD COLUMN IF NOT EXISTS enforce_password_history BOOLEAN DEFAULT true;

-- Add to users
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255),
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT false;

-- Comments
COMMENT ON COLUMN organizations.session_timeout_hours IS 'Session timeout in hours (default 24, range 1-720)';
COMMENT ON COLUMN organizations.password_expiry_days IS 'Password expiry in days (NULL = no expiry, minimum 30)';
COMMENT ON COLUMN organizations.enforce_password_history IS 'Enforce password history (cannot reuse last 5 passwords)';
COMMENT ON COLUMN users.password_hash IS 'Bcrypt hashed password (cost factor 12)';
COMMENT ON COLUMN users.password_changed_at IS 'Timestamp of last password change';
COMMENT ON COLUMN users.password_expires_at IS 'Calculated password expiry date';
COMMENT ON COLUMN users.force_password_change IS 'User must change password on next login (set by admin)';

-- ============================================================================
-- MIGRATION 084: user_invitations table
-- ============================================================================

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

  CONSTRAINT unique_pending_invitation UNIQUE(org_id, email, status),
  CONSTRAINT valid_status CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_invitations_token ON user_invitations(token) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_user_invitations_org_status ON user_invitations(org_id, status);
CREATE INDEX IF NOT EXISTS idx_user_invitations_expiry ON user_invitations(expires_at) WHERE status = 'pending';

-- Enable RLS
ALTER TABLE user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_invitations' AND policyname = 'invitations_org_isolation') THEN
    CREATE POLICY "invitations_org_isolation" ON user_invitations
    FOR SELECT USING (
      org_id = (SELECT org_id FROM users WHERE id = auth.uid())
      OR status = 'pending'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_invitations' AND policyname = 'invitations_admin_write') THEN
    CREATE POLICY "invitations_admin_write" ON user_invitations
    FOR ALL USING (
      org_id = (SELECT org_id FROM users WHERE id = auth.uid())
      AND (SELECT r.code FROM roles r JOIN users u ON u.role_id = r.id WHERE u.id = auth.uid()) IN ('SUPER_ADMIN', 'ADMIN')
    );
  END IF;
END $$;

-- Trigger
CREATE OR REPLACE FUNCTION update_user_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_invitations_updated_at ON user_invitations;
CREATE TRIGGER user_invitations_updated_at
  BEFORE UPDATE ON user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_invitations_updated_at();

COMMENT ON TABLE user_invitations IS 'User invitation records with secure 64-char crypto tokens';

-- ============================================================================
-- DONE!
-- ============================================================================

SELECT 'Migrations 081-084 applied successfully!' AS status;
