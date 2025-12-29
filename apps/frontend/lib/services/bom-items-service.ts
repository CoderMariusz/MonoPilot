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
 *
 * @module lib/services/bom-items-service
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
import { BOM_ITEM_LIMITS, DEFAULT_CONDITIONAL_FLAGS } from '@/lib/constants/bom-items'

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
 *
 * @param bomId - UUID of the BOM
 * @returns BOM items list with summary statistics including:
 *   - items: Array of BOM items with product details
 *   - summary: Total cost, item count, etc.
 * @throws Error if BOM not found or request fails
 *
 * @example
 * ```ts
 * const { items, summary } = await getBOMItems('bom-uuid')
 * console.log(`${summary.total_items} items, total cost: ${summary.total_cost}`)
 * ```
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
 *
 * @param bomId - UUID of the BOM
 * @param data - Create request payload containing:
 *   - product_id: UUID of the product (required)
 *   - quantity: Amount to consume (required)
 *   - uom: Unit of measure (required)
 *   - sequence: Display order (optional, auto-increments)
 *   - scrap_percent: Expected waste percentage (optional)
 *   - operation_seq: Link to operation step (optional)
 *   - consume_whole_lp: Consume entire license plate (optional)
 *   - line_ids: Restrict to specific lines (optional)
 *   - is_by_product: Mark as byproduct output (optional)
 *   - yield_percent: Byproduct yield percentage (optional)
 *   - condition_flags: Special flags like organic, vegan (optional)
 *   - notes: Free text notes (optional)
 * @returns Created item with any warnings (e.g., UoM mismatch)
 * @throws Error if validation fails or BOM not found
 *
 * @example
 * ```ts
 * const { item, warning } = await createBOMItem('bom-uuid', {
 *   product_id: 'product-uuid',
 *   quantity: 10,
 *   uom: 'kg',
 *   is_by_product: true,
 *   yield_percent: 2.5
 * })
 * ```
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
 *
 * @param bomId - UUID of the BOM
 * @param itemId - UUID of the item to update
 * @param data - Update request payload (partial - only changed fields required)
 * @returns Updated item with any warnings
 * @throws Error if item not found or validation fails
 *
 * @example
 * ```ts
 * const { item } = await updateBOMItem('bom-uuid', 'item-uuid', {
 *   quantity: 15,
 *   yield_percent: 3.0
 * })
 * ```
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
 *
 * @param bomId - UUID of the BOM
 * @param itemId - UUID of the item to delete
 * @returns Success confirmation with message
 * @throws Error if item not found
 *
 * @example
 * ```ts
 * const { success, message } = await deleteBOMItem('bom-uuid', 'item-uuid')
 * console.log(message) // "Item deleted successfully"
 * ```
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
 *
 * Returns max(sequence) + 10, or 10 for empty BOM.
 * Default increment of 10 allows inserting items between existing ones.
 *
 * @param bomId - UUID of the BOM
 * @returns Next sequence number (defaults to 10 if request fails)
 *
 * @example
 * ```ts
 * const nextSeq = await getNextSequence('bom-uuid')
 * // First item: 10, then 20, 30, etc.
 * ```
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
 *
 * Formula: (byproductQty / bomOutputQty) * 100
 * Result is rounded to 2 decimal places.
 *
 * This represents what percentage of the main output
 * this byproduct represents. For example, if making 100kg
 * of flour and 2kg of bran comes out, yield = 2%.
 *
 * @param byproductQty - Quantity of the byproduct output
 * @param bomOutputQty - Total output quantity of the BOM (main product)
 * @returns Yield percentage (0-100), or 0 if bomOutputQty is 0
 *
 * @example
 * ```ts
 * const yield = calculateYieldPercent(2, 100) // 2.00
 * const yield = calculateYieldPercent(5.5, 50) // 11.00
 * const yield = calculateYieldPercent(1, 0)   // 0 (avoid divide by zero)
 * ```
 */
