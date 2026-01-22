/**
 * Quality Holds API Routes
 * Story: 06.2 - Quality Holds CRUD
 * Phase: P3 - Backend Implementation (GREEN)
 *
 * Routes:
 * - GET /api/quality/holds - List holds with filters
 * - POST /api/quality/holds - Create hold with items
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.2.quality-holds-crud.md}
 */

import { NextRequest, NextResponse } from 'next/server'
import { createHoldSchema, holdListFiltersSchema } from '@/lib/validation/quality-hold-validation'
import { ZodError } from 'zod'
import * as QualityHoldService from '@/lib/services/quality-hold-service'
import { getAuthenticatedOrgId, getAuthenticatedUser, handleError } from '@/lib/utils/api-helpers'

/**
 * GET /api/quality/holds
 * Get paginated list of holds with filters
 *
 * Query Parameters:
 * - status: Filter by status (comma-separated: active,released,disposed)
 * - priority: Filter by priority (comma-separated: low,medium,high,critical)
 * - hold_type: Filter by type (comma-separated: qa_pending,investigation,recall,quarantine)
 * - from: Filter by held_at >= from date
 * - to: Filter by held_at <= to date
 * - search: Search in hold_number or reason
 * - limit: Page size (default 20, max 100)
 * - offset: Offset for pagination (default 0)
 * - sort: Sort field and direction (e.g., "held_at DESC")
 *
 * Response:
 * - 200: { holds: QualityHoldSummary[], pagination: {...}, filters_applied: {...} }
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
      status: searchParams.get('status')?.split(',').filter(Boolean) || undefined,
      priority: searchParams.get('priority')?.split(',').filter(Boolean) || undefined,
      hold_type: searchParams.get('hold_type')?.split(',').filter(Boolean) || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      search: searchParams.get('search') || undefined,
      limit: parseInt(searchParams.get('limit') || '20', 10),
      offset: parseInt(searchParams.get('offset') || '0', 10),
      sort: searchParams.get('sort') || undefined,
    }

    // Validate filters
    const validatedFilters = holdListFiltersSchema.parse(filters)

    // Get holds list
    const result = await QualityHoldService.getHoldsList(auth.orgId, validatedFilters)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/quality/holds:', error)

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
 * POST /api/quality/holds
 * Create a new hold with items
 *
 * Request Body: CreateHoldInput
 * - reason: string (10-500 chars)
 * - hold_type: 'qa_pending' | 'investigation' | 'recall' | 'quarantine'
 * - priority: 'low' | 'medium' | 'high' | 'critical' (default: medium)
 * - items: Array<{ reference_type, reference_id, quantity_held?, uom?, notes? }>
 *
 * Response:
 * - 201: { hold: QualityHold, items: QualityHoldItem[], lp_updates?: [...] }
 * - 400: { error: string, details?: ZodError[] }
 * - 401: { error: 'Unauthorized' }
 * - 403: { error: 'Forbidden' }
 * - 404: { error: string }
 * - 500: { error: string }
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permission - VIEWER cannot create holds
    if (auth.roleCode === 'viewer') {
      return NextResponse.json(
        { error: 'Insufficient permissions to create quality holds' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createHoldSchema.parse(body)

    // Create hold
    const result = await QualityHoldService.createHold(validatedData, auth.orgId, auth.userId)

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/quality/holds:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return handleError(error)
  }
}
