/**
 * NCR Close API Route
 * Story: 06.9 - Basic NCR Creation
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - POST /api/quality/ncrs/:id/close - Close NCR (open -> closed)
 *
 * QA Manager only - requires closure notes (min 50 chars)
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.9.basic-ncr-creation.md}
 */

import { NextRequest, NextResponse } from 'next/server'
import { closeNCRSchema } from '@/lib/validation/ncr-schemas'
import { ZodError } from 'zod'
import { NCRService, setUserRole } from '@/lib/services/ncr-service'
import { getAuthenticatedUser, handleError, isValidUUID } from '@/lib/utils/api-helpers'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * POST /api/quality/ncrs/:id/close
 * Close open NCR with closure notes
 *
 * QA Manager only
 *
 * Request Body:
 * - closure_notes: string (50-2000 chars)
 *
 * Response:
 * - 200: { ncr: NCRReport }
 * - 400: { error: 'Closure notes required' | 'Closure notes must be at least 50 characters' }
 * - 401: { error: 'Unauthorized' }
 * - 403: { error: 'Only QA_MANAGER can close NCRs' }
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

    // Check role - only QA_MANAGER can close
    const isQAManager = auth.roleCode === 'qa_manager' || auth.roleCode === 'admin'
    if (!isQAManager) {
      return NextResponse.json({ error: 'Only QA_MANAGER can close NCRs' }, { status: 403 })
    }

    // Set user role for service layer permission check
    setUserRole(auth.userId, auth.roleCode)

    // Parse and validate request body
    const body = await request.json()
    const validatedData = closeNCRSchema.parse(body)

    // Close NCR
    const ncr = await NCRService.close(id, validatedData.closure_notes, auth.userId)

    return NextResponse.json({ ncr })
  } catch (error) {
    console.error('Error in POST /api/quality/ncrs/:id/close:', error)

    if (error instanceof ZodError) {
      const firstError = error.errors[0]
      if (firstError.path.includes('closure_notes')) {
        if (firstError.message.includes('at least 50')) {
          return NextResponse.json({ error: 'Closure notes must be at least 50 characters' }, { status: 400 })
        }
        return NextResponse.json({ error: 'Closure notes required' }, { status: 400 })
      }
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    if (error instanceof Error) {
      if (error.message.includes('Only QA_MANAGER')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
      if (error.message.includes('Closure notes')) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }
      if (error.message.includes('Cannot close')) {
        return NextResponse.json({ error: error.message }, { status: 403 })
      }
    }

    return handleError(error)
  }
}
