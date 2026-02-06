/**
 * API Route: Lookup Shipment by Barcode
 * Story: 07.12 - Packing Scanner Mobile UI
 *
 * GET /api/shipping/scanner/pack/lookup/[barcode] - Lookup shipment by SO number or shipment number
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/api/auth-helpers'

// Roles that can lookup shipments
const ALLOWED_ROLES = ['packer', 'warehouse_packer', 'warehouse_manager', 'supervisor', 'warehouse', 'manager', 'admin', 'owner', 'super_admin']

interface RouteParams {
  params: {
    barcode: string
  }
}

/**
 * GET /api/shipping/scanner/pack/lookup/[barcode]
 * Lookup shipment by SO number or shipment number
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const barcode = decodeURIComponent(params.barcode)

    // Try to find shipment by SO number first
    let { data: shipment, error } = await supabase
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
      .or(`sales_order.order_number.eq.${barcode},shipment_number.eq.${barcode}`)
      .eq('status', 'ready_to_pack')
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error looking up shipment:', error)
      return NextResponse.json(
        { error: { code: 'FETCH_ERROR', message: 'Lookup failed' } },
        { status: 500 }
      )
    }

    if (!shipment) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Shipment not found' } },
        { status: 404 }
      )
    }

    // Get line counts
    const { data: lineCounts } = await supabase
      .from('shipment_lines')
      .select('status')
      .eq('shipment_id', shipment.id)

    const total = lineCounts?.length || 0
    const packed = lineCounts?.filter((l) => l.status === 'packed').length || 0

    const formattedShipment = {
      id: shipment.id,
      soNumber: shipment.sales_order?.order_number || 'N/A',
      customerName: shipment.sales_order?.customer?.name || 'Unknown',
      promisedShipDate: shipment.sales_order?.promised_ship_date || new Date().toISOString(),
      linesTotal: total,
      linesPacked: packed,
      allergenAlert: false,
      allergenRestrictions: [],
    }

    return NextResponse.json({ data: formattedShipment })
  } catch (error) {
    console.error('Error in GET /api/shipping/scanner/pack/lookup/[barcode]:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
