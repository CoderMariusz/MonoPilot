/**
 * Quality Holds Release API Route
 * Story: 06.2 - Quality Holds CRUD
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - PATCH /api/quality/holds/:id/release - Release hold with disposition
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.2.quality-holds-crud.md}
 */

import { NextRequest, NextResponse } from 'next/server'
import { releaseHoldSchema } from '@/lib/validation/quality-hold-validation'
import { ZodError } from 'zod'
import * as QualityHoldService from '@/lib/services/quality-hold-service'
import { isValidUUID, getAuthenticatedUser, handleError } from '@/lib/utils/api-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * PATCH /api/quality/holds/:id/release
 * Release a hold with disposition
 *
 * Request Body: ReleaseHoldInput
 * - disposition: 'release' | 'rework' | 'scrap' | 'return'
 * - release_notes: string (10-1000 chars)
 *
 * Response:
 * - 200: { hold: QualityHold, lp_updates?: [...] }
 * - 400: { error: string, details?: ZodError[] }
 * - 401: { error: 'Unauthorized' }
 * - 403: { error: 'Forbidden' }
 * - 404: { error: 'Hold not found' }
 * - 500: { error: string }
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: holdId } = await params

    if (!isValidUUID(holdId)) {
      return NextResponse.json({ error: 'Invalid hold ID' }, { status: 400 })
    }

    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission - VIEWER cannot release holds
    if (auth.roleCode === 'viewer') {
      return NextResponse.json(
        { error: 'Insufficient permissions to release holds' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = releaseHoldSchema.parse(body)

    // Release hold
    const result = await QualityHoldService.releaseHold(
      holdId,
      validatedData.disposition,
      validatedData.release_notes,
      auth.orgId,
      auth.userId
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in PATCH /api/quality/holds/:id/release:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return handleError(error)
  }
}
