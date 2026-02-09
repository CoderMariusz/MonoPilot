/**
 * API Route: Get Single Shipment
 * GET /api/shipping/shipments/[id] - Get shipment details
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/api/auth-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabase()

    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { orgId } = authContext
    const shipmentId = params.id

    // Get shipment details with related data
    const { data: shipment, error } = await supabase
      .from('shipments')
      .select(`
        id,
        shipment_number,
        status,
        sales_order_id,
        ship_to_address_id,
        ship_from_address_id,
        special_instructions,
        created_at,
        updated_at,
        packed_at,
        manifested_at,
        shipped_at,
        delivered_at,
        sales_orders (
          id,
          order_number,
          status,
          customer_id,
          customers (
            id,
            name,
            email
          )
        ),
        shipment_boxes (
          id,
          box_number,
          weight,
          length,
          width,
          height,
          sscc,
          tracking_number,
          created_at
        )
      `)
      .eq('id', shipmentId)
      .eq('org_id', orgId)
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'FETCH_ERROR', message: error.message } },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      )
    }

    if (!shipment) {
      return NextResponse.json(
        { success: false, error: { code: 'NOT_FOUND', message: 'Shipment not found' } },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: shipment,
    })
  } catch (error) {
    console.error('Error fetching shipment:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
