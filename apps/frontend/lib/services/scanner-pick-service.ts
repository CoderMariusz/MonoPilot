/**
 * Scanner Pick Service (Story 07.10)
 * Mobile pick workflow operations for scanner devices
 *
 * Provides:
 * - confirmPick: Confirm a pick with LP validation and auto-advance
 * - lookupLP: Fast LP lookup for scanner validation
 * - suggestPick: Get suggested LP based on FIFO/FEFO
 * - startPickList: Update pick list status to in_progress
 * - completePickList: Mark pick list as complete
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ScannerPickInput } from '@/lib/validation/scanner-pick-schema'
import type {
  PickProgress,
  LPLookupResult as BaseLPLookupResult,
  PickCompleteSummary,
} from '@/lib/types/scanner-pick'

// =============================================================================
// Types (re-export from types file for backward compatibility)
// =============================================================================

export type { PickProgress, PickCompleteSummary }

// Service-specific types that extend or differ from base types
export interface PickLinePreview {
  id: string
  pick_sequence: number
  location_path: string
  product_name: string
  quantity_to_pick: number
  expected_lp: string | null
}

export interface ScannerPickResponse {
  success: boolean
  pick_line_status: 'picked' | 'short'
  next_line: PickLinePreview | null
  progress: PickProgress
  pick_list_complete: boolean
}

// LPLookupResult in service allows null lot_number (more flexible than types file)
export interface LPLookupResult {
  lp_number: string
  product_id: string
  product_name: string
  product_sku: string
  lot_number: string | null
  best_before_date: string | null
  on_hand_quantity: number
  location_id: string
  location_path: string
  allergens: string[]
  qa_status: string
}

export interface AlternateLP {
  lp_number: string
  lp_id: string
  mfg_date: string | null
  bbd_date: string | null
}

export interface PickSuggestionResult {
  suggested_lp: string
  suggested_lp_id: string
  alternate_lps: AlternateLP[]
  fifo_warning: boolean
  fefo_warning: boolean
}

// Alias for backward compatibility
export type PickListSummary = PickCompleteSummary

// =============================================================================
// Custom Error Class
// =============================================================================

export class ScannerPickError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number = 400
  ) {
    super(message)
    this.name = 'ScannerPickError'
  }
}

// =============================================================================
// Service Implementation
// =============================================================================

export class ScannerPickService {
  /**
   * Confirm a pick via scanner
   * Validates LP, updates pick line, returns next line preview
   */
  static async confirmPick(
    supabase: SupabaseClient,
    orgId: string,
    userId: string,
    input: ScannerPickInput
  ): Promise<ScannerPickResponse> {
    const now = new Date().toISOString()

    // 1. Get pick line with related data
    const { data: pickLine, error: lineError } = await supabase
      .from('pick_list_lines')
      .select(`
        id,
        pick_list_id,
        product_id,
        location_id,
        quantity_to_pick,
        quantity_picked,
        status,
        pick_sequence,
        license_plate_id,
        pick_lists!inner(org_id, status)
      `)
      .eq('id', input.pick_line_id)
      .single()

    if (lineError || !pickLine) {
      throw new ScannerPickError('Pick line not found', 'NOT_FOUND', 404)
    }

    // Verify org_id via pick_lists RLS
    if ((pickLine as any).pick_lists?.org_id !== orgId) {
      throw new ScannerPickError('Pick line not found', 'NOT_FOUND', 404)
    }

    // Check if line is still pending
    if (pickLine.status !== 'pending') {
      throw new ScannerPickError('Line already picked', 'LINE_ALREADY_PICKED', 409)
    }

    // 2. Look up the scanned LP
    const { data: scannedLP, error: lpError } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        product_id,
        quantity,
        location_id,
        org_id
      `)
      .eq('org_id', orgId)
      .or(`lp_number.eq.${input.scanned_lp_barcode},id.eq.${input.scanned_lp_barcode}`)
      .single()

    if (lpError || !scannedLP) {
      throw new ScannerPickError('LP not found', 'NOT_FOUND', 404)
    }

    // 3. Validate LP matches expected (if there's an expected LP)
    if (pickLine.license_plate_id && scannedLP.id !== pickLine.license_plate_id) {
      // Get expected LP number for error message
      const { data: expectedLP } = await supabase
        .from('license_plates')
        .select('lp_number')
        .eq('id', pickLine.license_plate_id)
        .single()

      const expectedLpNumber = expectedLP?.lp_number || pickLine.license_plate_id
      throw new ScannerPickError(
        `Wrong LP - Expected ${expectedLpNumber}`,
        'LP_MISMATCH',
        400
      )
    }

    // 4. Validate quantity doesn't exceed available
    const lpOnHand = Number(scannedLP.quantity) || 0
    if (input.quantity_picked > lpOnHand) {
      throw new ScannerPickError(
        `Quantity exceeds available (max ${lpOnHand})`,
        'QUANTITY_EXCEEDS_AVAILABLE',
        400
      )
    }

    // 5. Determine line status
    const lineStatus = input.short_pick ? 'short' : 'picked'

    // 6. Update pick_list_lines
    const { error: updateError } = await supabase
      .from('pick_list_lines')
      .update({
        quantity_picked: input.quantity_picked,
        status: lineStatus,
        picked_at: now,
        picked_by: userId,
        picked_license_plate_id: scannedLP.id,
        short_pick_reason: input.short_pick_reason || null,
        short_pick_notes: input.short_pick_notes || null,
      })
      .eq('id', input.pick_line_id)

    if (updateError) {
      throw new ScannerPickError('Failed to update pick line', 'INTERNAL_ERROR', 500)
    }

    // 7. Update LP quantity
    const newQty = lpOnHand - input.quantity_picked
    await supabase
      .from('license_plates')
      .update({
        quantity: newQty,
        allocated_quantity: Math.max(0, (Number(scannedLP.quantity) || 0) - input.quantity_picked),
      })
      .eq('id', scannedLP.id)
      .eq('org_id', orgId)

    // 8. If short pick, could create backorder (optional, depends on business logic)
    // For now, just record the short pick reason

    // 9. Get all lines to calculate progress
    const { data: allLines } = await supabase
      .from('pick_list_lines')
      .select('id, status, pick_sequence')
      .eq('pick_list_id', pickLine.pick_list_id)
      .order('pick_sequence', { ascending: true })

    const lines = allLines || []
    const totalLines = lines.length
    const pickedLines = lines.filter((l: any) => l.status === 'picked').length
    const shortLines = lines.filter((l: any) => l.status === 'short').length
    const pendingLines = lines.filter((l: any) => l.status === 'pending')
    const pickListComplete = pendingLines.length === 0

    // 10. Get next line preview if not complete
    let nextLine: PickLinePreview | null = null
    if (pendingLines.length > 0) {
      const nextPendingLine = pendingLines[0]
      const { data: nextLineData } = await supabase
        .from('pick_list_lines')
        .select(`
          id,
          pick_sequence,
          quantity_to_pick,
          license_plate_id,
          products!inner(name),
          locations!inner(code, zones!inner(name))
        `)
        .eq('id', nextPendingLine.id)
        .single()

      if (nextLineData) {
        const product = (nextLineData as any).products
        const location = (nextLineData as any).locations
        const zone = location?.zones

        // Get expected LP number
        let expectedLp: string | null = null
        if (nextLineData.license_plate_id) {
          const { data: lpData } = await supabase
            .from('license_plates')
            .select('lp_number')
            .eq('id', nextLineData.license_plate_id)
            .single()
          expectedLp = lpData?.lp_number || null
        }

        nextLine = {
          id: nextLineData.id,
          pick_sequence: nextLineData.pick_sequence,
          location_path: `${zone?.name || ''} / ${location?.code || ''}`,
          product_name: product?.name || '',
          quantity_to_pick: Number(nextLineData.quantity_to_pick),
          expected_lp: expectedLp,
        }
      }
    }

    // 11. If complete, update pick list status
    if (pickListComplete) {
      await supabase
        .from('pick_lists')
        .update({
          status: 'completed',
          completed_at: now,
        })
        .eq('id', pickLine.pick_list_id)
        .eq('org_id', orgId)
    }

    return {
      success: true,
      pick_line_status: lineStatus,
      next_line: nextLine,
      progress: {
        total_lines: totalLines,
        picked_lines: pickedLines,
        short_lines: shortLines,
      },
      pick_list_complete: pickListComplete,
    }
  }

  /**
   * Fast LP lookup for scanner validation
   */
  static async lookupLP(
    supabase: SupabaseClient,
    orgId: string,
    barcode: string
  ): Promise<LPLookupResult | null> {
    const { data: lp, error } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        product_id,
        quantity,
        location_id,
        supplier_batch_number,
        expiry_date,
        status,
        products!inner(
          id,
          name,
          code,
          product_allergens(allergen:allergens(name))
        ),
        locations!inner(
          id,
          code,
          zones!inner(name)
        )
      `)
      .eq('org_id', orgId)
      .or(`lp_number.eq.${barcode},id.eq.${barcode}`)
      .single()

    if (error || !lp) {
      return null
    }

    const product = (lp as any).products
    const location = (lp as any).locations
    const zone = location?.zones

    // Extract allergen names
    const allergens = (product?.product_allergens || [])
      .map((pa: any) => pa?.allergen?.name)
      .filter(Boolean) as string[]

    return {
      lp_number: lp.lp_number,
      product_id: product?.id || lp.product_id,
      product_name: product?.name || '',
      product_sku: product?.code || '',
      lot_number: lp.supplier_batch_number,
      best_before_date: lp.expiry_date,
      on_hand_quantity: Number(lp.quantity) || 0,
      location_id: location?.id || lp.location_id,
      location_path: `${zone?.name || ''} / ${location?.code || ''}`,
      allergens,
      qa_status: lp.status === 'quarantine' ? 'hold' : 'passed',
    }
  }

  /**
   * Get suggested LP based on FIFO/FEFO
   */
  static async suggestPick(
    supabase: SupabaseClient,
    orgId: string,
    lineId: string
  ): Promise<PickSuggestionResult> {
    // Get pick line details
    const { data: pickLine, error: lineError } = await supabase
      .from('pick_list_lines')
      .select(`
        id,
        product_id,
        location_id,
        quantity_to_pick,
        license_plate_id,
        pick_lists!inner(org_id)
      `)
      .eq('id', lineId)
      .single()

    if (lineError || !pickLine) {
      throw new ScannerPickError('Pick line not found', 'NOT_FOUND', 404)
    }

    // Verify org_id
    if ((pickLine as any).pick_lists?.org_id !== orgId) {
      throw new ScannerPickError('Pick line not found', 'NOT_FOUND', 404)
    }

    // Get available LPs for this product at the location
    const { data: lps, error: lpError } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        quantity,
        manufacturing_date,
        expiry_date
      `)
      .eq('org_id', orgId)
      .eq('product_id', pickLine.product_id)
      .eq('location_id', pickLine.location_id)
      .eq('status', 'available')
      .gt('quantity', 0)
      .order('manufacturing_date', { ascending: true, nullsFirst: false })
      .order('expiry_date', { ascending: true, nullsFirst: false })

    if (lpError || !lps || lps.length === 0) {
      throw new ScannerPickError('No available LPs found', 'NOT_FOUND', 404)
    }

    // First LP is the suggested one (oldest mfg or earliest expiry)
    const suggestedLP = lps[0]

    // Build alternate LPs list
    const alternateLPs: AlternateLP[] = lps.map((lp: any) => ({
      lp_number: lp.lp_number,
      lp_id: lp.id,
      mfg_date: lp.manufacturing_date,
      bbd_date: lp.expiry_date,
    }))

    return {
      suggested_lp: suggestedLP.lp_number,
      suggested_lp_id: suggestedLP.id,
      alternate_lps: alternateLPs,
      fifo_warning: false, // Will be true if user picks non-oldest
      fefo_warning: false, // Will be true if user picks non-earliest expiry
    }
  }

  /**
   * Start a pick list (transition from assigned to in_progress)
   */
  static async startPickList(
    supabase: SupabaseClient,
    orgId: string,
    userId: string,
    pickListId: string
  ): Promise<void> {
    const now = new Date().toISOString()

    // Get pick list
    const { data: pickList, error: fetchError } = await supabase
      .from('pick_lists')
      .select('id, status, assigned_to')
      .eq('id', pickListId)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !pickList) {
      throw new ScannerPickError('Pick list not found', 'NOT_FOUND', 404)
    }

    // Validate status transition
    if (pickList.status === 'in_progress') {
      throw new ScannerPickError('Pick list already in progress', 'ALREADY_IN_PROGRESS', 409)
    }

    if (pickList.status === 'completed') {
      throw new ScannerPickError('Pick list already completed', 'ALREADY_COMPLETED', 409)
    }

    if (pickList.status !== 'assigned') {
      throw new ScannerPickError('Invalid status transition', 'INVALID_STATUS', 409)
    }

    // Update status
    const { error: updateError } = await supabase
      .from('pick_lists')
      .update({
        status: 'in_progress',
        started_at: now,
      })
      .eq('id', pickListId)
      .eq('org_id', orgId)

    if (updateError) {
      throw new ScannerPickError('Failed to start pick list', 'INTERNAL_ERROR', 500)
    }
  }

  /**
   * Complete a pick list (mark as completed when all lines done)
   */
  static async completePickList(
    supabase: SupabaseClient,
    orgId: string,
    pickListId: string
  ): Promise<PickListSummary> {
    const now = new Date().toISOString()

    // Get pick list
    const { data: pickList, error: fetchError } = await supabase
      .from('pick_lists')
      .select('id, status, started_at')
      .eq('id', pickListId)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !pickList) {
      throw new ScannerPickError('Pick list not found', 'NOT_FOUND', 404)
    }

    // Get all lines
    const { data: lines, error: linesError } = await supabase
      .from('pick_list_lines')
      .select('id, status, quantity_picked')
      .eq('pick_list_id', pickListId)

    if (linesError) {
      throw new ScannerPickError('Failed to fetch lines', 'INTERNAL_ERROR', 500)
    }

    const allLines = lines || []
    const pendingLines = allLines.filter((l: any) => l.status === 'pending')

    // Validate all lines are picked or short
    if (pendingLines.length > 0) {
      throw new ScannerPickError(
        'Cannot complete: some lines still pending',
        'NOT_ALL_PICKED',
        400
      )
    }

    // Update status
    const { error: updateError } = await supabase
      .from('pick_lists')
      .update({
        status: 'completed',
        completed_at: now,
      })
      .eq('id', pickListId)
      .eq('org_id', orgId)

    if (updateError) {
      throw new ScannerPickError('Failed to complete pick list', 'INTERNAL_ERROR', 500)
    }

    // Calculate summary
    const pickedLines = allLines.filter((l: any) => l.status === 'picked')
    const shortLines = allLines.filter((l: any) => l.status === 'short')
    const totalQty = allLines.reduce((sum: number, l: any) => sum + Number(l.quantity_picked || 0), 0)

    // Calculate duration
    let durationMinutes = 0
    if (pickList.started_at) {
      const startTime = new Date(pickList.started_at).getTime()
      const endTime = new Date(now).getTime()
      durationMinutes = Math.round((endTime - startTime) / (1000 * 60))
    }

    return {
      total_lines: allLines.length,
      picked_lines: pickedLines.length,
      short_picks: shortLines.length,
      total_qty: totalQty,
      duration_minutes: durationMinutes,
    }
  }
}
