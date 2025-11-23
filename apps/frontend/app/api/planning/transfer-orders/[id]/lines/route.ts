import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  createToLineSchema,
  type CreateToLineInput,
} from '@/lib/validation/transfer-order-schemas'
import {
  getToLines,
  createToLine,
} from '@/lib/services/transfer-order-service'
import { ZodError } from 'zod'

/**
 * Transfer Order Lines API Routes
 * Story: 3.7 - TO Line Management
 *
 * GET /api/planning/transfer-orders/:id/lines - List TO lines
 * POST /api/planning/transfer-orders/:id/lines - Create TO line
 */

// ============================================================================
// GET /api/planning/transfer-orders/:id/lines - List TO Lines
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
    const result = await getToLines(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch TO lines' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        lines: result.data || [],
        total: result.total || 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/planning/transfer-orders/:id/lines:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/planning/transfer-orders/:id/lines - Create TO Line
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
    const validatedData: CreateToLineInput = createToLineSchema.parse(body)

    // Call service method
    const result = await createToLine(id, validatedData)

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: result.error || 'Transfer Order or Product not found' },
          { status: 404 }
        )
      }

      if (result.code === 'INVALID_STATUS') {
        return NextResponse.json(
          { error: result.error || 'Cannot add lines to this Transfer Order' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to create TO line' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        line: result.data,
        message: 'TO line created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/planning/transfer-orders/:id/lines:', error)

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
