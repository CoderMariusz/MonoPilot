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

/**
 * GET /api/shipping/scanner/pack/lookup/[barcode]
 * Lookup shipment by SO number or shipment number
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  try {
    const { barcode: rawBarcode } = await params
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

    const barcode = decodeURIComponent(rawBarcode)

    // Try to find shipment by shipment_number first
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
            name,
            allergen_restrictions
          )
        ),
        status,
        created_at
      `)
      .eq('org_id', orgId)
      .eq('shipment_number', barcode)
      .eq('status', 'ready_to_pack')
      .single()

    // If not found by shipment_number, try by SO order_number
    if (!shipment && (!error || error.code === 'PGRST116')) {
      const { data: shipmentBySO, error: soError } = await supabase
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
              name,
              allergen_restrictions
            )
          ),
          status,
          created_at
        `)
        .eq('org_id', orgId)
        .eq('sales_order.order_number', barcode)
        .eq('status', 'ready_to_pack')
        .single()

      if (soError && soError.code !== 'PGRST116') {
        console.error('Error looking up shipment by SO:', soError)
        return NextResponse.json(
          { error: { code: 'FETCH_ERROR', message: 'Lookup failed' } },
          { status: 500 }
        )
      }

      shipment = shipmentBySO
      error = soError
    } else if (error && error.code !== 'PGRST116') {
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

    // Type assertions for Supabase joined data
    const salesOrder = shipment.sales_order as unknown as {
      id: string
      order_number: string
      promised_ship_date: string | null
      customer: { id: string; name: string; allergen_restrictions: string[] | null } | null
    } | null
    const customer = salesOrder?.customer

    // Get line counts from sales_order_lines
    const { data: lineCounts } = await supabase
      .from('sales_order_lines')
      .select('id, packed_quantity, quantity')
      .eq('sales_order_id', salesOrder?.id)

    const total = lineCounts?.length || 0
    const packed = lineCounts?.filter((l) => (l.packed_quantity || 0) >= (l.quantity || 0)).length || 0

    // Check allergen restrictions
    const allergenRestrictions = customer?.allergen_restrictions || []
    const allergenAlert = allergenRestrictions.length > 0

    const formattedShipment = {
      id: shipment.id,
      soNumber: salesOrder?.order_number || 'N/A',
      customerName: customer?.name || 'Unknown',
      promisedShipDate: salesOrder?.promised_ship_date || new Date().toISOString(),
      linesTotal: total,
      linesPacked: packed,
      allergenAlert,
      allergenRestrictions,
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
