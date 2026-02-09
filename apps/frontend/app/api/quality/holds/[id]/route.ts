/**
 * Quality Holds Detail API Routes
 * Story: 06.2 - Quality Holds CRUD
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/holds/:id - Get hold detail with items
 * - PATCH /api/quality/holds/:id - Update hold details (reason, priority, hold_type)
 * - DELETE /api/quality/holds/:id - Delete hold (soft-delete)
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.2.quality-holds-crud.md}
 */

import { NextRequest, NextResponse } from 'next/server'
import { z, ZodError } from 'zod'
import * as QualityHoldService from '@/lib/services/quality-hold-service'
import { isValidUUID, getAuthenticatedUser, handleError } from '@/lib/utils/api-helpers'

// Validation schema for updating hold details
const updateHoldSchema = z.object({
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500, 'Reason must not exceed 500 characters').optional(),
  hold_type: z.enum(['qa_pending', 'investigation', 'recall', 'quarantine']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
})

export type UpdateHoldInput = z.infer<typeof updateHoldSchema>

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/quality/holds/:id
 * Get hold detail with items
 *
 * Response:
 * - 200: { hold: QualityHold, items: QualityHoldItem[], ncr?: {...} }
 * - 400: { error: 'Invalid hold ID' }
 * - 401: { error: 'Unauthorized' }
 * - 404: { error: 'Hold not found' }
 * - 500: { error: string }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: holdId } = await params

    if (!isValidUUID(holdId)) {
      return NextResponse.json({ error: 'Invalid hold ID' }, { status: 400 })
    }

    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get hold detail
    const result = await QualityHoldService.getHoldById(holdId, auth.orgId)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/quality/holds/:id:', error)
    return handleError(error)
  }
}

/**
 * PATCH /api/quality/holds/:id
 * Update hold details (reason, priority, hold_type)
 * Only allowed for 'active' holds
 *
 * Request Body: UpdateHoldInput
 * - reason?: string (10-500 chars)
 * - hold_type?: 'qa_pending' | 'investigation' | 'recall' | 'quarantine'
 * - priority?: 'low' | 'medium' | 'high' | 'critical'
 *
 * Response:
 * - 200: { hold: QualityHold }
 * - 400: { error: string }
 * - 401: { error: 'Unauthorized' }
 * - 403: { error: 'Forbidden' }
 * - 404: { error: 'Hold not found' }
 * - 409: { error: 'Hold cannot be updated (not in active status)' }
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

    // Check permission - VIEWER cannot update holds
    if (auth.roleCode === 'viewer') {
      return NextResponse.json(
        { error: 'Insufficient permissions to update holds' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateHoldSchema.parse(body)

    // Update hold details
    const result = await QualityHoldService.updateHold(
      holdId,
      validatedData,
      auth.orgId,
      auth.userId
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in PATCH /api/quality/holds/:id:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return handleError(error)
  }
}

/**
 * DELETE /api/quality/holds/:id
 * Delete hold (only if status = 'active' and no items)
 *
 * Response:
 * - 204: No Content
 * - 400: { error: string }
 * - 401: { error: 'Unauthorized' }
 * - 403: { error: 'Forbidden' }
 * - 404: { error: 'Hold not found' }
 * - 500: { error: string }
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: holdId } = await params

    if (!isValidUUID(holdId)) {
      return NextResponse.json({ error: 'Invalid hold ID' }, { status: 400 })
    }

    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission - VIEWER cannot delete holds
    if (auth.roleCode === 'viewer') {
      return NextResponse.json(
        { error: 'Insufficient permissions to delete holds' },
        { status: 403 }
      )
    }

    // Delete hold
    await QualityHoldService.deleteHold(holdId, auth.orgId)

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/quality/holds/:id:', error)
    return handleError(error)
  }
}
