/**
 * Rate Limiter - 50 requests per minute per IP
 * 
 * Implements basic in-memory rate limiting for API endpoints.
 * Tracks requests by IP address and enforces 50 req/min limit.
 */

interface RateLimitRecord {
  count: number
  resetTime: number
}

// In-memory store for rate limit tracking
const rateLimitStore = new Map<string, RateLimitRecord>()

// Cleanup interval: run every 2 minutes to remove old records
const CLEANUP_INTERVAL = 2 * 60 * 1000

// Start cleanup interval
if (typeof global !== 'undefined' && !(global as any).__rateLimitCleanupStarted) {
  (global as any).__rateLimitCleanupStarted = true
  
  setInterval(() => {
    const now = Date.now()
    const keysToDelete: string[] = []
    
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetTime < now) {
        keysToDelete.push(key)
      }
    }
    
    keysToDelete.forEach(key => rateLimitStore.delete(key))
  }, CLEANUP_INTERVAL)
}

/**
 * Extract client IP from request headers
 */
export function getClientIp(request: Request): string {
  // Check various headers in order of preference
  const ip =
    (request.headers.get('x-forwarded-for')?.split(',')[0]) ||
    (request.headers.get('x-real-ip')) ||
    (request.headers.get('cf-connecting-ip')) ||
    (request.headers.get('x-client-ip')) ||
    '0.0.0.0'

  return ip.trim()
}

/**
 * Check if request is within rate limit
 * Returns true if request is allowed, false if rate limited
 * 
 * Rate limit: 50 requests per minute per IP
 */
export function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const LIMIT = 50
  const WINDOW_MS = 60 * 1000 // 1 minute

  let record = rateLimitStore.get(ip)

  // If no record exists or window has expired, create new one
  if (!record || record.resetTime < now) {
    rateLimitStore.set(ip, {
      count: 1,
      resetTime: now + WINDOW_MS,
    })
    return true
  }

  // Increment count and check limit
  record.count++

  if (record.count > LIMIT) {
    return false // Rate limited
  }

  return true // Still within limit
}

/**
 * Get current rate limit status for debugging
 */
export function getRateLimitStatus(ip: string): {
  count: number
  limit: number
  remaining: number
  resetTime: number
} {
  const LIMIT = 50
  const record = rateLimitStore.get(ip)
  const now = Date.now()

  if (!record || record.resetTime < now) {
    return {
      count: 0,
      limit: LIMIT,
      remaining: LIMIT,
      resetTime: now + 60 * 1000,
    }
  }

  return {
    count: record.count,
    limit: LIMIT,
    remaining: Math.max(0, LIMIT - record.count),
    resetTime: record.resetTime,
  }
}
