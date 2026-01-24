/**
 * API Route: /api/v1/quality/scanner/quick-inspection
 * Story: 06.8 Scanner QA Pass/Fail
 * Methods: POST
 * AC-8.4, AC-8.5: Quick Pass/Fail Workflow
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { quickInspectionSchema } from '@/lib/validation/scanner-qa'
import { ZodError } from 'zod'

// =============================================================================
// Constants
// =============================================================================

const INSPECTION_STATUS = {
  COMPLETED: 'completed',
} as const

const LP_QA_STATUS = {
  PASSED: 'passed',
  FAILED: 'failed',
} as const

const AUDIT_ACTION = {
  SCANNER_COMPLETE: 'scanner_complete',
} as const

const ALLOWED_ROLES = ['qa_inspector', 'qa_manager', 'admin', 'owner'] as const

const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized',
  USER_NOT_FOUND: 'User not found',
  PERMISSION_DENIED: 'Scanner access requires QA Inspector role',
  VALIDATION_FAILED: 'Validation failed',
  INSPECTION_NOT_FOUND: 'Inspection not found',
  INSPECTION_ALREADY_COMPLETED: 'Inspection already completed',
  FAILED_TO_UPDATE_INSPECTION: 'Failed to update inspection',
  INTERNAL_SERVER_ERROR: 'Internal server error',
} as const

/**
 * POST /api/v1/quality/scanner/quick-inspection
 * Quick pass/fail for scanner workflow (simplified version of complete inspection)
 *
 * Request Body:
 * - inspection_id: string (required, UUID)
 * - result: 'pass' | 'fail' (required)
 * - result_notes: string (optional, max 2000 chars)
 * - defects_found: number (optional, 0-1000)
 * - inspection_method: 'scanner' (required)
 * - scanner_device_id: string (optional, max 100 chars)
 * - scanner_location: string (optional, GPS coordinates)
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: ERROR_MESSAGES.UNAUTHORIZED }, { status: 401 })
    }

    // Get user's org_id and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: ERROR_MESSAGES.USER_NOT_FOUND }, { status: 401 })
    }

    // Check permissions - QA_INSPECTOR or QA_MANAGER role required
    const roleData = userData.role as { code?: string } | { code?: string }[] | null
    const userRole = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code

    if (!ALLOWED_ROLES.includes(userRole?.toLowerCase() as typeof ALLOWED_ROLES[number])) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.PERMISSION_DENIED },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()

    let validatedData
    try {
      validatedData = quickInspectionSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: ERROR_MESSAGES.VALIDATION_FAILED,
            details: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        )
      }
      throw error
    }

    // Verify inspection exists
    const { data: inspection, error: inspectionError } = await supabase
      .from('quality_inspections')
      .select('*')
      .eq('id', validatedData.inspection_id)
      .eq('org_id', userData.org_id)
      .single()

    if (inspectionError || !inspection) {
      return NextResponse.json({ error: ERROR_MESSAGES.INSPECTION_NOT_FOUND }, { status: 404 })
    }

    // Check if already completed
    if (inspection.status === INSPECTION_STATUS.COMPLETED) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.INSPECTION_ALREADY_COMPLETED },
        { status: 400 }
      )
    }

    // Map result to LP QA status
    const lpQAStatus = validatedData.result === 'pass' ? LP_QA_STATUS.PASSED : LP_QA_STATUS.FAILED

    // Update inspection
    const now = new Date().toISOString()
    const { data: updatedInspection, error: updateError } = await supabase
      .from('quality_inspections')
      .update({
        status: INSPECTION_STATUS.COMPLETED,
        result: validatedData.result,
        result_notes: validatedData.result_notes,
        defects_found: validatedData.defects_found,
        inspection_method: validatedData.inspection_method,
        scanner_device_id: validatedData.scanner_device_id,
        scanner_location: validatedData.scanner_location,
        completed_at: now,
        completed_by: user.id,
        updated_at: now,
        updated_by: user.id,
      })
      .eq('id', validatedData.inspection_id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update inspection:', updateError)
      return NextResponse.json({ error: ERROR_MESSAGES.FAILED_TO_UPDATE_INSPECTION }, { status: 500 })
    }

    // Update LP QA status
    let lpStatusUpdated = false
    if (inspection.lp_id) {
      const { error: lpUpdateError } = await supabase
        .from('license_plates')
        .update({
          qa_status: lpQAStatus,
          updated_at: now,
        })
        .eq('id', inspection.lp_id)

      if (!lpUpdateError) {
        lpStatusUpdated = true
      } else {
        console.error('Failed to update LP status:', lpUpdateError)
      }
    }

    // Log audit trail (AC-8.15)
    await supabase.from('quality_audit_log').insert({
      org_id: userData.org_id,
      entity_type: 'inspection',
      entity_id: validatedData.inspection_id,
      action: AUDIT_ACTION.SCANNER_COMPLETE,
      user_id: user.id,
      old_value: JSON.stringify({
        status: inspection.status,
        result: inspection.result,
      }),
      new_value: JSON.stringify({
        status: INSPECTION_STATUS.COMPLETED,
        result: validatedData.result,
      }),
      change_reason: validatedData.result === 'pass' ? 'Scanner quick pass' : 'Scanner quick fail',
      metadata: JSON.stringify({
        inspection_method: 'scanner',
        device_id: validatedData.scanner_device_id || null,
        offline_queued: false,
      }),
    })

    return NextResponse.json({
      inspection: updatedInspection,
      lp_status_updated: lpStatusUpdated,
      lp_new_status: lpQAStatus,
    })
  } catch (error) {
    console.error('Error in POST /api/v1/quality/scanner/quick-inspection:', error)
    return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR }, { status: 500 })
  }
}
