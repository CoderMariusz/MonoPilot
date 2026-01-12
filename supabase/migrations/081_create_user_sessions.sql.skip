/**
 * Migration: User Sessions Table
 * Story: 01.15 - Session & Password Management
 * Purpose: Track user sessions for multi-device support and session management
 * ADR-013: RLS Org Isolation Pattern
 */

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  device_type VARCHAR(50),
  device_name VARCHAR(100),
  browser VARCHAR(50),
  os VARCHAR(50),
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  last_activity_at TIMESTAMPTZ DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES users(id),
  revocation_reason VARCHAR(100)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_org_id ON user_sessions(org_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(user_id, revoked_at) WHERE revoked_at IS NULL;

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (ADR-013 - users lookup pattern)

-- Users can read their own sessions
CREATE POLICY "sessions_own_read" ON user_sessions
FOR SELECT TO authenticated
USING (
  user_id = auth.uid() AND
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- Users can delete (revoke) their own sessions
CREATE POLICY "sessions_own_delete" ON user_sessions
FOR UPDATE TO authenticated
USING (
  user_id = auth.uid() AND
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);

-- Admins can read all sessions in their org
CREATE POLICY "sessions_admin_read" ON user_sessions
FOR SELECT TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
  (SELECT role_code FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
);

-- Admins can delete (revoke) any session in their org
CREATE POLICY "sessions_admin_delete" ON user_sessions
FOR UPDATE TO authenticated
USING (
  org_id = (SELECT org_id FROM users WHERE id = auth.uid()) AND
  (SELECT role_code FROM users WHERE id = auth.uid()) IN ('owner', 'admin')
);

-- Users can insert their own sessions
CREATE POLICY "sessions_insert" ON user_sessions
FOR INSERT TO authenticated
WITH CHECK (
  user_id = auth.uid() AND
  org_id = (SELECT org_id FROM users WHERE id = auth.uid())
);
