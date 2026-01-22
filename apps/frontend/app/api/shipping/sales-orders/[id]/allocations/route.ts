/**
 * API Route: Allocation Data
 * Story: 07.7 - Inventory Allocation (FIFO/FEFO + Backorders)
 *
 * GET /api/shipping/sales-orders/:id/allocations - Fetch allocation data with suggestions
 *
 * Roles: All authenticated users
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { InventoryAllocationService } from '@/lib/services/inventory-allocation-service'
import { allocationQuerySchema, type AllocationDataResponse, type AllocationLineData } from '@/lib/validation/allocation'

// ============================================================================
// GET Handler - Fetch Allocation Data
// ============================================================================

/**
 * GET /api/shipping/sales-orders/:id/allocations
 * Fetch allocation data with FIFO/FEFO suggestions and inventory freshness
 *
 * Query params:
 * - strategy: 'fifo' | 'fefo' (override default)
 * - include_suggestions: boolean (default true)
 * - include_last_updated: boolean (default true)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check authentication
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    // Get user's org
    const supabaseAdmin = createServerSupabaseAdmin()
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'User not found' } },
        { status: 403 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryResult = allocationQuerySchema.safeParse({
      strategy: searchParams.get('strategy')?.toUpperCase(),
      include_suggestions: searchParams.get('include_suggestions'),
      include_last_updated: searchParams.get('include_last_updated'),
    })

    if (!queryResult.success) {
      return NextResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: queryResult.error.errors[0]?.message || 'Invalid query parameters',
          },
        },
        { status: 400 }
      )
    }

    const query = queryResult.data

    // Check if SO exists within the user's org
    const { data: so, error: soError } = await supabaseAdmin
      .from('sales_orders')
      .select('id, order_number, status')
      .eq('id', id)
      .eq('org_id', userData.org_id)
      .single()

    if (soError || !so) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Sales order not found' } },
        { status: 404 }
      )
    }

    // Validate SO status (must be confirmed or allocated)
    if (!['confirmed', 'allocated'].includes(so.status)) {
      return NextResponse.json(
        { error: { code: 'INVALID_SO_STATUS', message: 'SO must be in confirmed status' } },
        { status: 400 }
      )
    }

    // Get SO lines with product info
    const { data: soLines, error: linesError } = await supabaseAdmin
      .from('sales_order_lines')
      .select(`
        id,
        line_number,
        product_id,
        quantity_ordered,
        quantity_allocated,
        unit_price,
        products!inner(id, code, name, size)
      `)
      .eq('sales_order_id', id)
      .order('line_number', { ascending: true })

    if (linesError) {
      throw new Error(`Failed to fetch SO lines: ${linesError.message}`)
    }

    // Get strategy (from query or org default)
    const strategy = query.strategy ||
      await InventoryAllocationService.getPickingStrategy(
        supabaseAdmin,
        soLines?.[0]?.product_id || '',
        userData.org_id
      )

    // Get FEFO warning threshold
    const fefoWarningThreshold = await InventoryAllocationService.getFefoWarningThreshold(
      supabaseAdmin,
      userData.org_id
    )

    // Build line data with available LPs
    const lineData: AllocationLineData[] = []

    for (const line of soLines || []) {
      const productData = line.products as unknown as { id: string; code: string; name: string; size: string | null }
      const product = productData

      // Get available LPs for this product
      const availableLPs = query.include_suggestions
        ? await InventoryAllocationService.getAvailableLPs(
            supabaseAdmin,
            line.product_id,
            strategy,
            100
          )
        : []

      const qtyOrdered = Number(line.quantity_ordered)
      const qtyAllocated = Number(line.quantity_allocated) || 0
      const totalAvailable = availableLPs.reduce((sum, lp) => sum + lp.available_quantity, 0)
      const qtyShort = Math.max(0, qtyOrdered - qtyAllocated - totalAvailable)

      let allocationStatus: 'full' | 'partial' | 'none' = 'none'
      if (qtyAllocated >= qtyOrdered) {
        allocationStatus = 'full'
      } else if (qtyAllocated > 0) {
        allocationStatus = 'partial'
      }

      lineData.push({
        line_id: line.id,
        line_number: line.line_number,
        product_id: line.product_id,
        product_name: product.name,
        product_size: product.size,
        quantity_ordered: qtyOrdered,
        quantity_currently_allocated: qtyAllocated,
        unit_price: Number(line.unit_price),
        line_total: Math.round(qtyOrdered * Number(line.unit_price) * 100) / 100,
        available_license_plates: availableLPs,
        allocation_status: allocationStatus,
        total_available: totalAvailable,
        qty_short: qtyShort,
        allocation_summary: {
          fully_allocated: qtyAllocated >= qtyOrdered,
          partially_allocated: qtyAllocated > 0 && qtyAllocated < qtyOrdered,
          total_available_qty: totalAvailable,
          total_allocated_qty: qtyAllocated,
          shortfall_qty: Math.max(0, qtyOrdered - qtyAllocated),
        },
      })
    }

    // Calculate overall summary
    const summary = InventoryAllocationService.calculateAllocationSummary(
      lineData.map((l) => ({
        quantity_ordered: l.quantity_ordered,
        quantity_allocated: l.quantity_currently_allocated,
        available_lps: l.available_license_plates.map((lp) => ({
          available_quantity: lp.available_quantity,
        })),
      }))
    )

    const response: AllocationDataResponse = {
      sales_order_id: id,
      order_number: so.order_number,
      last_updated: new Date().toISOString(),
      lines: lineData,
      allocation_summary: summary,
      fefo_warning_threshold_days: fefoWarningThreshold,
      strategy: strategy.toLowerCase() as 'fifo' | 'fefo',
      timestamp: new Date().toISOString(),
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error in GET /api/shipping/sales-orders/:id/allocations:', error)

    const message = error instanceof Error ? error.message : 'Internal server error'

    if (message.includes('not found')) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message } },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
