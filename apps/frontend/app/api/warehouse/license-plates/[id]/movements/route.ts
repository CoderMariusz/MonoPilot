// API Route: License Plate Movement Audit Trail
// Epic 5 Batch 05B-1: Stock Moves (Story 5.15)
// GET /api/warehouse/license-plates/[id]/movements - List all movements for an LP

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createServerSupabase()

    // Auth check
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify LP exists and belongs to org
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select('id, lp_number, org_id')
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (lpError || !lp) {
      return NextResponse.json({ error: 'License plate not found' }, { status: 404 })
    }

    // Parse query params for pagination
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // AC-5.15.1: Get all movements with related data
    const { data: movements, error: movementsError } = await supabase
      .from('lp_movements')
      .select(`
        id,
        movement_type,
        qty_change,
        qty_before,
        qty_after,
        uom,
        from_location:locations!lp_movements_from_location_id_fkey(id, code, name, type),
        to_location:locations!lp_movements_to_location_id_fkey(id, code, name, type),
        work_order:work_orders(id, wo_number),
        purchase_order:purchase_orders(id, po_number),
        created_by:users!lp_movements_created_by_user_id_fkey(id, email),
        created_at,
        notes
      `)
      .eq('lp_id', id)
      .eq('org_id', currentUser.org_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (movementsError) {
      throw new Error(`Failed to fetch movements: ${movementsError.message}`)
    }

    // Get total count
    const { count, error: countError } = await supabase
      .from('lp_movements')
      .select('id', { count: 'exact', head: true })
      .eq('lp_id', id)
      .eq('org_id', currentUser.org_id)

    if (countError) {
      throw new Error(`Failed to count movements: ${countError.message}`)
    }

    return NextResponse.json({
      data: movements,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error in GET /api/warehouse/license-plates/[id]/movements:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
