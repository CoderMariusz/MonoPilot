import { createClient } from '@/lib/supabase/client'
import type { Session, AuthError } from '@supabase/supabase-js'

export interface AuthResult {
  session: Session | null
  error: AuthError | null
}

/**
 * Sign in via server-side API endpoint
 * Uses POST to /api/auth/login which sets cookies server-side
 * This ensures cookies are in request headers when router.push() fires
 * Fixes race condition: client-side signIn returns before cookies reach headers
 * @param email - User email
 * @param password - User password
 */
export async function signInViaAPI(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include' // IMPORTANT: Include cookies in request
    })

    if (!response.ok) {
      const error = await response.json()
      return {
        session: null,
        error: {
          message: error.error || error.message || 'Login failed',
          status: response.status,
        } as AuthError
      }
    }

    // Server already set cookies via Set-Cookie headers
    // Cookies will be automatically included in next request
    return { session: null, error: null }
  } catch (error) {
    return {
      session: null,
      error: {
        message: error instanceof Error ? error.message : 'Network error',
      } as AuthError
    }
  }
}

/**
 * Sign in with email and password
 * @param email - User email
 * @param password - User password
 * @param rememberMe - Extend session to 30 days if true
 */
export async function signIn(
  email: string,
  password: string,
  rememberMe?: boolean
): Promise<AuthResult> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { session: null, error: mapAuthError(error) }
  }

  // Note: "Remember me" session extension would be handled via Supabase Auth settings
  // For now, we return the standard session

  return { session: data.session, error: null }
}

/**
 * Sign out current user
 * Clears session and redirects to login
 */
export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()

  // Redirect to login
  window.location.href = '/login'
}

/**
 * Sign out from all devices
 * Terminates all sessions for the user
 */
export async function signOutAllDevices(): Promise<{ error: AuthError | null }> {
  const supabase = createClient()

  // Sign out globally (invalidates all refresh tokens)
  const { error } = await supabase.auth.signOut({ scope: 'global' })

  if (error) {
    return { error: mapAuthError(error) }
  }

  // Redirect to login
  window.location.href = '/login'

  return { error: null }
}

/**
 * Send password reset email
 * @param email - User email
 */
export async function resetPassword(
  email: string
): Promise<{ error: AuthError | null }> {
  const supabase = createClient()

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  })

  if (error) {
    return { error: mapAuthError(error) }
  }

  return { error: null }
}

/**
 * Update password with reset token
 * @param newPassword - New password
 */
export async function updatePassword(
  newPassword: string
): Promise<{ error: AuthError | null }> {
  const supabase = createClient()

  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  })

  if (error) {
    return { error: mapAuthError(error) }
  }

  return { error: null }
}

/**
 * Sign up new user
 *
 * NOTE: This function is reserved for Story 1.3 (User Invitations).
 * MonoPilot is an invitation-only system - there is no public /signup page.
 * Users will be invited via email invitation flow (Story 1.3).
 *
 * @param email - User email
 * @param password - User password
 * @param firstName - User first name
 * @param lastName - User last name
 */
export async function signUp(
  email: string,
  password: string,
  firstName: string,
  lastName: string
): Promise<AuthResult> {
  const supabase = createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        first_name: firstName,
        last_name: lastName,
      },
    },
  })

  if (error) {
    return { session: null, error: mapAuthError(error) }
  }

  return { session: data.session, error: null }
}

/**
 * Map Supabase auth errors to user-friendly messages
 */
function mapAuthError(error: AuthError): AuthError {
  const errorMessages: Record<string, string> = {
    'Invalid login credentials': 'Invalid email or password',
    'Email not confirmed': 'Please confirm your email address',
    'User already registered': 'An account with this email already exists',
    'Password should be at least 8 characters':
      'Password must be at least 8 characters',
  }

  const message = errorMessages[error.message] || error.message

  // Return modified error object with user-friendly message
  error.message = message
  return error
}