export function calculateYieldPercent(
  byproductQty: number,
  bomOutputQty: number
): number {
  if (bomOutputQty <= 0) return 0
  const yield_percent = (byproductQty / bomOutputQty) * 100
  // Round to 2 decimal places (matches BOM_ITEM_LIMITS.MAX_YIELD_DECIMALS)
  return Math.round(yield_percent * 100) / 100
}

/**
 * Bulk create BOM items (up to 500 items)
 *
 * Processes items one at a time on the server:
 * - Auto-increments sequence if not provided
 * - Auto-calculates yield_percent for byproducts
 * - Returns partial success (207) if some items fail
 *
 * @param bomId - UUID of the BOM
 * @param items - Array of items to create (max 500)
 * @returns BulkImportResponse with:
 *   - created: Number of successfully created items
 *   - total: Total items attempted
 *   - items: Array of created items
 *   - errors: Array of { row, error } for failed items
 * @throws Error if more than 500 items or BOM not found
 *
 * @example
 * ```ts
 * const result = await bulkCreateBOMItems('bom-uuid', [
 *   { product_id: 'p1', quantity: 10, uom: 'kg' },
 *   { product_id: 'p2', quantity: 5, uom: 'kg', is_by_product: true }
 * ])
 *
 * if (result.errors.length > 0) {
 *   console.log(`${result.created} of ${result.total} imported`)
 *   result.errors.forEach(e => console.log(`Row ${e.row}: ${e.error}`))
 * }
 * ```
 */
export async function bulkCreateBOMItems(
  bomId: string,
  items: CreateBOMItemRequest[]
): Promise<BulkImportResponse> {
  if (items.length > BOM_ITEM_LIMITS.MAX_BULK_IMPORT) {
    throw new Error(`Maximum ${BOM_ITEM_LIMITS.MAX_BULK_IMPORT} items allowed per bulk import`)
  }

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
 *
 * Fetches only items marked as byproducts for display
 * in the Byproducts section of the BOM editor.
 *
 * @param bomId - UUID of the BOM
 * @returns Array of byproduct items
 *
 * @example
 * ```ts
 * const byproducts = await getByproducts('bom-uuid')
 * const totalYield = byproducts.reduce((sum, bp) => sum + (bp.yield_percent || 0), 0)
 * ```
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
 *
 * Fetches all production lines for the organization
 * to populate the line selection dropdown in BOM item form.
 * Results are cached by the browser.
 *
 * @param orgId - Organization ID (optional, uses current org context)
 * @returns Array of production lines with id, code, name, is_active
 *
 * @example
 * ```ts
 * const lines = await getProductionLines()
 * const activeLines = lines.filter(l => l.is_active)
 * ```
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
 *
 * Returns the available conditional flags for the organization.
 * Falls back to default flags if the endpoint doesn't exist:
 * - organic, vegan, gluten_free, kosher, halal
 *
 * These flags allow creating variant recipes (e.g., organic version)
 * that use different ingredients based on the flag.
 *
 * @returns Array of conditional flags with id, code, name, is_active
 *
 * @example
 * ```ts
 * const flags = await getConditionalFlags()
 * // Use in ConditionalFlagsSelect component
 * ```
 */
export async function getConditionalFlags(): Promise<ConditionalFlag[]> {
  const response = await fetch('/api/v1/technical/conditional-flags')

  if (!response.ok) {
    // Return default flags if endpoint doesn't exist
    return DEFAULT_CONDITIONAL_FLAGS as unknown as ConditionalFlag[]
  }

  const data = await response.json()
  return data.flags || data || []
}

/**
 * Get items available for a specific production line
 *
 * Returns items that can be used on a given production line:
 * - Items with line_ids=null (available on all lines)
 * - Items where line_ids array contains the specified lineId
 *
 * This is used when starting a work order to show only
 * applicable BOM items for the selected line.
 *
 * @param bomId - UUID of the BOM
 * @param lineId - UUID of the production line
 * @returns Array of BOM items available for the line
 *
 * @example
 * ```ts
 * const itemsForLine1 = await getItemsForLine('bom-uuid', 'line-1-uuid')
 * // Returns items with line_ids=null OR line_ids includes 'line-1-uuid'
 * ```
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
