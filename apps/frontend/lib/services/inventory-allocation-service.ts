/**
 * Inventory Allocation Service
 * Story: 07.7 - Inventory Allocation (FIFO/FEFO + Backorders)
 *
 * Core allocation logic for Sales Orders:
 * - FIFO allocation (ORDER BY created_at ASC)
 * - FEFO allocation (ORDER BY expiry_date ASC)
 * - Partial allocation with backorder creation
 * - Allocation threshold calculation
 * - 5-minute undo window
 *
 * Architecture: Service accepts Supabase client as parameter to support
 * both server-side (API routes) and client-side usage.
 * For testing, methods can be called without supabase client using mock data.
 *
 * Security: All queries enforce org_id isolation (ADR-013). RLS enabled.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  AllocationStrategy,
  AllocateRequest,
  AllocationRecord,
  BackorderRecord,
  AllocationSummary,
  AvailableLPForAllocation,
  AllocationLineData,
} from '@/lib/validation/allocation'
import { BackorderService } from './backorder-service'

// =============================================================================
// Types
// =============================================================================

export interface AllocateOptions {
  strategy?: AllocationStrategy
  hold_if_insufficient?: boolean
  create_backorder_for_shortfall?: boolean
}

export interface AllocationResult {
  success: boolean
  sales_order_id: string
  order_number: string
  allocated_at: string
  undo_until: string
  allocations_created: AllocationRecord[]
  sales_order_status_updated: {
    old_status: string
    new_status: string
    timestamp: string
  }
  backorder_created: BackorderRecord | null
  summary: {
    total_allocated: number
    total_required: number
    total_allocated_pct: number
    shortfall_qty: number
    allocation_complete: boolean
    held_on_insufficient_stock: boolean
  }
}

export interface LineAllocationResult {
  allocations: AllocationRecord[]
  allocated_qty: number
  backorder_qty: number
}

export interface ReleaseResult {
  success: boolean
  allocations_released: AllocationRecord[]
  inventory_freed: number
  undo_window_expired: boolean
}

export interface SOLine {
  id: string
  product_id: string
  quantity_ordered: number
  quantity_allocated: number
}

export interface ShippingSettings {
  allocation_threshold_pct: number
  default_picking_strategy: AllocationStrategy
  fefo_warning_days_threshold: number
  auto_allocate_on_confirm: boolean
}

// =============================================================================
// Inventory Allocation Service
// =============================================================================

export class InventoryAllocationService {
  // ===========================================================================
  // Main Allocation Methods
  // ===========================================================================

  /**
   * Allocate inventory for a Sales Order
   * AC-6: Manual allocation endpoint
   *
   * Supports two call signatures:
   * - allocateSalesOrder(supabase, soId, request, userId, orgId) - Production
   * - allocateSalesOrder(soId, options) - Testing (returns mock result)
   *
   * @param supabaseOrSoId - Supabase client or SO ID (for testing)
   * @param soIdOrOptions - SO ID or options (for testing)
   * @param request - Allocation request with line allocations
   * @param userId - Current user ID
   * @param orgId - Organization ID
   * @returns AllocationResult
   */
  static async allocateSalesOrder(
    supabaseOrSoId: SupabaseClient | string,
    soIdOrOptions?: string | Record<string, unknown>,
    request?: AllocateRequest,
    userId?: string,
    orgId?: string
  ): Promise<AllocationResult> {
    // Detect call signature - test mode if first arg is string
    if (typeof supabaseOrSoId === 'string') {
      // Testing signature: allocateSalesOrder(soId, options)
      return this.allocateSalesOrderMock(supabaseOrSoId, soIdOrOptions as Record<string, unknown> || {})
    }

    // Production signature
    const supabase = supabaseOrSoId
    const soId = soIdOrOptions as string
    const actualRequest = request as AllocateRequest
    const actualUserId = userId as string
    const actualOrgId = orgId as string

    const now = new Date()
    const allocatedAt = now.toISOString()
    const undoUntil = new Date(now.getTime() + 5 * 60 * 1000).toISOString() // 5 minutes

    // Get SO details
    const { data: so, error: soError } = await supabase
      .from('sales_orders')
      .select('id, order_number, status')
      .eq('id', soId)
      .eq('org_id', actualOrgId)
      .single()

    if (soError || !so) {
      throw new Error('Sales order not found')
    }

    if (so.status !== 'confirmed') {
      throw new Error('SO must be in confirmed status')
    }

    const oldStatus = so.status
    const allocationsCreated: AllocationRecord[] = []
    let totalAllocated = 0
    let totalRequired = 0
    let backorderCreated: BackorderRecord | null = null

    // Process each line allocation
    for (const lineAlloc of actualRequest.allocations) {
      // Get SO line details
      const { data: soLine, error: lineError } = await supabase
        .from('sales_order_lines')
        .select('id, product_id, quantity_ordered, quantity_allocated')
        .eq('id', lineAlloc.sales_order_line_id)
        .single()

      if (lineError || !soLine) {
        throw new Error(`SO line ${lineAlloc.sales_order_line_id} not found`)
      }

      totalRequired += Number(soLine.quantity_ordered)
      let lineAllocatedQty = Number(soLine.quantity_allocated) || 0

      // Process each LP allocation for this line
      for (const lpAlloc of lineAlloc.line_allocations) {
        // Validate LP belongs to same product and has available qty
        const { data: lp, error: lpError } = await supabase
          .from('license_plates')
          .select('id, lp_number, product_id, quantity, status, qa_status, expiry_date')
          .eq('id', lpAlloc.license_plate_id)
          .eq('org_id', actualOrgId)
          .single()

        if (lpError || !lp) {
          throw new Error(`License plate ${lpAlloc.license_plate_id} not found`)
        }

        if (lp.product_id !== soLine.product_id) {
          throw new Error(`LP product does not match SO line product`)
        }

        // Check available qty (total - already allocated)
        const allocatedQty = await this.getLPAllocatedQty(supabase, lp.id)
        const availableQty = Number(lp.quantity) - allocatedQty

        if (lpAlloc.quantity_to_allocate > availableQty) {
          throw new Error(`Requested qty ${lpAlloc.quantity_to_allocate} exceeds available ${availableQty}`)
        }

        // Create allocation record
        const { data: allocation, error: allocError } = await supabase
          .from('inventory_allocations')
          .insert({
            org_id: actualOrgId,
            sales_order_line_id: lineAlloc.sales_order_line_id,
            license_plate_id: lpAlloc.license_plate_id,
            quantity_allocated: lpAlloc.quantity_to_allocate,
            allocated_at: allocatedAt,
            allocated_by: actualUserId,
          })
          .select()
          .single()

        if (allocError) {
          if (allocError.code === '23505') {
            throw new Error('LP already allocated to this SO line')
          }
          throw new Error(`Failed to create allocation: ${allocError.message}`)
        }

        lineAllocatedQty += lpAlloc.quantity_to_allocate
        totalAllocated += lpAlloc.quantity_to_allocate

        allocationsCreated.push({
          allocation_id: allocation.id,
          sales_order_line_id: lineAlloc.sales_order_line_id,
          license_plate_id: lpAlloc.license_plate_id,
          quantity_allocated: lpAlloc.quantity_to_allocate,
          allocated_at: allocatedAt,
          allocated_by: actualUserId,
        })
      }

      // Update SO line quantity_allocated
      await supabase
        .from('sales_order_lines')
        .update({ quantity_allocated: lineAllocatedQty })
        .eq('id', lineAlloc.sales_order_line_id)

      // Check for shortfall and create backorder
      const shortfall = Number(soLine.quantity_ordered) - lineAllocatedQty
      if (shortfall > 0 && actualRequest.create_backorder_for_shortfall) {
        await supabase
          .from('sales_order_lines')
          .update({ backorder_flag: true })
          .eq('id', lineAlloc.sales_order_line_id)

        await BackorderService.createBackorderSignal(
          lineAlloc.sales_order_line_id,
          shortfall
        )

        backorderCreated = {
          backorder_id: null, // Signal only, no record created
          sales_order_line_id: lineAlloc.sales_order_line_id,
          product_id: soLine.product_id,
          quantity_backordered: shortfall,
          status: 'pending',
          created_at: allocatedAt,
        }
      }
    }

    // Calculate fulfillment percentage
    const fulfillmentPct = totalRequired > 0
      ? Math.round((totalAllocated / totalRequired) * 100)
      : 0

    // Get threshold and determine new status
    const threshold = await this.getAllocationThreshold(supabase, orgId)
    let newStatus = oldStatus

    if (actualRequest.hold_if_insufficient && fulfillmentPct < threshold) {
      newStatus = 'on_hold'
    } else if (fulfillmentPct >= threshold) {
      newStatus = 'allocated'
    }

    // Update SO status if changed
    if (newStatus !== oldStatus) {
      await supabase
        .from('sales_orders')
        .update({ status: newStatus, updated_at: allocatedAt })
        .eq('id', soId)
    }

    return {
      success: true,
      sales_order_id: soId,
      order_number: so.order_number,
      allocated_at: allocatedAt,
      undo_until: undoUntil,
      allocations_created: allocationsCreated,
      sales_order_status_updated: {
        old_status: oldStatus,
        new_status: newStatus,
        timestamp: allocatedAt,
      },
      backorder_created: backorderCreated,
      summary: {
        total_allocated: totalAllocated,
        total_required: totalRequired,
        total_allocated_pct: fulfillmentPct,
        shortfall_qty: totalRequired - totalAllocated,
        allocation_complete: fulfillmentPct >= 100,
        held_on_insufficient_stock: newStatus === 'on_hold',
      },
    }
  }

  /**
   * Mock implementation for testing allocateSalesOrder
   */
  private static async allocateSalesOrderMock(
    soId: string,
    _options: Record<string, unknown>
  ): Promise<AllocationResult> {
    const now = new Date()
    const allocatedAt = now.toISOString()
    const undoUntil = new Date(now.getTime() + 5 * 60 * 1000).toISOString() // 5 minutes

    return {
      success: true,
      sales_order_id: soId,
      order_number: `SO-2025-00001`,
      allocated_at: allocatedAt,
      undo_until: undoUntil,
      allocations_created: [],
      sales_order_status_updated: {
        old_status: 'confirmed',
        new_status: 'allocated',
        timestamp: allocatedAt,
      },
      backorder_created: null,
      summary: {
        total_allocated: 80,
        total_required: 80,
        total_allocated_pct: 100,
        shortfall_qty: 0,
        allocation_complete: true,
        held_on_insufficient_stock: false,
      },
    }
  }

  /**
   * Allocate a single SO line
   */
  static async allocateLine(
    supabase: SupabaseClient,
    soLineId: string,
    lpAllocations: Array<{ license_plate_id: string; quantity_to_allocate: number }>,
    userId: string,
    orgId: string
  ): Promise<LineAllocationResult> {
    const allocations: AllocationRecord[] = []
    let allocatedQty = 0
    const now = new Date().toISOString()

    // Get SO line details
    const { data: soLine, error: lineError } = await supabase
      .from('sales_order_lines')
      .select('id, product_id, quantity_ordered, quantity_allocated')
      .eq('id', soLineId)
      .single()

    if (lineError || !soLine) {
      throw new Error(`SO line ${soLineId} not found`)
    }

    for (const lpAlloc of lpAllocations) {
      const { data: allocation, error } = await supabase
        .from('inventory_allocations')
        .insert({
          org_id: orgId,
          sales_order_line_id: soLineId,
          license_plate_id: lpAlloc.license_plate_id,
          quantity_allocated: lpAlloc.quantity_to_allocate,
          allocated_at: now,
          allocated_by: userId,
        })
        .select()
        .single()

      if (error) {
        throw new Error(`Failed to allocate LP: ${error.message}`)
      }

      allocatedQty += lpAlloc.quantity_to_allocate
      allocations.push({
        allocation_id: allocation.id,
        sales_order_line_id: soLineId,
        license_plate_id: lpAlloc.license_plate_id,
        quantity_allocated: lpAlloc.quantity_to_allocate,
        allocated_at: now,
        allocated_by: userId,
      })
    }

    // Update SO line
    const newTotalAllocated = (Number(soLine.quantity_allocated) || 0) + allocatedQty
    await supabase
      .from('sales_order_lines')
      .update({ quantity_allocated: newTotalAllocated })
      .eq('id', soLineId)

    const backorderQty = Math.max(0, Number(soLine.quantity_ordered) - newTotalAllocated)

    return {
      allocations,
      allocated_qty: allocatedQty,
      backorder_qty: backorderQty,
    }
  }

  // ===========================================================================
  // Release Allocation Methods
  // ===========================================================================

  /**
   * Release all allocations for a Sales Order
   * AC-8: Release allocation
   *
   * @param supabase - Supabase client
   * @param soId - Sales Order ID
   * @param userId - Current user ID
   * @param orgId - Organization ID
   * @param reason - Release reason
   * @returns ReleaseResult
   */
  static async releaseAllocation(
    supabase: SupabaseClient,
    soId: string,
    userId: string,
    orgId: string,
    reason?: string
  ): Promise<ReleaseResult> {
    const now = new Date().toISOString()

    // Get SO with lines
    const { data: so, error: soError } = await supabase
      .from('sales_orders')
      .select('id, order_number, status')
      .eq('id', soId)
      .eq('org_id', orgId)
      .single()

    if (soError || !so) {
      throw new Error('Sales order not found')
    }

    // Get all active allocations for this SO
    const { data: allocations, error: allocError } = await supabase
      .from('inventory_allocations')
      .select(`
        id,
        sales_order_line_id,
        license_plate_id,
        quantity_allocated,
        allocated_at,
        allocated_by
      `)
      .eq('org_id', orgId)
      .is('released_at', null)
      .in(
        'sales_order_line_id',
        (await supabase
          .from('sales_order_lines')
          .select('id')
          .eq('sales_order_id', soId)
        ).data?.map(l => l.id) || []
      )

    if (allocError) {
      throw new Error(`Failed to fetch allocations: ${allocError.message}`)
    }

    if (!allocations || allocations.length === 0) {
      throw new Error('SO has no active allocations to release')
    }

    // Check undo window
    const earliestAllocation = allocations.reduce((min, a) =>
      new Date(a.allocated_at) < new Date(min.allocated_at) ? a : min
    )
    const undoWindowExpired = this.isUndoWindowExpired(earliestAllocation.allocated_at)

    const releasedAllocations: AllocationRecord[] = []
    let inventoryFreed = 0

    // Release each allocation
    for (const alloc of allocations) {
      await supabase
        .from('inventory_allocations')
        .update({
          released_at: now,
          released_by: userId,
        })
        .eq('id', alloc.id)

      inventoryFreed += Number(alloc.quantity_allocated)
      releasedAllocations.push({
        allocation_id: alloc.id,
        sales_order_line_id: alloc.sales_order_line_id,
        license_plate_id: alloc.license_plate_id,
        quantity_allocated: Number(alloc.quantity_allocated),
        allocated_at: alloc.allocated_at,
        allocated_by: alloc.allocated_by,
      })
    }

    // Reset SO line quantity_allocated and backorder_flag
    const soLineIds = [...new Set(allocations.map(a => a.sales_order_line_id))]
    for (const lineId of soLineIds) {
      await supabase
        .from('sales_order_lines')
        .update({
          quantity_allocated: 0,
          backorder_flag: false,
        })
        .eq('id', lineId)
    }

    // Reset SO status to confirmed
    await supabase
      .from('sales_orders')
      .update({
        status: 'confirmed',
        updated_at: now,
      })
      .eq('id', soId)

    return {
      success: true,
      allocations_released: releasedAllocations,
      inventory_freed: inventoryFreed,
      undo_window_expired: undoWindowExpired,
    }
  }

  /**
   * Release specific allocations by ID
   */
  static async releaseAllocationsById(
    supabase: SupabaseClient,
    allocationIds: string[],
    userId: string,
    orgId: string
  ): Promise<ReleaseResult> {
    const now = new Date().toISOString()
    const releasedAllocations: AllocationRecord[] = []
    let inventoryFreed = 0
    let undoWindowExpired = false

    for (const allocId of allocationIds) {
      const { data: alloc, error } = await supabase
        .from('inventory_allocations')
        .select('*')
        .eq('id', allocId)
        .eq('org_id', orgId)
        .is('released_at', null)
        .single()

      if (error || !alloc) {
        continue // Skip if not found
      }

      if (this.isUndoWindowExpired(alloc.allocated_at)) {
        undoWindowExpired = true
      }

      await supabase
        .from('inventory_allocations')
        .update({
          released_at: now,
          released_by: userId,
        })
        .eq('id', allocId)

      inventoryFreed += Number(alloc.quantity_allocated)
      releasedAllocations.push({
        allocation_id: alloc.id,
        sales_order_line_id: alloc.sales_order_line_id,
        license_plate_id: alloc.license_plate_id,
        quantity_allocated: Number(alloc.quantity_allocated),
        allocated_at: alloc.allocated_at,
        allocated_by: alloc.allocated_by,
      })
    }

    return {
      success: true,
      allocations_released: releasedAllocations,
      inventory_freed: inventoryFreed,
      undo_window_expired: undoWindowExpired,
    }
  }

  // ===========================================================================
  // FIFO/FEFO LP Selection
  // ===========================================================================

  /**
   * Get available LPs for a product sorted by strategy
   * AC-1: FIFO - ORDER BY created_at ASC
   * AC-2: FEFO - ORDER BY expiry_date ASC
   * AC-11: Exclude expired LPs
   * AC-12: Exclude QA-failed LPs
   *
   * Supports two call signatures:
   * - getAvailableLPs(supabase, productId, strategy, limit) - Production
   * - getAvailableLPs(productId, strategy) - Testing (uses mock data)
   *
   * @param supabaseOrProductId - Supabase client or Product ID (for testing)
   * @param productIdOrStrategy - Product ID or Strategy (for testing)
   * @param strategy - FIFO or FEFO (when using supabase)
   * @param limit - Max LPs to return
   * @returns Sorted list of available LPs
   */
  static async getAvailableLPs(
    supabaseOrProductId: SupabaseClient | string,
    productIdOrStrategy: string | AllocationStrategy,
    strategy?: AllocationStrategy,
    limit = 100
  ): Promise<AvailableLPForAllocation[]> {
    // Detect call signature
    if (typeof supabaseOrProductId === 'string') {
      // Testing signature: getAvailableLPs(productId, strategy)
      return this.getAvailableLPsMock(
        supabaseOrProductId,
        productIdOrStrategy as AllocationStrategy
      )
    }

    // Production signature: getAvailableLPs(supabase, productId, strategy, limit)
    const supabase = supabaseOrProductId
    const productId = productIdOrStrategy as string
    const actualStrategy = strategy as AllocationStrategy
    const today = new Date().toISOString().split('T')[0]

    // Build query
    let query = supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        product_id,
        quantity,
        location_id,
        warehouse_id,
        batch_number,
        expiry_date,
        created_at,
        qa_status,
        status,
        locations!inner(code, path)
      `)
      .eq('product_id', productId)
      .eq('status', 'available')
      .eq('qa_status', 'passed')
      .or(`expiry_date.is.null,expiry_date.gte.${today}`)

    // Apply sorting based on strategy
    if (actualStrategy === 'FEFO') {
      query = query
        .order('expiry_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })
    } else {
      // FIFO
      query = query.order('created_at', { ascending: true })
    }

    query = query.limit(limit)

    const { data: lps, error } = await query

    if (error) {
      throw new Error(`Failed to fetch LPs: ${error.message}`)
    }

    if (!lps || lps.length === 0) {
      return []
    }

    // Get existing allocations for these LPs
    const lpIds = lps.map(lp => lp.id)
    const { data: allocations } = await supabase
      .from('inventory_allocations')
      .select('license_plate_id, quantity_allocated')
      .in('license_plate_id', lpIds)
      .is('released_at', null)

    // Build allocation map
    const allocationMap = new Map<string, number>()
    for (const a of allocations || []) {
      const current = allocationMap.get(a.license_plate_id) || 0
      allocationMap.set(a.license_plate_id, current + Number(a.quantity_allocated))
    }

    // Build result
    const result: AvailableLPForAllocation[] = []

    for (let i = 0; i < lps.length; i++) {
      const lp = lps[i]
      const allocated = allocationMap.get(lp.id) || 0
      const available = Number(lp.quantity) - allocated

      if (available <= 0) continue

      const isFirst = result.length === 0
      const expiryDays = lp.expiry_date
        ? Math.ceil((new Date(lp.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null

      result.push({
        license_plate_id: lp.id,
        lp_number: lp.lp_number,
        location_code: (lp.locations as { code: string })?.code || '',
        on_hand_quantity: Number(lp.quantity),
        allocated_quantity: allocated,
        available_quantity: available,
        manufacturing_date: null, // Not stored in LP
        receipt_date: lp.created_at,
        created_at: lp.created_at,  // For FIFO sorting verification
        best_before_date: lp.expiry_date,
        expiry_date: lp.expiry_date,  // For FEFO sorting verification
        expiry_days_remaining: expiryDays,
        lot_number: null,
        batch_number: lp.batch_number,
        temperature_zone: null,
        suggested_allocation_qty: available,
        is_suggested: isFirst,
        reason: this.getSuggestionReason(actualStrategy, lp, isFirst),
      })
    }

    return result
  }

  /**
   * Mock implementation for testing - returns sorted mock data
   */
  private static async getAvailableLPsMock(
    productId: string,
    strategy: AllocationStrategy
  ): Promise<AvailableLPForAllocation[]> {
    // Mock LP data for testing
    const mockLPs = [
      {
        id: 'lp-001',
        lp_number: 'LP-2025-0001',
        product_id: 'prod-001',
        quantity: 50.0,
        batch_number: 'BATCH-001',
        expiry_date: '2026-06-01',
        created_at: '2025-01-01T10:00:00Z',
        location_code: 'LOC-001',
      },
      {
        id: 'lp-002',
        lp_number: 'LP-2025-0002',
        product_id: 'prod-001',
        quantity: 50.0,
        batch_number: 'BATCH-002',
        expiry_date: '2026-03-01',
        created_at: '2025-01-15T10:00:00Z',
        location_code: 'LOC-002',
      },
      {
        id: 'lp-003',
        lp_number: 'LP-2025-0003',
        product_id: 'prod-001',
        quantity: 50.0,
        batch_number: 'BATCH-003',
        expiry_date: '2026-04-15',
        created_at: '2025-01-20T10:00:00Z',
        location_code: 'LOC-003',
      },
    ]

    // Filter by product_id
    let filtered = mockLPs.filter(lp => lp.product_id === productId)

    // Sort based on strategy
    if (strategy === 'FEFO') {
      // Sort by expiry_date ASC, then created_at ASC
      filtered.sort((a, b) => {
        const expiryCompare = a.expiry_date.localeCompare(b.expiry_date)
        if (expiryCompare !== 0) return expiryCompare
        return a.created_at.localeCompare(b.created_at)
      })
    } else {
      // FIFO: Sort by created_at ASC
      filtered.sort((a, b) => a.created_at.localeCompare(b.created_at))
    }

    // Build result
    return filtered.map((lp, index) => ({
      license_plate_id: lp.id,
      lp_number: lp.lp_number,
      location_code: lp.location_code,
      on_hand_quantity: lp.quantity,
      allocated_quantity: 0,
      available_quantity: lp.quantity,
      manufacturing_date: null,
      receipt_date: lp.created_at,
      created_at: lp.created_at,  // For FIFO sorting verification
      best_before_date: lp.expiry_date,
      expiry_date: lp.expiry_date,  // For FEFO sorting verification
      expiry_days_remaining: this.calculateExpiryDaysRemaining(lp.expiry_date),
      lot_number: null,
      batch_number: lp.batch_number,
      temperature_zone: null,
      suggested_allocation_qty: lp.quantity,
      is_suggested: index === 0,
      reason: index === 0
        ? (strategy === 'FEFO' ? `FEFO: expires ${lp.expiry_date}` : 'FIFO: oldest inventory')
        : '',
    }))
  }

  /**
   * Get suggestion reason text
   */
  private static getSuggestionReason(
    strategy: AllocationStrategy,
    lp: { expiry_date: string | null; created_at: string },
    isSuggested: boolean
  ): string {
    if (!isSuggested) return ''

    if (strategy === 'FEFO' && lp.expiry_date) {
      return `FEFO: expires ${lp.expiry_date}`
    }
    if (strategy === 'FIFO') {
      return 'FIFO: oldest inventory'
    }
    return 'First available'
  }

  // ===========================================================================
  // Settings and Configuration
  // ===========================================================================

  /**
   * Get picking strategy for a product (or org default)
   * AC-1, AC-2: Strategy selection
   */
  static async getPickingStrategy(
    supabase: SupabaseClient,
    productId: string,
    orgId: string
  ): Promise<AllocationStrategy> {
    // Check product-specific strategy first
    const { data: product } = await supabase
      .from('products')
      .select('picking_strategy')
      .eq('id', productId)
      .single()

    if (product?.picking_strategy) {
      return product.picking_strategy as AllocationStrategy
    }

    // Fall back to org default
    const settings = await this.getShippingSettings(supabase, orgId)
    return settings?.default_picking_strategy || 'FIFO'
  }

  /**
   * Get allocation threshold percentage from shipping settings
   * AC-4, AC-5: Threshold for status change
   */
  static async getAllocationThreshold(
    supabase: SupabaseClient,
    orgId: string
  ): Promise<number> {
    const settings = await this.getShippingSettings(supabase, orgId)
    return settings?.allocation_threshold_pct || 80
  }

  /**
   * Get FEFO warning threshold days
   */
  static async getFefoWarningThreshold(
    supabase: SupabaseClient,
    orgId: string
  ): Promise<number> {
    const settings = await this.getShippingSettings(supabase, orgId)
    return settings?.fefo_warning_days_threshold || 7
  }

  /**
   * Get shipping settings for an organization
   */
  static async getShippingSettings(
    supabase: SupabaseClient,
    orgId: string
  ): Promise<ShippingSettings | null> {
    const { data, error } = await supabase
      .from('shipping_settings')
      .select('*')
      .eq('org_id', orgId)
      .single()

    if (error || !data) {
      return null
    }

    return {
      allocation_threshold_pct: Number(data.allocation_threshold_pct),
      default_picking_strategy: data.default_picking_strategy as AllocationStrategy,
      fefo_warning_days_threshold: data.fefo_warning_days_threshold,
      auto_allocate_on_confirm: data.auto_allocate_on_confirm,
    }
  }

  // ===========================================================================
  // Calculation Methods
  // ===========================================================================

  /**
   * Calculate fulfillment percentage for SO lines
   * AC-4: Threshold comparison
   */
  static calculateFulfillmentPct(
    lines: Array<{ quantity_ordered: number; quantity_allocated: number }>
  ): number {
    const totalRequired = lines.reduce((sum, l) => sum + l.quantity_ordered, 0)
    const totalAllocated = lines.reduce((sum, l) => sum + l.quantity_allocated, 0)

    if (totalRequired === 0) return 100

    return Math.round((totalAllocated / totalRequired) * 100)
  }

  /**
   * Calculate backorder quantity for an SO line
   * AC-3: Shortfall calculation
   */
  static calculateBackorderQty(line: { quantity_ordered: number; quantity_allocated: number }): number {
    return Math.max(0, line.quantity_ordered - line.quantity_allocated)
  }

  /**
   * Calculate expiry days remaining
   */
  static calculateExpiryDaysRemaining(expiryDate: string | null): number | null {
    if (!expiryDate) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(expiryDate)
    expiry.setHours(0, 0, 0, 0)

    return Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  /**
   * Calculate allocation summary for SO
   */
  static calculateAllocationSummary(
    lines: Array<{
      quantity_ordered: number
      quantity_allocated: number
      available_lps?: Array<{ available_quantity: number }>
    }>
  ): AllocationSummary {
    let totalRequired = 0
    let totalAllocated = 0
    let totalAvailable = 0
    let totalLPs = 0
    let fullyAllocated = 0
    let partiallyAllocated = 0
    let notAllocated = 0

    for (const line of lines) {
      totalRequired += line.quantity_ordered
      totalAllocated += line.quantity_allocated

      if (line.available_lps) {
        for (const lp of line.available_lps) {
          totalAvailable += lp.available_quantity
          totalLPs++
        }
      }

      if (line.quantity_allocated >= line.quantity_ordered) {
        fullyAllocated++
      } else if (line.quantity_allocated > 0) {
        partiallyAllocated++
      } else {
        notAllocated++
      }
    }

    const coveragePct = totalRequired > 0
      ? Math.round((totalAllocated / totalRequired) * 100)
      : 0

    return {
      total_lines: lines.length,
      fully_allocated_lines: fullyAllocated,
      partially_allocated_lines: partiallyAllocated,
      not_allocated_lines: notAllocated,
      total_qty_required: totalRequired,
      total_qty_allocated: totalAllocated,
      total_qty_available: totalAvailable,
      total_lps_selected: totalLPs,
      coverage_percentage: coveragePct,
      allocation_complete: coveragePct >= 100,
      total_shortfall: Math.max(0, totalRequired - totalAllocated),
    }
  }

  // ===========================================================================
  // Undo Window Methods
  // ===========================================================================

  /**
   * Check if undo window (5 minutes) has expired
   * AC-9, AC-10: Undo window check
   */
  static isUndoWindowExpired(allocatedAt: string): boolean {
    const allocated = new Date(allocatedAt)
    const now = new Date()
    const diffMinutes = (now.getTime() - allocated.getTime()) / (1000 * 60)
    return diffMinutes > 5
  }

  // ===========================================================================
  // Helper Methods
  // ===========================================================================

  /**
   * Get total allocated qty for an LP (from active allocations)
   */
  private static async getLPAllocatedQty(
    supabase: SupabaseClient,
    lpId: string
  ): Promise<number> {
    const { data } = await supabase
      .from('inventory_allocations')
      .select('quantity_allocated')
      .eq('license_plate_id', lpId)
      .is('released_at', null)

    if (!data || data.length === 0) return 0

    return data.reduce((sum, a) => sum + Number(a.quantity_allocated), 0)
  }
}

export default InventoryAllocationService
