/**
 * BOM Alternatives Service (Story 02.6)
 *
 * Handles BOM alternative ingredient operations:
 * - Get alternatives for a BOM item (sorted by preference_order)
 * - Create alternative (with auto-increment preference order)
 * - Update alternative (quantity, preference order, notes)
 * - Delete alternative
 * - Validate alternative business rules
 * - Preference order enforcement (must be >= 2)
 * - Circular reference prevention
 * - UoM mismatch detection (warning, not error)
 */

import type {
  BOMAlternative,
  AlternativesListResponse,
  CreateAlternativeRequest,
  UpdateAlternativeRequest,
  AlternativeResponse,
  DeleteAlternativeResponse,
  AlternativeValidationResult,
} from '@/lib/types/bom-alternative'
import type { BOMItem } from '@/lib/types/bom'

/**
 * Build API URL for alternatives
 */
function buildAlternativesUrl(bomId: string, itemId: string, altId?: string): string {
  const base = `/api/v1/technical/boms/${bomId}/items/${itemId}/alternatives`
  return altId ? `${base}/${altId}` : base
}

/**
 * Get all alternatives for a BOM item with primary item info
 * @param bomId - BOM ID
 * @param itemId - BOM Item ID
 * @returns Alternatives list with primary item details
 */
export async function getAlternatives(
  bomId: string,
  itemId: string
): Promise<AlternativesListResponse> {
  const response = await fetch(buildAlternativesUrl(bomId, itemId))

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to fetch alternatives' }))
    throw new Error(error.error || error.message || 'Failed to fetch alternatives')
  }

  return response.json()
}

/**
 * Get next available preference order for an item
 * @param itemId - BOM Item ID
 * @returns Next preference order (max + 1, minimum 2)
 */
export async function getNextPreferenceOrder(
  bomId: string,
  itemId: string
): Promise<number> {
  try {
    const data = await getAlternatives(bomId, itemId)
    const alternatives = data.alternatives || []

    if (alternatives.length === 0) {
      return 2 // First alternative is preference 2 (1 = primary)
    }

    const maxOrder = Math.max(...alternatives.map((a) => a.preference_order || 2))
    return maxOrder + 1
  } catch {
    return 2 // Default to 2 if fetch fails
  }
}

/**
 * Create a new alternative for a BOM item
 * @param bomId - BOM ID
 * @param itemId - BOM Item ID
 * @param data - Alternative creation data
 * @returns Created alternative
 */
export async function createAlternative(
  bomId: string,
  itemId: string,
  data: CreateAlternativeRequest
): Promise<AlternativeResponse> {
  const response = await fetch(buildAlternativesUrl(bomId, itemId), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to create alternative' }))
    throw new Error(error.error || error.message || 'Failed to create alternative')
  }

  return response.json()
}

/**
 * Update an existing alternative
 * @param bomId - BOM ID
 * @param itemId - BOM Item ID
 * @param altId - Alternative ID
 * @param data - Update data
 * @returns Updated alternative
 */
export async function updateAlternative(
  bomId: string,
  itemId: string,
  altId: string,
  data: UpdateAlternativeRequest
): Promise<AlternativeResponse> {
  const response = await fetch(buildAlternativesUrl(bomId, itemId, altId), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to update alternative' }))
    throw new Error(error.error || error.message || 'Failed to update alternative')
  }

  return response.json()
}

/**
 * Delete an alternative
 * @param bomId - BOM ID
 * @param itemId - BOM Item ID
 * @param altId - Alternative ID
 */
export async function deleteAlternative(
  bomId: string,
  itemId: string,
  altId: string
): Promise<DeleteAlternativeResponse> {
  const response = await fetch(buildAlternativesUrl(bomId, itemId, altId), {
    method: 'DELETE',
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Failed to delete alternative' }))
    throw new Error(error.error || error.message || 'Failed to delete alternative')
  }

  return response.json()
}

/**
 * UoM class mapping for mismatch detection
 */
const UOM_CLASSES: Record<string, string> = {
  // Weight class
  'kg': 'weight',
  'g': 'weight',
  'mg': 'weight',
  'lb': 'weight',
  'lbs': 'weight',
  'oz': 'weight',
  // Volume class
  'L': 'volume',
  'l': 'volume',
  'mL': 'volume',
  'ml': 'volume',
  'gal': 'volume',
  // Count class
  'pcs': 'count',
  'ea': 'count',
  'unit': 'count',
  'units': 'count',
}

/**
 * Get UoM class for a unit
 */
function getUomClass(uom: string): string {
  return UOM_CLASSES[uom.toLowerCase()] || UOM_CLASSES[uom] || 'other'
}

/**
 * Validate alternative against business rules
 * @param primaryItem - Primary BOM item
 * @param alternativeProductId - Alternative product ID
 * @param existingAlternatives - Current alternatives for the item
 * @param bomProductId - BOM output product ID (for circular ref check)
 * @param alternativeProduct - Alternative product details (for type check)
 * @returns Validation result with error/warning if applicable
 */
export function validateAlternativeRules(
  primaryItem: { product_id: string; product_type?: string; uom?: string },
  alternativeProductId: string,
  existingAlternatives: BOMAlternative[],
  bomProductId: string,
  alternativeProduct?: { product_type?: string; base_uom?: string }
): AlternativeValidationResult {
  // Check if same as primary
  if (alternativeProductId === primaryItem.product_id) {
    return {
      valid: false,
      error: 'SAME_AS_PRIMARY',
    }
  }

  // Check if same as BOM product (circular reference)
  if (alternativeProductId === bomProductId) {
    return {
      valid: false,
      error: 'CIRCULAR_REFERENCE',
    }
  }

  // Check if duplicate
  if (existingAlternatives.some((a) => a.alternative_product_id === alternativeProductId)) {
    return {
      valid: false,
      error: 'DUPLICATE_ALTERNATIVE',
    }
  }

  // Check type match if product details provided
  if (alternativeProduct?.product_type && primaryItem.product_type) {
    if (alternativeProduct.product_type !== primaryItem.product_type) {
      return {
        valid: false,
        error: 'TYPE_MISMATCH',
      }
    }
  }

  // Check UoM mismatch (warning only)
  if (alternativeProduct?.base_uom && primaryItem.uom) {
    const primaryClass = getUomClass(primaryItem.uom)
    const altClass = getUomClass(alternativeProduct.base_uom)

    if (primaryClass !== altClass && primaryClass !== 'other' && altClass !== 'other') {
      return {
        valid: true,
        warning: 'UOM_MISMATCH',
      }
    }
  }

  return { valid: true }
}
