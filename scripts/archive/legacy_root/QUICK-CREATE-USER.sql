-- QUICK CREATE TEST USER
-- Email: admin@monopilot.com
-- Password: test1234
-- Copy and paste this ENTIRE script into Supabase SQL Editor and run it

-- User ID from Auth (already created): 85c0b1fd-4a73-4a35-a50b-1170ef3d93fc

-- 1. Create organization
INSERT INTO public.organizations (id, name, slug, timezone, locale, currency, is_active, onboarding_completed_at)
VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'MonoPilot Demo',
  'monopilot-demo',
  'Europe/Warsaw',
  'pl',
  'PLN',
  true,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- 2. Create user profile (connects to Auth user)
INSERT INTO public.users (id, org_id, email, first_name, last_name, role_id, language, is_active, last_login_at, created_at, updated_at)
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
  role_id = EXCLUDED.role_id,
  is_active = true;

-- 3. Verify user creation
SELECT
  '✅ USER CREATED!' as status,
  u.email,
  u.first_name || ' ' || u.last_name as name,
  r.name as role,
  o.name as organization,
  u.is_active as active
FROM public.users u
JOIN public.roles r ON u.role_id = r.id
JOIN public.organizations o ON u.org_id = o.id
WHERE u.email = 'admin@monopilot.com';
