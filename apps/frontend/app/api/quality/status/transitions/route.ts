/**
 * Quality Status Transitions API Route
 * Story: 06.1 - Quality Status Types
 *
 * Route:
 * - GET /api/quality/status/transitions?current=PENDING - Get valid transitions for current status
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.1.quality-status-types.md}
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { QualityStatusService } from '@/lib/services/quality-status-service'
import { currentStatusQuerySchema } from '@/lib/validation/quality-status-schemas'
import { ZodError } from 'zod'

/**
 * GET /api/quality/status/transitions
 * Get valid transitions from current status
 *
 * Query Parameters:
 * - current: Required - Current status (PENDING, PASSED, FAILED, HOLD, RELEASED, QUARANTINED, COND_APPROVED)
 *
 * Response:
 * - 200: { current_status: string, valid_transitions: StatusTransition[] }
 * - 400: { error: string } - Missing or invalid current parameter
 * - 401: { error: 'Unauthorized' }
 * - 500: { error: string }
 */
export async function GET(request: NextRequest) {
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

    // Get current status from query params
    const { searchParams } = new URL(request.url)
    const current = searchParams.get('current')

    // Validate query parameter
    if (!current) {
      return NextResponse.json(
        { error: 'current parameter is required' },
        { status: 400 }
      )
    }

    // Validate status value
    try {
      currentStatusQuerySchema.parse({ current })
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          { error: 'Invalid status value' },
          { status: 400 }
        )
      }
      throw error
    }

    // Get valid transitions
    const validTransitions = await QualityStatusService.getValidTransitions(current)

    return NextResponse.json({
      current_status: current,
      valid_transitions: validTransitions,
    })
  } catch (error) {
    console.error('Error in GET /api/quality/status/transitions:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
