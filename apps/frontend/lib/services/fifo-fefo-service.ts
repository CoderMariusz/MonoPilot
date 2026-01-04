/**
 * FIFO/FEFO Picking Service (Story 05.3)
 * Purpose: Provide FIFO/FEFO picking algorithms for LP selection
 *
 * CRITICAL for Epic 04.8 (Material Reservations):
 * - findAvailableLPs(): Get LPs sorted by FIFO/FEFO strategy
 * - getPickingStrategy(): Get strategy from warehouse settings
 * - checkFIFOFEFOViolation(): Detect FIFO/FEFO violations
 *
 * Algorithms:
 * - FIFO: ORDER BY created_at ASC (oldest first)
 * - FEFO: ORDER BY expiry_date ASC, created_at ASC (soonest expiry first)
 *
 * Architecture: Service accepts Supabase client as parameter to support
 * both server-side (API routes) and client-side usage.
 *
 * Security: All queries enforce org_id isolation (ADR-013). RLS enabled.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { AvailableLP, ViolationResult, PickingStrategy } from '@/lib/validation/reservation-schemas'

// =============================================================================
// Types
// =============================================================================

export interface FindAvailableLPsOptions {
  warehouseId?: string
  locationId?: string
  strategy?: PickingStrategy
  limit?: number
}

// =============================================================================
// Settings Integration
// =============================================================================

/**
 * Get the current picking strategy from warehouse settings
 * FEFO takes precedence over FIFO when both are enabled
 *
 * @param supabase - Supabase client
 * @returns PickingStrategy - 'fifo' | 'fefo' | 'none'
 */
export async function getPickingStrategy(supabase: SupabaseClient): Promise<PickingStrategy> {
  // Get user's org_id
  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) {
    return 'fifo' // Default
  }

  const { data: user } = await supabase
    .from('users')
    .select('org_id')
    .eq('id', userData.user.id)
    .single()

  if (!user?.org_id) {
    return 'fifo' // Default
  }

  // Get warehouse settings
  const { data: settings, error } = await supabase
    .from('warehouse_settings')
    .select('enable_fifo, enable_fefo')
    .eq('org_id', user.org_id)
    .single()

  if (error || !settings) {
    return 'fifo' // Default
  }

  // FEFO takes precedence
  if (settings.enable_fefo) {
    return 'fefo'
  }

  if (settings.enable_fifo) {
    return 'fifo'
  }

  return 'none'
}

// =============================================================================
// Core FIFO/FEFO Algorithm
// =============================================================================

/**
 * Find available LPs for a product using FIFO/FEFO strategy
 *
 * Filters:
 * - status = 'available'
 * - qa_status = 'passed'
 * - Not expired (expiry_date >= today OR expiry_date IS NULL)
 * - available_qty > 0 (quantity - active reservations)
 *
 * Sorting:
 * - FIFO: created_at ASC
 * - FEFO: expiry_date ASC (NULLS LAST), created_at ASC
 *
 * @param supabase - Supabase client
 * @param productId - Product to find LPs for
 * @param options - Filters and strategy
 * @returns Sorted list of available LPs with suggestion markers
 */
