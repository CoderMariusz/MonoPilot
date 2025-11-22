-- Migration: Create user_invitations table
-- Story: 1.3 User Invitations
-- Description: Invitation tracking with JWT tokens, 7-day expiry, RLS enforcement

-- Create enum for invitation status
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- Create user_invitations table
CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL,
  token TEXT NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status invitation_status NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  accepted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add unique constraint: Only one pending invitation per email per org
CREATE UNIQUE INDEX idx_user_invitations_unique_pending
  ON public.user_invitations (org_id, email, status)
  WHERE status = 'pending';

-- Add indexes for performance
CREATE INDEX idx_user_invitations_org_id ON public.user_invitations (org_id);
CREATE INDEX idx_user_invitations_email ON public.user_invitations (email);
CREATE INDEX idx_user_invitations_status ON public.user_invitations (status);
CREATE INDEX idx_user_invitations_expires_at ON public.user_invitations (expires_at);

-- Create RLS policies
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view invitations for their organization
CREATE POLICY user_invitations_select_policy ON public.user_invitations
  FOR SELECT
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Policy: Admins can insert invitations for their organization
CREATE POLICY user_invitations_insert_policy ON public.user_invitations
  FOR INSERT
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Policy: Admins can update invitations for their organization
CREATE POLICY user_invitations_update_policy ON public.user_invitations
  FOR UPDATE
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
  WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Policy: Admins can delete invitations for their organization
CREATE POLICY user_invitations_delete_policy ON public.user_invitations
  FOR DELETE
  USING (org_id = (auth.jwt() ->> 'org_id')::uuid);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_invitations_updated_at
  BEFORE UPDATE ON public.user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.user_invitations IS 'User invitation tracking with JWT tokens and 7-day expiry (Story 1.3)';
