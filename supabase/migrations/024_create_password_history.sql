-- Migration 082: Create password_history table
-- Story: 01.15 - Session & Password Management
-- Description: Track password history to prevent reuse of last 5 passwords
-- Security: Service role only (RLS blocks ALL user access)
-- Date: 2025-12-23

CREATE TABLE IF NOT EXISTS password_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  UNIQUE(user_id, password_hash)
);

-- Index for lookup
CREATE INDEX idx_password_history_user_id ON password_history(user_id, created_at DESC);

-- Enable RLS
ALTER TABLE password_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Block ALL user access (service role only)
CREATE POLICY "password_history_none" ON password_history
FOR ALL USING (false);

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
CREATE TRIGGER password_history_cleanup
AFTER INSERT ON password_history
FOR EACH ROW
EXECUTE FUNCTION maintain_password_history();

-- Comments
COMMENT ON TABLE password_history IS 'Password history for preventing reuse (last 5 passwords). Service role only.';
COMMENT ON COLUMN password_history.password_hash IS 'Bcrypt hashed password (cost factor 12)';
