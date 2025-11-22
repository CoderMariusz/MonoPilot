-- Migration 015: Auto-activate users via Database Trigger
-- Story: 1.14 Epic Polish & Cleanup
-- AC: AC-1.4 (Signup Status Automation)
--
-- Purpose: Automatically activate users when they signup via invitation link
-- Replaces: Vercel webhook ($20/month) with FREE database trigger
--
-- Flow:
-- 1. User completes signup via /signup?token=xxx
-- 2. Supabase Auth creates record in auth.users with invitation_token in metadata
-- 3. Trigger fires on INSERT to auth.users
-- 4. Trigger validates invitation token
-- 5. Trigger updates public.users.status = 'active'
-- 6. Trigger updates public.user_invitations.status = 'accepted'

-- ============================================
-- Function: Auto-activate user after signup
-- ============================================
CREATE OR REPLACE FUNCTION auto_activate_invited_user()
RETURNS TRIGGER AS $$
DECLARE
  invitation_token TEXT;
  invitation_record RECORD;
  public_user_id UUID;
BEGIN
  -- 1. Extract invitation_token from user metadata
  -- When user signs up, invitation_token is stored in raw_user_meta_data
  invitation_token := NEW.raw_user_meta_data->>'invitation_token';

  -- If no invitation token, this is a direct signup (skip activation)
  IF invitation_token IS NULL OR invitation_token = '' THEN
    RAISE LOG 'No invitation token for user %, skipping auto-activation', NEW.email;
    RETURN NEW;
  END IF;

  RAISE LOG 'Processing auto-activation for user % with token %', NEW.email, invitation_token;

  -- 2. Find invitation by token
  SELECT * INTO invitation_record
  FROM public.user_invitations
  WHERE token = invitation_token
    AND status = 'pending'
    AND expires_at > NOW();

  IF NOT FOUND THEN
    RAISE WARNING 'Invitation not found or expired for token % (user %)', invitation_token, NEW.email;
    RETURN NEW;
  END IF;

  RAISE LOG 'Found invitation % for email %', invitation_record.id, invitation_record.email;

  -- 3. Verify email matches invitation
  IF invitation_record.email != NEW.email THEN
    RAISE WARNING 'Email mismatch: invitation.email=% vs auth.user.email=%', invitation_record.email, NEW.email;
    RETURN NEW;
  END IF;

  -- 4. Find the corresponding user in public.users table
  -- The user should have been created by Supabase Auth trigger
  SELECT id INTO public_user_id
  FROM public.users
  WHERE email = NEW.email
    AND org_id = invitation_record.org_id;

  IF NOT FOUND THEN
    RAISE WARNING 'User not found in public.users table for email % (org_id=%)', NEW.email, invitation_record.org_id;
    RETURN NEW;
  END IF;

  -- 5. Activate user in public.users table
  UPDATE public.users
  SET
    status = 'active',
    updated_at = NOW()
  WHERE id = public_user_id;

  RAISE LOG 'Activated user % (status=active)', public_user_id;

  -- 6. Mark invitation as accepted
  UPDATE public.user_invitations
  SET
    status = 'accepted',
    accepted_at = NOW(),
    updated_at = NOW()
  WHERE id = invitation_record.id;

  RAISE LOG 'Marked invitation % as accepted', invitation_record.id;

  -- 7. Log activity (optional, requires activity_logs table)
  BEGIN
    INSERT INTO public.activity_logs (
      org_id,
      user_id,
      action,
      entity_type,
      entity_id,
      details,
      created_at
    ) VALUES (
      invitation_record.org_id,
      public_user_id,
      'user_activated',
      'user',
      public_user_id,
      jsonb_build_object(
        'email', NEW.email,
        'invitation_id', invitation_record.id,
        'activation_method', 'auto_trigger'
      ),
      NOW()
    );
  EXCEPTION WHEN OTHERS THEN
    RAISE LOG 'Failed to log activity: %', SQLERRM;
    -- Don't fail the trigger if logging fails
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Trigger: Execute after auth.users INSERT
-- ============================================

-- Drop trigger if exists (for re-running migration)
DROP TRIGGER IF EXISTS trigger_auto_activate_user ON auth.users;

-- Create trigger on auth.users table
CREATE TRIGGER trigger_auto_activate_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION auto_activate_invited_user();

-- ============================================
-- Verification Query
-- ============================================
-- Run this to verify trigger is installed:
-- SELECT
--   trigger_name,
--   event_manipulation,
--   event_object_table,
--   action_statement
-- FROM information_schema.triggers
-- WHERE trigger_name = 'trigger_auto_activate_user';

-- ============================================
-- Test Case (manual testing)
-- ============================================
-- 1. Create invitation:
--    POST /api/settings/users { email, role }
--
-- 2. User signs up:
--    Navigate to /signup?token=xxx&email=test@example.com
--    Complete signup form
--
-- 3. Verify activation:
--    SELECT status FROM public.users WHERE email = 'test@example.com';
--    -- Expected: 'active'
--
--    SELECT status, accepted_at FROM public.user_invitations WHERE token = 'xxx';
--    -- Expected: status='accepted', accepted_at IS NOT NULL

-- ============================================
-- Rollback (if needed)
-- ============================================
-- DROP TRIGGER IF EXISTS trigger_auto_activate_user ON auth.users;
-- DROP FUNCTION IF EXISTS auto_activate_invited_user();
