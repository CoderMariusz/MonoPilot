/**
 * Reject Over-Receipt API Route (Story 05.15)
 * POST /api/warehouse/over-receipt-approvals/[id]/reject - Reject request
 *
 * SECURITY (ADR-013 compliance):
 * - Authentication required
 * - Manager role required (WH_MANAGER, ADMIN, SUPER_ADMIN)
 * - org_id isolation via RLS
 * - Input validation via Zod
 * - Review notes required for rejection
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { OverReceiptApprovalService } from '@/lib/services/over-receipt-approval-service'
import { rejectOverReceiptSchema } from '@/lib/validation/over-receipt-approval'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const { id } = await params

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

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(id)) {
      return NextResponse.json({ error: 'Invalid approval ID format' }, { status: 400 })
    }

    const body = await request.json()

    // Validate input
    const validated = rejectOverReceiptSchema.parse(body)

    // Reject request
    const approval = await OverReceiptApprovalService.rejectRequest(
      { approvalId: id, reviewNotes: validated.review_notes },
      userData.org_id,
      user.id,
      supabase
    )

    return NextResponse.json(approval, { status: 200 })
  } catch (error: unknown) {
    const err = error as Error & { name?: string; errors?: unknown[] }
    if (err.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: err.errors },
        { status: 400 }
      )
    }
    if (err.message.includes('Only warehouse managers')) {
      return NextResponse.json({ error: err.message }, { status: 403 })
    }
    if (err.message.includes('not found')) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    if (err.message.includes('already reviewed')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    if (err.message.includes('Review notes required')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
