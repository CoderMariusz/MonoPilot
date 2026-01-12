/**
 * Migration: Add Session & Password Management Fields
 * Story: 01.15 - Session & Password Management
 * Purpose: Extend organizations and users tables with session/password config
 */

-- Add fields to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS session_timeout_hours INTEGER DEFAULT 24,
ADD COLUMN IF NOT EXISTS password_expiry_days INTEGER DEFAULT NULL,
ADD COLUMN IF NOT EXISTS enforce_password_history BOOLEAN DEFAULT true;

-- Add fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS password_expires_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS force_password_change BOOLEAN DEFAULT false;

-- Add comment for clarity
COMMENT ON COLUMN organizations.session_timeout_hours IS 'Session timeout in hours (default 24)';
COMMENT ON COLUMN organizations.password_expiry_days IS 'Password expiry in days (NULL = no expiry)';
COMMENT ON COLUMN organizations.enforce_password_history IS 'Enforce password history (last 5 passwords)';
COMMENT ON COLUMN users.password_changed_at IS 'Timestamp of last password change';
COMMENT ON COLUMN users.password_expires_at IS 'Timestamp when password expires (calculated)';
COMMENT ON COLUMN users.force_password_change IS 'User must change password on next login';
