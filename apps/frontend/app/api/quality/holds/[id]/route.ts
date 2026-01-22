/**
 * Quality Holds Detail API Routes
 * Story: 06.2 - Quality Holds CRUD
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/holds/:id - Get hold detail with items
 * - DELETE /api/quality/holds/:id - Delete hold (soft-delete)
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.2.quality-holds-crud.md}
 */

import { NextRequest, NextResponse } from 'next/server'
import * as QualityHoldService from '@/lib/services/quality-hold-service'
import { isValidUUID, getAuthenticatedOrgId, getAuthenticatedUser, handleError } from '@/lib/utils/api-helpers'

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

    const auth = await getAuthenticatedOrgId()
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
