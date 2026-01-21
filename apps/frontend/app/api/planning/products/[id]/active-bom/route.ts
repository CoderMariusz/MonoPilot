/**
 * GET /api/planning/products/:id/active-bom
 * Story 3.10: Get active BOM for product on a specific date
 * Returns the active BOM (status='active', effective_from <= date, effective_to is null or >= date)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Get date from query param (default to today)
    const searchParams = request.nextUrl.searchParams
    const dateParam = searchParams.get('date')
    const targetDate = dateParam || new Date().toISOString().split('T')[0]

    // Find active BOM for product on target date
    // Conditions: status='active', effective_from <= date, (effective_to is null OR effective_to >= date)
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select(`
        id,
        version,
        status,
        effective_from,
        effective_to,
        output_qty,
        output_uom,
        routing_id,
        units_per_box,
        boxes_per_pallet,
        product:products!product_id (
          id,
          code,
          name,
          uom
        )
      `)
      .eq('org_id', currentUser.org_id)
      .eq('product_id', productId)
      .eq('status', 'active')
      .lte('effective_from', targetDate)
      .or(`effective_to.gte.${targetDate},effective_to.is.null`)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (bomError) {
      console.error('Error fetching active BOM:', bomError)
      return NextResponse.json(
        { error: 'Failed to fetch active BOM' },
        { status: 500 }
      )
    }

    // Return null if no active BOM found (this is not an error)
    return NextResponse.json({
      bom: bom || null,
      date: targetDate,
    })
  } catch (error) {
    console.error('Error in GET /api/planning/products/:id/active-bom:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
