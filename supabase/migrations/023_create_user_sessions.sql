-- Migration 081: Create user_sessions table
-- Story: 01.15 - Session & Password Management
-- Description: Track user sessions for multi-device support
-- Date: 2025-12-23

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

-- Indexes for performance
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_org_id ON user_sessions(org_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_active ON user_sessions(user_id) WHERE revoked_at IS NULL;

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can read their own sessions
CREATE POLICY "sessions_own_read" ON user_sessions
FOR SELECT USING (
  user_id = auth.uid()
  OR (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.code IN ('SUPER_ADMIN', 'ADMIN')
    )
  )
);

-- RLS Policy: Users can delete (revoke) their own sessions
CREATE POLICY "sessions_own_delete" ON user_sessions
FOR UPDATE USING (
  user_id = auth.uid()
  OR (
    org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM users u
      JOIN roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.code IN ('SUPER_ADMIN', 'ADMIN')
    )
  )
);

-- RLS Policy: Users can insert their own sessions
CREATE POLICY "sessions_insert" ON user_sessions
FOR INSERT WITH CHECK (
  org_id IN (SELECT org_id FROM users WHERE id = auth.uid())
);

-- Comments
COMMENT ON TABLE user_sessions IS 'User sessions for multi-device support and session management';
COMMENT ON COLUMN user_sessions.session_token IS 'Cryptographically secure session token (64-char hex)';
COMMENT ON COLUMN user_sessions.revocation_reason IS 'Reason for session termination: user_logout, admin_terminate, password_change, timeout';
