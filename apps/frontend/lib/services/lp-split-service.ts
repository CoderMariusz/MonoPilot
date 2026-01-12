/**
 * LP Split Service (Story 05.17)
 * Purpose: Business logic for LP Split operation
 *
 * Exports:
 * - LPSplitService: Static class with split methods
 *   - validateSplitLP(): Validate split parameters
 *   - splitLP(): Execute split operation
 *   - getLPById(): Fetch LP with joins
 *   - getWarehouseSettings(): Check settings
 *   - previewSplit(): Preview split result
 *
 * Acceptance Criteria Coverage:
 * - AC-2, AC-3, AC-4: Split Quantity Validation
 * - AC-6: Settings Toggle Check
 * - AC-7, AC-8: Split Operation Execution
 * - AC-9: Split Inherits All Tracking Fields
 * - AC-10: Split Status Validation
 * - AC-11: Split QA Status Warning
 * - AC-12: Transaction Atomicity
 * - AC-13: Auto-Generated LP Number
 * - AC-22: RLS Permission Check
 * - AC-23: Performance (<300ms)
 * - AC-25: Decimal Handling
 */

import type { SupabaseClient } from '@supabase/supabase-js'

// =============================================================================
// Type Definitions
// =============================================================================

export interface SplitLPRequest {
  lpId: string
  splitQty: number
  destinationLocationId?: string
  orgId?: string
  userId?: string
}

export interface SplitLPResult {
  success: boolean
  sourceLp: {
    id: string
    lpNumber: string
    quantity: number
    location?: { id: string; name: string }
  }
  newLp: {
    id: string
    lpNumber: string
    quantity: number
    location?: { id: string; name: string }
  }
  genealogyId: string
}

export interface SplitValidationResult {
  valid: boolean
  error?: string
  warning?: string
  remainingQty?: number
}

export interface SplitPreviewResult {
  sourceAfter: {
    quantity: number
  }
  newLp: {
    quantity: number
    estimatedLpNumber?: string
  }
}

export interface WarehouseSettings {
  org_id: string
  enable_split_merge: boolean
}

export interface LicensePlate {
  id: string
  org_id: string
  lp_number: string
  product_id: string
  quantity: number
  uom: string
  status: string
  qa_status: string
  warehouse_id: string
  location_id: string
  batch_number: string | null
  supplier_batch_number: string | null
  expiry_date: string | null
  manufacture_date: string | null
  location?: { id: string; name: string }
  warehouse?: { id: string; name: string }
}

// =============================================================================
// LP Split Service
// =============================================================================

export class LPSplitService {
  /**
   * Validate split request before execution
   * Checks: settings, LP status, quantity, QA status warning
   *
   * @param supabase - Supabase client
   * @param lpId - Source LP ID
   * @param splitQty - Quantity to split off
   * @returns Validation result with error/warning messages
   */
  static async validateSplitLP(
    supabase: SupabaseClient,
    lpId: string,
    splitQty: number
  ): Promise<SplitValidationResult> {
    // 1. Check warehouse settings
    const { data: settings, error: settingsError } = await supabase
      .from('warehouse_settings')
      .select('org_id, enable_split_merge')
      .single()

    if (settingsError || !settings) {
      return { valid: false, error: 'Warehouse settings not found' }
    }

    if (!settings.enable_split_merge) {
      return { valid: false, error: 'Split/merge operations are disabled in settings' }
    }

    // 2. Fetch source LP
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select(`
        *,
        location:locations(id, name),
        warehouse:warehouses(id, name)
      `)
      .eq('id', lpId)
      .single()

    if (lpError || !lp) {
      return { valid: false, error: 'License Plate not found' }
    }

    // 3. Check quantity validation (zero/negative)
    if (splitQty <= 0) {
      return { valid: false, error: 'Split quantity must be greater than 0' }
    }

    // 4. Validate LP status (must be available)
    if (lp.status !== 'available') {
      return {
        valid: false,
        error: `Cannot split LP. Status must be 'available'. Current status: ${lp.status}`,
      }
    }

    // 5. Check split quantity against source quantity
    if (splitQty >= lp.quantity) {
      return {
        valid: false,
        error: `Split quantity must be less than LP quantity (${lp.quantity} ${lp.uom})`,
      }
    }

    // 6. Calculate remaining quantity
    const remainingQty = Number((lp.quantity - splitQty).toFixed(4))

    // 7. Check QA status for warning (non-blocking)
    let warning: string | undefined
    if (lp.qa_status && lp.qa_status !== 'passed') {
      warning = `This LP has QA status: ${lp.qa_status}. Split will inherit this status.`
    }

    return { valid: true, warning, remainingQty }
  }

