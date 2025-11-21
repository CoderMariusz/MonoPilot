-- Migration 001: Create minimal users table for Story 1.1 testing
-- Story: 1.1 Organization Configuration (dependency)
-- Date: 2025-11-21
-- Note: This is a minimal version. Full users table will be created in Story 1.2

-- ============================================================================
-- CREATE MINIMAL USERS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY, -- Matches auth.users.id
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  first_name VARCHAR(50),
  last_name VARCHAR(50),
  role VARCHAR(20) NOT NULL DEFAULT 'user',

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,

  -- Constraints
  CONSTRAINT users_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT users_role_check CHECK (role IN ('admin', 'manager', 'operator', 'viewer', 'planner', 'technical', 'purchasing', 'warehouse', 'qc', 'finance'))
);

-- ============================================================================
-- CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_org_id ON public.users(org_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Temporary policy: Allow authenticated users full access
-- Proper RLS policies will be added in Story 1.2
CREATE POLICY "Authenticated users can access users"
  ON public.users
  FOR ALL
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INSERT INITIAL DATA FOR TESTING
-- ============================================================================

-- Create default organization
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
ON CONFLICT (id) DO NOTHING;

-- Link admin user (from seed script) to default organization
-- Note: This assumes the admin user from seed-first-admin.mjs exists
-- If you haven't run the seed script yet, run: pnpm seed:admin
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
WHERE au.email = 'admin@monopilot.local'
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE public.users IS 'Minimal users table for Story 1.1 testing (will be extended in Story 1.2)';
COMMENT ON COLUMN public.users.id IS 'Matches auth.users.id (UUID from Supabase Auth)';
COMMENT ON COLUMN public.users.org_id IS 'Foreign key to organizations table';
COMMENT ON COLUMN public.users.role IS 'User role: admin, manager, operator, viewer, etc.';
