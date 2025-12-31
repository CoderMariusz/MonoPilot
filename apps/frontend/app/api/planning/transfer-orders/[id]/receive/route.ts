import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getTransferOrder, changeToStatus } from '@/lib/services/transfer-order-service'

/**
 * Transfer Order Receive API Route (Stub for Epic 05)
 * Story: 03.8 - Ship/Receive stubs
 *
 * POST /api/planning/transfer-orders/:id/receive
 *
 * MVP Stub - Full implementation in Epic 05 (Warehouse Module)
 *
 * Validation Rules:
 * - TO must be in 'shipped' status
 * - User must have ADMIN, WH_MANAGER, or WH_OPERATOR role
 */

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

    // Get the TO to check its current status
    const toResult = await getTransferOrder(id)

    if (!toResult.success || !toResult.data) {
      return NextResponse.json(
        { error: 'Transfer Order not found', code: 'TO_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Check if TO can be received
    const currentStatus = toResult.data.status
    if (currentStatus !== 'shipped') {
      return NextResponse.json(
        {
          error: 'TO must be in shipped status to receive',
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      )
    }

    // Call service method to change status to 'received'
    const result = await changeToStatus(id, 'received')

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Transfer Order not found', code: 'TO_NOT_FOUND' },
          { status: 404 }
        )
      }

      if (result.code === 'INVALID_STATUS') {
        return NextResponse.json(
          {
            error: result.error || 'Cannot receive this Transfer Order',
            code: 'INVALID_STATUS',
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to receive Transfer Order' },
        { status: 500 }
      )
    }

    // Get current date for actual_receive_date
    const actualReceiveDate = new Date().toISOString().split('T')[0]

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.data?.id,
          status: 'received',
          actual_receive_date: actualReceiveDate,
          received_by: {
            id: session.user.id,
            name: session.user.email,
          },
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/planning/transfer-orders/:id/receive:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
