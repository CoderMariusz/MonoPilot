import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  updateWorkOrderSchema,
  type UpdateWorkOrderInput,
} from '@/lib/validation/work-order-schemas'
import {
  getWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
} from '@/lib/services/work-order-service'
import { ZodError } from 'zod'

/**
 * Work Order Detail API Routes
 * Story: 3.10 - Work Order CRUD
 *
 * GET /api/planning/work-orders/[id] - Get single work order
 * PUT /api/planning/work-orders/[id] - Update work order
 * DELETE /api/planning/work-orders/[id] - Delete work order
 */

// ============================================================================
// GET /api/planning/work-orders/[id] - Get Work Order
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await getWorkOrder(id)

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: result.error || 'Work Order not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to fetch work order' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        work_order: result.data,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/planning/work-orders/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT /api/planning/work-orders/[id] - Update Work Order
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
    const validatedData: UpdateWorkOrderInput =
      updateWorkOrderSchema.parse(body)

    const result = await updateWorkOrder(id, validatedData)

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: result.error || 'Work Order not found' },
          { status: 404 }
        )
      }

      if (result.code === 'INVALID_INPUT') {
        return NextResponse.json(
          { error: result.error || 'Invalid input' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to update work order' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        work_order: result.data,
        message: 'Work Order updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PUT /api/planning/work-orders/[id]:', error)

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

// ============================================================================
// DELETE /api/planning/work-orders/[id] - Delete Work Order
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await deleteWorkOrder(id)

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: result.error || 'Work Order not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to delete work order' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Work Order deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/planning/work-orders/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
