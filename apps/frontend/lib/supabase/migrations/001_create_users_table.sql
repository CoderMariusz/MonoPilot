-- Create users table for user profiles
-- This table stores user profile information linked to Supabase Auth users

CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'Operator',
  status TEXT NOT NULL DEFAULT 'active',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT users_role_check CHECK (role IN ('Admin', 'Manager', 'Operator', 'Viewer', 'Planner', 'Technical', 'Purchasing', 'Warehouse', 'QC')),
  CONSTRAINT users_status_check CHECK (status IN ('active', 'inactive', 'suspended'))
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON public.users
  FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile (except role and status)
CREATE POLICY "Users can update own profile"
  ON public.users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Service role can do everything (for admin operations)
CREATE POLICY "Service role can manage all users"
  ON public.users
  FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- Updated at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Grant permissions
GRANT SELECT ON public.users TO authenticated;
GRANT UPDATE (name, last_login) ON public.users TO authenticated;
GRANT ALL ON public.users TO service_role;

-- Comments
COMMENT ON TABLE public.users IS 'User profiles linked to Supabase Auth users';
COMMENT ON COLUMN public.users.id IS 'User ID from auth.users';
COMMENT ON COLUMN public.users.email IS 'User email address';
COMMENT ON COLUMN public.users.name IS 'User full name';
COMMENT ON COLUMN public.users.role IS 'User role for RBAC';
COMMENT ON COLUMN public.users.status IS 'User account status';
