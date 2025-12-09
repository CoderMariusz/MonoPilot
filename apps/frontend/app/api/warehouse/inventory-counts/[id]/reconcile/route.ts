/**
 * API Route: Reconcile Inventory Count Variance
 * Story 5.35: Inventory Count
 * POST /api/warehouse/inventory-counts/:id/reconcile - Reconcile variance (accept_loss/investigate/recount)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { reconcileVariance } from '@/lib/services/inventory-count-service'

// POST /api/warehouse/inventory-counts/:id/reconcile - Reconcile variance
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

    // Authorization: Manager, Admin only (reconciliation is sensitive)
    if (!['manager', 'admin'].includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden: Manager role or higher required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { action, notes } = body

    // Validate action
    if (!action || !['accept_loss', 'investigate', 'recount'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be: accept_loss, investigate, or recount' },
        { status: 400 }
      )
    }

    const result = await reconcileVariance(id, action, session.user.id, notes)

    return NextResponse.json({
      data: result,
      message: result.message,
    })
  } catch (error) {
    console.error('Error in POST /api/warehouse/inventory-counts/:id/reconcile:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
