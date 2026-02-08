-- Insert 25 test quality holds to trigger pagination
-- First, get the org_id and admin user_id from existing data

INSERT INTO quality_holds (
  org_id,
  hold_number,
  reason,
  hold_type,
  status,
  priority,
  held_by,
  created_by,
  updated_by,
  held_at
) 
SELECT
  org_id,
  'QH-TEST-' || LPAD((row_number() OVER (ORDER BY id) + 1000)::text, 4, '0') AS hold_number,
  'Test Hold ' || (row_number() OVER (ORDER BY id)) || ' for pagination testing' AS reason,
  CASE (row_number() OVER (ORDER BY id) % 4)
    WHEN 0 THEN 'qa_pending'
    WHEN 1 THEN 'investigation'
    WHEN 2 THEN 'recall'
    ELSE 'quarantine'
  END AS hold_type,
  'active'::text AS status,
  CASE (row_number() OVER (ORDER BY id) % 4)
    WHEN 0 THEN 'critical'
    WHEN 1 THEN 'high'
    WHEN 2 THEN 'medium'
    ELSE 'low'
  END AS priority,
  id AS held_by,
  id AS created_by,
  id AS updated_by,
  NOW() - INTERVAL '1 day' * (row_number() OVER (ORDER BY id)) AS held_at
FROM (
  SELECT DISTINCT
    q.org_id,
    u.id
  FROM quality_holds q
  CROSS JOIN users u
  WHERE u.email = 'admin@monopilot.com'
  LIMIT 1
) base_data
CROSS JOIN generate_series(1, 22) AS gs
LIMIT 22
ON CONFLICT DO NOTHING;

-- Verify insertion
SELECT COUNT(*) as total_holds FROM quality_holds;
