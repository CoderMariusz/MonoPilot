import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  createTransferOrderSchema,
  transferOrderFiltersSchema,
  type CreateTransferOrderInput,
  type TransferOrderFilters,
} from '@/lib/validation/transfer-order-schemas'
import {
  createTransferOrder,
  listTransferOrders,
} from '@/lib/services/transfer-order-service'
import { ZodError } from 'zod'

/**
 * Transfer Order API Routes
 * Story: 3.6 - Transfer Order CRUD
 *
 * GET /api/planning/transfer-orders - List transfer orders with filters
 * POST /api/planning/transfer-orders - Create new transfer order
 */

// ============================================================================
// GET /api/planning/transfer-orders - List Transfer Orders
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
    const fromWarehouseId = searchParams.get('from_warehouse_id')
    const toWarehouseId = searchParams.get('to_warehouse_id')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const sortBy = searchParams.get('sort_by')
    const sortDirection = searchParams.get('sort_direction')

    // Validate filters
    const filters: TransferOrderFilters = transferOrderFiltersSchema.parse({
      search: search || undefined,
      status: status || undefined,
      from_warehouse_id: fromWarehouseId || undefined,
      to_warehouse_id: toWarehouseId || undefined,
      date_from: dateFrom ? new Date(dateFrom) : undefined,
      date_to: dateTo ? new Date(dateTo) : undefined,
      sort_by: sortBy || undefined,
      sort_direction: sortDirection || undefined,
    })

    // Call service method
    const result = await listTransferOrders(filters)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch transfer orders' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        transfer_orders: result.data || [],
        total: result.total || 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/planning/transfer-orders:', error)

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
// POST /api/planning/transfer-orders - Create Transfer Order
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
    const validatedData: CreateTransferOrderInput =
      createTransferOrderSchema.parse(body)

    // Call service method
    const result = await createTransferOrder(validatedData)

    if (!result.success) {
      // Handle specific error codes
      if (result.code === 'DUPLICATE_TO_NUMBER') {
        return NextResponse.json(
          { error: result.error || 'Transfer Order number already exists' },
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
        { error: result.error || 'Failed to create transfer order' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        transfer_order: result.data,
        message: 'Transfer Order created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/planning/transfer-orders:', error)

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
