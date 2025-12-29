/**
 * BOM Clone Service (Story 02.6)
 *
 * Handles BOM clone operations:
 * - Clone BOM to same product (version increment)
 * - Clone BOM to different product (version starts at 1 or next)
 * - Get next version for target product
 * - Validate clone target (date overlap checking)
 * - Preserve BOM header data (routing, notes, output_qty)
 * - Copy all BOM items (MVP: excludes byproducts)
 * - Set draft status on cloned BOM
 * - Set effective_from to today by default
 */

import type {
  CloneBOMRequest,
  CloneBOMResponse,
  CloneValidationResult,
} from '@/lib/types/bom-clone'

const API_BASE = '/api/v1/technical/boms'

/**
 * Get next available version number for a product
 * @param productId - Product ID to check versions for
 * @returns Next version number (max + 1, or 1 if no BOMs exist)
 */
export async function getNextVersion(productId: string): Promise<number> {
  const response = await fetch(`${API_BASE}?product_id=${productId}&limit=1&sortBy=version&sortOrder=desc`)

  if (!response.ok) {
    // If no BOMs exist for product, return 1
    return 1
  }

  const data = await response.json()
  const boms = data.boms || data || []

  if (!Array.isArray(boms) || boms.length === 0) {
    return 1
  }

  // Return max version + 1
  const maxVersion = Math.max(...boms.map((b: any) => b.version || 0))
  return maxVersion + 1
}

/**
 * Validate clone target - check for date overlap with existing BOMs
 * @param productId - Target product ID
 * @param effectiveFrom - Clone effective_from date
 * @param effectiveTo - Clone effective_to date (null for open-ended)
 * @returns Validation result with error if overlap exists
 */
export async function validateCloneTarget(
  productId: string,
  effectiveFrom: string,
  effectiveTo: string | null
): Promise<CloneValidationResult> {
  const response = await fetch(`${API_BASE}?product_id=${productId}`)

  if (!response.ok) {
    return { valid: true } // No existing BOMs means no overlap
  }

  const data = await response.json()
  const boms = data.boms || data || []

  if (!Array.isArray(boms) || boms.length === 0) {
    return { valid: true }
  }

  const newFrom = new Date(effectiveFrom)
  const newTo = effectiveTo ? new Date(effectiveTo) : null

  for (const bom of boms) {
    const existingFrom = new Date(bom.effective_from)
    const existingTo = bom.effective_to ? new Date(bom.effective_to) : null

    // Check overlap: ranges overlap if NOT (newTo < existingFrom OR newFrom > existingTo)
    // Handle null dates (open-ended ranges) - they overlap with everything after their start
    const newEndsBeforeExisting = newTo && newTo < existingFrom
    const newStartsAfterExisting = existingTo && newFrom > existingTo

    if (!newEndsBeforeExisting && !newStartsAfterExisting) {
      return {
        valid: false,
        error: 'DATE_OVERLAP',
      }
    }
  }

  return { valid: true }
}

/**
 * Clone a BOM to target product
 * @param sourceBomId - Source BOM ID to clone
 * @param options - Clone options (target product, dates, notes)
 * @returns Clone result with new BOM details
 */
export async function cloneBOM(
  sourceBomId: string,
  options: CloneBOMRequest
): Promise<CloneBOMResponse> {
  const response = await fetch(`${API_BASE}/${sourceBomId}/clone`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Clone failed' }))
    const errorMessage = error.error || error.message || 'Clone failed'
    throw new Error(errorMessage)
  }

  return response.json()
}
