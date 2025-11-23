import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  createRoutingSchema,
  routingFiltersSchema,
  type RoutingFilters,
} from '@/lib/validation/routing-schemas'
import {
  createRouting,
  listRoutings,
} from '@/lib/services/routing-service'
import { ZodError } from 'zod'

/**
 * Routing API Routes
 * Story: 2.15 Routing CRUD
 *
 * GET /api/technical/routings - List routings with filters
 * POST /api/technical/routings - Create new routing
 */

// ============================================================================
// GET /api/technical/routings - List Routings (AC-015.2)
// ============================================================================

export async function GET(request: NextRequest) {
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

    // Get current user to check role and org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Note: GET is allowed for all authenticated users (view routings)
    // Admin/Technical restriction only applies to POST/PUT/DELETE

    // Parse query parameters for filtering and sorting (AC-015.3)
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sort_by')
    const sortDirection = searchParams.get('sort_direction')

    // Validate filters
    const filters: RoutingFilters = routingFiltersSchema.parse({
      status: status || undefined,
      search: search || undefined,
      sort_by: sortBy || undefined,
      sort_direction: sortDirection || undefined,
    })

    // Call service method
    const result = await listRoutings(filters)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch routings' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        routings: result.data || [],
        total: result.total || 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/technical/routings:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/technical/routings - Create Routing (AC-015.1)
// ============================================================================

export async function POST(request: NextRequest) {
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

    // Get current user to check role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check authorization: Admin or Technical only (AC-015.5)
    if (!['admin', 'technical'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Technical role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createRoutingSchema.parse(body)

    // Call service method
    const result = await createRouting(validatedData)

    if (!result.success) {
      // Handle specific error codes
      if (result.code === 'DUPLICATE_CODE') {
        return NextResponse.json(
          { error: result.error || 'Routing code already exists' },
          { status: 409 }
        )
      }

      if (result.code === 'INVALID_INPUT') {
        return NextResponse.json(
          { error: result.error || 'Invalid input' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to create routing' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        routing: result.data,
        message: 'Routing created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/technical/routings:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
