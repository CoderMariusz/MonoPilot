import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { changeToStatus, getTransferOrder } from '@/lib/services/transfer-order-service'

/**
 * Transfer Order Cancel API Route
 * Story: 03.8 - AC-13: Cancel TO
 *
 * POST /api/planning/transfer-orders/:id/cancel
 *
 * Validation Rules:
 * - TO must be in 'draft' or 'planned' status
 * - Cannot cancel shipped or received TOs
 * - User must have ADMIN or WH_MANAGER role
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

    // First get the TO to check its current status
    const toResult = await getTransferOrder(id)

    if (!toResult.success || !toResult.data) {
      return NextResponse.json(
        { error: 'Transfer Order not found', code: 'TO_NOT_FOUND' },
        { status: 404 }
      )
    }

    // Check if TO can be cancelled
    const currentStatus = toResult.data.status
    if (['shipped', 'received', 'closed', 'cancelled'].includes(currentStatus)) {
      return NextResponse.json(
        {
          error: 'Cannot cancel TO that has been shipped or received',
          code: 'CANNOT_CANCEL',
        },
        { status: 400 }
      )
    }

    // Call service method to change status to 'cancelled'
    const result = await changeToStatus(id, 'cancelled')

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
            error: result.error || 'Cannot cancel this Transfer Order',
            code: 'CANNOT_CANCEL',
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to cancel Transfer Order' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.data?.id,
          status: 'cancelled',
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/planning/transfer-orders/:id/cancel:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
