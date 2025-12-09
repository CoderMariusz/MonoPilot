/**
 * Scanner API: Get Work Order Requirements
 * GET /api/scanner/work-orders/[id]/requirements
 *
 * Returns WO materials with reservation status and all reservations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

interface RouteContext {
  params: { id: string }
}

export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase()
    const woId = context.params.id

    // Get current user's org_id
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
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (!userData?.org_id) {
      return NextResponse.json(
        { success: false, error: 'Organization not found' },
        { status: 403 }
      )
    }

    const orgId = userData.org_id

    // 1. Get Work Order details
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select(`
        id,
        wo_number,
        product_id,
        planned_quantity,
        uom,
        products:product_id (
          code,
          name
        )
      `)
      .eq('id', woId)
      .eq('org_id', orgId)
      .single()

    if (woError || !wo) {
      return NextResponse.json(
        { success: false, error: 'Work Order not found' },
        { status: 404 }
      )
    }

    // 2. Get WO materials
    const { data: materials, error: materialsError } = await supabase
      .from('wo_materials')
      .select(`
        id,
        product_id,
        material_name,
        required_qty,
        consumed_qty,
        uom,
        sequence,
        products:product_id (
          code,
          name
        )
      `)
      .eq('wo_id', woId)
      .eq('organization_id', orgId)
      .order('sequence', { ascending: true })

    if (materialsError) {
      console.error('Error fetching materials:', materialsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch materials' },
        { status: 500 }
      )
    }

    // 3. Get all reservations for this WO
    const { data: reservations, error: reservationsError } = await supabase
      .from('wo_material_reservations')
      .select(`
        id,
        material_id,
        lp_id,
        reserved_qty,
        uom,
        status,
        reserved_at,
        license_plates:lp_id (
          lp_number,
          product:products (
            code,
            name
          )
        )
      `)
      .eq('wo_id', woId)
      .eq('status', 'reserved')
      .order('reserved_at', { ascending: true })

    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch reservations' },
        { status: 500 }
      )
    }

    // 4. Calculate status for each material
    const materialsWithStatus = (materials || []).map((material) => {
      const materialReservations = (reservations || []).filter(
        (r) => r.material_id === material.id
      )

      const reservedQty = materialReservations.reduce(
        (sum, r) => sum + Number(r.reserved_qty),
        0
      )

      const requiredQty = Number(material.required_qty)
      let status: 'complete' | 'partial' | 'none'

      if (reservedQty >= requiredQty) {
        status = 'complete'
      } else if (reservedQty > 0) {
        status = 'partial'
      } else {
        status = 'none'
      }

      // Handle Supabase join results
      const product = material.products as unknown as
        | { code: string; name: string }
        | { code: string; name: string }[]
        | null
      const productData = Array.isArray(product) ? product[0] : product

      return {
        id: material.id,
        product_id: material.product_id,
        product_code: productData?.code || '',
        product_name: productData?.name || material.material_name,
        required_qty: requiredQty,
        reserved_qty: reservedQty,
        status,
      }
    })

    // 5. Format reservations list
    const reservationsList = (reservations || []).map((r) => {
      // Handle Supabase join results
      const lpData = r.license_plates as unknown as
        | {
            lp_number: string
            product: { code: string; name: string } | { code: string; name: string }[]
          }
        | {
            lp_number: string
            product: { code: string; name: string } | { code: string; name: string }[]
          }[]
        | null

      const lp = Array.isArray(lpData) ? lpData[0] : lpData
      const product = lp?.product
      const productData = Array.isArray(product) ? product[0] : product

      return {
        id: r.id,
        lp_id: r.lp_id,
        lp_barcode: lp?.lp_number || '',
        product_code: productData?.code || '',
        quantity: Number(r.reserved_qty),
        uom: r.uom,
        reserved_at: r.reserved_at,
      }
    })

    // Handle WO product join
    const woProduct = wo.products as unknown as
      | { code: string; name: string }
      | { code: string; name: string }[]
      | null
    const woProductData = Array.isArray(woProduct) ? woProduct[0] : woProduct

    return NextResponse.json({
      success: true,
      data: {
        wo: {
          id: wo.id,
          wo_number: wo.wo_number,
          product_code: woProductData?.code || '',
          product_name: woProductData?.name || 'Unknown',
          planned_quantity: Number(wo.planned_quantity),
          uom: wo.uom,
        },
        materials: materialsWithStatus,
        reservations: reservationsList,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/scanner/work-orders/[id]/requirements:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
