// API Route: Purchase Order Approvals
// Epic 3 Batch 3A - Story 3.4: PO Approval Workflow
// GET /api/planning/purchase-orders/:id/approvals - Get approval history
// POST /api/planning/purchase-orders/:id/approvals - Approve or reject PO

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { poApprovalSchema, type POApprovalInput } from '@/lib/validation/planning-schemas'
import { ZodError } from 'zod'

// GET /api/planning/purchase-orders/:id/approvals - Get approval history
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
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Verify PO exists and belongs to user's org
    const { data: po } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, org_id')
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Fetch approval history
    const { data, error } = await supabaseAdmin
      .from('po_approvals')
      .select(`
        *,
        users:approved_by(id, email, first_name, last_name)
      `)
      .eq('po_id', id)
      .eq('org_id', currentUser.org_id)
      .order('approved_at', { ascending: false })

    if (error) {
      console.error('Error fetching PO approvals:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      approvals: data || [],
      total: data?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/planning/purchase-orders/:id/approvals:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/planning/purchase-orders/:id/approvals - Approve or reject PO
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

    // Authorization: Manager, Admin only (can approve POs)
    const roleCode = (currentUser.role as unknown as { code: string } | null)?.code?.toLowerCase() ?? ''
    if (!['manager', 'admin'].includes(roleCode)) {
      return NextResponse.json(
        { error: 'Forbidden: Manager role or higher required to approve/reject POs' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData: POApprovalInput = poApprovalSchema.parse(body)

    const supabaseAdmin = createServerSupabaseAdmin()

    // Fetch PO to verify it exists and check approval status
    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .select('id, org_id, approval_status')
      .eq('id', id)
      .single()

    if (poError || !po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Verify org_id isolation
    if (po.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Check if PO is pending approval
    if (po.approval_status !== 'pending') {
      return NextResponse.json(
        { error: 'PO is not pending approval' },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const newApprovalStatus = validatedData.action === 'approve' ? 'approved' : 'rejected'

    // Create approval record
    const approvalData = {
      org_id: currentUser.org_id,
      po_id: id,
      status: newApprovalStatus,
      approved_by: session.user.id,
      approved_at: now,
      rejection_reason: validatedData.rejection_reason || null,
      comments: validatedData.comments || null,
    }

    const { data: approval, error: approvalError } = await supabaseAdmin
      .from('po_approvals')
      .insert(approvalData)
      .select()
      .single()

    if (approvalError) {
      console.error('Error creating approval record:', approvalError)
      return NextResponse.json({ error: approvalError.message }, { status: 500 })
    }

    // Update PO approval status
    const poUpdateData = {
      approval_status: newApprovalStatus,
      approved_by: session.user.id,
      approved_at: now,
      rejection_reason: validatedData.rejection_reason || null,
      updated_at: now,
    }

    const { error: updateError } = await supabaseAdmin
      .from('purchase_orders')
      .update(poUpdateData)
      .eq('id', id)

    if (updateError) {
      console.error('Error updating PO approval status:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      approval,
      message: `PO ${validatedData.action === 'approve' ? 'approved' : 'rejected'} successfully`,
    })
  } catch (error) {
    console.error('Error in POST /api/planning/purchase-orders/:id/approvals:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
