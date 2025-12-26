-- Simple test user creation (run with service_role privileges)

-- 1. Create organization (bypass RLS)
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
) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- 2. Create auth user (email: admin@monopilot.com, password: test1234)
-- Using Supabase auth.users table
INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  confirmation_sent_at,
  recovery_sent_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  created_at,
  updated_at,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000'::uuid,
  'b0000000-0000-0000-0000-000000000001'::uuid,
  'authenticated',
  'authenticated',
  'admin@monopilot.com',
  crypt('test1234', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{}',
  false,
  NOW(),
  NOW(),
  '',
  '',
  '',
  ''
) ON CONFLICT (id) DO UPDATE SET 
  email = EXCLUDED.email,
  encrypted_password = EXCLUDED.encrypted_password;

-- 3. Create identity
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'b0000000-0000-0000-0000-000000000001'::uuid,
  '{"sub":"b0000000-0000-0000-0000-000000000001","email":"admin@monopilot.com"}'::jsonb,
  'email',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (provider, user_id) DO NOTHING;

-- 4. Create user profile (get admin role dynamically)
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
  'b0000000-0000-0000-0000-000000000001'::uuid,
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
  is_active = EXCLUDED.is_active;

-- Verify
SELECT 
  u.email,
  u.first_name || ' ' || u.last_name as name,
  r.name as role,
  o.name as organization,
  u.is_active
FROM public.users u
JOIN public.roles r ON u.role_id = r.id
JOIN public.organizations o ON u.org_id = o.id
WHERE u.email = 'admin@monopilot.com';
