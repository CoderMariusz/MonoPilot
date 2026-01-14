-- Migration: Create user_org_context view
-- Purpose: Convenience view for getting user's org_id and role_code in API routes
-- Used by: /api/v1/settings/dashboard/stats and other endpoints

-- Create view that joins users with roles to get org context
CREATE OR REPLACE VIEW user_org_context AS
SELECT
  u.id AS user_id,
  u.org_id,
  r.code AS role_code
FROM users u
LEFT JOIN roles r ON u.role_id = r.id;

-- Grant access to authenticated users
GRANT SELECT ON user_org_context TO authenticated;

-- Comment
COMMENT ON VIEW user_org_context IS 'Convenience view for getting user org_id and role_code';
