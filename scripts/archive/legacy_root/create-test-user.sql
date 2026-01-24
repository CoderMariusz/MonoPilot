-- Create Test User: admin@monopilot.com
-- Password: test1234
-- Role: Administrator
-- Organization: MonoPilot Demo

-- This script must be run in Supabase Dashboard SQL Editor

BEGIN;

-- 1. Create test organization
INSERT INTO organizations (id, name, slug, timezone, locale, currency, is_active, onboarding_completed_at)
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

-- 2. Get admin role ID
DO $$
DECLARE
  v_admin_role_id UUID;
  v_user_id UUID;
  v_encrypted_password TEXT;
BEGIN
  -- Get admin role
  SELECT id INTO v_admin_role_id
  FROM roles
  WHERE code = 'admin'
  LIMIT 1;

  -- Generate user ID
  v_user_id := 'b0000000-0000-0000-0000-000000000001'::uuid;

  -- Hash password 'test1234' using crypt (bcrypt)
  -- This uses Supabase's built-in pgcrypt extension
  v_encrypted_password := crypt('test1234', gen_salt('bf', 10));

  -- 3. Create user in auth.users (Supabase Auth)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    v_user_id,
    'authenticated',
    'authenticated',
    'admin@monopilot.com',
    v_encrypted_password,
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"first_name":"Admin","last_name":"User"}'::jsonb,
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) ON CONFLICT (id) DO NOTHING;

  -- 4. Create user profile in public.users
  INSERT INTO users (
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
  ) VALUES (
    v_user_id,
    'a0000000-0000-0000-0000-000000000001'::uuid,
    'admin@monopilot.com',
    'Admin',
    'User',
    v_admin_role_id,
    'pl',
    true,
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO NOTHING;

  -- 5. Create identity for email/password auth
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
    v_user_id,
    format('{"sub":"%s","email":"%s"}', v_user_id, 'admin@monopilot.com')::jsonb,
    'email',
    NOW(),
    NOW(),
    NOW()
  ) ON CONFLICT (provider, user_id) DO NOTHING;

END $$;

COMMIT;

-- Verify user creation
SELECT
  u.email,
  u.first_name,
  u.last_name,
  r.name as role_name,
  o.name as org_name,
  u.is_active
FROM users u
JOIN roles r ON u.role_id = r.id
JOIN organizations o ON u.org_id = o.id
WHERE u.email = 'admin@monopilot.com';

-- Display success message
DO $$
BEGIN
  RAISE NOTICE '✅ Test user created successfully!';
  RAISE NOTICE 'Email: admin@monopilot.com';
  RAISE NOTICE 'Password: test1234';
  RAISE NOTICE 'Role: Administrator';
  RAISE NOTICE 'Organization: MonoPilot Demo';
END $$;
