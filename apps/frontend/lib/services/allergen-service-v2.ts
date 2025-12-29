/**
 * Allergen Service V2
 * Story: TD-209 - Products Column in Allergens Table
 *
 * Extended allergen service with product count functionality.
 * Uses RPC functions created in migration 032.
 *
 * Features:
 * - Get product count for single allergen
 * - Get product counts for all allergens (batch)
 * - Org-scoped queries via RLS
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Result type for allergen product count
 */
export interface AllergenProductCount {
  allergen_id: string
  product_count: number
}

/**
 * Service result type
 */
export interface AllergenServiceV2Result<T> {
  success: boolean
  data?: T
  error?: string
  code?: 'UNAUTHORIZED' | 'NOT_FOUND' | 'DATABASE_ERROR'
}

/**
 * Get product count for a specific allergen
 * Uses RPC function get_allergen_product_count(UUID)
 *
 * @param allergenId - Allergen UUID
 * @param orgId - Optional org ID (not used directly, RPC uses auth context)
 * @returns Product count for the allergen in user's org
 */
export async function getProductCountForAllergen(
  allergenId: string,
  orgId?: string // Parameter kept for API consistency, RPC uses auth context
): Promise<AllergenServiceV2Result<number>> {
  try {
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      }
    }

    // Get product count using RPC
    const { data, error } = await supabase
      .rpc('get_allergen_product_count', { p_allergen_id: allergenId })

    if (error) {
      console.error('[AllergenServiceV2] Failed to get product count:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    return {
      success: true,
      data: data ?? 0,
    }
  } catch (error) {
    console.error('[AllergenServiceV2] Error in getProductCountForAllergen:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Get product counts for multiple allergens (batch)
 * Uses RPC function get_all_allergen_product_counts()
 *
 * @param allergenIds - Optional array of allergen IDs to filter (if empty, returns all)
 * @param orgId - Optional org ID (not used directly, RPC uses auth context)
 * @returns Map of allergen ID to product count
 */
export async function getAllergenProductCounts(
  allergenIds?: string[],
  orgId?: string // Parameter kept for API consistency, RPC uses auth context
): Promise<AllergenServiceV2Result<Map<string, number>>> {
  try {
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        success: false,
        error: 'Unauthorized',
        code: 'UNAUTHORIZED',
      }
    }

    // Get all allergen product counts using RPC
    const { data, error } = await supabase
      .rpc('get_all_allergen_product_counts')

    if (error) {
      console.error('[AllergenServiceV2] Failed to get allergen counts:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`,
        code: 'DATABASE_ERROR',
      }
    }

    // Convert to Map
    const countsMap = new Map<string, number>()

    if (data) {
      for (const row of data as AllergenProductCount[]) {
        // Filter by allergenIds if provided
        if (!allergenIds || allergenIds.length === 0 || allergenIds.includes(row.allergen_id)) {
          countsMap.set(row.allergen_id, row.product_count)
        }
      }
    }

    return {
      success: true,
      data: countsMap,
    }
  } catch (error) {
    console.error('[AllergenServiceV2] Error in getAllergenProductCounts:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      code: 'DATABASE_ERROR',
    }
  }
}

/**
 * Get product counts as object (for JSON serialization)
 * Alternative to Map-based method for easier API responses
 *
 * @param allergenIds - Optional array of allergen IDs to filter
 * @returns Object with allergen_id keys and product_count values
 */
export async function getAllergenProductCountsAsObject(
  allergenIds?: string[]
): Promise<AllergenServiceV2Result<Record<string, number>>> {
  const result = await getAllergenProductCounts(allergenIds)

  if (!result.success || !result.data) {
    return {
      success: result.success,
      error: result.error,
      code: result.code,
    }
  }

  // Convert Map to object
  const countsObject: Record<string, number> = {}
  result.data.forEach((count, id) => {
    countsObject[id] = count
  })

  return {
    success: true,
    data: countsObject,
  }
}


