/**
 * API Route: Get By-Products for WO
 * Story 04.7b: Output Registration Scanner
 *
 * GET /api/production/output/by-products/:woId - Get by-products list
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getOrgContext } from '@/lib/hooks/server/getOrgContext'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ woId: string }> }
) {
  try {
    const { woId } = await params
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

    // Get WO and verify it belongs to org
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select('id, org_id, product_id, planned_qty')
      .eq('id', woId)
      .single()

    if (woError || !wo) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    if (wo.org_id !== orgContext.org_id) {
      return NextResponse.json({ error: 'Work order not found' }, { status: 404 })
    }

    // Get by-products from BOM
    const byProducts = await getByProductsFromBOM(supabase, wo.product_id, wo.planned_qty)

    return NextResponse.json({ by_products: byProducts })
  } catch (error) {
    console.error('Error in GET /api/production/output/by-products/:woId:', error)
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
      products!bom_items_material_id_fkey(id, name, code, uom)
    `
    )
    .eq('bom_id', bom.id)
    .eq('is_by_product', true)

  if (!bomItems) return []

  return bomItems.map((item) => {
    const product = item.products as { id: string; name: string; code: string; uom: string }
    const yieldPercent = Number(item.yield_percent) || 0
    const expectedQty = Math.round(((plannedQty * yieldPercent) / 100) * 100) / 100

    return {
      id: product.id,
      name: product.name,
      code: product.code,
      yield_percent: yieldPercent,
      expected_qty: expectedQty,
      uom: product.uom,
    }
  })
}
