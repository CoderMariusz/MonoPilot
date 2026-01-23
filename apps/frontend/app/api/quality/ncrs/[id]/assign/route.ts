/**
 * NCR Assign API Route
 * Story: 06.9 - Basic NCR Creation
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - POST /api/quality/ncrs/:id/assign - Assign NCR to user
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.9.basic-ncr-creation.md}
 */

import { NextRequest, NextResponse } from 'next/server'
import { assignNCRSchema } from '@/lib/validation/ncr-schemas'
import { ZodError } from 'zod'
import { NCRService } from '@/lib/services/ncr-service'
import { getAuthenticatedUser, handleError, isValidUUID } from '@/lib/utils/api-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/quality/ncrs/:id/assign
 * Assign NCR to a user
 *
 * Request Body:
 * - assigned_to: string (valid UUID)
 *
 * Response:
 * - 200: { ncr: NCRReport }
 * - 400: { error: 'Invalid user ID' }
 * - 401: { error: 'Unauthorized' }
 * - 404: { error: 'NCR not found' }
 * - 500: { error: string }
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid NCR ID' }, { status: 400 })
    }

    // Check NCR exists and belongs to org
    const existingNCR = await NCRService.getById(id)
    if (!existingNCR) {
      return NextResponse.json({ error: 'NCR not found' }, { status: 404 })
    }
    if (existingNCR.org_id !== auth.orgId) {
      return NextResponse.json({ error: 'NCR not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = assignNCRSchema.parse(body)

    // Assign NCR
    const ncr = await NCRService.assign(id, validatedData.assigned_to, auth.userId)

    return NextResponse.json({ ncr })
  } catch (error) {
    console.error('Error in POST /api/quality/ncrs/:id/assign:', error)

    if (error instanceof ZodError) {
      const firstError = error.errors[0]
      if (firstError.path.includes('assigned_to')) {
        return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 })
      }
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message.includes('Invalid user ID')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
    }

    return handleError(error)
  }
}
