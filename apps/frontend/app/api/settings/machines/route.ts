import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  createMachineSchema,
  machineFiltersSchema,
  type MachineFilters,
} from '@/lib/validation/machine-schemas'
import {
  createMachine,
  listMachines,
} from '@/lib/services/machine-service'
import { ZodError } from 'zod'

/**
 * Machine API Routes
 * Story: 1.7 Machine Configuration
 * Task 4: API Endpoints
 *
 * GET /api/settings/machines - List machines with filters
 * POST /api/settings/machines - Create new machine
 */

// ============================================================================
// GET /api/settings/machines - List Machines (AC-006.4)
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

    // Note: GET is allowed for all authenticated users (view machines)
    // Admin restriction only applies to POST/PUT/DELETE

    // Parse query parameters for filtering and sorting (AC-006.4)
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sort_by')
    const sortDirection = searchParams.get('sort_direction')

    // Validate filters
    const filters: MachineFilters = machineFiltersSchema.parse({
      status: status || undefined,
      search: search || undefined,
      sort_by: sortBy || undefined,
      sort_direction: sortDirection || undefined,
    })

    // Call service method
    const result = await listMachines(filters)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch machines' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        machines: result.data || [],
        total: result.total || 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/settings/machines:', error)

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
// POST /api/settings/machines - Create Machine (AC-006.1)
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

    // Check authorization: Admin only (AC-006.1)
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createMachineSchema.parse(body)

    // Call service method
    const result = await createMachine(validatedData)

    if (!result.success) {
      // Handle specific error codes
      if (result.code === 'DUPLICATE_CODE') {
        return NextResponse.json(
          { error: result.error || 'Machine code already exists' },
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
        { error: result.error || 'Failed to create machine' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        machine: result.data,
        message: 'Machine created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/settings/machines:', error)

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
