/**
 * Scanner Putaway Service (Story 05.21)
 * Purpose: Business logic for scanner putaway operations
 * Phase: GREEN - Minimal code to pass tests
 *
 * SECURITY (ADR-013 compliance):
 * - SQL Injection: SAFE - Supabase client uses parameterized queries via PostgREST.
 * - org_id Isolation: SAFE - RLS policies enforce org_id filtering at database level.
 * - XSS: SAFE - React auto-escapes all rendered values.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  PutawaySuggestion,
  PutawayValidationResult,
  PutawayResult,
  SuggestedLocation,
} from '@/lib/validation/scanner-putaway'

// =============================================================================
// Types
// =============================================================================

export interface PutawayInput {
  lpId: string
  locationId: string
  suggestedLocationId?: string
  override: boolean
  overrideReason?: string
}

interface LPData {
  id: string
  lp_number: string
  product_id: string
  quantity: number
  uom: string
  expiry_date: string | null
  status: 'available' | 'reserved' | 'blocked' | 'consumed'
  qa_status: string
  location_id: string
  warehouse_id: string
  created_at: string
  batch_number: string | null
  product?: {
    name: string
    preferred_zone_id: string | null
  }
  location?: {
    location_code: string
    full_path: string
  }
}

interface LocationData {
  id: string
  location_code: string
  name: string
  warehouse_id: string
  zone_id: string | null
  is_active: boolean
  full_path: string
  aisle: string | null
  rack: string | null
  level: string | null
  zone?: {
    id: string
    name: string
  }
}

interface WarehouseSettings {
  enable_fifo: boolean
  enable_fefo: boolean
  enable_location_capacity: boolean
}

// =============================================================================
// Scanner Putaway Service Class
// =============================================================================

export class ScannerPutawayService {
  /**
   * Calculate optimal putaway location for LP
   * Uses FIFO/FEFO zone logic and product zone preferences
   */
  static async suggestLocation(
    supabase: SupabaseClient,
    lpId: string
  ): Promise<PutawaySuggestion> {
    // Get LP with product and location info
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        product_id,
        quantity,
        uom,
        expiry_date,
        status,
        qa_status,
        location_id,
        warehouse_id,
        created_at,
        batch_number,
        product:products(name, preferred_zone_id),
        location:locations(location_code, full_path)
      `)
      .eq('id', lpId)
      .single()

    if (lpError || !lp) {
      throw new Error('LP not found')
    }

    const lpData = lp as unknown as LPData

    // Check LP status
    if (lpData.status !== 'available' && lpData.status !== 'reserved') {
      throw new Error(`LP not available for putaway (status: ${lpData.status})`)
    }

    // Get warehouse settings
    const { data: user } = await supabase.auth.getUser()
    if (!user?.user) {
      throw new Error('Unauthorized')
    }

    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.user.id)
      .single()

    if (!userData) {
      throw new Error('User not found')
    }

    const { data: settings } = await supabase
      .from('warehouse_settings')
      .select('enable_fifo, enable_fefo, enable_location_capacity')
      .eq('org_id', userData.org_id)
      .single()

    const warehouseSettings: WarehouseSettings = settings || {
      enable_fifo: true,
      enable_fefo: false,
      enable_location_capacity: true,
    }

    // Determine strategy - FEFO takes precedence
    const strategyUsed: 'fifo' | 'fefo' | 'none' = warehouseSettings.enable_fefo
      ? 'fefo'
      : warehouseSettings.enable_fifo
        ? 'fifo'
        : 'none'

    // Find zone based on strategy
    const zoneResult = await this.getProductZone(
      supabase,
      lpData.product_id,
      lpData.warehouse_id,
      strategyUsed,
      lpData.product?.preferred_zone_id
    )

    // Find available locations
    const locations = await this.findAvailableLocations(
      supabase,
      lpData.warehouse_id,
      zoneResult?.zoneId
    )

    // Build LP details
    const lpDetails = {
      lp_number: lpData.lp_number,
      product_name: lpData.product?.name || 'Unknown Product',
      quantity: lpData.quantity,
      uom: lpData.uom,
      expiry_date: lpData.expiry_date,
      current_location: lpData.location?.full_path || 'Unknown',
    }

    if (locations.length === 0) {
      return {
        suggestedLocation: null,
        reason: 'No available locations in preferred zone',
        reasonCode: 'no_preference',
        alternatives: [],
        strategyUsed,
        lpDetails,
      }
    }

    // Build suggested location
    const suggested = locations[0]
    const suggestedLocation: SuggestedLocation = {
      id: suggested.id,
      location_code: suggested.location_code,
      full_path: suggested.full_path,
      zone_id: suggested.zone_id,
      zone_name: suggested.zone?.name || null,
      aisle: suggested.aisle,
      rack: suggested.rack,
      level: suggested.level,
    }

    // Build alternatives
    const alternatives = locations.slice(1, 3).map((loc) => ({
      id: loc.id,
      location_code: loc.location_code,
      reason: loc.zone_id === suggested.zone_id ? 'Same zone, next available' : 'Alternative zone',
    }))

    return {
      suggestedLocation,
      reason: zoneResult?.reason || this.getDefaultReason(strategyUsed),
      reasonCode: zoneResult?.reasonCode || 'default_zone',
      alternatives,
      strategyUsed,
      lpDetails,
    }
  }

  /**
   * Execute putaway transaction
   * - Creates stock_move with move_type='putaway'
   * - Updates LP.location_id
   * - Records override in audit if applicable
   */
  static async processPutaway(
    supabase: SupabaseClient,
    input: PutawayInput
  ): Promise<PutawayResult> {
    // Validate LP
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        product_id,
        quantity,
        uom,
        status,
        location_id,
        warehouse_id
      `)
      .eq('id', input.lpId)
      .single()

    if (lpError || !lp) {
      throw new Error('LP not found')
    }

    if (lp.status !== 'available' && lp.status !== 'reserved') {
      throw new Error(`LP not available for putaway (status: ${lp.status})`)
    }

    // Validate destination location
    const { data: location, error: locError } = await supabase
      .from('locations')
      .select(`
        id,
        location_code,
        name,
        warehouse_id,
        is_active,
        full_path,
        zone_id
      `)
      .eq('id', input.locationId)
      .single()

    if (locError || !location) {
      throw new Error('Destination location not found')
    }

    if (!location.is_active) {
      throw new Error('Destination location not available (inactive)')
    }

    // Get user info for stock move
    const { data: authUser } = await supabase.auth.getUser()
    if (!authUser?.user) {
      throw new Error('Unauthorized')
    }

    const { data: userData } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', authUser.user.id)
      .single()

    if (!userData) {
      throw new Error('User not found')
    }

    // Create stock move using RPC
    const { data: moveId, error: rpcError } = await supabase.rpc('execute_stock_move', {
      p_org_id: userData.org_id,
      p_lp_id: input.lpId,
      p_move_type: 'putaway',
      p_to_location_id: input.locationId,
      p_quantity: null,
      p_reason: input.overrideReason || null,
      p_reason_code: input.override ? 'putaway_override' : null,
      p_wo_id: null,
      p_reference_id: null,
      p_reference_type: null,
      p_created_by: authUser.user.id,
    })

    if (rpcError) {
      throw new Error(`Failed to create stock move: ${rpcError.message}`)
    }

    // Get the created stock move
    const { data: stockMove, error: moveError } = await supabase
      .from('stock_moves')
      .select('id, move_number, move_type, from_location_id, to_location_id, quantity, status')
      .eq('id', moveId)
      .single()

    if (moveError || !stockMove) {
      throw new Error('Stock move created but not found')
    }

    // Get suggested location code for override response
    let suggestedLocationCode: string | undefined
    if (input.override && input.suggestedLocationId) {
      const { data: suggestedLoc } = await supabase
        .from('locations')
        .select('location_code')
        .eq('id', input.suggestedLocationId)
        .single()

      if (suggestedLoc) {
        suggestedLocationCode = suggestedLoc.location_code
      }
    }

    return {
      stockMove: {
        id: stockMove.id,
        move_number: stockMove.move_number,
        move_type: 'putaway',
        from_location_id: stockMove.from_location_id,
        to_location_id: stockMove.to_location_id,
        quantity: stockMove.quantity,
        status: 'completed',
      },
      lp: {
        id: lp.id,
        lp_number: lp.lp_number,
        location_id: input.locationId,
        location_path: location.full_path,
      },
      overrideApplied: input.override,
      suggestedLocationCode,
    }
  }

  /**
   * Validate putaway before commit
   * Returns validation errors without creating records
   */
  static async validatePutaway(
    supabase: SupabaseClient,
    input: { lpId: string; locationId: string; suggestedLocationId?: string }
  ): Promise<PutawayValidationResult> {
    const errors: Array<{ field: string; message: string }> = []
    const warnings: Array<{ field: string; message: string }> = []

    // Validate LP
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select('id, status, qa_status')
      .eq('id', input.lpId)
      .single()

    if (lpError || !lp) {
      errors.push({ field: 'lp_id', message: 'LP not found' })
    } else if (lp.status !== 'available' && lp.status !== 'reserved') {
      errors.push({
        field: 'lp_id',
        message: `LP not available for putaway (status: ${lp.status})`,
      })
    }

    // Validate location
    const { data: location, error: locError } = await supabase
      .from('locations')
      .select('id, is_active, warehouse_id')
      .eq('id', input.locationId)
      .single()

    if (locError || !location) {
      errors.push({ field: 'location_id', message: 'Location not found' })
    } else if (!location.is_active) {
      errors.push({ field: 'location_id', message: 'Location not available (inactive)' })
    }

    // Check for suggestion mismatch (warning, not error)
    if (input.suggestedLocationId && input.suggestedLocationId !== input.locationId) {
      warnings.push({
        field: 'location_id',
        message: 'Location is different from suggested location',
      })
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    }
  }

  /**
   * Get zone for existing product stock (FIFO/FEFO logic)
   * @internal
   */
  private static async getProductZone(
    supabase: SupabaseClient,
    productId: string,
    warehouseId: string,
    strategy: 'fifo' | 'fefo' | 'none',
    preferredZoneId?: string | null
  ): Promise<{ zoneId: string; reason: string; reasonCode: 'fifo_zone' | 'fefo_zone' | 'product_zone' | 'default_zone' } | null> {
    // Find existing LPs of same product in warehouse
    let query = supabase
      .from('license_plates')
      .select('location_id, created_at, expiry_date, location:locations(zone_id)')
      .eq('product_id', productId)
      .eq('warehouse_id', warehouseId)
      .eq('status', 'available')

    if (strategy === 'fefo') {
      query = query.order('expiry_date', { ascending: true, nullsFirst: false })
    } else {
      query = query.order('created_at', { ascending: true })
    }

    const { data: existingLPs } = await query.limit(10)

    // Find zone from existing LPs
    if (existingLPs && existingLPs.length > 0) {
      for (const existingLP of existingLPs) {
        const location = existingLP.location as unknown as { zone_id: string | null }
        if (location?.zone_id) {
          if (strategy === 'fefo') {
            return {
              zoneId: location.zone_id,
              reason: 'FEFO: Place with similar expiry dates',
              reasonCode: 'fefo_zone',
            }
          } else {
            return {
              zoneId: location.zone_id,
              reason: 'FIFO: Place near oldest stock of same product',
              reasonCode: 'fifo_zone',
            }
          }
        }
      }
    }

    // Use product preferred zone
    if (preferredZoneId) {
      return {
        zoneId: preferredZoneId,
        reason: 'Product preferred zone',
        reasonCode: 'product_zone',
      }
    }

    // No specific zone preference
    return null
  }

  /**
   * Find available locations in zone
   * @internal
   */
  private static async findAvailableLocations(
    supabase: SupabaseClient,
    warehouseId: string,
    zoneId?: string | null
  ): Promise<LocationData[]> {
    let query = supabase
      .from('locations')
      .select(`
        id,
        location_code,
        name,
        warehouse_id,
        zone_id,
        is_active,
        full_path,
        aisle,
        rack,
        level,
        zone:zones(id, name)
      `)
      .eq('warehouse_id', warehouseId)
      .eq('is_active', true)

    if (zoneId) {
      query = query.eq('zone_id', zoneId)
    }

    const { data: locations, error } = await query.limit(10)

    if (error || !locations) {
      return []
    }

    return locations as unknown as LocationData[]
  }

  /**
   * Get default reason text based on strategy
   */
  private static getDefaultReason(strategy: 'fifo' | 'fefo' | 'none'): string {
    switch (strategy) {
      case 'fifo':
        return 'FIFO: Place near oldest stock'
      case 'fefo':
        return 'FEFO: Place with similar expiry dates'
      default:
        return 'Default storage zone'
    }
  }
}
