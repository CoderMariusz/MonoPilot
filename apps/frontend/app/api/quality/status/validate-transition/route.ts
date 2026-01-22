/**
 * Quality Status Validate Transition API Route
 * Story: 06.1 - Quality Status Types
 *
 * Route:
 * - POST /api/quality/status/validate-transition - Validate if transition is allowed
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.1.quality-status-types.md}
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { QualityStatusService } from '@/lib/services/quality-status-service'
import { validateTransitionSchema } from '@/lib/validation/quality-status-schemas'
import { ZodError } from 'zod'

/**
 * POST /api/quality/status/validate-transition
 * Validate if a status transition is allowed
 *
 * Request Body:
 * - entity_type: 'lp' | 'batch' | 'inspection'
 * - entity_id: UUID
 * - from_status: Current status
 * - to_status: Target status
 * - reason?: Optional reason (10-500 chars if provided)
 *
 * Response:
 * - 200: { is_valid: boolean, errors?: string[], warnings?: string[], required_actions?: {...} }
 * - 400: { error: string, details?: ZodError[] }
 * - 401: { error: 'Unauthorized' }
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
      validatedData = validateTransitionSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid request data', details: error.errors },
          { status: 400 }
        )
      }
      throw error
    }

    // Validate transition
    const result = await QualityStatusService.validateTransition({
      entity_type: validatedData.entity_type,
      entity_id: validatedData.entity_id,
      from_status: validatedData.from_status,
      to_status: validatedData.to_status,
      reason: validatedData.reason,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in POST /api/quality/status/validate-transition:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
