-- Migration 026: Create user_invitations table
-- Story: 01.16 - User Invitations (Email)
-- Description: Invitation tracking with JWT tokens, 7-day expiry, RLS enforcement
-- Date: 2025-12-23

CREATE TABLE IF NOT EXISTS public.user_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  role TEXT NOT NULL, -- Role code string (e.g., 'admin', 'production_operator')
  token TEXT UNIQUE NOT NULL, -- Secure random token (64 hex chars)
  expires_at TIMESTAMPTZ NOT NULL,
  invited_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ DEFAULT NOW() NOT NULL, -- Required by invitation-service.ts
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

  -- Email validation
  CONSTRAINT user_invitations_email_check CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),

  -- Status constraint
  CONSTRAINT user_invitations_status_check CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled'))
);

-- Create partial unique index for one pending invitation per email per org
CREATE UNIQUE INDEX user_invitations_unique_pending_idx 
  ON public.user_invitations(org_id, email) 
  WHERE status = 'pending';

-- Indexes for performance
CREATE INDEX idx_user_invitations_org_id ON public.user_invitations(org_id);
CREATE INDEX idx_user_invitations_email ON public.user_invitations(email);
CREATE INDEX idx_user_invitations_token ON public.user_invitations(token);
CREATE INDEX idx_user_invitations_status ON public.user_invitations(status);
CREATE INDEX idx_user_invitations_expires_at ON public.user_invitations(expires_at);
CREATE INDEX idx_user_invitations_sent_at ON public.user_invitations(sent_at);

-- Enable RLS
ALTER TABLE public.user_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view invitations in their org
CREATE POLICY "invitations_org_select" ON public.user_invitations
FOR SELECT USING (
  org_id IN (SELECT org_id FROM public.users WHERE id = auth.uid())
);

-- RLS Policy: Admins/owners can insert invitations
CREATE POLICY "invitations_admin_insert" ON public.user_invitations
FOR INSERT WITH CHECK (
  org_id IN (
    SELECT u.org_id FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.code IN ('owner', 'admin')
  )
);

-- RLS Policy: Admins/owners can update invitations (resend, revoke)
CREATE POLICY "invitations_admin_update" ON public.user_invitations
FOR UPDATE USING (
  org_id IN (
    SELECT u.org_id FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.code IN ('owner', 'admin')
  )
);

-- RLS Policy: Admins/owners can delete invitations
CREATE POLICY "invitations_admin_delete" ON public.user_invitations
FOR DELETE USING (
  org_id IN (
    SELECT u.org_id FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.id = auth.uid()
    AND r.code IN ('owner', 'admin')
  )
);

-- Trigger: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_invitations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_invitations_updated_at
  BEFORE UPDATE ON public.user_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_user_invitations_updated_at();

-- Comments
COMMENT ON TABLE public.user_invitations IS 'User invitation records with secure random tokens for email-based user onboarding';
COMMENT ON COLUMN public.user_invitations.token IS 'Cryptographically secure 64-char hex token (256-bit entropy)';
COMMENT ON COLUMN public.user_invitations.role IS 'Role code string to assign to user upon acceptance';
COMMENT ON COLUMN public.user_invitations.status IS 'Invitation status: pending, accepted, expired, cancelled';
COMMENT ON COLUMN public.user_invitations.expires_at IS 'Invitation expiry timestamp (7 days from creation)';
COMMENT ON COLUMN public.user_invitations.sent_at IS 'Timestamp when invitation was sent (used for sorting and resend tracking)';
