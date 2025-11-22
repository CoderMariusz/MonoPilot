-- Migration: Create user_sessions table
-- Story: 1.4 Session Management
-- Description: Track user login sessions with device info, IP, and last activity

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  token_id VARCHAR(255) NOT NULL UNIQUE,  -- JWT jti claim
  device_info TEXT,  -- Parsed from user agent: "Chrome 120 on Windows 10 (Desktop)"
  ip_address VARCHAR(45),  -- IPv4 or IPv6
  location VARCHAR(255),  -- City, Country from GeoIP (optional)
  login_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  is_active BOOLEAN NOT NULL DEFAULT true,
  logged_out_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX idx_user_sessions_user_id ON public.user_sessions (user_id);
CREATE INDEX idx_user_sessions_token_id ON public.user_sessions (token_id);
CREATE INDEX idx_user_sessions_is_active ON public.user_sessions (is_active);
CREATE INDEX idx_user_sessions_last_activity ON public.user_sessions (last_activity);

-- Composite index for common query pattern (user's active sessions)
CREATE INDEX idx_user_sessions_user_active ON public.user_sessions (user_id, is_active) WHERE is_active = true;

-- Check constraint: logged_out_at should be NULL if is_active = true
ALTER TABLE public.user_sessions ADD CONSTRAINT check_active_not_logged_out
  CHECK (is_active = false OR logged_out_at IS NULL);

-- NO RLS needed - access control handled in API layer
-- Sessions are user-specific, not org-specific
-- RLS would add unnecessary complexity for JWT-based auth

-- Add comment
COMMENT ON TABLE public.user_sessions IS 'User login sessions tracking with device info, IP, and last activity (Story 1.4)';
COMMENT ON COLUMN public.user_sessions.token_id IS 'JWT jti claim - unique token identifier for blacklist lookup';
COMMENT ON COLUMN public.user_sessions.device_info IS 'Parsed user agent: browser, OS, device type';
COMMENT ON COLUMN public.user_sessions.location IS 'City, Country from GeoIP (optional, skip for MVP)';
COMMENT ON COLUMN public.user_sessions.is_active IS 'true = active session, false = terminated/logged out';
COMMENT ON COLUMN public.user_sessions.last_activity IS 'Updated on each API request via middleware';
