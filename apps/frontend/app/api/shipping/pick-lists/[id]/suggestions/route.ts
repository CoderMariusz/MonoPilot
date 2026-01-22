/**
 * API Route: Pick Suggestions
 * Story: 07.9 - Pick Confirmation Desktop
 *
 * GET /api/shipping/pick-lists/:id/suggestions - Get FIFO/FEFO pick suggestions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/api/auth-helpers'

/**
 * GET /api/shipping/pick-lists/:id/suggestions
 * Get FIFO/FEFO pick suggestions for a pick list
 *
 * AC-2: Display pick suggestions with FIFO/FEFO order
 *
 * Query params:
 * - strategy: 'FIFO' | 'FEFO' (default: 'FIFO')
 * - product_id: Filter suggestions to specific product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: pickListId } = await params

    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { orgId } = authContext

    // Parse query params
    const searchParams = request.nextUrl.searchParams
    const strategy = (searchParams.get('strategy') || 'FIFO').toUpperCase() as 'FIFO' | 'FEFO'
    const productId = searchParams.get('product_id')

    // Validate strategy
    if (strategy !== 'FIFO' && strategy !== 'FEFO') {
      return NextResponse.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Strategy must be FIFO or FEFO' } },
        { status: 400 }
      )
    }

    // Verify pick list exists
    const { data: pickList, error: plError } = await supabase
      .from('pick_lists')
      .select('id')
      .eq('id', pickListId)
      .eq('org_id', orgId)
      .single()

    if (plError || !pickList) {
      return NextResponse.json(
        { error: { code: 'NOT_FOUND', message: 'Pick list not found' } },
        { status: 404 }
      )
    }

    // Get pick list lines to know what products need suggestions
    let productsQuery = supabase
      .from('pick_list_lines')
      .select('product_id')
      .eq('pick_list_id', pickListId)
      .eq('org_id', orgId)
      .eq('status', 'pending')

    if (productId) {
      productsQuery = productsQuery.eq('product_id', productId)
    }

    const { data: lineProducts } = await productsQuery

    if (!lineProducts || lineProducts.length === 0) {
      return NextResponse.json({
        suggestions: [],
        strategy,
      })
    }

    // Get unique product IDs
    const productIds = [...new Set(lineProducts.map((l: any) => l.product_id))]

    // Get current date for expiry filtering
    const today = new Date().toISOString().split('T')[0]

    // Build LP query with FIFO/FEFO sorting
    let lpQuery = supabase
      .from('license_plates')
      .select(`
        id,
        lp_number,
        product_id,
        quantity,
        lot_number,
        expiry_date,
        created_at,
        location_id,
        allocated_quantity,
        locations!license_plates_location_id_fkey(code, zone, aisle, bin),
        products!license_plates_product_id_fkey(name, sku)
      `)
      .in('product_id', productIds)
      .eq('org_id', orgId)
      .eq('status', 'available')
      .gt('quantity', 0)

    // Exclude expired LPs
    lpQuery = lpQuery.or(`expiry_date.is.null,expiry_date.gte.${today}`)

    // Apply sorting based on strategy
    if (strategy === 'FEFO') {
      lpQuery = lpQuery
        .order('expiry_date', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true })
    } else {
      // FIFO
      lpQuery = lpQuery.order('created_at', { ascending: true })
    }

    lpQuery = lpQuery.limit(50)

    const { data: lps, error: lpError } = await lpQuery

    if (lpError) {
      return NextResponse.json(
        { error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch suggestions' } },
        { status: 500 }
      )
    }

    // Transform LP data to suggestions
    const suggestions = (lps || []).map((lp: any, index: number) => {
      const availableQty = Number(lp.quantity) - Number(lp.allocated_quantity || 0)
      const expiryDays = lp.expiry_date
        ? Math.ceil((new Date(lp.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null

      return {
        license_plate_id: lp.id,
        lp_number: lp.lp_number,
        product_id: lp.product_id,
        product_name: lp.products?.name || '',
        product_sku: lp.products?.sku || '',
        quantity_on_hand: Number(lp.quantity),
        allocated_quantity: Number(lp.allocated_quantity || 0),
        available_quantity: Math.max(0, availableQty),
        lot_number: lp.lot_number,
        expiry_date: lp.expiry_date,
        expiry_days_remaining: expiryDays,
        created_at: lp.created_at,
        location: {
          code: lp.locations?.code || '',
          zone: lp.locations?.zone || '',
          aisle: lp.locations?.aisle || '',
          bin: lp.locations?.bin || '',
        },
        is_suggested: index === 0,
        reason: index === 0
          ? (strategy === 'FEFO' ? `FEFO: expires ${lp.expiry_date || 'N/A'}` : 'FIFO: oldest inventory')
          : '',
      }
    })

    return NextResponse.json({
      suggestions,
      strategy,
      pick_list_id: pickListId,
    })
  } catch (error) {
    console.error('Error in GET /api/shipping/pick-lists/:id/suggestions:', error)
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
