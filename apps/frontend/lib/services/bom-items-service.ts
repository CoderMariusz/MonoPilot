/**
 * BOM Items Service - Story 02.5a + 02.5b Phase 1B
 *
 * Client-side service for BOM items CRUD operations:
 * - getBOMItems: List items for a BOM with product details
 * - createBOMItem: Add new item to BOM
 * - updateBOMItem: Update existing item
 * - deleteBOMItem: Remove item from BOM
 * - getNextSequence: Calculate next sequence (max + 10)
 *
 * Phase 1B Functions:
 * - calculateYieldPercent: Calculate byproduct yield percentage
 * - bulkCreateBOMItems: Bulk import up to 500 items
 * - getByproducts: Get byproducts only (is_by_product=true)
 * - getProductionLines: Fetch production lines for dropdown
 * - getConditionalFlags: Fetch conditional flags for multi-select
 * - getItemsForLine: Filter items by production line
 *
 * This service calls the API routes and handles responses/errors.
 * UoM mismatch warnings are returned (not thrown) as non-blocking.
 */

import type {
  BOMItem,
  BOMItemsListResponse,
  BOMItemResponse,
  CreateBOMItemRequest,
  UpdateBOMItemRequest,
  BulkImportResponse,
  ProductionLine,
  ConditionalFlag,
} from '@/lib/types/bom'

// Keep for backward compatibility
export type { BOMItem, BOMItemsListResponse, BOMItemResponse, CreateBOMItemRequest, UpdateBOMItemRequest } from '@/lib/types/bom'

/**
 * Delete BOM Item Response
 */
export interface DeleteBOMItemResponse {
  success: boolean
  message: string
}

const API_BASE = '/api/v1/technical/boms'

/**
 * Get all items for a BOM with product details and summary
 * @param bomId - UUID of the BOM
 * @returns BOM items list with summary statistics
 * @throws Error if BOM not found or request fails
 */
export async function getBOMItems(bomId: string): Promise<BOMItemsListResponse> {
  const response = await fetch(`${API_BASE}/${bomId}/items`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch BOM items')
  }

  const data: BOMItemsListResponse = await response.json()

  // Ensure items are sorted by sequence (safeguard - backend should already sort)
  data.items.sort((a, b) => a.sequence - b.sequence)

  return data
}

/**
 * Create a new BOM item
 * @param bomId - UUID of the BOM
 * @param data - Create request payload
 * @returns Created item with any warnings (e.g., UoM mismatch)
 * @throws Error if validation fails or BOM not found
 */
