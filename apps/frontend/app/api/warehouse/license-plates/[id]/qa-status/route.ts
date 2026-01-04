/**
 * LP QA Status Update API Route (Story 05.4)
 * PUT /api/warehouse/license-plates/:id/qa-status
 *
 * Update QA status with automatic side effects
 *
 * Request Body:
 * - qa_status: 'pending' | 'passed' | 'failed' | 'quarantine'
 * - reason: string (required for failed/quarantine, optional for passed/pending)
 *
 * Side Effects:
 * - QA fail → auto-block LP (AC-3)
 * - QA pass from quarantine → auto-unblock LP (AC-5)
 * - Creates 2 audit entries when LP status also changes
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { updateQAStatusSchemaWithReason } from '@/lib/validation/lp-status-schemas'
import type { LPStatus, QAStatus } from '@/lib/validation/lp-status-schemas'
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
    const validatedData = updateQAStatusSchemaWithReason.parse(body)

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

    // Determine if we need to change LP status as side effect
    let newLPStatus: LPStatus | null = null

    // AC-3: QA fail → auto-block
    if (validatedData.qa_status === 'failed' && currentLP.status !== 'blocked') {
      newLPStatus = 'blocked'
    }

    // AC-5: QA pass from quarantine → auto-unblock
    if (
      validatedData.qa_status === 'passed' &&
      currentLP.qa_status === 'quarantine' &&
      currentLP.status === 'blocked'
    ) {
      newLPStatus = 'available'
    }

    // Update QA status (and potentially LP status)
    const updateData: any = {
      qa_status: validatedData.qa_status,
      updated_at: new Date().toISOString(),
    }

    if (newLPStatus) {
      updateData.status = newLPStatus
    }

    const { data: updatedLP, error: updateError } = await supabase
      .from('license_plates')
      .update(updateData)
      .eq('id', lpId)
      .select()
      .single()

    if (updateError || !updatedLP) {
      return NextResponse.json(
        { error: 'Failed to update QA status' },
        { status: 500 }
      )
    }

    // Create audit trail entry for QA status change
    const { data: qaAuditEntry, error: qaAuditError } = await supabase
      .from('lp_status_audit')
      .insert({
        lp_id: lpId,
        field_name: 'qa_status',
        old_value: currentLP.qa_status,
        new_value: validatedData.qa_status,
        reason: validatedData.reason || null,
        changed_by: session.user.id,
      })
      .select()
      .single()

    if (qaAuditError) {
      console.error('Failed to create QA audit entry:', qaAuditError)
    }

    // Create second audit entry if LP status also changed
    let statusAuditEntry = null
    if (newLPStatus) {
      const { data: sAuditEntry, error: sAuditError } = await supabase
        .from('lp_status_audit')
        .insert({
          lp_id: lpId,
          field_name: 'status',
          old_value: currentLP.status,
          new_value: newLPStatus,
          reason: `Auto-updated due to QA status change to ${validatedData.qa_status}`,
          changed_by: session.user.id,
        })
        .select()
        .single()

      if (sAuditError) {
        console.error('Failed to create status audit entry:', sAuditError)
      } else {
        statusAuditEntry = sAuditEntry
      }
    }

    return NextResponse.json({
      success: true,
      data: updatedLP,
      audit_entries: {
        qa_status: qaAuditEntry,
        status: statusAuditEntry,
      },
      side_effect: newLPStatus
        ? {
            type: 'status_change',
            old_status: currentLP.status,
            new_status: newLPStatus,
          }
        : null,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in PUT /api/warehouse/license-plates/:id/qa-status:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
