/**
 * API Route: Get Pending Over-Consumption Requests
 * Story 04.6e: Over-Consumption Control
 *
 * GET /api/production/work-orders/:woId/over-consumption/pending
 * Returns pending over-consumption approval requests for a work order
 *
 * Security:
 * - Requires authentication
 * - Role-based: owner, admin, production_manager, production_operator
 * - RLS: org_id isolation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  WO_NOT_FOUND: 'WO_NOT_FOUND',
} as const

// Roles allowed to view pending requests
const ALLOWED_ROLES = ['owner', 'admin', 'production_manager', 'production_operator']

export async function GET(
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
      .select('id, org_id, role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found', code: ERROR_CODES.UNAUTHORIZED },
        { status: 401 }
      )
    }

    // 3. Role-based authorization
    const roleCode = (currentUser.role as { code: string } | null)?.code?.toLowerCase() ?? ''
    if (!ALLOWED_ROLES.includes(roleCode)) {
      return NextResponse.json(
        { error: 'Insufficient permissions', code: ERROR_CODES.FORBIDDEN },
        { status: 403 }
      )
    }

    // 4. Verify work order exists and belongs to org
    const { data: workOrder, error: woError } = await supabase
      .from('work_orders')
      .select('id')
      .eq('id', woId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (woError || !workOrder) {
      return NextResponse.json(
        { error: 'Work order not found', code: ERROR_CODES.WO_NOT_FOUND },
        { status: 404 }
      )
    }

    // 5. Get pending requests
    const { data: pendingRequests, error: reqError } = await supabase
      .from('over_consumption_approvals')
      .select('id, status, wo_material_id, requested_at, requested_by, requested_qty, over_consumption_qty, variance_percent')
      .eq('wo_id', woId)
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })

    if (reqError) {
      return NextResponse.json(
        { requests: [] },
        { status: 200 }
      )
    }

    // 6. Return success response
    return NextResponse.json({ requests: pendingRequests || [] }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/production/work-orders/:woId/over-consumption/pending:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
