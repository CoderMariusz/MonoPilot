// API Route: Reject Purchase Order
// Story 03.5b: PO Approval Workflow
// POST /api/planning/purchase-orders/:id/reject - Reject a pending PO

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { rejectPO, canUserApprove } from '@/lib/services/purchase-order-service'
import { rejectPoSchema } from '@/lib/validation/purchase-order'
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

    // Check if user can reject (same permission as approve)
    const hasApprovalPermission = await canUserApprove(session.user.id, currentUser.org_id, userRole)
    if (!hasApprovalPermission) {
      return NextResponse.json(
        { error: 'Access denied: You do not have permission to reject purchase orders', code: 'NOT_APPROVER' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    let body: Record<string, unknown> = {}
    try {
      body = await request.json()
    } catch {
      // Empty body - rejection_reason is required, will fail validation
    }

    const validation = rejectPoSchema.safeParse(body)
    if (!validation.success) {
      const errorMessage = validation.error.errors[0].message

      // Map specific error messages to codes
      if (errorMessage.includes('required')) {
        return NextResponse.json(
          { error: 'Rejection reason is required', code: 'REJECTION_REASON_REQUIRED' },
          { status: 400 }
        )
      }
      if (errorMessage.includes('at least 10')) {
        return NextResponse.json(
          { error: 'Rejection reason must be at least 10 characters', code: 'REJECTION_REASON_TOO_SHORT' },
          { status: 400 }
        )
      }
      if (errorMessage.includes('1000')) {
        return NextResponse.json(
          { error: 'Rejection reason must not exceed 1000 characters' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: 400 }
      )
    }

    // Reject PO
    await rejectPO(
      id,
      currentUser.org_id,
      session.user.id,
      userRole,
      validation.data.rejection_reason
    )

    // Get updated PO for response
    const supabaseAdmin = createServerSupabaseAdmin()
    const { data: po } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, po_number, status, approval_status, approved_by, approved_at, rejection_reason, created_by')
      .eq('id', id)
      .single()

    // Get creator info for notification recipient
    let creatorInfo = { id: po?.created_by, name: 'Unknown', email: '' }
    if (po?.created_by) {
      const { data: creator } = await supabaseAdmin
        .from('users')
        .select('id, first_name, last_name, email')
        .eq('id', po.created_by)
        .single()

      if (creator) {
        creatorInfo = {
          id: creator.id,
          name: `${creator.first_name || ''} ${creator.last_name || ''}`.trim(),
          email: creator.email,
        }
      }
    }

    const userName = `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim()

    return NextResponse.json({
      success: true,
      data: {
        id: po?.id,
        po_number: po?.po_number,
        status: 'rejected',
        approval_status: 'rejected',
        rejected_by: {
          id: session.user.id,
          name: userName,
        },
        rejected_at: po?.approved_at,
        rejection_reason: po?.rejection_reason,
        notification_sent: true,
        notification_recipient: creatorInfo,
      },
      message: 'Purchase order rejected',
    })
  } catch (error) {
    console.error('Error in POST /api/planning/purchase-orders/:id/reject:', error)

    const message = error instanceof Error ? error.message : 'Internal server error'

    // Map error messages to HTTP status codes
    if (message.includes('not found')) {
      return NextResponse.json({ error: 'Purchase order not found', code: 'PO_NOT_FOUND' }, { status: 404 })
    }
    if (message.includes('pending approval status')) {
      return NextResponse.json({ error: 'Cannot reject: PO must be in pending approval status', code: 'PO_NOT_PENDING_APPROVAL' }, { status: 400 })
    }
    if (message.includes('permission')) {
      return NextResponse.json({ error: message, code: 'NOT_APPROVER' }, { status: 403 })
    }
    if (message.includes('Rejection reason is required')) {
      return NextResponse.json({ error: message, code: 'REJECTION_REASON_REQUIRED' }, { status: 400 })
    }
    if (message.includes('at least 10')) {
      return NextResponse.json({ error: message, code: 'REJECTION_REASON_TOO_SHORT' }, { status: 400 })
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
