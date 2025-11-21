import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  createWarehouseSchema,
  warehouseFiltersSchema,
  type CreateWarehouseInput,
  type WarehouseFilters,
} from '@/packages/shared/schemas'
import {
  createWarehouse,
  listWarehouses,
} from '@/lib/services/warehouse-service'
import { ZodError } from 'zod'

/**
 * Warehouse API Routes
 * Story: 1.5 Warehouse Configuration
 * Task 4: API Endpoints
 *
 * GET /api/settings/warehouses - List warehouses with filters
 * POST /api/settings/warehouses - Create new warehouse
 */

// ============================================================================
// GET /api/settings/warehouses - List Warehouses (AC-004.3)
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

    // Check authorization: Admin only (AC-004.1)
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Parse query parameters for filtering (AC-004.3)
    const searchParams = request.nextUrl.searchParams
    const isActive = searchParams.get('is_active')
    const search = searchParams.get('search')

    // Validate filters
    const filters: WarehouseFilters = warehouseFiltersSchema.parse({
      is_active: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search: search || undefined,
    })

    // Call service method
    const result = await listWarehouses(filters)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch warehouses' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        warehouses: result.data || [],
        total: result.total || 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/settings/warehouses:', error)

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
// POST /api/settings/warehouses - Create Warehouse (AC-004.1)
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

    // Check authorization: Admin only (AC-004.1)
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData: CreateWarehouseInput = createWarehouseSchema.parse(body)

    // Call service method
    const result = await createWarehouse(validatedData)

    if (!result.success) {
      // Handle specific error codes
      if (result.code === 'DUPLICATE_CODE') {
        return NextResponse.json(
          { error: result.error || 'Warehouse code already exists' },
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
        { error: result.error || 'Failed to create warehouse' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        warehouse: result.data,
        message: 'Warehouse created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/settings/warehouses:', error)

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
