/**
 * LP Status Update API Route (Story 05.4)
 * PUT /api/warehouse/license-plates/:id/status
 *
 * Update LP status with validation and audit trail
 *
 * Request Body:
 * - status: 'available' | 'reserved' | 'consumed' | 'blocked'
 * - reason: string (optional, max 500 chars)
 *
 * Business Rules:
 * - Validates status transitions
 * - Creates audit trail entry
 * - Enforces org_id isolation (RLS)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { updateLPStatusSchema } from '@/lib/validation/lp-status-schemas'
import { LPStatusService } from '@/lib/services/lp-status-service'
import type { LPStatus } from '@/lib/validation/lp-status-schemas'
import { ZodError } from 'zod'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lpId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateLPStatusSchema.parse(body)

    // Get current LP (RLS enforces org_id isolation)
    const { data: currentLP, error: fetchError } = await supabase
      .from('license_plates')
      .select('*')
      .eq('id', lpId)
      .single()

    if (fetchError || !currentLP) {
      return NextResponse.json(
        { error: 'License plate not found', code: 'LP_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Validate status transition
    const validation = await LPStatusService.validateStatusTransition(
      currentLP.status as LPStatus,
      validatedData.status as LPStatus
    )

    if (!validation.valid) {
      return NextResponse.json(
        {
          error: validation.error,
          code: 'INVALID_STATUS_TRANSITION',
          current_status: validation.currentStatus,
        },
        { status: 400 }
      )
    }

    // Update LP status
    const { data: updatedLP, error: updateError } = await supabase
      .from('license_plates')
      .update({
        status: validatedData.status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', lpId)
      .select()
      .single()

    if (updateError || !updatedLP) {
      return NextResponse.json(
        { error: 'Failed to update LP status' },
        { status: 500 }
      )
    }

    // Create audit trail entry
    const { data: auditEntry, error: auditError } = await supabase
      .from('lp_status_audit')
      .insert({
        lp_id: lpId,
        field_name: 'status',
        old_value: currentLP.status,
        new_value: validatedData.status,
        reason: validatedData.reason || null,
        changed_by: session.user.id,
      })
      .select()
      .single()

    if (auditError) {
      console.error('Failed to create audit entry:', auditError)
      // Non-fatal - status was updated successfully
    }

    return NextResponse.json({
      success: true,
      data: updatedLP,
      audit_entry: auditEntry,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in PUT /api/warehouse/license-plates/:id/status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
