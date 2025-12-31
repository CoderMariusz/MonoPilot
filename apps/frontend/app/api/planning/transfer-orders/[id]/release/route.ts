import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { changeToStatus } from '@/lib/services/transfer-order-service'

/**
 * Transfer Order Release API Route
 * Story: 03.8 - AC-09: Release TO (draft -> planned)
 *
 * POST /api/planning/transfer-orders/:id/release
 *
 * Validation Rules:
 * - TO must be in 'draft' status
 * - TO must have at least one line
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

    // Call service method to change status to 'planned'
    const result = await changeToStatus(id, 'planned')

    if (!result.success) {
      // Handle specific error codes
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'Transfer Order not found', code: 'TO_NOT_FOUND' },
          { status: 404 }
        )
      }

      if (result.code === 'INVALID_STATUS') {
        // Check for specific error messages
        if (result.error?.includes('without lines')) {
          return NextResponse.json(
            {
              error: 'Cannot release TO with no lines. Add at least one line.',
              code: 'NO_LINES',
            },
            { status: 400 }
          )
        }

        return NextResponse.json(
          {
            error: result.error || 'TO must be in draft status to release',
            code: 'INVALID_STATUS',
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to release Transfer Order' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          id: result.data?.id,
          status: 'planned',
          message: 'Transfer Order released successfully',
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in POST /api/planning/transfer-orders/:id/release:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
