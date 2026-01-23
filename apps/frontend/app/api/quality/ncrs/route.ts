/**
 * NCR API Routes
 * Story: 06.9 - Basic NCR Creation
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/ncrs - List NCRs with filters
 * - POST /api/quality/ncrs - Create new NCR
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.9.basic-ncr-creation.md}
 */

import { NextRequest, NextResponse } from 'next/server'
import { createNCRSchema, ncrListQuerySchema } from '@/lib/validation/ncr-schemas'
import { ZodError } from 'zod'
import { NCRService } from '@/lib/services/ncr-service'
import { getAuthenticatedOrgId, getAuthenticatedUser, handleError } from '@/lib/utils/api-helpers'

/**
 * GET /api/quality/ncrs
 * Get paginated list of NCRs with filters
 *
 * Query Parameters:
 * - status: Filter by status (draft, open, closed)
 * - severity: Filter by severity (minor, major, critical)
 * - detection_point: Filter by detection point
 * - category: Filter by category
 * - detected_by: Filter by user UUID
 * - assigned_to: Filter by assignee UUID
 * - date_from: Filter by detected_date >= date_from
 * - date_to: Filter by detected_date <= date_to
 * - search: Search in ncr_number, title
 * - sort_by: Sort field (ncr_number, detected_date, severity, status)
 * - sort_order: Sort direction (asc, desc)
 * - page: Page number (default: 1)
 * - limit: Page size (default: 20, max: 100)
 *
 * Response:
 * - 200: { ncrs: NCRReport[], pagination: {...}, stats: {...} }
 * - 401: { error: 'Unauthorized' }
 * - 500: { error: string }
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedOrgId()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const filters = {
      status: searchParams.get('status') || undefined,
      severity: searchParams.get('severity') || undefined,
      detection_point: searchParams.get('detection_point') || undefined,
      category: searchParams.get('category') || undefined,
      detected_by: searchParams.get('detected_by') || undefined,
      assigned_to: searchParams.get('assigned_to') || undefined,
      date_from: searchParams.get('date_from') || undefined,
      date_to: searchParams.get('date_to') || undefined,
      search: searchParams.get('search') || undefined,
      sort_by: searchParams.get('sort_by') || 'detected_date',
      sort_order: searchParams.get('sort_order') || 'desc',
      page: parseInt(searchParams.get('page') || '1', 10),
      limit: parseInt(searchParams.get('limit') || '20', 10),
    }

    // Validate filters
    const validatedFilters = ncrListQuerySchema.parse(filters)

    // Get NCRs list
    const result = await NCRService.list({
      ...validatedFilters,
      org_id: auth.orgId,
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/quality/ncrs:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request parameters', details: error.errors },
        { status: 400 }
      )
    }

    return handleError(error)
  }
}

/**
 * POST /api/quality/ncrs
 * Create a new NCR
 *
 * Request Body: CreateNCRInput
 * - title: string (5-200 chars)
 * - description: string (20-2000 chars)
 * - severity: 'minor' | 'major' | 'critical'
 * - detection_point: 'incoming' | 'in_process' | 'final' | etc.
 * - category: optional
 * - source_type: optional
 * - source_id: optional UUID
 * - source_description: optional string
 * - submit_immediately: boolean (default: false)
 *
 * Response:
 * - 201: { ncr: NCRReport }
 * - 400: { error: string, details?: ZodError[] }
 * - 401: { error: 'Unauthorized' }
 * - 500: { error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission - VIEWER cannot create NCRs
    if (auth.roleCode === 'viewer') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create NCRs' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createNCRSchema.parse(body)

    // Create NCR with org_id from authenticated user
    const ncr = await NCRService.create(validatedData, auth.userId, auth.orgId)

    return NextResponse.json({ ncr }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/quality/ncrs:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return handleError(error)
  }
}
