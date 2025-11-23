import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  shipToSchema,
  type ShipToInput,
} from '@/lib/validation/transfer-order-schemas'
import {
  shipTransferOrder,
} from '@/lib/services/transfer-order-service'
import { ZodError } from 'zod'

/**
 * Transfer Order Shipment API Route
 * Story: 3.8 - Partial Shipments
 *
 * POST /api/planning/transfer-orders/:id/ship - Ship transfer order (partial or full)
 */

// ============================================================================
// POST /api/planning/transfer-orders/:id/ship - Ship Transfer Order
// ============================================================================

export async function POST(
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
    const validatedData: ShipToInput = shipToSchema.parse(body)

    // Call service method
    const result = await shipTransferOrder(id, validatedData)

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: result.error || 'Transfer Order or TO line not found' },
          { status: 404 }
        )
      }

      if (result.code === 'INVALID_STATUS') {
        return NextResponse.json(
          { error: result.error || 'Cannot ship this Transfer Order' },
          { status: 400 }
        )
      }

      if (result.code === 'INVALID_QUANTITY') {
        return NextResponse.json(
          { error: result.error || 'Invalid ship quantity' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to ship transfer order' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        transfer_order: result.data,
        message: 'Transfer Order shipped successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/planning/transfer-orders/:id/ship:', error)

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
