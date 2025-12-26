/**
 * Product History Service (Story 02.2)
 * Handles product version history operations and field change detection
 *
 * Architecture: Service layer methods accept Supabase client for server/client usage
 *
 * Security: All queries enforce org_id isolation via product_id lookup (ADR-013)
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Product } from '@/lib/types/product'
import type {
  ChangedFields,
  VersionsListResponse,
  HistoryResponse,
  HistoryFilters,
} from '@/lib/types/product-history'

/**
 * Trackable fields for version history
 * Excludes: id, org_id, code, product_type_id (immutable), created_at, updated_at, version, deleted_at
 */
const TRACKABLE_FIELDS = [
  'name',
  'description',
  'base_uom',
  'status',
  'barcode',
  'gtin',
  'category_id',
  'supplier_id',
  'lead_time_days',
  'moq',
  'expiry_policy',
  'shelf_life_days',
  'std_price',
  'cost_per_unit',
  'min_stock',
  'max_stock',
  'storage_conditions',
  'is_perishable',
] as const

/**
 * Compare two product states and detect changed fields
 * Returns JSONB-compatible object: { field: { old: value, new: value } }
 */
export function detectChangedFields(
  oldProduct: Product,
  newProduct: Partial<Product>
): ChangedFields {
  const changedFields: ChangedFields = {}

  for (const field of TRACKABLE_FIELDS) {
    if (field in newProduct) {
      const oldValue = oldProduct[field]
      const newValue = newProduct[field]

      // Normalize undefined to null for comparison
      const normalizedOld = oldValue === undefined ? null : oldValue
      const normalizedNew = newValue === undefined ? null : newValue

      // Deep comparison using JSON stringify
      if (JSON.stringify(normalizedOld) !== JSON.stringify(normalizedNew)) {
        changedFields[field] = { old: normalizedOld, new: normalizedNew }
      }
    }
  }

  return changedFields
}

/**
 * Format changed fields into human-readable summary
 * Handles initial creation, null values, and multiple changes
 */
export function formatChangeSummary(changedFields: ChangedFields): string {
  // Check for initial creation flag
  if ('_initial' in changedFields) {
    return 'Initial creation'
  }

  const changes = Object.entries(changedFields).map(([field, change]) => {
    const oldStr = change.old === null ? '(empty)' : String(change.old)
    const newStr = change.new === null ? '(empty)' : String(change.new)
    return `${field}: ${oldStr} -> ${newStr}`
  })

  return changes.join(', ')
}

/**
 * Get paginated list of versions (summary view)
 * Uses fetch to call API endpoint
 */
export async function getVersionsList(
  productId: string,
  pagination: { page?: number; limit?: number } = {}
): Promise<VersionsListResponse> {
  const params = new URLSearchParams()
  if (pagination.page) params.set('page', String(pagination.page))
  if (pagination.limit) params.set('limit', String(pagination.limit))

  const url = `/api/v1/technical/products/${productId}/versions${params.toString() ? `?${params}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch versions')
  }

  return response.json()
}

/**
 * Get detailed change history with optional date filters
 * Uses fetch to call API endpoint
 */
export async function getVersionHistory(
  productId: string,
  pagination: { page?: number; limit?: number } = {},
  filters?: HistoryFilters
): Promise<HistoryResponse> {
  const params = new URLSearchParams()
  if (pagination.page) params.set('page', String(pagination.page))
  if (pagination.limit) params.set('limit', String(pagination.limit))
  if (filters?.from_date) params.set('from_date', filters.from_date)
  if (filters?.to_date) params.set('to_date', filters.to_date)

  const url = `/api/v1/technical/products/${productId}/history${params.toString() ? `?${params}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error('Failed to fetch history')
  }

  return response.json()
}

// Export service as default object for testing
export const ProductHistoryService = {
  detectChangedFields,
  formatChangeSummary,
  getVersionsList,
  getVersionHistory,
}
