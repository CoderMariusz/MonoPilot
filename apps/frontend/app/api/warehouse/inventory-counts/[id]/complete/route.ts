/**
 * API Route: Complete Inventory Count
 * Story 5.35: Inventory Count
 * POST /api/warehouse/inventory-counts/:id/complete - Complete count and calculate variance
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { completeCount } from '@/lib/services/inventory-count-service'

// POST /api/warehouse/inventory-counts/:id/complete - Complete count
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

    // Authorization: Warehouse, Manager, Admin
    if (!['warehouse', 'manager', 'admin'].includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden: Warehouse role or higher required' },
        { status: 403 }
      )
    }

    const report = await completeCount(id, session.user.id)

    return NextResponse.json({
      data: report,
      message: 'Inventory count completed successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/warehouse/inventory-counts/:id/complete:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
