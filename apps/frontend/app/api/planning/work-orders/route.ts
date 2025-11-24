import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  createWorkOrderSchema,
  workOrderFiltersSchema,
  type CreateWorkOrderInput,
  type WorkOrderFilters,
} from '@/lib/validation/work-order-schemas'
import {
  createWorkOrder,
  listWorkOrders,
} from '@/lib/services/work-order-service'
import { ZodError } from 'zod'

/**
 * Work Order API Routes
 * Story: 3.10 - Work Order CRUD
 *
 * GET /api/planning/work-orders - List work orders with filters
 * POST /api/planning/work-orders - Create new work order
 */

// ============================================================================
// GET /api/planning/work-orders - List Work Orders
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get('search')
    const status = searchParams.get('status')
    const productId = searchParams.get('product_id')
    const productionLineId = searchParams.get('production_line_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const sortBy = searchParams.get('sort_by')
    const sortDirection = searchParams.get('sort_direction')

    // Validate filters
    const filters: WorkOrderFilters = workOrderFiltersSchema.parse({
      search: search || undefined,
      status: status || undefined,
      product_id: productId || undefined,
      production_line_id: productionLineId || undefined,
      date_from: dateFrom ? new Date(dateFrom) : undefined,
      date_to: dateTo ? new Date(dateTo) : undefined,
      sort_by: sortBy || undefined,
      sort_direction: sortDirection || undefined,
    })

    // Call service method
    const result = await listWorkOrders(filters)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch work orders' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        work_orders: result.data || [],
        total: result.total || 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/planning/work-orders:', error)

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
// POST /api/planning/work-orders - Create Work Order
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

    // Parse and validate request body
    const body = await request.json()
    const validatedData: CreateWorkOrderInput =
      createWorkOrderSchema.parse(body)

    // Call service method
    const result = await createWorkOrder(validatedData)

    if (!result.success) {
      // Handle specific error codes
      if (result.code === 'DUPLICATE_WO_NUMBER') {
        return NextResponse.json(
          { error: result.error || 'Work Order number already exists' },
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
        { error: result.error || 'Failed to create work order' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        work_order: result.data,
        message: 'Work Order created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/planning/work-orders:', error)

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
