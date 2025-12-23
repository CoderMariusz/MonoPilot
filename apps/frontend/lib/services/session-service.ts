import { createServerSupabase } from '../supabase/server'
import { parseUserAgent } from '../utils/device-info-parser'
import { addToBlacklist } from './jwt-blacklist-service'

/**
 * Session Service
 * Story: 01.15 Session & Password Management
 * Task: Session Service - Core Logic
 *
 * Handles user session CRUD, termination, and activity tracking.
 * Implements multi-device session management with device tracking and timeout configuration.
 */

/**
 * User session record from database
 */
export interface UserSession {
  id: string
  user_id: string
  token_id: string
  device_info: string
  ip_address: string
  location?: string
  login_time: string
  last_activity: string
  is_active: boolean
  logged_out_at?: string
  created_at: string
}

/**
 * Parameters for creating a new session
 */
export interface CreateSessionParams {
  userId: string
  tokenId: string // JWT jti claim
  userAgent: string
  ipAddress: string
  location?: string
}

/**
 * Create new session record on login
 *
 * AC-003.5: Session tracking on login - capture device info, IP, location
 *
 * @param params - Session creation parameters
 * @returns Created session record
 */
export async function createSession(
  params: CreateSessionParams
): Promise<UserSession> {
  const supabase = await createServerSupabase()

  // Parse device info from user agent
  const deviceInfo = parseUserAgent(params.userAgent)

  // Insert session record
  const { data, error } = await supabase
    .from('user_sessions')
    .insert({
      user_id: params.userId,
      token_id: params.tokenId,
      device_info: deviceInfo.formatted,
      ip_address: params.ipAddress,
      location: params.location || null,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create session: ${error.message}`)
  }

  return data as UserSession
}

/**
 * Get all sessions for a user
 *
 * AC-003.1: User views list of active sessions
 *
 * @param userId - User UUID
 * @param includeExpired - Include inactive/logged out sessions
 * @returns Array of sessions sorted by last_activity DESC
 */
export async function getSessions(
  userId: string,
  includeExpired = false
): Promise<UserSession[]> {
  const supabase = await createServerSupabase()

  let query = supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('last_activity', { ascending: false })

  // Filter active sessions only by default
  if (!includeExpired) {
    query = query.eq('is_active', true)
  }

  const { data, error} = await query

  if (error) {
    throw new Error(`Failed to fetch sessions: ${error.message}`)
  }

  return (data || []) as UserSession[]
}

/**
 * Terminate a single session
 *
 * AC-003.3: Admin can terminate any user's session
 * AC-003.8: Individual session termination
 *
 * @param sessionId - Session UUID
 * @param userId - User UUID (for validation)
 * @param tokenExpiry - JWT exp claim (Unix timestamp)
 * @returns Success boolean
 */
export async function terminateSession(
  sessionId: string,
  userId: string,
  tokenExpiry: number
): Promise<boolean> {
  const supabase = await createServerSupabase()

  // Get session to validate and extract token_id
  const { data: session, error: fetchError } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('id', sessionId)
    .eq('user_id', userId)
    .single()

  if (fetchError || !session) {
    throw new Error('Session not found or unauthorized')
  }

  // Update session status
  const { error: updateError } = await supabase
    .from('user_sessions')
    .update({
      is_active: false,
      logged_out_at: new Date().toISOString(),
    })
    .eq('id', sessionId)

  if (updateError) {
    throw new Error(`Failed to terminate session: ${updateError.message}`)
  }

  // Add JWT to blacklist (prevents further API use)
  await addToBlacklist(session.token_id, tokenExpiry)

  // TODO (Task 8): Emit Supabase Realtime event for immediate logout
  // await emitSessionTerminatedEvent(session.token_id)

  return true
}

/**
 * Terminate all sessions except current (or all if no exception specified)
 *
 * AC-003.2: "Logout All Devices" functionality
 * AC-002.4: Terminate all sessions when deactivating user
 *
 * @param userId - User UUID
 * @param exceptTokenId - Current session token ID (keep this one active), optional
 * @param tokenExpiry - JWT exp claim (Unix timestamp), optional (defaults to current time + 1 day)
 * @returns Number of sessions terminated
 * @throws Error if operation fails
 */
export async function terminateAllSessions(
  userId: string,
  exceptTokenId?: string,
  tokenExpiry?: number
): Promise<number> {
  const supabase = await createServerSupabase()

  // Default token expiry to 24 hours from now if not provided
  const expiry = tokenExpiry || Math.floor(Date.now() / 1000) + 86400

  // Build query for active sessions
  let query = supabase
    .from('user_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)

  // If exceptTokenId provided, exclude it from termination
  if (exceptTokenId) {
    query = query.neq('token_id', exceptTokenId)
  }

  const { data: sessions, error: fetchError } = await query

  if (fetchError) {
    throw new Error(`Failed to fetch sessions: ${fetchError.message}`)
  }

  if (!sessions || sessions.length === 0) {
    return 0
  }

  // Terminate each session
  for (const session of sessions) {
    await terminateSession(session.id, userId, expiry)
  }

  return sessions.length
}

/**
 * Update last activity timestamp for session
 *
 * AC-003.1: Last Activity column shows last API request time
 *
 * @param tokenId - JWT jti claim
 * @returns Success boolean
 */
export async function updateLastActivity(tokenId: string): Promise<boolean> {
  const supabase = await createServerSupabase()

  const { error } = await supabase
    .from('user_sessions')
    .update({ last_activity: new Date().toISOString() })
    .eq('token_id', tokenId)
    .eq('is_active', true)

  if (error) {
    // Silently fail - this is not critical
    // Session might not exist yet (race condition on first request after login)
    return false
  }

  return true
}

/**
 * Handle normal logout (user initiated)
 *
 * AC-003.6: Session cleanup on logout - mark inactive, no blacklist
 *
 * @param tokenId - JWT jti claim
 * @returns Success boolean
 */
export async function logout(tokenId: string): Promise<boolean> {
  const supabase = await createServerSupabase()

  const { error } = await supabase
    .from('user_sessions')
    .update({
      is_active: false,
      logged_out_at: new Date().toISOString(),
    })
    .eq('token_id', tokenId)

  if (error) {
    console.error('Failed to mark session as logged out:', error)
    return false
  }

  // Note: JWT not blacklisted on normal logout (natural expiry after 7 days)
  // Only blacklist on forced termination ("Logout All Devices")
  return true
}

/**
 * Get session by token ID
 *
 * @param tokenId - JWT jti claim
 * @returns Session or null
 */
export async function getSessionByTokenId(
  tokenId: string
): Promise<UserSession | null> {
  const supabase = await createServerSupabase()

  const { data, error } = await supabase
    .from('user_sessions')
    .select('*')
    .eq('token_id', tokenId)
    .single()

  if (error) {
    return null
  }

  return data as UserSession
}
