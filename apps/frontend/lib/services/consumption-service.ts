/**
 * Consumption Service (Story 04.6a)
 *
 * Client-side service for material consumption:
 * - getWOMaterials: Fetch WO materials with consumption progress
 * - getConsumptionHistory: Fetch consumption history with pagination
 * - getAvailableLPs: Search available LPs for a material
 * - validateLP: Validate LP for consumption
 * - recordConsumption: Record material consumption
 * - reverseConsumption: Reverse a consumption record
 *
 * @module lib/services/consumption-service
 */

import type {
  ConsumeRequest,
  ConsumptionFilter,
  ReversalRequest,
} from '@/lib/validation/consumption-schemas'

const API_BASE = '/api/production/work-orders'

/**
 * WO Material with consumption progress
 */
export interface ConsumptionMaterial {
  id: string
  wo_id: string
  product_id: string
  material_name: string
  required_qty: number
  consumed_qty: number
  reserved_qty: number
  uom: string
  sequence: number
  consume_whole_lp: boolean
  is_by_product?: boolean
  product?: {
    id: string
    code: string
    name: string
    product_type: string
  }
}

/**
 * Consumption record
 */
export interface Consumption {
  id: string
  wo_id: string
  material_id: string
  reservation_id: string | null
  lp_id: string
  consumed_qty: number
  uom: string
  consumed_at: string
  consumed_by_user_id: string
  operation_id: string | null
  notes: string | null
  status: 'consumed' | 'reversed'
  reversed_at: string | null
  reverse_reason: string | null
  wo_materials?: { material_name: string; product_id: string } | null
  license_plates?: { lp_number: string; batch_number?: string; expiry_date?: string } | null
  consumed_by_user?: { first_name: string; last_name: string; email: string } | null
}

/**
 * Available LP for consumption
 */
export interface AvailableLP {
  id: string
  lp_number: string
  product_id: string
  quantity: number
  current_qty: number
  uom: string
  status: string
  qa_status: string
  batch_number: string | null
  expiry_date: string | null
  location_id: string | null
  location_name: string | null
}

/**
 * LP validation result
 */
export interface LPValidationResult {
  valid: boolean
  lp?: AvailableLP
  error?: string
  errorCode?: string
}

/**
 * Full LP validation result (Story 04.6c)
 * Used for 1:1 consumption enforcement
 */
export interface FullLPValidationResult {
  valid: boolean
  error?: 'FULL_LP_REQUIRED'
  lpQty?: number
  message?: string
}

/**
 * Consumption recording result
 */
export interface ConsumptionResult {
  consumption: Consumption
  message: string
  material_name: string
  lp_number: string
  consumed_qty: number
  uom: string
  lp_remaining_qty: number
}

/**
 * Get materials for a work order with consumption progress
 */
export async function getWOMaterials(
  woId: string
): Promise<{ materials: ConsumptionMaterial[]; total: number }> {
  const response = await fetch(`/api/planning/work-orders/${woId}/materials`)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Work order not found')
    }
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch WO materials')
  }

  const data = await response.json()
  return {
    materials: data.materials.sort(
      (a: ConsumptionMaterial, b: ConsumptionMaterial) => a.sequence - b.sequence
    ),
    total: data.total,
  }
}

/**
 * Get consumption history for a work order
 */
export async function getConsumptionHistory(
  woId: string,
  filter?: ConsumptionFilter
): Promise<{ consumptions: Consumption[]; total: number }> {
  const params = new URLSearchParams()
  if (filter?.status) params.set('status', filter.status)
  if (filter?.page) params.set('page', String(filter.page))
  if (filter?.limit) params.set('limit', String(filter.limit))

  const url = `${API_BASE}/${woId}/consume${params.toString() ? `?${params}` : ''}`
  const response = await fetch(url)

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch consumption history')
  }

  const data = await response.json()
  return {
    consumptions: data.consumptions || [],
    total: data.consumptions?.length || 0,
  }
}

/**
 * Get available LPs for a material
 */
export async function getAvailableLPs(
  woId: string,
  productId: string,
  uom: string,
  search?: string
): Promise<AvailableLP[]> {
  const params = new URLSearchParams({
    product_id: productId,
    uom: uom,
  })
  if (search) params.set('search', search)

  const response = await fetch(
    `${API_BASE}/${woId}/materials/available-lps?${params}`
  )

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to fetch available LPs')
  }

  const data = await response.json()
  return data.data || []
}

