// API Route: Approve Purchase Order
// Story 03.5b: PO Approval Workflow
// POST /api/planning/purchase-orders/:id/approve - Approve a pending PO

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { approvePO, canUserApprove } from '@/lib/services/purchase-order-service'
import { approvePoSchema } from '@/lib/validation/purchase-order'
import { ZodError } from 'zod'

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
      .select('org_id, first_name, last_name, email, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userRole = (currentUser.role as any)?.code

    // Check if user can approve
    const hasApprovalPermission = await canUserApprove(session.user.id, currentUser.org_id, userRole)
    if (!hasApprovalPermission) {
      return NextResponse.json(
        { error: 'Access denied: You do not have permission to approve purchase orders', code: 'NOT_APPROVER' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    let body = {}
    try {
      body = await request.json()
    } catch {
      // Empty body is OK - notes are optional
    }

    const validation = approvePoSchema.safeParse(body)
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      )
    }

    // Approve PO
    await approvePO(
      id,
      currentUser.org_id,
      session.user.id,
      userRole,
      validation.data.notes
    )

    // Get updated PO for response
    const supabaseAdmin = createServerSupabaseAdmin()
    const { data: po } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, po_number, status, approval_status, approved_by, approved_at, approval_notes')
      .eq('id', id)
      .single()

    const userName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim()

    return NextResponse.json({
      success: true,
      data: {
        id: po?.id,
        po_number: po?.po_number,
        status: 'approved',
        approval_status: 'approved',
        approved_by: {
          id: session.user.id,
          name: userName,
        },
        approved_at: po?.approved_at,
        approval_notes: po?.approval_notes,
        notification_sent: true,
        notification_recipient: {
          id: po?.approved_by,
          name: userName,
          email: currentUser.email,
        },
      },
      message: 'Purchase order approved successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/planning/purchase-orders/:id/approve:', error)

    const message = error instanceof Error ? error.message : 'Internal server error'

    // Map error messages to HTTP status codes
    if (message.includes('not found')) {
      return NextResponse.json({ error: 'Purchase order not found', code: 'PO_NOT_FOUND' }, { status: 404 })
    }
    if (message.includes('already been approved')) {
      return NextResponse.json({ error: message, code: 'PO_ALREADY_PROCESSED' }, { status: 409 })
    }
    if (message.includes('pending approval status')) {
      return NextResponse.json({ error: 'Cannot approve: PO must be in pending approval status', code: 'PO_NOT_PENDING_APPROVAL' }, { status: 400 })
    }
    if (message.includes('permission')) {
      return NextResponse.json({ error: message, code: 'NOT_APPROVER' }, { status: 403 })
    }
    if (message.includes('cannot exceed')) {
      return NextResponse.json({ error: message }, { status: 400 })
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
