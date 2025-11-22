import { Redis } from '@upstash/redis'

/**
 * JWT Blacklist Service
 * Story: 1.4 Session Management
 * Task 3: Redis Blacklist - JWT Invalidation (AC-003.2, AC-003.3, AC-003.4)
 *
 * Manages JWT token blacklist in Redis for session termination
 */

// Initialize Redis client (Upstash)
// NOTE: Requires UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN in .env
let redis: Redis | null = null

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  })
} else {
  console.warn(
    '⚠️  Redis not configured. Set UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN for session termination.'
  )
}

/**
 * Add JWT token to blacklist
 *
 * AC-003.2: All JWT tokens added to Redis blacklist (TTL = token expiry)
 * AC-003.3: Terminated session JWT blacklisted
 *
 * @param tokenId - JWT jti claim (unique token identifier)
 * @param expiresAt - Token expiration timestamp (Unix seconds)
 * @returns Success boolean
 *
 * @example
 * await addToBlacklist('abc-123-xyz', 1234567890)
 * // Redis: SET blacklist:abc-123-xyz "1" EX 604800
 */
export async function addToBlacklist(
  tokenId: string,
  expiresAt: number
): Promise<boolean> {
  if (!redis) {
    console.error('Redis not configured, cannot blacklist token')
    return false
  }

  try {
    // Calculate TTL (time until token naturally expires)
    const now = Math.floor(Date.now() / 1000) // Current time in Unix seconds
    const ttl = expiresAt - now

    // If token already expired, no need to blacklist
    if (ttl <= 0) {
      console.log(`Token ${tokenId} already expired, skipping blacklist`)
      return true
    }

    // Add to Redis with TTL
    // Key: blacklist:{tokenId}
    // Value: "1" (boolean flag)
    // TTL: seconds until natural expiry
    await redis.set(`blacklist:${tokenId}`, '1', { ex: ttl })

    console.log(
      `✅ Token ${tokenId} blacklisted for ${ttl}s (${Math.floor(ttl / 86400)} days)`
    )
    return true
  } catch (error) {
    console.error('Failed to blacklist token:', error)
    return false
  }
}

/**
 * Check if JWT token is blacklisted
 *
 * AC-003.4: Blacklisted JWT → 401 on next request
 *
 * @param tokenId - JWT jti claim
 * @returns true if blacklisted, false otherwise
 *
 * @example
 * const isBlacklisted = await isBlacklisted('abc-123-xyz')
 * if (isBlacklisted) {
 *   return new Response('Unauthorized', { status: 401 })
 * }
 */
export async function isBlacklisted(tokenId: string): Promise<boolean> {
  if (!redis) {
    // If Redis not configured, assume not blacklisted (fail open)
    // This allows basic functionality without Redis, but session termination won't work
    return false
  }

  try {
    const value = await redis.get(`blacklist:${tokenId}`)
    return value === '1'
  } catch (error) {
    console.error('Failed to check blacklist:', error)
    // Fail open: assume not blacklisted to avoid blocking legitimate users
    return false
  }
}

/**
 * Remove token from blacklist (manual cleanup, rarely needed)
 *
 * @param tokenId - JWT jti claim
 * @returns Success boolean
 */
export async function removeFromBlacklist(tokenId: string): Promise<boolean> {
  if (!redis) {
    return false
  }

  try {
    await redis.del(`blacklist:${tokenId}`)
    console.log(`Token ${tokenId} removed from blacklist`)
    return true
  } catch (error) {
    console.error('Failed to remove from blacklist:', error)
    return false
  }
}

/**
 * Get blacklist stats (for monitoring/debugging)
 *
 * @returns Blacklist statistics
 */
export async function getBlacklistStats(): Promise<{
  count: number
  keys: string[]
}> {
  if (!redis) {
    return { count: 0, keys: [] }
  }

  try {
    // Scan for blacklist keys (pattern: blacklist:*)
    // Note: SCAN is more efficient than KEYS for production
    const keys = await redis.keys('blacklist:*')
    return {
      count: keys.length,
      keys: keys.slice(0, 10), // Return first 10 for preview
    }
  } catch (error) {
    console.error('Failed to get blacklist stats:', error)
    return { count: 0, keys: [] }
  }
}
