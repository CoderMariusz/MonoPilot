import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  updateTransferOrderSchema,
  type UpdateTransferOrderInput,
} from '@/lib/validation/transfer-order-schemas'
import {
  getTransferOrder,
  updateTransferOrder,
  deleteTransferOrder,
} from '@/lib/services/transfer-order-service'
import { ZodError } from 'zod'

/**
 * Transfer Order Detail API Routes
 * Story: 3.6 - Transfer Order CRUD
 *
 * GET /api/planning/transfer-orders/:id - Get single transfer order
 * PUT /api/planning/transfer-orders/:id - Update transfer order
 * DELETE /api/planning/transfer-orders/:id - Delete transfer order
 */

// ============================================================================
// GET /api/planning/transfer-orders/:id - Get Transfer Order
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Call service method
    const result = await getTransferOrder(id)

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Transfer Order not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to fetch transfer order' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        transfer_order: result.data,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/planning/transfer-orders/:id:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PUT /api/planning/transfer-orders/:id - Update Transfer Order
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Parse and validate request body
    const body = await request.json()
    const validatedData: UpdateTransferOrderInput =
      updateTransferOrderSchema.parse(body)

    // Call service method
    const result = await updateTransferOrder(id, validatedData)

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Transfer Order not found' },
          { status: 404 }
        )
      }

      if (result.code === 'INVALID_STATUS') {
        return NextResponse.json(
          { error: result.error || 'Invalid status for update' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to update transfer order' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        transfer_order: result.data,
        message: 'Transfer Order updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PUT /api/planning/transfer-orders/:id:', error)

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
// DELETE /api/planning/transfer-orders/:id - Delete Transfer Order
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

    const { id } = await params

    // Call service method
    const result = await deleteTransferOrder(id)

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Transfer Order not found' },
          { status: 404 }
        )
      }

      if (result.code === 'INVALID_STATUS') {
        return NextResponse.json(
          { error: result.error || 'Cannot delete this Transfer Order' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to delete transfer order' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'Transfer Order deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/planning/transfer-orders/:id:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
