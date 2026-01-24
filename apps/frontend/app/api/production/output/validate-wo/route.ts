/**
 * API Route: Validate WO Barcode for Scanner
 * Story 04.7b: Output Registration Scanner
 *
 * POST /api/production/output/validate-wo - Validate WO barcode (500ms target)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrgContext } from '@/lib/hooks/server/getOrgContext'
import { validateWOSchema } from '@/lib/validation/scanner-output'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get org context
    const orgContext = await getOrgContext()
    if (!orgContext?.org_id) {
      return NextResponse.json({ error: 'Organization context not found' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validation = validateWOSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    const { barcode } = validation.data

    // Validate barcode format
    if (!barcode || barcode.trim() === '') {
      return NextResponse.json({ error: 'Barcode is required' }, { status: 400 })
    }

    // Fetch WO with product and line info
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select(
        `
        id,
        wo_number,
        status,
        product_id,
        planned_qty,
        output_qty,
        uom,
        batch_number,
        production_line_id,
        org_id,
        products!inner(id, name, code, base_uom, shelf_life_days),
        production_lines(id, name)
      `
      )
      .eq('wo_number', barcode)
      .eq('org_id', orgContext.org_id)
      .single()

    if (woError || !wo) {
      return NextResponse.json(
        { error: 'Work order not found', valid: false },
        { status: 404 }
      )
    }

    // Check org isolation (return 404 for cross-org, not 403)
    if (wo.org_id !== orgContext.org_id) {
      return NextResponse.json(
        { error: 'Work order not found', valid: false },
        { status: 404 }
      )
    }

    // Validate status
    if (wo.status === 'completed' || wo.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Work order is not in progress or paused', valid: false },
        { status: 409 }
      )
    }

    if (wo.status === 'draft' || wo.status === 'released') {
      return NextResponse.json(
        { error: 'Work order must be started first', valid: false },
        { status: 409 }
      )
    }

    // Get by-products from BOM
    const byProducts = await getByProductsFromBOM(supabase, wo.product_id, wo.planned_qty)

    const products = wo.products as unknown as {
      id: string
      name: string
      code: string
      base_uom: string
      shelf_life_days: number
    }
    const productionLine = wo.production_lines as unknown as { id: string; name: string } | null

    const registeredQty = Number(wo.output_qty) || 0
    const plannedQty = Number(wo.planned_qty)
    const remainingQty = plannedQty - registeredQty

    return NextResponse.json({
      valid: true,
      wo: {
        id: wo.id,
        wo_number: wo.wo_number,
        status: wo.status,
        product_id: wo.product_id,
        product_name: products.name,
        product_code: products.code,
        planned_qty: plannedQty,
        registered_qty: registeredQty,
        remaining_qty: remainingQty,
        progress_percent: plannedQty > 0 ? Math.round((registeredQty / plannedQty) * 100) : 0,
        uom: products.base_uom || wo.uom,
        batch_number: wo.batch_number || wo.wo_number,
        line_name: productionLine?.name || 'Default Line',
        shelf_life_days: products.shelf_life_days || 90,
      },
      by_products: byProducts,
    })
  } catch (error) {
    console.error('Error in POST /api/production/output/validate-wo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

async function getByProductsFromBOM(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  plannedQty: number
) {
  // Get active BOM for product
  const { data: bom } = await supabase
    .from('boms')
    .select('id')
    .eq('product_id', productId)
    .eq('status', 'active')
    .maybeSingle()

  if (!bom) return []

  // Get by-product items from BOM
  const { data: bomItems } = await supabase
    .from('bom_items')
    .select(
      `
      id,
      material_id,
      quantity_per,
      yield_percent,
      is_by_product,
      products!bom_items_material_id_fkey(id, name, code, base_uom)
    `
    )
    .eq('bom_id', bom.id)
    .eq('is_by_product', true)

  if (!bomItems) return []

  return bomItems.map((item) => {
    const product = item.products as unknown as { id: string; name: string; code: string; base_uom: string }
    const yieldPercent = Number(item.yield_percent) || 0
    const expectedQty = Math.round(((plannedQty * yieldPercent) / 100) * 100) / 100

    return {
      id: product.id,
      name: product.name,
      code: product.code,
      yield_percent: yieldPercent,
      expected_qty: expectedQty,
      uom: product.base_uom,
    }
  })
}
