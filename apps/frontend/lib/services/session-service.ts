/**
 * Session Service
 * Story: 01.15 - Session & Password Management
 *
 * Manages user sessions for multi-device support and session tracking.
 * Provides methods for session creation, validation, termination, and activity tracking.
 *
 * **Architecture:** Service layer accepts Supabase client as parameter to support
 * both server-side (API routes) and client-side usage.
 *
 * **Security:** Session tokens are cryptographically secure (32+ bytes).
 * All methods validate org_id and enforce multi-tenant isolation (ADR-013).
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { UAParser } from 'ua-parser-js'
import type { Session, DeviceInfo, SessionValidation } from '@/lib/types/session'

/**
 * Generate cryptographically secure session token (32 bytes = 64 hex chars)
 */
function generateSessionToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

/**
 * Parse user agent string to extract device/browser/OS info
 */
export function parseUserAgent(userAgent: string, ipAddress: string | null): DeviceInfo {
  const parser = new UAParser(userAgent)
  const result = parser.getResult()

  // Determine device type
  let deviceType: string | null = null
  if (result.device.type === 'mobile') deviceType = 'Mobile'
  else if (result.device.type === 'tablet') deviceType = 'Tablet'
  else if (result.device.type) deviceType = result.device.type
  else if (userAgent.toLowerCase().includes('mobile')) deviceType = 'Mobile'
  else deviceType = 'Desktop'

  // Build device name
  const deviceName = result.device.vendor && result.device.model
    ? `${result.device.vendor} ${result.device.model}`
    : result.device.model || result.os.name || 'Unknown Device'

  return {
    device_type: deviceType,
    device_name: deviceName,
    browser: result.browser.name || null,
    os: result.os.name || null,
    ip_address: ipAddress,
    user_agent: userAgent,
  }
}

/**
 * Check if session is expired
 */
export function isSessionExpired(session: Session): boolean {
  return new Date(session.expires_at) < new Date()
}

/**
 * Create a new session for a user
 */
export async function createSession(
  supabase: SupabaseClient,
  userId: string,
  orgId: string,
  deviceInfo: DeviceInfo,
  timeoutHours?: number
): Promise<Session> {
  // Get org timeout if not provided
  let timeout = timeoutHours || 24
  if (!timeoutHours) {
    const { data: org } = await supabase
      .from('organizations')
      .select('session_timeout_hours')
      .eq('id', orgId)
      .single()

    if (org?.session_timeout_hours) {
      timeout = org.session_timeout_hours
    }
  }

  const sessionToken = generateSessionToken()
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + timeout)

  const { data, error } = await supabase
    .from('user_sessions')
    .insert({
      user_id: userId,
      org_id: orgId,
      session_token: sessionToken,
      device_type: deviceInfo.device_type,
      device_name: deviceInfo.device_name,
      browser: deviceInfo.browser,
      os: deviceInfo.os,
      ip_address: deviceInfo.ip_address,
      user_agent: deviceInfo.user_agent,
      expires_at: expiresAt.toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  return data as Session
}

/**
 * Get session by token
 */
export async function getSession(
  supabase: SupabaseClient,
  sessionToken: string
): Promise<Session | null> {
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .maybeSingle()

  if (error) throw error
  return data as Session | null
}

/**
 * Get all sessions for a user
 */
export async function getSessions(
  supabase: SupabaseClient,
  userId: string
): Promise<Session[]> {
  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .is('revoked_at', null)
    .order('last_activity_at', { ascending: false })

  if (error) throw error
  return (data as Session[]) || []
}

/**
 * Get current session (same as getSession but with validation)
 */
export async function getCurrentSession(
  supabase: SupabaseClient,
  sessionToken: string
): Promise<Session | null> {
  const validation = await validateSession(supabase, sessionToken)
  return validation.valid ? validation.session : null
}

/**
 * Validate session (check if active and not expired/revoked)
 */
export async function validateSession(
  supabase: SupabaseClient,
  sessionToken: string
): Promise<SessionValidation> {
  const session = await getSession(supabase, sessionToken)

  if (!session) {
    return { valid: false, session: null, reason: 'not_found' }
  }

  if (session.revoked_at) {
    return { valid: false, session, reason: 'revoked' }
  }

  if (isSessionExpired(session)) {
    return { valid: false, session, reason: 'expired' }
  }

  return { valid: true, session }
}

/**
 * Terminate a single session
 */
export async function terminateSession(
  supabase: SupabaseClient,
  sessionId: string,
  reason?: string,
  revokedBy?: string
): Promise<void> {
  const { error } = await supabase
    .from('user_sessions')
    .update({
      revoked_at: new Date().toISOString(),
      revoked_by: revokedBy || null,
      revocation_reason: reason || 'user_logout',
    })
    .eq('id', sessionId)

  if (error) throw error
}

/**
 * Terminate all sessions for a user (except optionally one)
 */
export async function terminateAllSessions(
  supabase: SupabaseClient,
  userId: string,
  exceptCurrent?: string
): Promise<number> {
  const query = supabase
    .from('user_sessions')
    .update({
      revoked_at: new Date().toISOString(),
      revocation_reason: exceptCurrent ? 'password_change' : 'logout_all',
    })
    .eq('user_id', userId)
    .is('revoked_at', null)

  if (exceptCurrent) {
    query.neq('id', exceptCurrent)
  }

  const { data, error } = await query.select('id')

  if (error) throw error
  return data?.length || 0
}

/**
 * Update last activity timestamp for a session
 */
export async function updateLastActivity(
  supabase: SupabaseClient,
  sessionId: string
): Promise<void> {
  const { error } = await supabase
    .from('user_sessions')
    .update({
      last_activity_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (error) throw error
}