  /**
   * Execute LP split operation
   * Uses RPC function for atomic transaction
   *
   * @param supabase - Supabase client
   * @param request - Split request parameters
   * @returns Split result with source LP, new LP, and genealogy ID
   * @throws Error if split fails
   */
  static async splitLP(
    supabase: SupabaseClient,
    request: SplitLPRequest
  ): Promise<SplitLPResult> {
    const { lpId, splitQty, destinationLocationId, orgId, userId } = request

    // Call RPC function for atomic split
    const { data, error } = await supabase.rpc('split_license_plate', {
      p_source_lp_id: lpId,
      p_org_id: orgId,
      p_split_qty: splitQty,
      p_destination_location_id: destinationLocationId || null,
      p_user_id: userId || null,
    })

    if (error) {
      throw new Error(error.message)
    }

    return data as SplitLPResult
  }

  /**
   * Get LP by ID with location and warehouse joins
   *
   * @param supabase - Supabase client
   * @param lpId - LP ID to fetch
   * @returns LP data with joins or null if not found
   */
  static async getLPById(
    supabase: SupabaseClient,
    lpId: string
  ): Promise<LicensePlate | null> {
    const { data, error } = await supabase
      .from('license_plates')
      .select(`
        *,
        location:locations(id, name),
        warehouse:warehouses(id, name)
      `)
      .eq('id', lpId)
      .single()

    if (error || !data) {
      return null
    }

    return data as LicensePlate
  }

  /**
   * Get warehouse settings for org
   *
   * @param supabase - Supabase client
   * @param orgId - Organization ID
   * @returns Settings or null if not found
   */
  static async getWarehouseSettings(
    supabase: SupabaseClient,
    orgId: string
  ): Promise<WarehouseSettings | null> {
    const { data, error } = await supabase
      .from('warehouse_settings')
      .select('org_id, enable_split_merge')
      .eq('org_id', orgId)
      .single()

    if (error || !data) {
      return null
    }

    return data as WarehouseSettings
  }

  /**
   * Preview split result before execution
   * Returns calculated quantities and estimated LP number
   *
   * @param supabase - Supabase client
   * @param lpId - Source LP ID
   * @param splitQty - Quantity to split off
   * @returns Preview result
   */
  static async previewSplit(
    supabase: SupabaseClient,
    lpId: string,
    splitQty: number
  ): Promise<SplitPreviewResult> {
    // Query settings first (same as validateSplitLP)
    const { data: settings } = await supabase
      .from('warehouse_settings')
      .select('org_id, enable_split_merge')
      .single()

    // Fetch LP for current quantity (same query used in validateSplitLP)
    const { data: lp } = await supabase
      .from('license_plates')
      .select(`
        *,
        location:locations(id, name),
        warehouse:warehouses(id, name)
      `)
      .eq('id', lpId)
      .single()

    // Get next LP number estimate
    let estimatedLpNumber: string | undefined
    try {
      const { data: lpNum } = await supabase.rpc('generate_lp_number')
      estimatedLpNumber = lpNum
    } catch {
      // Non-fatal - preview still works without LP number
    }

    const currentQty = lp?.quantity || 0
    const remainingQty = Number((currentQty - splitQty).toFixed(4))

    return {
      sourceAfter: {
        quantity: remainingQty,
      },
      newLp: {
        quantity: splitQty,
        estimatedLpNumber,
      },
    }
  }
}
