/**
 * Redis Client Configuration
 * Story: 1.5 Warehouse Configuration
 * AC-004.8: Redis caching layer
 *
 * Configures Upstash Redis client for serverless environments
 * with optional fallback when Redis is unavailable.
 */

import { Redis } from '@upstash/redis'

let redisClient: Redis | null = null
let redisAvailable = false

/**
 * Initialize Redis client
 * Returns null if Redis environment variables are not configured
 * This allows the application to work without Redis (cache disabled)
 */
function getRedisClient(): Redis | null {
  // Return cached client if already initialized
  if (redisClient !== null) {
    return redisClient
  }

  // Check if Redis is configured
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!redisUrl || !redisToken) {
    console.warn('Redis not configured. Cache operations will be skipped.')
    redisAvailable = false
    return null
  }

  try {
    // Initialize Redis client with Upstash REST API
    redisClient = new Redis({
      url: redisUrl,
      token: redisToken,
    })

    redisAvailable = true
    console.log('Redis client initialized successfully')

    return redisClient
  } catch (error) {
    console.error('Failed to initialize Redis client:', error)
    redisAvailable = false
    return null
  }
}

/**
 * Get Redis client instance
 * Returns null if Redis is not available
 *
 * @returns Redis client or null
 */
export function getRedis(): Redis | null {
  return getRedisClient()
}

/**
 * Check if Redis is available
 *
 * @returns true if Redis is configured and initialized
 */
export function isRedisAvailable(): boolean {
  getRedisClient() // Ensure client is initialized
  return redisAvailable
}

/**
 * Safely execute a Redis operation with error handling
 * Returns null if Redis is unavailable or operation fails
 *
 * @param operation - Async function that performs Redis operation
 * @returns Result of operation or null
 */
export async function safeRedisOperation<T>(
  operation: (redis: Redis) => Promise<T>
): Promise<T | null> {
  const redis = getRedis()

  if (!redis) {
    return null
  }

  try {
    return await operation(redis)
  } catch (error) {
    console.error('Redis operation failed:', error)
    return null
  }
}
