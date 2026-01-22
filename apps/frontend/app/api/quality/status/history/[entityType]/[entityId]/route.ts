/**
 * Quality Status History API Route
 * Story: 06.1 - Quality Status Types
 *
 * Route:
 * - GET /api/quality/status/history/:entityType/:entityId - Get status change history
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.1.quality-status-types.md}
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { QualityStatusService } from '@/lib/services/quality-status-service'
import { statusHistoryQuerySchema, ENTITY_TYPES } from '@/lib/validation/quality-status-schemas'
import { ZodError } from 'zod'

interface RouteParams {
  params: Promise<{
    entityType: string
    entityId: string
  }>
}

/**
 * GET /api/quality/status/history/:entityType/:entityId
 * Get status change history for entity
 *
 * Path Parameters:
 * - entityType: 'lp' | 'batch' | 'inspection'
 * - entityId: UUID
 *
 * Query Parameters:
 * - limit?: Number of entries to return
 * - offset?: Number of entries to skip
 *
 * Response:
 * - 200: { entity_type: string, entity_id: string, history: StatusHistoryEntry[] }
 * - 400: { error: string } - Invalid parameters
 * - 401: { error: 'Unauthorized' }
 * - 500: { error: string }
 *
 * Performance: <200ms
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    // Get path parameters
    const { entityType, entityId } = await params

    // Validate entityType
    if (!ENTITY_TYPES.includes(entityType as any)) {
      return NextResponse.json(
        { error: `Invalid entity type. Must be one of: ${ENTITY_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate query parameters
    try {
      statusHistoryQuerySchema.parse({
        entity_type: entityType,
        entity_id: entityId,
      })
    } catch (error) {
      if (error instanceof ZodError) {
        // Check if it's an invalid UUID
        const uuidError = error.errors.find((e) => e.path.includes('entity_id'))
        if (uuidError) {
          return NextResponse.json(
            { error: 'Invalid entity ID - must be a valid UUID' },
            { status: 400 }
          )
        }
        return NextResponse.json(
          { error: 'Invalid parameters', details: error.errors },
          { status: 400 }
        )
      }
      throw error
    }

    // Get history
    const history = await QualityStatusService.getStatusHistory(entityType, entityId)

    return NextResponse.json({
      entity_type: entityType,
      entity_id: entityId,
      history,
    })
  } catch (error) {
    console.error('Error in GET /api/quality/status/history:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
