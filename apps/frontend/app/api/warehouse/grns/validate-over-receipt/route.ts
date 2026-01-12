/**
 * Over-Receipt Validation API Route (Story 05.15)
 * POST /api/warehouse/grns/validate-over-receipt - Validate single line over-receipt
 *
 * SECURITY (ADR-013 compliance):
 * - Authentication required
 * - org_id isolation via RLS
 * - Input validation via Zod
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { OverReceiptApprovalService } from '@/lib/services/over-receipt-approval-service'
import { validateOverReceiptRequestSchema } from '@/lib/validation/over-receipt-approval'

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
    const validated = validateOverReceiptRequestSchema.parse(body)

    // Perform validation
    const result = await OverReceiptApprovalService.validateOverReceipt(
      validated.po_line_id,
      validated.receiving_qty,
      userData.org_id,
      supabase
    )

    return NextResponse.json(result, { status: 200 })
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
