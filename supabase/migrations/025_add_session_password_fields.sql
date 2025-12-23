-- Migration 083: Add session and password management fields
-- Story: 01.15 - Session & Password Management
-- Description: Extend organizations and users tables
-- Date: 2025-12-23

-- Add fields to organizations table
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS session_timeout_hours INTEGER DEFAULT 24 CHECK (session_timeout_hours >= 1 AND session_timeout_hours <= 720),
ADD COLUMN IF NOT EXISTS password_expiry_days INTEGER DEFAULT NULL CHECK (password_expiry_days IS NULL OR password_expiry_days >= 30),
ADD COLUMN IF NOT EXISTS enforce_password_history BOOLEAN DEFAULT true;

-- Add fields to users table
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
