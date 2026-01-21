/**
 * Scanner Move Service (Story 05.20)
 * Purpose: Business logic for scanner-based LP move operations
 *
 * SECURITY (ADR-013 compliance):
 * - SQL Injection: SAFE - Supabase client uses parameterized queries via PostgREST.
 * - org_id Isolation: SAFE - RLS policies enforce org_id filtering at database level.
 * - XSS: SAFE - React auto-escapes all rendered values.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  LPLookupResult,
  LocationLookupResult,
  MoveValidationResult,
  ScannerMoveResult,
  RecentMoveResult,
} from '@/lib/validation/scanner-move'

// =============================================================================
// Types
// =============================================================================

export interface ScannerMoveInput {
  lpId: string
  toLocationId: string
  notes?: string
}

// =============================================================================
// Scanner Move Service Class
// =============================================================================

export class ScannerMoveService {
  /**
   * Execute scanner move - main handler
   * - Validates LP (exists, available status)
   * - Validates destination (exists, active)
   * - Creates stock_move via RPC (atomic)
   * - Updates LP.location_id (handled by RPC)
   */
  static async processMove(
    supabase: SupabaseClient,
    input: ScannerMoveInput
  ): Promise<ScannerMoveResult> {
    const { lpId, toLocationId, notes } = input

    // 1. Validate LP exists and is available
    const lp = await this.getLPById(supabase, lpId)
    if (!lp) {
      throw new Error('License Plate not found')
    }

    // 2. Check LP status
    const canMoveResult = this.validateLPStatus(lp.status)
    if (!canMoveResult.canMove) {
      throw new Error(canMoveResult.reason || 'LP not available for movement')
    }

    // 3. Validate destination location exists and is active
    const destination = await this.getLocationById(supabase, toLocationId)
    if (!destination) {
      throw new Error('Destination location not found')
    }

    if (!destination.is_active) {
      throw new Error('Destination location is inactive')
    }

    // 4. Check same location
    if (lp.location_id === toLocationId) {
      throw new Error('Source and destination locations are the same')
    }

    // 5. Get user's org_id
    const { data: userData } = await supabase.auth.getUser()
    const userId = userData?.user?.id

    const { data: userRecord } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', userId)
      .single()

    const orgId = userRecord?.org_id

    // 6. Execute stock move via RPC (atomic)
    const { data: moveId, error: moveError } = await supabase.rpc('execute_stock_move', {
      p_org_id: orgId,
      p_lp_id: lpId,
      p_move_type: 'transfer',
      p_to_location_id: toLocationId,
      p_quantity: null, // Use full LP quantity
      p_reason: notes || null,
      p_reason_code: null,
      p_wo_id: null,
      p_reference_id: null,
      p_reference_type: 'manual',
      p_created_by: userId,
    })

    if (moveError) {
      throw new Error(`Failed to execute move: ${moveError.message}`)
    }

    // 7. Fetch created stock_move
    const { data: stockMove, error: fetchError } = await supabase
      .from('stock_moves')
      .select('id, move_number, move_type, from_location_id, to_location_id, quantity, status, move_date')
      .eq('id', moveId)
      .single()

    if (fetchError || !stockMove) {
      throw new Error('Move created but failed to fetch details')
    }

    // 8. Get updated LP with new location
    const { data: updatedLP, error: lpFetchError } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        location_id,
        quantity,
        uom,
        product:products(name)
      `)
      .eq('id', lpId)
      .single()

    if (lpFetchError || !updatedLP) {
      throw new Error('Failed to fetch updated LP')
    }

    // 9. Get destination location path
    const { data: locationPath } = await supabase
      .from('locations')
      .select('full_path')
      .eq('id', toLocationId)
      .single()

    return {
      stock_move: {
        id: stockMove.id,
        move_number: stockMove.move_number,
        move_type: 'transfer',
        from_location_id: stockMove.from_location_id,
        to_location_id: stockMove.to_location_id,
        quantity: Number(stockMove.quantity),
        status: 'completed',
        move_date: stockMove.move_date,
      },
      lp: {
        id: updatedLP.id,
        lp_number: updatedLP.lp_number,
        location_id: updatedLP.location_id,
        location_path: locationPath?.full_path || '',
        product_name: (updatedLP.product as { name: string } | null)?.name || '',
        quantity: Number(updatedLP.quantity),
        uom: updatedLP.uom,
      },
    }
  }

  /**
   * Validate move without executing
   * Returns errors/warnings for UI feedback
   */
  static async validateMove(
    supabase: SupabaseClient,
    lpId: string,
    toLocationId: string
  ): Promise<MoveValidationResult> {
    const errors: Array<{ field: string; message: string }> = []
    const warnings: Array<{ code: string; message: string }> = []
    let lpResult: LPLookupResult | undefined
    let destinationResult: LocationLookupResult | undefined

    // 1. Lookup LP
    const lp = await this.getLPById(supabase, lpId)
    if (!lp) {
      errors.push({ field: 'lp_id', message: 'License Plate not found' })
      return { valid: false, errors, warnings }
    }

    // Transform to lookup result
    lpResult = {
      id: lp.id,
      lp_number: lp.lp_number,
      product: {
        id: lp.product_id,
        name: (lp.product as { name: string; code: string } | null)?.name || '',
        sku: (lp.product as { name: string; code: string } | null)?.code || '',
      },
      quantity: Number(lp.quantity),
      uom: lp.uom,
      location: {
        id: lp.location_id,
        code: (lp.location as { location_code: string; full_path: string } | null)?.location_code || '',
        path: (lp.location as { location_code: string; full_path: string } | null)?.full_path || '',
      },
      status: lp.status as 'available' | 'reserved' | 'consumed' | 'blocked',
      qa_status: lp.qa_status as 'pending' | 'passed' | 'failed' | 'on_hold',
      batch_number: lp.batch_number,
      expiry_date: lp.expiry_date,
    }

    // 2. Check LP status
    if (lp.status !== 'available') {
      errors.push({
        field: 'lp_id',
        message: `LP not available for movement (status: ${lp.status})`,
      })
    }

    // 3. Lookup destination location
    const destination = await this.getLocationById(supabase, toLocationId)
    if (!destination) {
      errors.push({ field: 'to_location_id', message: 'Destination location not found' })
      return { valid: errors.length === 0, errors, warnings, lp: lpResult }
    }

    destinationResult = {
      id: destination.id,
      location_code: destination.location_code,
      location_path: destination.full_path || '',
      warehouse_name: (destination.warehouse as { name: string } | null)?.name || '',
      is_active: destination.is_active,
      capacity_pct: null, // Capacity tracking not implemented in this story
    }

    // 4. Check location active
    if (!destination.is_active) {
      errors.push({ field: 'to_location_id', message: 'Destination location is inactive' })
    }

    // 5. Check same location
    if (lp.location_id === toLocationId) {
      errors.push({ field: 'to_location_id', message: 'Source and destination locations are the same' })
    }

    // 6. Capacity warning (placeholder for future implementation)
    // Would check location capacity if enabled

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      lp: lpResult,
      destination: destinationResult,
    }
  }

  /**
   * Lookup LP by barcode (lp_number)
   * Returns full LP details for display
   */
  static async lookupLP(
    supabase: SupabaseClient,
    barcode: string
  ): Promise<LPLookupResult | null> {
    const { data, error } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        product_id,
        quantity,
        uom,
        location_id,
        status,
        qa_status,
        batch_number,
        expiry_date,
        product:products(id, name, code),
        location:locations(id, location_code, full_path)
      `)
      .eq('lp_number', barcode)
      .single()

    if (error || !data) {
      return null
    }

    const product = data.product as { id: string; name: string; code: string } | null
    const location = data.location as { id: string; location_code: string; full_path: string } | null

    return {
      id: data.id,
      lp_number: data.lp_number,
      product: {
        id: product?.id || '',
        name: product?.name || '',
        sku: product?.code || '',
      },
      quantity: Number(data.quantity),
      uom: data.uom,
      location: {
        id: location?.id || '',
        code: location?.location_code || '',
        path: location?.full_path || '',
      },
      status: data.status as 'available' | 'reserved' | 'consumed' | 'blocked',
      qa_status: data.qa_status as 'pending' | 'passed' | 'failed' | 'on_hold',
      batch_number: data.batch_number,
      expiry_date: data.expiry_date,
    }
  }

  /**
   * Check if LP can be moved
   * Returns validation result with reason
   */
  static validateLPStatus(status: string): { canMove: boolean; reason?: string } {
    if (status === 'available') {
      return { canMove: true }
    }

    if (status === 'consumed') {
      return { canMove: false, reason: 'LP has been consumed' }
    }

    if (status === 'blocked') {
      return { canMove: false, reason: 'LP is blocked' }
    }

    if (status === 'reserved') {
      return { canMove: false, reason: 'LP is reserved' }
    }

    return { canMove: false, reason: `LP status not valid for movement: ${status}` }
  }

  /**
   * Get recent moves for quick repeat functionality
   */
  static async getRecentMoves(
    supabase: SupabaseClient,
    limit: number = 5
  ): Promise<RecentMoveResult[]> {
    const { data, error } = await supabase
      .from('stock_moves')
      .select(`
        id,
        move_date,
        lp:license_plates(lp_number),
        from_location:locations!stock_moves_from_location_id_fkey(location_code),
        to_location:locations!stock_moves_to_location_id_fkey(location_code)
      `)
      .eq('move_type', 'transfer')
      .eq('status', 'completed')
      .order('move_date', { ascending: false })
      .limit(limit)

    if (error || !data) {
      return []
    }

    return data.map((move) => {
      const lpData = move.lp as { lp_number: string } | null
      const fromLoc = move.from_location as { location_code: string } | null
      const toLoc = move.to_location as { location_code: string } | null

      return {
        id: move.id,
        lp_number: lpData?.lp_number || '',
        from_location_code: fromLoc?.location_code || '',
        to_location_code: toLoc?.location_code || '',
        move_date: move.move_date,
        relative_time: this.formatRelativeTime(move.move_date),
      }
    })
  }

  // =============================================================================
  // Private Helpers
  // =============================================================================

  /**
   * Get LP by ID with joins
   */
  private static async getLPById(
    supabase: SupabaseClient,
    lpId: string
  ): Promise<{
    id: string
    lp_number: string
    product_id: string
    quantity: number
    uom: string
    location_id: string
    status: string
    qa_status: string
    batch_number: string | null
    expiry_date: string | null
    product: unknown
    location: unknown
  } | null> {
    const { data, error } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        product_id,
        quantity,
        uom,
        location_id,
        status,
        qa_status,
        batch_number,
        expiry_date,
        product:products(name, code),
        location:locations(location_code, full_path)
      `)
      .eq('id', lpId)
      .single()

    if (error || !data) {
      return null
    }

    return data
  }

  /**
   * Get location by ID with joins
   */
  private static async getLocationById(
    supabase: SupabaseClient,
    locationId: string
  ): Promise<{
    id: string
    location_code: string
    full_path: string
    is_active: boolean
    warehouse: unknown
  } | null> {
    const { data, error } = await supabase
      .from('locations')
      .select(`
        id,
        location_code,
        full_path,
        is_active,
        warehouse:warehouses(name)
      `)
      .eq('id', locationId)
      .single()

    if (error || !data) {
      return null
    }

    return data
  }

  /**
   * Format relative time for recent moves
   */
  private static formatRelativeTime(dateStr: string): string {
    const now = new Date()
    const date = new Date(dateStr)
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins} min ago`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`

    const diffDays = Math.floor(diffHours / 24)
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`
  }
}
