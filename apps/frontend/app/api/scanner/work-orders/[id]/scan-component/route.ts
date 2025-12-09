/**
 * Scanner API: Scan Component for Work Order
 * POST /api/scanner/work-orders/[id]/scan-component
 *
 * Scans an LP barcode and reserves it to the Work Order
 * Validates that the LP's product matches a material in the WO BOM
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { MaterialReservationService } from '@/lib/services/material-reservation-service'

interface RouteContext {
  params: { id: string }
}

export async function POST(req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase()
    const woId = context.params.id

    // Get current user
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: userData } = await supabase
      .from('users')
      .select('org_id, role')
      .eq('id', user.id)
      .single()

    if (!userData?.org_id) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 403 }
      )
    }

    const orgId = userData.org_id

    // Parse request body
    const body = await req.json()
    const { barcode } = body

    if (!barcode) {
      return NextResponse.json(
        { success: false, error: 'Barcode is required' },
        { status: 400 }
      )
    }

    // 1. Lookup LP by barcode
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        product_id,
        quantity,
        current_qty,
        uom,
        status,
        products:product_id (
          id,
          code,
          name
        ),
        locations:location_id (
          code
        )
      `)
      .eq('org_id', orgId)
      .eq('lp_number', barcode)
      .single()

    if (lpError || !lp) {
      return NextResponse.json(
        {
          success: false,
          error: 'License Plate not found',
          details: `No LP found with barcode: ${barcode}`,
        },
        { status: 404 }
      )
    }

    // 2. Check LP is available
    if (lp.status !== 'available') {
      return NextResponse.json(
        {
          success: false,
          error: 'License Plate not available',
          details: `LP ${lp.lp_number} has status: ${lp.status}`,
        },
        { status: 400 }
      )
    }

    // 3. Get LP's product_id
    const lpProductId = lp.product_id

    // 4. Check if product_id exists in wo_materials for this WO
    const { data: materials, error: materialsError } = await supabase
      .from('wo_materials')
      .select('id, product_id, material_name, required_qty, consumed_qty, uom')
      .eq('wo_id', woId)
      .eq('organization_id', orgId)
      .eq('product_id', lpProductId)

    if (materialsError) {
      console.error('Error fetching wo_materials:', materialsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch work order materials' },
        { status: 500 }
      )
    }

    if (!materials || materials.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Component not in BOM',
          details: 'This component is not in the BOM for this Work Order',
        },
        { status: 400 }
      )
    }

    // If multiple materials with same product (e.g., different operations), use first one
    const material = materials[0]

    // 5. Create reservation using MaterialReservationService
    const reservationService = new MaterialReservationService(supabase)

    const availableQty = lp.current_qty ?? lp.quantity
    const { data: reservation, error: reservationError } =
      await reservationService.reserveMaterial(
        {
          woId,
          materialId: material.id,
          lpId: lp.id,
          reservedQty: availableQty, // Reserve ENTIRE LP quantity
          userId: user.id,
          orgId,
        },
        userData.role
      )

    if (reservationError) {
      return NextResponse.json(
        {
          success: false,
          error: reservationError.message,
          code: reservationError.code,
          details: reservationError.details,
        },
        { status: 400 }
      )
    }

    // Handle Supabase join results
    const product = lp.products as unknown as
      | { id: string; code: string; name: string }
      | { id: string; code: string; name: string }[]
      | null
    const productData = Array.isArray(product) ? product[0] : product

    const location = lp.locations as unknown as
      | { code: string }
      | { code: string }[]
      | null
    const locationData = Array.isArray(location) ? location[0] : location

    // 6. Return success with reservation details
    return NextResponse.json({
      success: true,
      data: {
        reservation_id: reservation?.id,
        lp: {
          id: lp.id,
          barcode: lp.lp_number,
          product_code: productData?.code || '',
          product_name: productData?.name || 'Unknown',
          quantity: availableQty,
          uom: lp.uom,
          location_code: locationData?.code || 'Unknown',
        },
        material: {
          id: material.id,
          product_code: productData?.code || '',
          required_qty: Number(material.required_qty),
          consumed_qty: Number(material.consumed_qty || 0),
        },
      },
    })
  } catch (error) {
    console.error('Error in POST /api/scanner/work-orders/[id]/scan-component:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
