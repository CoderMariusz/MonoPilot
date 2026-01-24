/**
 * API Route: WO Barcode Lookup for Scanner
 * Story 04.6b: Material Consumption Scanner
 *
 * GET /api/production/work-orders/barcode/:barcode - Lookup WO by barcode
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrgContext } from '@/lib/hooks/server/getOrgContext'

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  WO_NOT_FOUND: 'WO_NOT_FOUND',
  WO_NOT_ACTIVE: 'WO_NOT_ACTIVE',
} as const

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ barcode: string }> }
) {
  try {
    const { barcode } = await params
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: ERROR_CODES.UNAUTHORIZED },
        { status: 401 }
      )
    }

    // Get org context for multi-tenant filtering
    const orgContext = await getOrgContext()
    if (!orgContext?.org_id) {
      return NextResponse.json(
        { error: 'Organization context not found', code: ERROR_CODES.UNAUTHORIZED },
        { status: 401 }
      )
    }

    // Query work order by wo_number (barcode), filtering by org_id and active status
    const { data: workOrder, error: woError } = await supabase
      .from('work_orders')
      .select(`
        id,
        wo_number,
        product_id,
        planned_qty,
        actual_qty,
        status,
        batch_number,
        production_line_id,
        products (
          name,
          sku
        ),
        production_lines (
          name
        )
      `)
      .eq('wo_number', barcode)
      .eq('org_id', orgContext.org_id)
      .in('status', ['in_progress', 'started'])
      .single()

    if (woError || !workOrder) {
      return NextResponse.json(
        {
          error: ERROR_CODES.WO_NOT_FOUND,
          message: `Work order with barcode ${barcode} not found`,
        },
        { status: 404 }
      )
    }

    // Get materials (BOM items) for the work order
    const { data: materials, error: matError } = await supabase
      .from('wo_bom_items')
      .select(`
        id,
        material_id,
        required_qty,
        consumed_qty,
        uom,
        consume_whole_lp,
        products (
          name,
          sku
        )
      `)
      .eq('wo_id', workOrder.id)

    if (matError) {
      console.error('Error fetching materials:', matError)
    }

    // Transform response to match expected format
    const products = workOrder.products as unknown as { name: string; sku: string } | null
    const productionLines = workOrder.production_lines as unknown as { name: string } | null

    const woResponse = {
      id: workOrder.id,
      wo_number: workOrder.wo_number,
      product_name: products?.name || '',
      product_sku: products?.sku || '',
      planned_qty: workOrder.planned_qty,
      actual_qty: workOrder.actual_qty || 0,
      status: workOrder.status,
      line_name: productionLines?.name || '',
      batch_number: workOrder.batch_number || '',
    }

    const materialsResponse = (materials || []).map((mat) => {
      const matProduct = mat.products as unknown as { name: string; sku: string } | null
      const requiredQty = Number(mat.required_qty) || 0
      const consumedQty = Number(mat.consumed_qty) || 0
      const progressPercent = requiredQty > 0 ? Math.round((consumedQty / requiredQty) * 100) : 0

      return {
        id: mat.id,
        material_name: matProduct?.name || '',
        required_qty: requiredQty,
        consumed_qty: consumedQty,
        uom: mat.uom || '',
        consume_whole_lp: mat.consume_whole_lp || false,
        progress_percent: progressPercent,
      }
    })

    return NextResponse.json({
      wo: woResponse,
      materials: materialsResponse,
    })
  } catch (error) {
    console.error('Error in GET /api/production/work-orders/barcode/:barcode:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
