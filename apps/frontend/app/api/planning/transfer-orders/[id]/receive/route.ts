import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { ZodError } from 'zod'
import {
  receiveTORequestSchema,
  type ReceiveTOInput,
} from '@/lib/validation/transfer-order-schemas'
import { receiveTransferOrder } from '@/lib/services/transfer-order-service'

/**
 * Transfer Order Receive API Route
 * Story: 03.9a - TO Partial Shipments (Basic)
 *
 * POST /api/planning/transfer-orders/:id/receive - Receive transfer order (partial or full)
 *
 * Supports partial receipts:
 * - receive_qty accumulates (does not replace)
 * - actual_receive_date set on FIRST receipt only (immutable)
 * - received_by set on FIRST receipt only (immutable)
 * - Status transitions: shipped/partially_shipped -> partially_received/received
 */

// ============================================================================
// POST /api/planning/transfer-orders/:id/receive - Receive Transfer Order
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
    const validatedData: ReceiveTOInput = receiveTORequestSchema.parse(body)

    // Call service method
    const result = await receiveTransferOrder(id, validatedData, session.user.id)

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: result.error || 'Transfer Order or TO line not found' },
          { status: 404 }
        )
      }

      if (result.code === 'INVALID_STATUS') {
        return NextResponse.json(
          { error: result.error || 'Cannot receive this Transfer Order' },
          { status: 400 }
        )
      }

      if (result.code === 'INVALID_QUANTITY') {
        return NextResponse.json(
          { error: result.error || 'Invalid receive quantity' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to receive transfer order' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        transfer_order: result.data,
        message: `Transfer Order ${result.data?.to_number} received successfully`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/planning/transfer-orders/:id/receive:', error)

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
