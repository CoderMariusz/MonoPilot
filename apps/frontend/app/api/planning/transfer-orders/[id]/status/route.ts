import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  changeToStatusSchema,
  type ChangeToStatusInput,
} from '@/lib/validation/transfer-order-schemas'
import { changeToStatus } from '@/lib/services/transfer-order-service'
import { ZodError } from 'zod'

/**
 * Transfer Order Status Change API Route
 * Story: 3.6 - AC-3.6.7: Change TO Status to 'Planned'
 *
 * PUT /api/planning/transfer-orders/:id/status - Change TO status
 *
 * Allowed status transitions:
 * - draft → planned (requires at least 1 line)
 * - any → cancelled
 * - planned → shipped (via Story 3.8 ship endpoint)
 * - shipped → received (via Story 3.8 receive endpoint)
 */

// ============================================================================
// PUT /api/planning/transfer-orders/:id/status - Change TO Status
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
    const validatedData: ChangeToStatusInput = changeToStatusSchema.parse(body)

    // Call service method
    const result = await changeToStatus(id, validatedData.status)

    if (!result.success) {
      // Handle specific error codes
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: result.error || 'Transfer Order not found' },
          { status: 404 }
        )
      }

      if (result.code === 'INVALID_STATUS') {
        return NextResponse.json(
          { error: result.error },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to change Transfer Order status' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        transfer_order: result.data,
        message: `Transfer Order status changed to ${validatedData.status}`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PUT /api/planning/transfer-orders/:id/status:', error)

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
