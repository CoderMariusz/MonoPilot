/**
 * Stock Move Service (Story 05.16)
 * Purpose: Business logic for stock move CRUD and operations
 * Phase: GREEN - Minimal code to pass tests
 *
 * SECURITY (ADR-013 compliance):
 * - SQL Injection: SAFE - Supabase client uses parameterized queries via PostgREST.
 * - org_id Isolation: SAFE - RLS policies enforce org_id filtering at database level.
 * - XSS: SAFE - React auto-escapes all rendered values.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  MoveType,
  MoveStatus,
  ReasonCode,
  ReferenceType,
  CreateStockMoveInput,
  CancelStockMoveInput,
  ListStockMovesInput,
} from '@/lib/validation/stock-move-schemas'

// Re-export types
export type { MoveType, MoveStatus, ReasonCode, ReferenceType }

// =============================================================================
// Types
// =============================================================================

export interface StockMove {
  id: string
  org_id: string
  move_number: string
  lp_id: string
  move_type: MoveType
  from_location_id: string | null
  to_location_id: string | null
  quantity: number
  status: MoveStatus
  move_date: string
  reason: string | null
  reason_code: ReasonCode | null
  wo_id: string | null
  reference_id: string | null
  reference_type: ReferenceType | null
  created_at: string
  created_by: string | null
  cancelled_at: string | null
  cancelled_by: string | null
  notes: string | null
  // Joined fields
  license_plate?: {
    lp_number: string
    product?: {
      name: string
      sku: string
    }
  }
  from_location?: {
    location_code: string
    name: string
  }
  to_location?: {
    location_code: string
    name: string
  }
  created_by_user?: {
    name: string
    email: string
  }
  cancelled_by_user?: {
    name: string
    email: string
  }
}

export interface PaginatedResult<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    total_pages: number
  }
}

// =============================================================================
// Stock Move Service Class
// =============================================================================

export class StockMoveService {
  // ===========================================================================
  // CRUD Operations
  // ===========================================================================

  /**
   * List stock moves with filtering, sorting, pagination
   */
  static async list(
    supabase: SupabaseClient,
    params: Partial<ListStockMovesInput>
  ): Promise<PaginatedResult<StockMove>> {
    const {
      search,
      moveType,
      lpId,
      locationId,
      dateFrom,
      dateTo,
      status,
      page = 1,
      limit = 50,
    } = params

    // Build count query
    let countQuery = supabase
      .from('stock_moves')
      .select('*', { count: 'exact', head: true })

    // Build data query
    let query = supabase
      .from('stock_moves')
      .select(`
        *,
        license_plate:license_plates(lp_number, product:products(name, sku)),
        from_location:locations!stock_moves_from_location_id_fkey(location_code, name),
        to_location:locations!stock_moves_to_location_id_fkey(location_code, name),
        created_by_user:users!stock_moves_created_by_fkey(name, email)
      `)

    // Apply filters to both queries
    if (search) {
      query = query.ilike('move_number', `${search}%`)
      countQuery = countQuery.ilike('move_number', `${search}%`)
    }

    if (moveType) {
      query = query.eq('move_type', moveType)
      countQuery = countQuery.eq('move_type', moveType)
    }

    if (lpId) {
      query = query.eq('lp_id', lpId)
      countQuery = countQuery.eq('lp_id', lpId)
    }

    if (locationId) {
      // Filter by from OR to location
      query = query.or(`from_location_id.eq.${locationId},to_location_id.eq.${locationId}`)
      countQuery = countQuery.or(`from_location_id.eq.${locationId},to_location_id.eq.${locationId}`)
    }

    if (dateFrom) {
      query = query.gte('move_date', dateFrom)
      countQuery = countQuery.gte('move_date', dateFrom)
    }

    if (dateTo) {
      query = query.lte('move_date', dateTo)
      countQuery = countQuery.lte('move_date', dateTo)
    }

    if (status) {
      query = query.eq('status', status)
      countQuery = countQuery.eq('status', status)
    }

    // Apply sorting (default: move_date DESC)
    query = query.order('move_date', { ascending: false })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    // Execute queries
    const [{ data, error }, { count }] = await Promise.all([
      query,
      countQuery,
    ])

    if (error) {
      throw new Error(`Failed to fetch stock moves: ${error.message}`)
    }

    const total = count || 0

    return {
      data: (data || []) as StockMove[],
      pagination: {
        page,
        limit,
        total,
        total_pages: Math.ceil(total / limit),
      },
    }
  }

  /**
   * Get single stock move by ID
   */
  static async getById(
    supabase: SupabaseClient,
    id: string
  ): Promise<StockMove | null> {
    const { data, error } = await supabase
      .from('stock_moves')
      .select(`
        *,
        license_plate:license_plates(lp_number, product:products(name, sku)),
        from_location:locations!stock_moves_from_location_id_fkey(location_code, name),
        to_location:locations!stock_moves_to_location_id_fkey(location_code, name),
        created_by_user:users!stock_moves_created_by_fkey(name, email),
        cancelled_by_user:users!stock_moves_cancelled_by_fkey(name, email)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Not found
      }
      throw new Error(`Failed to fetch stock move: ${error.message}`)
    }

    return data as StockMove
  }

  /**
   * Generate next stock move number for org
   */
  static async generateMoveNumber(
    supabase: SupabaseClient,
    orgId: string
  ): Promise<string> {
    const { data, error } = await supabase.rpc(
      'generate_stock_move_number',
      { p_org_id: orgId }
    )

    if (error) {
      throw new Error(`Failed to generate move number: ${error.message}`)
    }

    return data as string
  }

  /**
   * Create stock move (using RPC for atomicity)
   */
  static async create(
    supabase: SupabaseClient,
    input: CreateStockMoveInput,
    createdBy: string
  ): Promise<StockMove> {
    // Get user's org_id
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', createdBy)
      .single()

    if (userError || !user) {
      throw new Error('User not found')
    }

    const orgId = user.org_id

    // Validate LP exists and is available
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select('id, status, qa_status, quantity, location_id')
      .eq('id', input.lpId)
      .single()

    if (lpError || !lp) {
      throw new Error('LP not found')
    }

    // Validate LP status (skip for receipt - LP just created)
    if (input.moveType !== 'receipt') {
      if (lp.status !== 'available' && lp.status !== 'reserved') {
        throw new Error(`LP not available for movement (status: ${lp.status})`)
      }
    }

    // Validate quantity
    const moveQty = input.quantity ?? lp.quantity
    if (moveQty > lp.quantity) {
      throw new Error('Move quantity exceeds available quantity')
    }

    // Validate destination for transfer types
    if (['transfer', 'putaway', 'quarantine', 'return'].includes(input.moveType)) {
      if (!input.toLocationId) {
        throw new Error('Destination location required for this move type')
      }

      const { data: location, error: locError } = await supabase
        .from('locations')
        .select('id, is_active')
        .eq('id', input.toLocationId)
        .single()

      if (locError || !location) {
        throw new Error('Destination location not found')
      }

      if (!location.is_active) {
        throw new Error('Destination location not available')
      }
    }

    // Call RPC function for atomic execution
    const { data: moveId, error: rpcError } = await supabase.rpc(
      'execute_stock_move',
      {
        p_org_id: orgId,
        p_lp_id: input.lpId,
        p_move_type: input.moveType,
        p_to_location_id: input.toLocationId || null,
        p_quantity: input.quantity || null,
        p_reason: input.reason || null,
        p_reason_code: input.reasonCode || null,
        p_wo_id: input.woId || null,
        p_reference_id: input.referenceId || null,
        p_reference_type: input.referenceType || null,
        p_created_by: createdBy,
      }
    )

    if (rpcError) {
      throw new Error(`Failed to create stock move: ${rpcError.message}`)
    }

    // Fetch and return created move
    const move = await this.getById(supabase, moveId)
    if (!move) {
      throw new Error('Stock move created but not found')
    }

    return move
  }

  /**
   * Cancel stock move (within 24 hours only)
   */
  static async cancel(
    supabase: SupabaseClient,
    id: string,
    input: CancelStockMoveInput,
    userId: string
  ): Promise<StockMove> {
    // Get existing move
    const move = await this.getById(supabase, id)
    if (!move) {
      throw new Error('Stock move not found')
    }

    if (move.status === 'cancelled') {
      throw new Error('Move already cancelled')
    }

    // Check if move is within 24 hours
    const moveDate = new Date(move.move_date)
    const now = new Date()
    const hoursDiff = (now.getTime() - moveDate.getTime()) / (1000 * 60 * 60)

    if (hoursDiff > 24) {
      throw new Error('Cannot cancel moves older than 24 hours')
    }

    // Update to cancelled
    const { data, error } = await supabase
      .from('stock_moves')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancelled_by: userId,
        notes: input.reason,
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to cancel stock move: ${error.message}`)
    }

    // NOTE: Does NOT reverse LP changes - requires manual correction

    return await this.getById(supabase, id) as StockMove
  }

  // ===========================================================================
  // Query Helpers
  // ===========================================================================

  /**
   * Get movement history for an LP
   */
  static async getLPMovementHistory(
    supabase: SupabaseClient,
    lpId: string,
    limit: number = 50
  ): Promise<StockMove[]> {
    const { data, error } = await supabase
      .from('stock_moves')
      .select(`
        *,
        from_location:locations!stock_moves_from_location_id_fkey(location_code, name),
        to_location:locations!stock_moves_to_location_id_fkey(location_code, name),
        created_by_user:users!stock_moves_created_by_fkey(name, email)
      `)
      .eq('lp_id', lpId)
      .order('move_date', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch LP movement history: ${error.message}`)
    }

    return data as StockMove[]
  }

  /**
   * Get moves by reference (GRN, TO, WO)
   */
  static async getByReference(
    supabase: SupabaseClient,
    referenceId: string,
    referenceType: ReferenceType
  ): Promise<StockMove[]> {
    const { data, error } = await supabase
      .from('stock_moves')
      .select('*')
      .eq('reference_id', referenceId)
      .eq('reference_type', referenceType)
      .order('move_date', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch moves by reference: ${error.message}`)
    }

    return data as StockMove[]
  }

  /**
   * Get recent moves for a location
   */
  static async getRecentByLocation(
    supabase: SupabaseClient,
    locationId: string,
    limit: number = 20
  ): Promise<StockMove[]> {
    const { data, error } = await supabase
      .from('stock_moves')
      .select(`
        *,
        license_plate:license_plates(lp_number),
        created_by_user:users!stock_moves_created_by_fkey(name)
      `)
      .or(`from_location_id.eq.${locationId},to_location_id.eq.${locationId}`)
      .eq('status', 'completed')
      .order('move_date', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to fetch location moves: ${error.message}`)
    }

    return data as StockMove[]
  }

  /**
   * Count moves by type for an org (for dashboard)
   */
  static async countByType(
    supabase: SupabaseClient,
    dateFrom?: string,
    dateTo?: string
  ): Promise<Record<MoveType, number>> {
    let query = supabase
      .from('stock_moves')
      .select('move_type')
      .eq('status', 'completed')

    if (dateFrom) {
      query = query.gte('move_date', dateFrom)
    }

    if (dateTo) {
      query = query.lte('move_date', dateTo)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to count moves by type: ${error.message}`)
    }

    // Initialize counts
    const counts: Record<MoveType, number> = {
      transfer: 0,
      issue: 0,
      receipt: 0,
      adjustment: 0,
      return: 0,
      quarantine: 0,
      putaway: 0,
    }

    // Count each type
    for (const row of data || []) {
      const type = row.move_type as MoveType
      if (type in counts) {
        counts[type]++
      }
    }

    return counts
  }

  // ===========================================================================
  // Validation Helpers
  // ===========================================================================

  /**
   * Check if LP is moveable
   */
  static async canMoveLp(
    supabase: SupabaseClient,
    lpId: string
  ): Promise<{ canMove: boolean; reason?: string }> {
    const { data: lp, error } = await supabase
      .from('license_plates')
      .select('id, status, qa_status, quantity')
      .eq('id', lpId)
      .single()

    if (error || !lp) {
      return { canMove: false, reason: 'LP not found' }
    }

    if (lp.status === 'consumed') {
      return { canMove: false, reason: 'LP has been consumed' }
    }

    if (lp.status === 'blocked') {
      return { canMove: false, reason: 'LP is blocked' }
    }

    if (lp.quantity <= 0) {
      return { canMove: false, reason: 'LP has no quantity' }
    }

    return { canMove: true }
  }

  /**
   * Check if stock move exists
   */
  static async exists(
    supabase: SupabaseClient,
    id: string
  ): Promise<boolean> {
    const { data, error } = await supabase
      .from('stock_moves')
      .select('id')
      .eq('id', id)
      .single()

    return !!data && !error
  }
}
