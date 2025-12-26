-- Migration: Create test user admin@monopilot.com
-- This bypasses RLS by running as database owner
-- Password: test1234
-- User ID from Auth: 85c0b1fd-4a73-4a35-a50b-1170ef3d93fc

-- 1. Create organization (bypassing RLS)
INSERT INTO public.organizations (
  id,
  name,
  slug,
  timezone,
  locale,
  currency,
  is_active,
  onboarding_completed_at,
  created_at,
  updated_at
)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'MonoPilot Demo',
  'monopilot-demo',
  'Europe/Warsaw',
  'pl',
  'PLN',
  true,
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  is_active = EXCLUDED.is_active,
  onboarding_completed_at = EXCLUDED.onboarding_completed_at;

-- 2. Create user profile (connecting to existing Auth user)
INSERT INTO public.users (
  id,
  org_id,
  email,
  first_name,
  last_name,
  role_id,
  language,
  is_active,
  last_login_at,
  created_at,
  updated_at
)
SELECT
  '85c0b1fd-4a73-4a35-a50b-1170ef3d93fc'::uuid,
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'admin@monopilot.com',
  'Admin',
  'User',
  r.id,
  'pl',
  true,
  NOW(),
  NOW(),
  NOW()
FROM public.roles r
WHERE r.code = 'admin'
LIMIT 1
ON CONFLICT (id) DO UPDATE SET
  org_id = EXCLUDED.org_id,
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  role_id = EXCLUDED.role_id,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 3. Verify creation
DO $$
DECLARE
  v_user_count INT;
  v_org_count INT;
BEGIN
  SELECT COUNT(*) INTO v_user_count FROM public.users WHERE email = 'admin@monopilot.com';
  SELECT COUNT(*) INTO v_org_count FROM public.organizations WHERE id = 'a0000000-0000-0000-0000-000000000001';

  IF v_user_count > 0 AND v_org_count > 0 THEN
    RAISE NOTICE '✅ Test user created successfully!';
    RAISE NOTICE 'Email: admin@monopilot.com';
    RAISE NOTICE 'Password: test1234';
    RAISE NOTICE 'Organization: MonoPilot Demo';
  ELSE
    RAISE EXCEPTION 'Failed to create test user!';
  END IF;
END $$;
