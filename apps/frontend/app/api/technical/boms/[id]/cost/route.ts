import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { calculateTotalBOMCost } from '@/lib/services/costing-service'

/**
 * BOM Cost Calculation API
 * Story: 2.51, 2.52, 2.53
 * Related: ADR-009-routing-level-costs
 *
 * GET /api/technical/boms/[id]/cost - Calculate complete BOM cost
 *
 * Query parameters:
 * - quantity (optional): Number of output units, default 1
 *
 * Returns:
 * - materialCost: Sum of all bom_items costs
 * - laborCost: Sum of all routing operation labor costs
 * - setupCost: Fixed routing setup cost per batch
 * - workingCost: Variable working cost per unit * quantity
 * - overheadCost: Overhead percentage on subtotal
 * - totalCost: Sum of all costs
 * - currency: Cost currency (default PLN)
 * - breakdown: Detailed material and operation cost lines
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to verify org access
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify BOM exists and belongs to user's org
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select('id, org_id')
      .eq('id', id)
      .single()

    if (bomError || !bom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 })
    }

    if (bom.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 })
    }

    // Parse quantity from query params
    const searchParams = request.nextUrl.searchParams
    const quantityParam = searchParams.get('quantity')
    const quantity = quantityParam ? parseInt(quantityParam, 10) : 1

    if (isNaN(quantity) || quantity < 1) {
      return NextResponse.json(
        { error: 'Invalid quantity parameter. Must be a positive integer.' },
        { status: 400 }
      )
    }

    // Calculate BOM cost - pass org_id for reliable RLS with cross-table joins
    const result = await calculateTotalBOMCost(id, quantity, currentUser.org_id)

    if (!result.success) {
      const statusCode = result.error.code === 'BOM_NOT_FOUND' ? 404 : 500
      return NextResponse.json(
        { error: result.error.message, code: result.error.code },
        { status: statusCode }
      )
    }

    return NextResponse.json(result.data, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/technical/boms/[id]/cost:', error)

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
