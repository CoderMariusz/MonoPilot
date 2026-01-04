/**
 * Migration: Password History Table
 * Story: 01.15 - Session & Password Management
 * Purpose: Track password history to prevent reuse of last 5 passwords
 * Security: Service role only (RLS blocks ALL user access)
 */

-- Create password_history table
CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, password_hash)
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_password_history_user_id ON password_history(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Block ALL user access (service role only)
CREATE POLICY "password_history_none" ON password_history
FOR ALL TO authenticated
USING (false);

-- Trigger function to maintain last 5 passwords
CREATE OR REPLACE FUNCTION maintain_password_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Delete oldest passwords if we have more than 5
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

-- Trigger to run after each insert
CREATE TRIGGER maintain_password_history_trigger
AFTER INSERT ON password_history
FOR EACH ROW
EXECUTE FUNCTION maintain_password_history();
