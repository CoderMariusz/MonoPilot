/**
 * API Route: Inventory Count Scan
 * Story 5.35: Inventory Count
 * POST /api/warehouse/inventory-counts/:id/scan - Scan LP
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { scanLP, addExtraLP } from '@/lib/services/inventory-count-service'

// POST /api/warehouse/inventory-counts/:id/scan - Scan LP
export async function POST(
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

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Authorization: Warehouse, Operator, Manager, Admin
    if (!['warehouse', 'operator', 'manager', 'admin'].includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden: Warehouse role or higher required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { lp_id, lp_number } = body

    // Validate: either lp_id or lp_number required
    if (!lp_id && !lp_number) {
      return NextResponse.json(
        { error: 'Missing required field: lp_id or lp_number' },
        { status: 400 }
      )
    }

    let result

    if (lp_id) {
      // Scan by LP ID
      result = await scanLP(id, lp_id, session.user.id)
    } else {
      // Scan by LP number
      result = await addExtraLP(id, lp_number, currentUser.org_id, session.user.id)
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.message },
        { status: 400 }
      )
    }

    return NextResponse.json({
      data: result,
      message: result.message,
    })
  } catch (error) {
    console.error('Error in POST /api/warehouse/inventory-counts/:id/scan:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
