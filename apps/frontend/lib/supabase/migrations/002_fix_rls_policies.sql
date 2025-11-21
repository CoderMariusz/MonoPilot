-- Migration 002: Fix RLS policies to allow proper access
-- Story: 1.1 Organization Configuration (fix)
-- Date: 2025-11-21
-- Note: Grant service_role proper access and fix RLS policies

-- ============================================================================
-- FIX ORGANIZATIONS TABLE RLS
-- ============================================================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Service role has full access" ON public.organizations;

-- Grant full access to service role (bypasses RLS)
GRANT ALL ON public.organizations TO service_role;
GRANT ALL ON public.organizations TO authenticated;
GRANT ALL ON public.organizations TO anon;

-- Create proper RLS policies
-- Policy 1: Allow service role full access (highest priority)
CREATE POLICY "Service role bypass RLS"
  ON public.organizations
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Authenticated users can view and update
CREATE POLICY "Authenticated full access"
  ON public.organizations
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- FIX USERS TABLE RLS
-- ============================================================================

-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Authenticated users can access users" ON public.users;

-- Grant full access to service role
GRANT ALL ON public.users TO service_role;
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.users TO anon;

-- Create proper RLS policies
-- Policy 1: Allow service role full access
CREATE POLICY "Service role bypass RLS"
  ON public.users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Policy 2: Authenticated users can view and update
CREATE POLICY "Authenticated full access"
  ON public.users
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- VERIFY AND INSERT DATA IF MISSING
-- ============================================================================

-- Ensure default organization exists
INSERT INTO public.organizations (
  id,
  company_name,
  date_format,
  number_format,
  unit_system,
  timezone,
  default_currency,
  default_language
)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Default Organization',
  'DD/MM/YYYY',
  '1,234.56',
  'metric',
  'UTC',
  'EUR',
  'EN'
)
ON CONFLICT (id) DO UPDATE SET
  company_name = EXCLUDED.company_name,
  updated_at = NOW();

-- Link admin users to default organization
INSERT INTO public.users (
  id,
  org_id,
  email,
  first_name,
  last_name,
  role
)
SELECT
  au.id,
  '00000000-0000-0000-0000-000000000001'::uuid,
  au.email,
  COALESCE(au.raw_user_meta_data->>'first_name', 'Admin'),
  COALESCE(au.raw_user_meta_data->>'last_name', 'User'),
  'admin'
FROM auth.users au
WHERE au.email IN ('admin@monopilot.local', 'przyslony@gmail.com')
ON CONFLICT (id) DO UPDATE SET
  org_id = EXCLUDED.org_id,
  role = EXCLUDED.role,
  updated_at = NOW();
