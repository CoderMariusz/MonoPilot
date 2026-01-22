/**
 * API Route: Complete Pick List
 * Story: 07.9 - Pick Confirmation Desktop
 *
 * POST /api/shipping/pick-lists/:id/complete - Mark pick list as complete
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext, validateOrigin } from '@/lib/api/auth-helpers'
import { WAREHOUSE_ELEVATED_ROLES } from '@/lib/constants/roles'

/**
 * POST /api/shipping/pick-lists/:id/complete
 * Mark entire pick list as complete, validate all lines picked/short
 *
 * AC-7: Complete pick list workflow
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // CSRF protection
    const originError = validateOrigin(request)
    if (originError) {
      return originError
    }

    const { id: pickListId } = await params

    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId, orgId, userRole } = authContext

    const now = new Date().toISOString()

    // Get pick list
    const { data: pickList, error: plError } = await supabase
      .from('pick_lists')
      .select('id, pick_list_number, status, assigned_to')
      .eq('id', pickListId)
      .eq('org_id', orgId)
      .single()

    if (plError || !pickList) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Pick list not found' } },
        { status: 404 }
      )
    }

    // Validate permission
    const hasElevatedRole = WAREHOUSE_ELEVATED_ROLES.includes(userRole.toLowerCase() as typeof WAREHOUSE_ELEVATED_ROLES[number])
    if (pickList.assigned_to !== userId && !hasElevatedRole) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Access denied' } },
        { status: 403 }
      )
    }

    // Validate pick list status
    if (pickList.status !== 'in_progress') {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: 'Pick list not in progress' } },
        { status: 409 }
      )
    }

    // Get all lines
    const { data: lines, error: linesError } = await supabase
      .from('pick_list_lines')
      .select(`
        id,
        sales_order_line_id,
        quantity_picked,
        status,
        sales_order_lines!pick_list_lines_sales_order_line_id_fkey(
          id,
          sales_order_id
        )
      `)
      .eq('pick_list_id', pickListId)
      .eq('org_id', orgId)

    if (linesError || !lines) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch pick list lines' } },
        { status: 500 }
      )
    }

    // Check for pending lines
    const pendingLines = lines.filter((l: any) => l.status === 'pending')
    if (pendingLines.length > 0) {
      return NextResponse.json(
        { error: { code: 'CONFLICT', message: `Cannot complete pick list - ${pendingLines.length} lines still pending` } },
        { status: 409 }
      )
    }

    // Calculate summary
    const pickedLines = lines.filter((l: any) => l.status === 'picked').length
    const shortLines = lines.filter((l: any) => l.status === 'short').length
    const totalUnitsPicked = lines.reduce((sum: number, l: any) => sum + Number(l.quantity_picked), 0)

    // Update pick list status
    const { error: updateError } = await supabase
      .from('pick_lists')
      .update({
        status: 'completed',
        completed_at: now,
      })
      .eq('id', pickListId)
      .eq('org_id', orgId)

    if (updateError) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to complete pick list' } },
        { status: 500 }
      )
    }

    // Get unique sales order IDs and update their statuses
    const soIds = [...new Set(
      lines
        .map((l: any) => l.sales_order_lines?.sales_order_id)
        .filter(Boolean)
    )]

    const salesOrdersUpdated: Array<{ id: string; order_number: string; status: 'packing' | 'partial' }> = []

    for (const soId of soIds) {
      // Get all SO lines
      const { data: soLines } = await supabase
        .from('sales_order_lines')
        .select('quantity_ordered, quantity_picked, backorder_flag')
        .eq('sales_order_id', soId)

      // Determine SO status
      const hasShortPicks = soLines?.some((l: any) => l.backorder_flag)
      const newStatus = hasShortPicks ? 'partial' : 'packing'

      // Update SO
      const { data: so } = await supabase
        .from('sales_orders')
        .update({ status: newStatus })
        .eq('id', soId)
        .eq('org_id', orgId)
        .select('id, order_number')
        .single()

      if (so) {
        salesOrdersUpdated.push({
          id: so.id,
          order_number: so.order_number,
          status: newStatus,
        })
      }
    }

    return NextResponse.json({
      success: true,
      pick_list: {
        id: pickListId,
        status: 'completed',
        completed_at: now,
      },
      summary: {
        total_lines: lines.length,
        picked_lines: pickedLines,
        short_lines: shortLines,
        total_units_picked: totalUnitsPicked,
      },
      sales_orders_updated: salesOrdersUpdated,
    })
  } catch (error) {
    console.error('Error in POST /api/shipping/pick-lists/:id/complete:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
