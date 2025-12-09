/**
 * Scanner API: Get Work Orders
 * GET /api/scanner/work-orders
 *
 * Returns work orders filtered by production line for scanner UI
 * Calculates materials_status based on reservations
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const searchParams = req.nextUrl.searchParams

    const lineId = searchParams.get('line_id')
    const statusParam = searchParams.get('status') || 'released,in_progress'

    // Validate required params
    if (!lineId) {
      return NextResponse.json(
        { success: false, error: 'line_id is required' },
        { status: 400 }
      )
    }

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
    const statuses = statusParam.split(',')

    // Get work orders for production line
    const { data: workOrders, error: woError } = await supabase
      .from('work_orders')
      .select(`
        id,
        wo_number,
        product_id,
        planned_quantity,
        produced_quantity,
        uom,
        status,
        products:product_id (
          id,
          code,
          name
        )
      `)
      .eq('org_id', orgId)
      .eq('production_line_id', lineId)
      .in('status', statuses)
      .order('planned_start_date', { ascending: true })

    if (woError) {
      console.error('Error fetching work orders:', woError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch work orders' },
        { status: 500 }
      )
    }

    // For each WO, calculate materials_status
    const woIds = (workOrders || []).map((wo) => wo.id)

    if (woIds.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
      })
    }

    // Get all materials for these WOs
    const { data: materials, error: materialsError } = await supabase
      .from('wo_materials')
      .select('id, wo_id, required_qty')
      .in('wo_id', woIds)

    if (materialsError) {
      console.error('Error fetching materials:', materialsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch materials' },
        { status: 500 }
      )
    }

    // Get all reservations for these WOs
    const { data: reservations, error: reservationsError } = await supabase
      .from('wo_material_reservations')
      .select('material_id, reserved_qty, status')
      .in('wo_id', woIds)
      .eq('status', 'reserved')

    if (reservationsError) {
      console.error('Error fetching reservations:', reservationsError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch reservations' },
        { status: 500 }
      )
    }

    // Calculate materials_status for each WO
    const woWithStatus = (workOrders || []).map((wo) => {
      const woMaterials = (materials || []).filter((m) => m.wo_id === wo.id)

      if (woMaterials.length === 0) {
        return {
          ...wo,
          materials_status: 'none' as const,
        }
      }

      let completeCount = 0
      let partialCount = 0

      woMaterials.forEach((material) => {
        const materialReservations = (reservations || []).filter(
          (r) => r.material_id === material.id
        )
        const totalReserved = materialReservations.reduce(
          (sum, r) => sum + Number(r.reserved_qty),
          0
        )

        if (totalReserved >= Number(material.required_qty)) {
          completeCount++
        } else if (totalReserved > 0) {
          partialCount++
        }
      })

      let materialsStatus: 'complete' | 'partial' | 'none'
      if (completeCount === woMaterials.length) {
        materialsStatus = 'complete'
      } else if (completeCount > 0 || partialCount > 0) {
        materialsStatus = 'partial'
      } else {
        materialsStatus = 'none'
      }

      // Handle Supabase join results
      const product = wo.products as unknown as
        | { id: string; code: string; name: string }
        | { id: string; code: string; name: string }[]
        | null
      const productData = Array.isArray(product) ? product[0] : product

      return {
        id: wo.id,
        wo_number: wo.wo_number,
        product: {
          id: productData?.id || wo.product_id,
          code: productData?.code || '',
          name: productData?.name || 'Unknown',
        },
        planned_quantity: Number(wo.planned_quantity),
        produced_quantity: Number(wo.produced_quantity || 0),
        uom: wo.uom,
        status: wo.status,
        materials_status: materialsStatus,
      }
    })

    return NextResponse.json({
      success: true,
      data: woWithStatus,
    })
  } catch (error) {
    console.error('Error in GET /api/scanner/work-orders:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    )
  }
}
