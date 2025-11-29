/**
 * Material Availability Check API
 * Story 3.13: Material Availability Check
 *
 * POST /api/planning/work-orders/availability-check
 * Checks material availability for WO creation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'

interface MaterialAvailability {
  product_id: string
  product_code: string
  product_name: string
  required_qty: number
  available_qty: number
  uom: string
  status: 'green' | 'yellow' | 'red'
  coverage_percent: number
}

interface AvailabilityCheckResult {
  materials: MaterialAvailability[]
  summary: {
    total: number
    green: number
    yellow: number
    red: number
  }
  can_proceed: boolean
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get org_id from user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', session.user.id)
      .single()

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 400 })
    }

    const orgId = profile.organization_id

    // Parse request body
    const body = await request.json()
    const { bom_id, planned_quantity } = body

    if (!bom_id || !planned_quantity) {
      return NextResponse.json(
        { error: 'bom_id and planned_quantity are required' },
        { status: 400 }
      )
    }

    // Get BOM with output_qty
    const { data: bom, error: bomError } = await supabaseAdmin
      .from('boms')
      .select('id, output_qty')
      .eq('id', bom_id)
      .single()

    if (bomError || !bom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 })
    }

    // Get BOM items (materials)
    const { data: bomItems, error: itemsError } = await supabaseAdmin
      .from('bom_items')
      .select(`
        id,
        product_id,
        quantity,
        uom,
        is_by_product,
        products:product_id (
          id,
          code,
          name
        )
      `)
      .eq('bom_id', bom_id)
      .eq('is_by_product', false) // Only input materials, not by-products
      .order('sequence', { ascending: true })

    if (itemsError) {
      console.error('Error fetching BOM items:', itemsError)
      return NextResponse.json({ error: 'Failed to fetch BOM items' }, { status: 500 })
    }

    if (!bomItems || bomItems.length === 0) {
      return NextResponse.json({
        data: {
          materials: [],
          summary: { total: 0, green: 0, yellow: 0, red: 0 },
          can_proceed: true,
        },
      })
    }

    // Calculate scaling factor
    const scaleFactor = planned_quantity / (bom.output_qty || 1)

    // Get available quantities from license_plates
    const productIds = bomItems.map((item) => item.product_id)

    const { data: lpSummary, error: lpError } = await supabaseAdmin
      .from('license_plates')
      .select('product_id, current_qty')
      .eq('organization_id', orgId)
      .in('product_id', productIds)
      .eq('status', 'available')
      .is('deleted_at', null)

    if (lpError) {
      console.error('Error fetching LP quantities:', lpError)
    }

    // Aggregate available qty per product
    const availableByProduct: Record<string, number> = {}
    if (lpSummary) {
      for (const lp of lpSummary) {
        const qty = Number(lp.current_qty) || 0
        availableByProduct[lp.product_id] = (availableByProduct[lp.product_id] || 0) + qty
      }
    }

    // Calculate availability for each material
    const materials: MaterialAvailability[] = bomItems.map((item) => {
      const product = item.products as any
      const requiredQty = Number((item.quantity * scaleFactor).toFixed(3))
      const availableQty = availableByProduct[item.product_id] || 0
      const coveragePercent = requiredQty > 0 ? (availableQty / requiredQty) * 100 : 100

      let status: 'green' | 'yellow' | 'red'
      if (coveragePercent >= 120) {
        status = 'green' // >= 120% coverage
      } else if (coveragePercent >= 100) {
        status = 'yellow' // 100-119% coverage
      } else {
        status = 'red' // < 100% coverage
      }

      return {
        product_id: item.product_id,
        product_code: product?.code || 'N/A',
        product_name: product?.name || 'Unknown',
        required_qty: requiredQty,
        available_qty: availableQty,
        uom: item.uom,
        status,
        coverage_percent: Math.round(coveragePercent),
      }
    })

    // Calculate summary
    const summary = {
      total: materials.length,
      green: materials.filter((m) => m.status === 'green').length,
      yellow: materials.filter((m) => m.status === 'yellow').length,
      red: materials.filter((m) => m.status === 'red').length,
    }

    const result: AvailabilityCheckResult = {
      materials,
      summary,
      can_proceed: true, // Always allow (non-blocking per Story 3.13 AC3)
    }

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Error in availability check:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