/**
 * Validate Full LP consumption requirement (Story 04.6c)
 *
 * Checks if material requires full LP consumption (consume_whole_lp=true)
 * and validates that the consume quantity matches the LP quantity exactly.
 *
 * @param consumeWholeLP - Whether the material requires full LP consumption
 * @param consumeQty - Quantity to consume
 * @param lpQty - Available quantity on the LP
 * @returns FullLPValidationResult with valid flag and error details if invalid
 */
export function validateFullLPConsumption(
  consumeWholeLP: boolean,
  consumeQty: number,
  lpQty: number
): FullLPValidationResult {
  // If consume_whole_lp is not set, any quantity is valid
  if (!consumeWholeLP) {
    return { valid: true }
  }

  // For 1:1 consumption, consume_qty must match LP qty exactly
  // Use small tolerance for floating point comparison
  if (Math.abs(consumeQty - lpQty) > 0.0001) {
    return {
      valid: false,
      error: 'FULL_LP_REQUIRED',
      lpQty: lpQty,
      message: `Full LP consumption required. LP quantity is ${lpQty}`,
    }
  }

  return { valid: true }
}

/**
 * Check if consumption will use the full LP quantity
 *
 * @param consumeQty - Quantity being consumed
 * @param lpQty - Total LP quantity
 * @returns true if consuming the full LP
 */
export function isFullLPConsumption(consumeQty: number, lpQty: number): boolean {
  return Math.abs(consumeQty - lpQty) < 0.0001
}

/**
 * Validate LP for consumption
 */
export async function validateLP(
  woId: string,
  lpNumber: string,
  material: ConsumptionMaterial
): Promise<LPValidationResult> {
  try {
    // Search for LP by number
    const lps = await getAvailableLPs(woId, material.product_id, material.uom, lpNumber)

    // Find exact match
    const lp = lps.find((l) => l.lp_number === lpNumber)

    if (!lp) {
      return {
        valid: false,
        error: 'LP not found',
        errorCode: 'LP_NOT_FOUND',
      }
    }

    // Check status
    if (lp.status !== 'available') {
      return {
        valid: false,
        error: `LP not available (status: ${lp.status})`,
        errorCode: 'LP_NOT_AVAILABLE',
      }
    }

    // Check QA status
    if (lp.qa_status === 'on_hold' || lp.qa_status === 'rejected') {
      return {
        valid: false,
        error: `LP on QA hold (status: ${lp.qa_status})`,
        errorCode: 'LP_QA_HOLD',
      }
    }

    // Check expiry
    if (lp.expiry_date) {
      const today = new Date().toISOString().split('T')[0]
      if (lp.expiry_date < today) {
        return {
          valid: false,
          error: 'LP is expired',
          errorCode: 'LP_EXPIRED',
        }
      }
    }

    // Check product match
    if (lp.product_id !== material.product_id) {
      return {
        valid: false,
        error: `Product mismatch: LP contains different product`,
        errorCode: 'PRODUCT_MISMATCH',
      }
    }

    // Check UoM match
    if (lp.uom !== material.uom) {
      return {
        valid: false,
        error: `UoM mismatch: LP is ${lp.uom}, material requires ${material.uom}`,
        errorCode: 'UOM_MISMATCH',
      }
    }

    return { valid: true, lp }
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Validation failed',
      errorCode: 'VALIDATION_ERROR',
    }
  }
}

/**
 * Record material consumption
 * Note: Uses reservation-based API - creates reservation then consumes
 */
export async function recordConsumption(
  woId: string,
  request: ConsumeRequest
): Promise<ConsumptionResult> {
  // First, create a reservation for the LP
  const reserveResponse = await fetch(
    `${API_BASE}/${woId}/materials/reserve`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        material_id: request.wo_material_id,
        lp_id: request.lp_id,
        reserved_qty: request.consume_qty,
        notes: request.notes,
      }),
    }
  )

  if (!reserveResponse.ok) {
    const error = await reserveResponse.json()
    throw new Error(error.message || error.error || 'Failed to reserve material')
  }

  const reservation = await reserveResponse.json()

  // Then consume from the reservation
  const consumeResponse = await fetch(`${API_BASE}/${woId}/consume`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      reservation_id: reservation.data?.id || reservation.id,
      qty: request.consume_qty,
      notes: request.notes,
    }),
  })

  if (!consumeResponse.ok) {
    const error = await consumeResponse.json()
    throw new Error(error.error || 'Failed to record consumption')
  }

  return consumeResponse.json()
}

/**
 * Reverse a consumption record
 */
export async function reverseConsumption(
  woId: string,
  request: ReversalRequest
): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/${woId}/consume/reverse`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      consumption_id: request.consumption_id,
      reason: request.reason,
      notes: request.notes,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to reverse consumption')
  }

  return response.json()
}
