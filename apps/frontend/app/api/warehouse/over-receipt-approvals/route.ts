/**
 * Over-Receipt Approvals API Routes (Story 05.15)
 * GET /api/warehouse/over-receipt-approvals - List approvals
 * POST /api/warehouse/over-receipt-approvals - Create approval request
 *
 * SECURITY (ADR-013 compliance):
 * - Authentication required
 * - org_id isolation via RLS
 * - Input validation via Zod
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { OverReceiptApprovalService } from '@/lib/services/over-receipt-approval-service'
import {
  approvalListQuerySchema,
  createOverReceiptApprovalSchema,
} from '@/lib/validation/over-receipt-approval'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.org_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 400 })
    }

    // Parse and validate query params
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      status: searchParams.get('status') || undefined,
      po_id: searchParams.get('po_id') || undefined,
      requested_by: searchParams.get('requested_by') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      sort: searchParams.get('sort') || undefined,
      order: searchParams.get('order') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    }

    // Validate query params
    const validated = approvalListQuerySchema.parse(queryParams)

    const result = await OverReceiptApprovalService.list(validated, userData.org_id, supabase)

    return NextResponse.json(
      {
        data: result.data,
        meta: {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        },
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const err = error as Error & { name?: string; errors?: unknown[] }
    if (err.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: err.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.org_id) {
      return NextResponse.json({ error: 'User organization not found' }, { status: 400 })
    }

    const body = await request.json()

    // Validate input
    const validated = createOverReceiptApprovalSchema.parse(body)

    // Create approval request
    const approval = await OverReceiptApprovalService.requestApproval(
      validated,
      userData.org_id,
      user.id,
      supabase
    )

    return NextResponse.json(approval, { status: 201 })
  } catch (error: unknown) {
    const err = error as Error & { name?: string; errors?: unknown[] }
    if (err.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: err.errors },
        { status: 400 }
      )
    }
    if (err.message.includes('already exists')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
