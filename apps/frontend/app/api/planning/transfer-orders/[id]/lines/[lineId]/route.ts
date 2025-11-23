import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  updateToLineSchema,
  type UpdateToLineInput,
} from '@/lib/validation/transfer-order-schemas'
import {
  updateToLine,
  deleteToLine,
} from '@/lib/services/transfer-order-service'
import { ZodError } from 'zod'

/**
 * Transfer Order Line Detail API Routes
 * Story: 3.7 - TO Line Management
 *
 * PUT /api/planning/transfer-orders/:id/lines/:lineId - Update TO line
 * DELETE /api/planning/transfer-orders/:id/lines/:lineId - Delete TO line
 */

// ============================================================================
// PUT /api/planning/transfer-orders/:id/lines/:lineId - Update TO Line
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
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

    const { lineId } = await params

    // Parse and validate request body
    const body = await request.json()
    const validatedData: UpdateToLineInput = updateToLineSchema.parse(body)

    // Call service method
    const result = await updateToLine(lineId, validatedData)

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'TO line not found' },
          { status: 404 }
        )
      }

      if (result.code === 'INVALID_STATUS') {
        return NextResponse.json(
          { error: result.error || 'Cannot update this TO line' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to update TO line' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        line: result.data,
        message: 'TO line updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PUT /api/planning/transfer-orders/:id/lines/:lineId:', error)

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
// DELETE /api/planning/transfer-orders/:id/lines/:lineId - Delete TO Line
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
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

    const { lineId } = await params

    // Call service method
    const result = await deleteToLine(lineId)

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'TO line not found' },
          { status: 404 }
        )
      }

      if (result.code === 'INVALID_STATUS') {
        return NextResponse.json(
          { error: result.error || 'Cannot delete this TO line' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to delete TO line' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'TO line deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/planning/transfer-orders/:id/lines/:lineId:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
