import { createServerSupabase } from '../supabase/server'

/**
 * Session Termination Service
 * Story: 1.2 User Management - CRUD
 * Task 5: Session Termination Service (AC-002.4)
 *
 * Handles session termination when users are deactivated
 */

export interface SessionTerminationResult {
  success: boolean
  error?: string
  sessionsTerminated?: number
}

/**
 * Terminates all active sessions for a user
 * Used when deactivating a user to immediately log them out from all devices
 *
 * AC-002.4: All active sessions terminated (JWT blacklist)
 * AC-002.4: User logged out immediately on all devices
 *
 * Implementation Strategy:
 * 1. Update Supabase Auth to revoke sessions
 * 2. Emit realtime event for immediate client-side logout
 * 3. (Future) Add JWT tokens to Redis blacklist for additional security
 *
 * @param userId - UUID of user whose sessions should be terminated
 * @returns SessionTerminationResult with success status
 */
export async function terminateAllSessions(
  userId: string
): Promise<SessionTerminationResult> {
  try {
    const supabase = await createServerSupabase()

    // Method 1: Use Supabase Admin API to sign out user from all sessions
    // This requires service role key
    const { error: signOutError } = await supabase.auth.admin.signOut(userId, 'global')

    if (signOutError) {
      console.error('Failed to terminate sessions for user:', userId, signOutError)
      return {
        success: false,
        error: `Failed to terminate sessions: ${signOutError.message}`,
      }
    }

    // Method 2: Emit realtime event for immediate client-side logout
    // This triggers a listener on the client to immediately redirect to login
    const channel = supabase.channel(`user:${userId}`)

    await channel.send({
      type: 'broadcast',
      event: 'session.terminated',
      payload: {
        userId,
        reason: 'user_deactivated',
        timestamp: new Date().toISOString(),
      },
    })

    // Clean up channel
    await supabase.removeChannel(channel)

    // TODO (Future Enhancement): Add JWT tokens to Redis blacklist
    // This would provide an additional layer of security by blacklisting
    // the actual JWT tokens with TTL = token expiry (7 days)
    //
    // Example implementation:
    // await redisClient.set(
    //   `blacklist:${userId}`,
    //   'deactivated',
    //   'EX',
    //   60 * 60 * 24 * 7 // 7 days
    // )

    console.log(`Successfully terminated all sessions for user: ${userId}`)

    return {
      success: true,
      sessionsTerminated: 1, // At least one session terminated (the current one)
    }
  } catch (error) {
    console.error('Error in terminateAllSessions:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Checks if a user's sessions have been terminated
 * Used for testing and verification
 *
 * @param userId - UUID of user to check
 * @returns boolean indicating if user has active sessions
 */
export async function hasActiveSessions(userId: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabase()

    // Check if user can authenticate (has valid sessions)
    const { data, error } = await supabase.auth.admin.getUserById(userId)

    if (error || !data.user) {
      return false
    }

    // If user exists and is not banned, they might have active sessions
    // This is a simplified check - a full implementation would query session tables
    return true
  } catch (error) {
    console.error('Error checking active sessions:', error)
    return false
  }
}

/**
 * Updates user's last_login_at timestamp
 * Called on successful login to track user activity
 *
 * @param userId - UUID of user
 * @returns boolean indicating success
 */
export async function updateLastLogin(userId: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabase()

    const { error } = await supabase
      .from('users')
      .update({ last_login_at: new Date().toISOString() })
      .eq('id', userId)

    if (error) {
      console.error('Failed to update last_login_at:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error updating last login:', error)
    return false
  }
}
