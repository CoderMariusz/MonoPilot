// API Route: Submit Purchase Order
// Story 03.5b: PO Approval Workflow
// POST /api/planning/purchase-orders/:id/submit - Submit PO for approval or direct submission

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { submitPO } from '@/lib/services/purchase-order-service'
import { checkPOPermission, getPermissionRequirement } from '@/lib/utils/po-permissions'

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
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Authorization: MAJOR-02 Fix - Use centralized permission check
    if (!checkPOPermission(currentUser, 'submit')) {
      return NextResponse.json(
        { error: `Forbidden: ${getPermissionRequirement('submit')} required` },
        { status: 403 }
      )
    }

    // Submit PO using the new approval-aware function
    const result = await submitPO(
      id,
      currentUser.org_id,
      session.user.id
    )

    // Get PO details for response
    const supabaseAdmin = createServerSupabaseAdmin()
    const { data: po } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, po_number, status, approval_status')
      .eq('id', id)
      .single()

    return NextResponse.json({
      success: true,
      data: {
        id: po?.id || id,
        po_number: po?.po_number,
        status: result.status,
        approval_required: result.approvalRequired,
        approval_status: result.approvalRequired ? 'pending' : null,
        notification_sent: result.notificationSent,
        notification_count: result.notificationCount,
      },
      message: result.approvalRequired
        ? 'Purchase order submitted for approval'
        : 'Purchase order submitted successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/planning/purchase-orders/:id/submit:', error)

    const message = error instanceof Error ? error.message : 'Internal server error'

    // Map error messages to HTTP status codes
    if (message.includes('not found')) {
      return NextResponse.json({ error: message, code: 'PO_NOT_FOUND' }, { status: 404 })
    }
    if (message.includes('draft status')) {
      return NextResponse.json({ error: message, code: 'PO_NOT_DRAFT' }, { status: 400 })
    }
    if (message.includes('at least one line')) {
      return NextResponse.json({ error: message, code: 'PO_NO_LINES' }, { status: 400 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
