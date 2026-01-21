/**
 * API Route: Reject Over-Consumption Request
 * Story 04.6e: Over-Consumption Control
 *
 * POST /api/production/work-orders/:woId/over-consumption/reject
 * Rejects an over-consumption request with required reason (Manager/Admin only)
 *
 * Security:
 * - Requires authentication
 * - Role-based: owner, admin, production_manager only
 * - RLS: org_id isolation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { overConsumptionRejectionSchema } from '@/lib/validation/production-schemas'

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  REQUEST_NOT_FOUND: 'REQUEST_NOT_FOUND',
  ALREADY_DECIDED: 'ALREADY_DECIDED',
  REASON_REQUIRED: 'REASON_REQUIRED',
} as const

// Only managers can reject
const ALLOWED_ROLES = ['owner', 'admin', 'production_manager']

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ woId: string }> }
) {
  try {
    const { woId } = await params
    const supabase = await createServerSupabase()

    // 1. Authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized', code: ERROR_CODES.UNAUTHORIZED },
        { status: 401 }
      )
    }

    // 2. Get current user with role and org
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('id, org_id, full_name, role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found', code: ERROR_CODES.UNAUTHORIZED },
        { status: 401 }
      )
    }

    // 3. Role-based authorization - Only managers can reject
    const roleCode = (currentUser.role as { code: string } | null)?.code?.toLowerCase() ?? ''
    if (!ALLOWED_ROLES.includes(roleCode)) {
      return NextResponse.json(
        { error: 'Only Managers and Admins can approve/reject', code: ERROR_CODES.FORBIDDEN },
        { status: 403 }
      )
    }

    // 4. Parse and validate request body
    const body = await request.json()
    const validation = overConsumptionRejectionSchema.safeParse(body)

    if (!validation.success) {
      // Check if reason is missing
      const reasonError = validation.error.errors.find((e) => e.path.includes('reason'))
      if (reasonError) {
        return NextResponse.json(
          { error: 'Rejection reason is required', code: ERROR_CODES.REASON_REQUIRED },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'Invalid request data', details: validation.error.errors },
        { status: 400 }
      )
    }

    const { request_id, reason } = validation.data

    // 5. Verify request exists and belongs to this WO and org
    const { data: approvalRequest, error: reqError } = await supabase
      .from('over_consumption_approvals')
      .select('id, status, wo_id, org_id, wo_material_id, requested_qty')
      .eq('id', request_id)
      .eq('wo_id', woId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (reqError || !approvalRequest) {
      return NextResponse.json(
        { error: 'Approval request not found', code: ERROR_CODES.REQUEST_NOT_FOUND },
        { status: 404 }
      )
    }

    // 6. Check if already decided
    if (approvalRequest.status !== 'pending') {
      return NextResponse.json(
        {
          error: 'This request has already been approved or rejected',
          code: ERROR_CODES.ALREADY_DECIDED,
        },
        { status: 400 }
      )
    }

    const decidedAt = new Date().toISOString()

    // 7. Update approval request
    const { error: updateError } = await supabase
      .from('over_consumption_approvals')
      .update({
        status: 'rejected',
        decided_by: user.id,
        decided_at: decidedAt,
        rejection_reason: reason,
      })
      .eq('id', request_id)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to reject request' },
        { status: 500 }
      )
    }

    // 8. Create audit log
    await supabase.from('activity_logs').insert({
      org_id: currentUser.org_id,
      entity_type: 'over_consumption_approval',
      entity_id: request_id,
      action: 'rejected',
      user_id: user.id,
      details: {
        wo_id: woId,
        wo_material_id: approvalRequest.wo_material_id,
        requested_qty: approvalRequest.requested_qty,
        reason,
      },
    })

    // 9. Return success response
    return NextResponse.json(
      {
        request_id: request_id,
        status: 'rejected',
        rejected_by: user.id,
        rejected_by_name: currentUser.full_name || '',
        rejected_at: decidedAt,
        reason,
        message: 'Over-consumption request rejected',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/production/work-orders/:woId/over-consumption/reject:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
