/**
 * API Route: /api/v1/quality/scanner/sync-offline
 * Story: 06.8 Scanner QA Pass/Fail
 * Methods: POST
 * AC-8.9: Auto-Sync When Online
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { syncOfflineSchema, type QuickInspectionInput } from '@/lib/validation/scanner-qa'
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

const SYNC_STATUS = {
  SYNCED: 'synced',
  FAILED: 'failed',
  DUPLICATE: 'duplicate',
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
  MISSING_INSPECTION_ID: 'Missing inspection_id',
  INTERNAL_SERVER_ERROR: 'Internal server error',
} as const

/**
 * POST /api/v1/quality/scanner/sync-offline
 * Bulk sync offline actions
 *
 * Request Body:
 * - actions: array of offline actions (min 1, max 100)
 *   - id: string (UUID, local action ID)
 *   - type: 'quick_inspection' | 'test_result'
 *   - payload: action-specific data
 *   - timestamp: ISO 8601 datetime (local device timestamp)
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
      validatedData = syncOfflineSchema.parse(body)
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

    // Sort actions by timestamp (process oldest first)
    const sortedActions = [...validatedData.actions].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    )

    let success = 0
    let failed = 0
    const errors: { action_id: string; error: string }[] = []

    // Process each action
    for (const action of sortedActions) {
      try {
        if (action.type === 'quick_inspection') {
          const payload = action.payload as QuickInspectionInput

          // Validate required fields
          if (!payload.inspection_id) {
            throw new Error(ERROR_MESSAGES.MISSING_INSPECTION_ID)
          }

          // Check if inspection exists and not already completed
          const { data: inspection, error: inspectionError } = await supabase
            .from('quality_inspections')
            .select('id, status, lp_id, result')
            .eq('id', payload.inspection_id)
            .eq('org_id', userData.org_id)
            .single()

          if (inspectionError || !inspection) {
            throw new Error(ERROR_MESSAGES.INSPECTION_NOT_FOUND)
          }

          // Check for duplicate completion
          if (inspection.status === INSPECTION_STATUS.COMPLETED) {
            // Log duplicate attempt
            await supabase.from('scanner_offline_queue').insert({
              org_id: userData.org_id,
              user_id: user.id,
              action_type: action.type,
              action_payload: action.payload,
              device_id: payload.scanner_device_id || null,
              created_at_local: action.timestamp,
              sync_status: SYNC_STATUS.DUPLICATE,
              error_message: ERROR_MESSAGES.INSPECTION_ALREADY_COMPLETED,
            })

            throw new Error(ERROR_MESSAGES.INSPECTION_ALREADY_COMPLETED)
          }

          // Map result to LP QA status
          const lpQAStatus = payload.result === 'pass' ? LP_QA_STATUS.PASSED : LP_QA_STATUS.FAILED

          // Calculate sync delay
          const localTime = new Date(action.timestamp)
          const syncTime = new Date()
          const syncDelaySeconds = Math.round((syncTime.getTime() - localTime.getTime()) / 1000)
          const now = syncTime.toISOString()

          // Update inspection
          const { error: updateError } = await supabase
            .from('quality_inspections')
            .update({
              status: INSPECTION_STATUS.COMPLETED,
              result: payload.result,
              result_notes: payload.result_notes,
              defects_found: payload.defects_found,
              inspection_method: 'scanner',
              scanner_device_id: payload.scanner_device_id,
              scanner_location: payload.scanner_location,
              completed_at: action.timestamp, // Use local timestamp
              completed_by: user.id,
              updated_at: now,
              updated_by: user.id,
            })
            .eq('id', payload.inspection_id)

          if (updateError) {
            throw new Error(ERROR_MESSAGES.FAILED_TO_UPDATE_INSPECTION)
          }

          // Update LP QA status
          if (inspection.lp_id) {
            await supabase
              .from('license_plates')
              .update({
                qa_status: lpQAStatus,
                updated_at: now,
              })
              .eq('id', inspection.lp_id)
          }

          // Log audit trail
          await supabase.from('quality_audit_log').insert({
            org_id: userData.org_id,
            entity_type: 'inspection',
            entity_id: payload.inspection_id,
            action: AUDIT_ACTION.SCANNER_COMPLETE,
            user_id: user.id,
            old_value: JSON.stringify({
              status: inspection.status,
              result: inspection.result,
            }),
            new_value: JSON.stringify({
              status: INSPECTION_STATUS.COMPLETED,
              result: payload.result,
            }),
            change_reason: payload.result === 'pass' ? 'Scanner quick pass' : 'Scanner quick fail',
            metadata: JSON.stringify({
              inspection_method: 'scanner',
              device_id: payload.scanner_device_id || null,
              offline_queued: true,
              sync_delay_seconds: syncDelaySeconds,
            }),
          })

          // Log successful sync to queue table
          await supabase.from('scanner_offline_queue').insert({
            org_id: userData.org_id,
            user_id: user.id,
            action_type: action.type,
            action_payload: action.payload,
            device_id: payload.scanner_device_id || null,
            created_at_local: action.timestamp,
            sync_status: SYNC_STATUS.SYNCED,
          })

          success++
        } else if (action.type === 'test_result') {
          // Test result sync (Phase 2)
          // For now, just log and mark as synced
          await supabase.from('scanner_offline_queue').insert({
            org_id: userData.org_id,
            user_id: user.id,
            action_type: action.type,
            action_payload: action.payload,
            created_at_local: action.timestamp,
            sync_status: SYNC_STATUS.SYNCED,
          })

          success++
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        failed++
        errors.push({
          action_id: action.id,
          error: errorMessage,
        })

        // Log failed sync (if not already logged as duplicate)
        if (errorMessage !== ERROR_MESSAGES.INSPECTION_ALREADY_COMPLETED) {
          await supabase.from('scanner_offline_queue').insert({
            org_id: userData.org_id,
            user_id: user.id,
            action_type: action.type,
            action_payload: action.payload,
            created_at_local: action.timestamp,
            sync_status: SYNC_STATUS.FAILED,
            error_message: errorMessage,
          })
        }
      }
    }

    return NextResponse.json({
      success,
      failed,
      errors,
    })
  } catch (error) {
    console.error('Error in POST /api/v1/quality/scanner/sync-offline:', error)
    return NextResponse.json({ error: ERROR_MESSAGES.INTERNAL_SERVER_ERROR }, { status: 500 })
  }
}
