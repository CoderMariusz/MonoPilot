// API Route: Get PO Approval History
// Story 03.5b: PO Approval Workflow
// GET /api/planning/purchase-orders/:id/approval-history - Get approval history for a PO

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getPOApprovalHistory } from '@/lib/services/purchase-order-service'

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

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Parse pagination query params
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = Math.min(parseInt(searchParams.get('limit') || '10', 10), 50) // Max 50

    // Get approval history
    const result = await getPOApprovalHistory(id, currentUser.org_id, { page, limit })

    return NextResponse.json({
      success: true,
      data: {
        history: result.history,
        pagination: result.pagination,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/planning/purchase-orders/:id/approval-history:', error)

    const message = error instanceof Error ? error.message : 'Internal server error'

    if (message.includes('not found')) {
      return NextResponse.json({ error: 'Purchase order not found', code: 'PO_NOT_FOUND' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
