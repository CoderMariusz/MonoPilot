/**
 * Quality Status Change API Route
 * Story: 06.1 - Quality Status Types
 *
 * Route:
 * - POST /api/quality/status/change - Change status and record in history
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.1.quality-status-types.md}
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { QualityStatusService } from '@/lib/services/quality-status-service'
import { changeStatusSchema } from '@/lib/validation/quality-status-schemas'
import { ZodError } from 'zod'

/**
 * POST /api/quality/status/change
 * Change entity status and create history record
 *
 * Request Body:
 * - entity_type: 'lp' | 'batch' | 'inspection'
 * - entity_id: UUID
 * - to_status: Target status
 * - reason: Required reason (10-500 chars)
 * - inspection_id?: Optional inspection UUID
 *
 * Response:
 * - 200: { success: boolean, new_status: string, history_id: string, warnings?: string[] }
 * - 400: { error: string, details?: ZodError[] }
 * - 401: { error: 'Unauthorized' }
 * - 403: { error: 'Forbidden' } - For approval-required transitions without role
 * - 404: { error: 'Entity not found' }
 * - 500: { error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check user role for status change permission
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('role_id, roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if user has permission to change status (not VIEWER)
    const roleCode = (user.roles as any)?.code?.toLowerCase()
    if (roleCode === 'viewer') {
      return NextResponse.json(
        { error: 'Forbidden: Viewers cannot change quality status' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    let body
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON in request body' },
        { status: 400 }
      )
    }

    // Validate request
    let validatedData
    try {
      validatedData = changeStatusSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        )
      }
      throw error
    }

    // Change status
    try {
      const result = await QualityStatusService.changeStatus(
        {
          entity_type: validatedData.entity_type,
          entity_id: validatedData.entity_id,
          to_status: validatedData.to_status,
          reason: validatedData.reason,
          inspection_id: validatedData.inspection_id,
        },
        session.user.id
      )

      return NextResponse.json(result)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'

      // Check for specific error types
      if (message.includes('not found')) {
        return NextResponse.json({ error: 'Entity not found' }, { status: 404 })
      }

      if (message.includes('QA Manager approval required')) {
        return NextResponse.json(
          { error: 'Forbidden: QA Manager approval required for this transition' },
          { status: 403 }
        )
      }

      if (message.includes('Invalid status transition') || message.includes('Reason is required')) {
        return NextResponse.json({ error: message }, { status: 400 })
      }

      throw error
    }
  } catch (error) {
    console.error('Error in POST /api/quality/status/change:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
