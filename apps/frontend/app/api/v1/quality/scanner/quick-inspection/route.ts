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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Check permissions - QA_INSPECTOR or QA_MANAGER role required
    const roleData = userData.role as { code?: string } | { code?: string }[] | null
    const userRole = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code
    const allowedRoles = ['qa_inspector', 'qa_manager', 'admin', 'owner']

    if (!allowedRoles.includes(userRole?.toLowerCase() || '')) {
      return NextResponse.json(
        { error: 'Scanner access requires QA Inspector role' },
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
            error: 'Validation failed',
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
      return NextResponse.json({ error: 'Inspection not found' }, { status: 404 })
    }

    // Check if already completed
    if (inspection.status === 'completed') {
      return NextResponse.json(
        { error: 'Inspection already completed' },
        { status: 400 }
      )
    }

    // Map result to LP QA status
    const lpQAStatus = validatedData.result === 'pass' ? 'passed' : 'failed'

    // Update inspection
    const { data: updatedInspection, error: updateError } = await supabase
      .from('quality_inspections')
      .update({
        status: 'completed',
        result: validatedData.result,
        result_notes: validatedData.result_notes,
        defects_found: validatedData.defects_found,
        inspection_method: validatedData.inspection_method,
        scanner_device_id: validatedData.scanner_device_id,
        scanner_location: validatedData.scanner_location,
        completed_at: new Date().toISOString(),
        completed_by: user.id,
        updated_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', validatedData.inspection_id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update inspection:', updateError)
      return NextResponse.json({ error: 'Failed to update inspection' }, { status: 500 })
    }

    // Update LP QA status
    let lpStatusUpdated = false
    if (inspection.lp_id) {
      const { error: lpUpdateError } = await supabase
        .from('license_plates')
        .update({
          qa_status: lpQAStatus,
          updated_at: new Date().toISOString(),
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
      action: 'scanner_complete',
      user_id: user.id,
      old_value: JSON.stringify({
        status: inspection.status,
        result: inspection.result,
      }),
      new_value: JSON.stringify({
        status: 'completed',
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