export async function findAvailableLPs(
  supabase: SupabaseClient,
  productId: string,
  options?: FindAvailableLPsOptions
): Promise<AvailableLP[]> {
  const { warehouseId, locationId, strategy: requestedStrategy, limit = 100 } = options || {}

  // Determine strategy
  const strategy = requestedStrategy || (await getPickingStrategy(supabase))

  // Get today's date for expiry filter
  const today = new Date().toISOString().split('T')[0]

  // Build base query
  let query = supabase
    .from('license_plates')
    .select(`
      id,
      lp_number,
      product_id,
      quantity,
      uom,
      location_id,
      warehouse_id,
      batch_number,
      expiry_date,
      created_at,
      qa_status,
      status
    `)
    .eq('product_id', productId)
    .eq('status', 'available')
    .eq('qa_status', 'passed')

  // Exclude expired LPs (include NULL expiry_date)
  query = query.or(`expiry_date.is.null,expiry_date.gte.${today}`)

  // Apply optional filters
  if (warehouseId) {
    query = query.eq('warehouse_id', warehouseId)
  }

  if (locationId) {
    query = query.eq('location_id', locationId)
  }

  // Apply sorting based on strategy
  if (strategy === 'fefo') {
    // FEFO: expiry_date ASC (NULLS LAST), then created_at ASC
    query = query
      .order('expiry_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
  } else if (strategy === 'fifo') {
    // FIFO: created_at ASC
    query = query.order('created_at', { ascending: true })
  }
  // 'none' - no specific ordering

  // Apply limit
  query = query.limit(limit)

  // Execute query
  const { data: lps, error } = await query

  if (error) {
    throw new Error(`Failed to fetch available LPs: ${error.message}`)
  }

  if (!lps || lps.length === 0) {
    return []
  }

  // Get active reservations for these LPs
  const lpIds = lps.map((lp) => lp.id)

  const { data: reservations } = await supabase
    .from('lp_reservations')
    .select('lp_id, reserved_qty, consumed_qty')
    .in('lp_id', lpIds)
    .eq('status', 'active')

  // Create reservation map
  const reservationMap = new Map<string, number>()
  for (const r of reservations || []) {
    const current = reservationMap.get(r.lp_id) || 0
    reservationMap.set(r.lp_id, current + Number(r.reserved_qty) - Number(r.consumed_qty))
  }

  // Build result with available_qty
  const result: AvailableLP[] = []

  for (let i = 0; i < lps.length; i++) {
    const lp = lps[i]
    const reserved = reservationMap.get(lp.id) || 0
    const available_qty = Number(lp.quantity) - reserved

    if (available_qty > 0) {
      const isFirst = result.length === 0

      result.push({
        id: lp.id,
        lp_number: lp.lp_number,
        product_id: lp.product_id,
        quantity: Number(lp.quantity),
        available_qty,
        uom: lp.uom,
        location_id: lp.location_id,
        warehouse_id: lp.warehouse_id,
        batch_number: lp.batch_number,
        expiry_date: lp.expiry_date,
        created_at: lp.created_at,
        qa_status: lp.qa_status,
        status: lp.status,
        suggested: isFirst,
        suggestion_reason: isFirst ? getSuggestionReason(strategy, lp) : undefined,
      })
    }
  }

  return result
}

/**
 * Generate suggestion reason text
 */
function getSuggestionReason(
  strategy: PickingStrategy,
  lp: { expiry_date: string | null; created_at: string }
): string {
  if (strategy === 'fefo' && lp.expiry_date) {
    return `FEFO: expires ${lp.expiry_date}`
  }
  if (strategy === 'fifo') {
    return 'FIFO: oldest'
  }
  return 'First available'
}

// =============================================================================
// FIFO/FEFO Violation Detection
// =============================================================================

/**
 * Check if selecting a specific LP violates FIFO/FEFO rules
 * Returns violation details if the selected LP is not the suggested one
 *
 * @param supabase - Supabase client
 * @param selectedLpId - LP the user wants to select
 * @param productId - Product ID for finding available LPs
 * @param strategy - Strategy to check against
 * @returns ViolationResult with details
 */
export async function checkFIFOFEFOViolation(
  supabase: SupabaseClient,
  selectedLpId: string,
  productId: string,
  strategy: PickingStrategy
): Promise<ViolationResult> {
  // Get available LPs with strategy
  const availableLPs = await findAvailableLPs(supabase, productId, { strategy })

  if (availableLPs.length === 0) {
    return { hasViolation: false }
  }

  // Find the suggested LP (first one)
  const suggestedLP = availableLPs[0]

  // Find the selected LP
  const selectedLP = availableLPs.find((lp) => lp.id === selectedLpId)

  if (!selectedLP) {
    return { hasViolation: false }
  }

  // If selected is the suggested, no violation
  if (selectedLpId === suggestedLP.id) {
    return { hasViolation: false }
  }

  // Generate violation message
  let message: string

  if (strategy === 'fifo') {
    message = `FIFO violation: ${selectedLP.lp_number} is newer than suggested ${suggestedLP.lp_number}`
  } else if (strategy === 'fefo') {
    const suggestedExpiry = suggestedLP.expiry_date || 'no expiry'
    const selectedExpiry = selectedLP.expiry_date || 'no expiry'
    message = `FEFO violation: ${selectedLP.lp_number} expires later (${selectedExpiry}) than suggested ${suggestedLP.lp_number} (${suggestedExpiry})`
  } else {
    return { hasViolation: false }
  }

  return {
    hasViolation: true,
    violationType: strategy as 'fifo' | 'fefo',
    message,
    suggestedLP,
    selectedLP,
  }
}

// =============================================================================
// Export as FIFOFEFOService
// =============================================================================

export const FIFOFEFOService = {
  getPickingStrategy,
  findAvailableLPs,
  checkFIFOFEFOViolation,
}
