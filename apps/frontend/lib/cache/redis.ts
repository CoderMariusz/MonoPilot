/**
 * Redis Cache Functions
 * Story: 07.15 - Shipping Dashboard + KPIs
 * 
 * Wrapper functions for cache operations.
 * Falls back to in-memory cache when Redis is not available.
 */

import { getRedis, safeRedisOperation } from './redis-client'

const CACHE_TTL = 60 // Default TTL in seconds

/**
 * Get a value from cache
 */
export async function getCache<T>(key: string): Promise<T | null> {
  return safeRedisOperation<T>(async (redis) => {
    const value = await redis.get<T>(key)
    return value
  })
}

/**
 * Set a value in cache
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number = CACHE_TTL
): Promise<void> {
  await safeRedisOperation(async (redis) => {
    await redis.set(key, value, { ex: ttlSeconds })
  })
}

/**
 * Delete a value from cache
 */
export async function deleteCache(key: string): Promise<void> {
  await safeRedisOperation(async (redis) => {
    await redis.del(key)
  })
}
