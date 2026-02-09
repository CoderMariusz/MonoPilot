/**
 * API Route: Shipments CRUD
 * GET /api/shipping/shipments - List shipments
 * POST /api/shipping/shipments - Create shipment (will transition to "pending" status)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext, validateOrigin } from '@/lib/api/auth-helpers'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { orgId } = authContext

    // Get shipments list
    const { data: shipments, error } = await supabase
      .from('shipments')
      .select(`
        id,
        shipment_number,
        status,
        sales_order_id,
        sales_orders (
          id,
          order_number,
          status
        ),
        created_at,
        updated_at
      `)
      .eq('org_id', orgId)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'FETCH_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: shipments || [],
    })
  } catch (error) {
    console.error('Error fetching shipments:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const originError = validateOrigin(request)
    if (originError) {
      return originError
    }

    const supabase = await createServerSupabase()

    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { orgId, userId } = authContext

    const body = await request.json()
    const { sales_order_id, ship_to_address_id, ship_from_address_id, special_instructions } = body

    // Generate shipment number
    const timestamp = Date.now().toString().slice(-6)
    const shipmentNumber = `SHIP-${timestamp}`

    // Create shipment with initial "pending" status
    const { data: shipment, error } = await supabase
      .from('shipments')
      .insert({
        shipment_number: shipmentNumber,
        sales_order_id,
        ship_to_address_id,
        ship_from_address_id,
        status: 'pending',
        org_id: orgId,
        created_by: userId,
        special_instructions,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json(
        { success: false, error: { code: 'CREATE_ERROR', message: error.message } },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: shipment,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating shipment:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
