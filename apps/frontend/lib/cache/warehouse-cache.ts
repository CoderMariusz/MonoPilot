/**
 * Warehouse Cache Operations
 * Story: 1.5 Warehouse Configuration
 * AC-004.8: Redis caching layer
 *
 * Implements warehouse caching with:
 * - Cache key pattern: warehouses:{org_id}
 * - 5-minute TTL (300 seconds)
 * - Graceful fallback when Redis unavailable
 */

import { safeRedisOperation, isRedisAvailable } from './redis-client'
import { type Warehouse } from '@/lib/validation/warehouse-schemas'

/**
 * Cache TTL in seconds (5 minutes)
 */
const CACHE_TTL = 300

/**
 * Generate cache key for warehouse list
 * Pattern: warehouses:{org_id}
 *
 * @param orgId - Organization UUID
 * @returns Cache key string
 */
function getWarehouseCacheKey(orgId: string): string {
  return `warehouses:${orgId}`
}

/**
 * Get cached warehouses for an organization
 * AC-004.8: Cache warehouse list on GET /api/settings/warehouses
 *
 * @param orgId - Organization UUID
 * @returns Cached warehouse array or null if cache miss/unavailable
 */
export async function getCachedWarehouses(
  orgId: string
): Promise<Warehouse[] | null> {
  if (!isRedisAvailable()) {
    console.log('Redis not available, skipping cache read')
    return null
  }

  const cacheKey = getWarehouseCacheKey(orgId)

  const result = await safeRedisOperation(async (redis) => {
    const cached = await redis.get<Warehouse[]>(cacheKey)
    return cached
  })

  if (result) {
    console.log(`Cache HIT for warehouses:${orgId}`)
  } else {
    console.log(`Cache MISS for warehouses:${orgId}`)
  }

  return result
}

/**
 * Set cached warehouses for an organization
 * AC-004.8: Set 5-min TTL on cached data
 *
 * @param orgId - Organization UUID
 * @param data - Warehouse array to cache
 */
export async function setCachedWarehouses(
  orgId: string,
  data: Warehouse[]
): Promise<void> {
  if (!isRedisAvailable()) {
    console.log('Redis not available, skipping cache write')
    return
  }

  const cacheKey = getWarehouseCacheKey(orgId)

  await safeRedisOperation(async (redis) => {
    // Set cache with TTL of 5 minutes (300 seconds)
    await redis.set(cacheKey, data, { ex: CACHE_TTL })
    console.log(`Cache SET for warehouses:${orgId} (TTL: ${CACHE_TTL}s)`)
    return true
  })
}

/**
 * Invalidate warehouse cache for an organization
 * AC-004.8: Invalidate cache on create/update/delete operations
 *
 * Called after:
 * - createWarehouse
 * - updateWarehouse
 * - deleteWarehouse
 * - archiveWarehouse
 * - activateWarehouse
 *
 * @param orgId - Organization UUID
 */
export async function invalidateWarehouseCache(orgId: string): Promise<void> {
  if (!isRedisAvailable()) {
    console.log('Redis not available, skipping cache invalidation')
    return
  }

  const cacheKey = getWarehouseCacheKey(orgId)

  await safeRedisOperation(async (redis) => {
    await redis.del(cacheKey)
    console.log(`Cache INVALIDATED for warehouses:${orgId}`)
    return true
  })
}