export async function createBOMItem(
  bomId: string,
  data: CreateBOMItemRequest
): Promise<BOMItemResponse> {
  const response = await fetch(`${API_BASE}/${bomId}/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create BOM item')
  }

  return response.json()
}

/**
 * Update an existing BOM item
 * @param bomId - UUID of the BOM
 * @param itemId - UUID of the item to update
 * @param data - Update request payload (partial)
 * @returns Updated item with any warnings
 * @throws Error if item not found or validation fails
 */
export async function updateBOMItem(
  bomId: string,
  itemId: string,
  data: UpdateBOMItemRequest
): Promise<BOMItemResponse> {
  const response = await fetch(`${API_BASE}/${bomId}/items/${itemId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to update BOM item')
  }

  return response.json()
}

/**
 * Delete a BOM item
 * @param bomId - UUID of the BOM
 * @param itemId - UUID of the item to delete
 * @returns Success confirmation
 * @throws Error if item not found
 */
export async function deleteBOMItem(
  bomId: string,
  itemId: string
): Promise<DeleteBOMItemResponse> {
  const response = await fetch(`${API_BASE}/${bomId}/items/${itemId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to delete BOM item')
  }

  return response.json()
}

/**
 * Get next sequence number for auto-increment
 * Returns max(sequence) + 10, or 10 for empty BOM
 * @param bomId - UUID of the BOM
 * @returns Next sequence number (defaults to 10 if request fails)
 */
export async function getNextSequence(bomId: string): Promise<number> {
  const response = await fetch(`${API_BASE}/${bomId}/items/next-sequence`)

  if (!response.ok) {
    // Default to 10 if request fails
    return 10
  }

  const data = await response.json()
  return data.next_sequence
}

// ========================================
// Phase 1B Functions (Story 02.5b)
// ========================================

/**
 * Calculate byproduct yield percentage
 * Formula: (byproductQty / bomOutputQty) * 100, rounded to 2 decimals
 * @param byproductQty - Quantity of the byproduct
 * @param bomOutputQty - Total output quantity of the BOM
 * @returns Yield percentage (0-100), or 0 if bomOutputQty is 0
 */
export function calculateYieldPercent(
  byproductQty: number,
  bomOutputQty: number
): number {
  if (bomOutputQty <= 0) return 0
  const yield_percent = (byproductQty / bomOutputQty) * 100
  // Round to 2 decimal places
  return Math.round(yield_percent * 100) / 100
}

/**
 * Bulk create BOM items (up to 500 items)
 * @param bomId - UUID of the BOM
 * @param items - Array of items to create
 * @returns BulkImportResponse with created count, items, and errors
 * @throws Error if >500 items or BOM not found
 */
export async function bulkCreateBOMItems(
  bomId: string,
  items: CreateBOMItemRequest[]
): Promise<BulkImportResponse> {
  const response = await fetch(`${API_BASE}/${bomId}/items/bulk`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items }),
  })

  if (!response.ok && response.status !== 207) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to bulk import BOM items')
  }

  return response.json()
}

/**
 * Get byproducts only (is_by_product=true)
 * @param bomId - UUID of the BOM
 * @returns Array of byproduct items
 */
export async function getByproducts(bomId: string): Promise<BOMItem[]> {
  const response = await fetch(`${API_BASE}/${bomId}/items?byproducts_only=true`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch byproducts')
  }

  const data = await response.json()
  return data.byproducts || data.items?.filter((item: BOMItem) => item.is_by_product) || []
}

/**
 * Get production lines for dropdown
 * @param orgId - Organization ID (optional, uses current org context)
 * @returns Array of production lines
 */
export async function getProductionLines(orgId?: string): Promise<ProductionLine[]> {
  const url = orgId
    ? `/api/v1/settings/production-lines?org_id=${orgId}`
    : '/api/v1/settings/production-lines'

  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch production lines')
  }

  const data = await response.json()
  return data.lines || data || []
}

/**
 * Get conditional flags for multi-select dropdown
 * Returns the 5 default flags: organic, vegan, gluten_free, kosher, halal
 * @returns Array of conditional flags
 */
export async function getConditionalFlags(): Promise<ConditionalFlag[]> {
  const response = await fetch('/api/v1/technical/conditional-flags')

  if (!response.ok) {
    // Return default flags if endpoint doesn't exist
    return [
      { id: 'f-1', code: 'organic', name: 'Organic', is_active: true },
      { id: 'f-2', code: 'vegan', name: 'Vegan', is_active: true },
      { id: 'f-3', code: 'gluten_free', name: 'Gluten-Free', is_active: true },
      { id: 'f-4', code: 'kosher', name: 'Kosher', is_active: true },
      { id: 'f-5', code: 'halal', name: 'Halal', is_active: true },
    ]
  }

  const data = await response.json()
  return data.flags || data || []
}

/**
 * Get items available for a specific production line
 * Returns items with line_ids=null (all lines) OR line_ids containing the specified lineId
 * @param bomId - UUID of the BOM
 * @param lineId - UUID of the production line
 * @returns Array of BOM items available for the line
 */
export async function getItemsForLine(
  bomId: string,
  lineId: string
): Promise<BOMItem[]> {
  const response = await fetch(`${API_BASE}/${bomId}/items?line_id=${lineId}`)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch items for line')
  }

  const data = await response.json()
  const items: BOMItem[] = data.items || []

  // Filter items where line_ids is null OR contains the lineId
  return items.filter((item) => {
    if (item.line_ids === null) return true
    return item.line_ids?.includes(lineId)
  })
}
