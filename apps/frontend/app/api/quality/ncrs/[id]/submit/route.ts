/**
 * NCR Submit API Route
 * Story: 06.9 - Basic NCR Creation
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - POST /api/quality/ncrs/:id/submit - Submit draft NCR (draft -> open)
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.9.basic-ncr-creation.md}
 */

import { NextRequest, NextResponse } from 'next/server'
import { NCRService } from '@/lib/services/ncr-service'
import { getAuthenticatedUser, handleError, isValidUUID } from '@/lib/utils/api-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/quality/ncrs/:id/submit
 * Submit draft NCR to open status
 *
 * Response:
 * - 200: { ncr: NCRReport }
 * - 401: { error: 'Unauthorized' }
 * - 404: { error: 'NCR not found' }
 * - 409: { error: 'NCR is already open' }
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

    // Submit NCR
    const ncr = await NCRService.submit(id, auth.userId)

    return NextResponse.json({ ncr })
  } catch (error) {
    console.error('Error in POST /api/quality/ncrs/:id/submit:', error)

    if (error instanceof Error) {
      if (error.message.includes('already open')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
      if (error.message.includes('Cannot submit')) {
        return NextResponse.json({ error: error.message }, { status: 409 })
      }
    }

    return handleError(error)
  }
}
