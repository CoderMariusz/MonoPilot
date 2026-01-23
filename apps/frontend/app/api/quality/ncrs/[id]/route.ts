/**
 * NCR Detail API Routes
 * Story: 06.9 - Basic NCR Creation
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/ncrs/:id - Get NCR detail
 * - PUT /api/quality/ncrs/:id - Update draft NCR
 * - DELETE /api/quality/ncrs/:id - Delete draft NCR
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.9.basic-ncr-creation.md}
 */

import { NextRequest, NextResponse } from 'next/server'
import { updateNCRSchema } from '@/lib/validation/ncr-schemas'
import { ZodError } from 'zod'
import { NCRService } from '@/lib/services/ncr-service'
import { getAuthenticatedOrgId, getAuthenticatedUser, handleError, isValidUUID } from '@/lib/utils/api-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET /api/quality/ncrs/:id
 * Get NCR detail with permissions
 *
 * Response:
 * - 200: { ncr: NCRReport, permissions: NCRPermissions }
 * - 401: { error: 'Unauthorized' }
 * - 404: { error: 'NCR not found' }
 * - 500: { error: string }
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const auth = await getAuthenticatedOrgId()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!isValidUUID(id)) {
      return NextResponse.json({ error: 'Invalid NCR ID' }, { status: 400 })
    }

    const ncr = await NCRService.getById(id)
    if (!ncr) {
      return NextResponse.json({ error: 'NCR not found' }, { status: 404 })
    }

    // Check org isolation
    if (ncr.org_id !== auth.orgId) {
      return NextResponse.json({ error: 'NCR not found' }, { status: 404 })
    }

    return NextResponse.json({
      ncr,
      permissions: ncr.permissions,
    })
  } catch (error) {
    console.error('Error in GET /api/quality/ncrs/:id:', error)
    return handleError(error)
  }
}

/**
 * PUT /api/quality/ncrs/:id
 * Update draft NCR
 *
 * Request Body: UpdateNCRInput (partial)
 * - title: optional (5-200 chars)
 * - description: optional (20-2000 chars)
 * - severity: optional
 * - detection_point: optional
 * - category: optional
 *
 * Response:
 * - 200: { ncr: NCRReport }
 * - 400: { error: string }
 * - 401: { error: 'Unauthorized' }
 * - 403: { error: 'Cannot edit open/closed NCR' }
 * - 404: { error: 'NCR not found' }
 * - 500: { error: string }
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    // Check status
    if (existingNCR.status === 'open') {
      return NextResponse.json({ error: 'Cannot edit open NCR' }, { status: 403 })
    }
    if (existingNCR.status === 'closed') {
      return NextResponse.json({ error: 'Cannot edit closed NCR' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateNCRSchema.parse(body)

    // Update NCR
    const ncr = await NCRService.update(id, validatedData, auth.userId)

    return NextResponse.json({ ncr })
  } catch (error) {
    console.error('Error in PUT /api/quality/ncrs/:id:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message.includes('Cannot edit')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }

    return handleError(error)
  }
}

/**
 * DELETE /api/quality/ncrs/:id
 * Delete draft NCR only
 *
 * Response:
 * - 200: {}
 * - 401: { error: 'Unauthorized' }
 * - 403: { error: 'Cannot delete open/closed NCR' }
 * - 404: { error: 'NCR not found' }
 * - 500: { error: string }
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    // Check status
    if (existingNCR.status === 'open') {
      return NextResponse.json({ error: 'Cannot delete open NCR' }, { status: 403 })
    }
    if (existingNCR.status === 'closed') {
      return NextResponse.json({ error: 'Cannot delete closed NCR' }, { status: 403 })
    }

    // Delete NCR
    await NCRService.delete(id, auth.userId)

    return NextResponse.json({})
  } catch (error) {
    console.error('Error in DELETE /api/quality/ncrs/:id:', error)

    if (error instanceof Error) {
      if (error.message.includes('Cannot delete')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }

    return handleError(error)
  }
}
