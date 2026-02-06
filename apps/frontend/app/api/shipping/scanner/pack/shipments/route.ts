/**
 * API Route: Get Pending Shipments
 * Story: 07.12 - Packing Scanner Mobile UI
 *
 * GET /api/shipping/scanner/pack/shipments - Get pending shipments for packing
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/api/auth-helpers'

// Roles that can view pending shipments
const ALLOWED_ROLES = ['packer', 'warehouse_packer', 'warehouse_manager', 'supervisor', 'warehouse', 'manager', 'admin', 'owner', 'super_admin']

/**
 * GET /api/shipping/scanner/pack/shipments
 * Returns pending shipments (status = 'ready_to_pack')
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { orgId, userRole } = authContext

    // Check role permission
    if (!ALLOWED_ROLES.includes(userRole.toLowerCase())) {
      return NextResponse.json(
        { error: { code: 'FORBIDDEN', message: 'Insufficient permissions' } },
        { status: 403 }
      )
    }

    // Query pending shipments
    const { data: shipments, error } = await supabase
      .from('shipments')
      .select(`
        id,
        shipment_number,
        sales_order:sales_orders!inner(
          id,
          order_number,
          promised_ship_date,
          customer:customers(
            id,
            name
          )
        ),
        status,
        created_at
      `)
      .eq('org_id', orgId)
      .eq('status', 'ready_to_pack')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching pending shipments:', error)
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: 'Failed to load shipments' } },
        { status: 500 }
      )
    }

    // Get line counts for each shipment
    const shipmentIds = (shipments || []).map((s) => s.id)
    let lineCounts: any[] = []

    if (shipmentIds.length > 0) {
      const { data: counts } = await supabase
        .from('shipment_lines')
        .select('shipment_id, status')
        .in('shipment_id', shipmentIds)

      lineCounts = counts || []
    }

    // Build line count map
    const lineCountMap = new Map<string, { total: number; packed: number }>()
    for (const line of lineCounts) {
      if (!lineCountMap.has(line.shipment_id)) {
        lineCountMap.set(line.shipment_id, { total: 0, packed: 0 })
      }
      const counts = lineCountMap.get(line.shipment_id)!
      counts.total++
      if (line.status === 'packed') {
        counts.packed++
      }
    }

    // Check for allergen alerts (simplified - would need actual allergen logic)
    const formattedShipments = (shipments || []).map((shipment) => {
      const counts = lineCountMap.get(shipment.id) || { total: 0, packed: 0 }
      return {
        id: shipment.id,
        soNumber: shipment.sales_order?.order_number || 'N/A',
        customerName: shipment.sales_order?.customer?.name || 'Unknown',
        promisedShipDate: shipment.sales_order?.promised_ship_date || new Date().toISOString(),
        linesTotal: counts.total,
        linesPacked: counts.packed,
        allergenAlert: false, // Would require checking product allergens vs customer restrictions
        allergenRestrictions: [],
      }
    })

    return NextResponse.json({ data: formattedShipments })
  } catch (error) {
    console.error('Error in GET /api/shipping/scanner/pack/shipments:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
