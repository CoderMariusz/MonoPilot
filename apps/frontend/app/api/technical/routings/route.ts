import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  createRoutingSchema,
  routingFiltersSchema,
} from '@/lib/validation/routing-schemas'
import {
  createRouting,
  listRoutings,
} from '@/lib/services/routing-service'
import { ZodError } from 'zod'

/**
 * Routing API Routes - Story 2.24
 *
 * GET /api/technical/routings - List routings with filters
 * POST /api/technical/routings - Create new routing
 */

// ============================================================================
// GET /api/technical/routings - List Routings (AC-2.24.5)
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

    // Parse query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const isActive = searchParams.get('is_active')

    // Validate filters
    const filters = routingFiltersSchema.parse({
      is_active: isActive || undefined,
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
// POST /api/technical/routings - Create Routing (AC-2.24.5)
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

    // Get current user and their role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Get role code separately to avoid join issues
    let userRole = 'user' // default role
    if (currentUser.role_id) {
      const { data: roleData } = await supabase
        .from('roles')
        .select('code')
        .eq('id', currentUser.role_id)
        .single()

      if (roleData) {
        userRole = roleData.code
      }
    }

    // Check authorization: Admin or Technical only
    if (!['admin', 'technical'].includes(userRole)) {
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
      if (result.code === 'DUPLICATE_NAME') {
        return NextResponse.json(
          { error: result.error || 'Routing name already exists' },
          { status: 400 }
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
