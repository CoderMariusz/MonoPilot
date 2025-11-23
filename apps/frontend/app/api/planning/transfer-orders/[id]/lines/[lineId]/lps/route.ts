import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  selectLpsSchema,
  type SelectLpsInput,
} from '@/lib/validation/transfer-order-schemas'
import {
  getToLineLps,
  selectLpsForToLine,
} from '@/lib/services/transfer-order-service'
import { ZodError } from 'zod'

/**
 * TO Line LP Selection API Routes
 * Story: 3.9 - LP Selection for TO
 *
 * GET /api/planning/transfer-orders/:id/lines/:lineId/lps - List LP selections
 * POST /api/planning/transfer-orders/:id/lines/:lineId/lps - Select LPs for TO line
 */

// ============================================================================
// GET /api/planning/transfer-orders/:id/lines/:lineId/lps - List LP Selections
// ============================================================================

export async function GET(
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
    const result = await getToLineLps(lineId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch LP selections' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        lp_selections: result.data || [],
        total: result.total || 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/planning/transfer-orders/:id/lines/:lineId/lps:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/planning/transfer-orders/:id/lines/:lineId/lps - Select LPs
// ============================================================================

export async function POST(
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
    const validatedData: SelectLpsInput = selectLpsSchema.parse(body)

    // Call service method
    const result = await selectLpsForToLine(lineId, validatedData)

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: result.error || 'TO line not found' },
          { status: 404 }
        )
      }

      if (result.code === 'INVALID_STATUS') {
        return NextResponse.json(
          { error: result.error || 'Cannot select LPs for this Transfer Order' },
          { status: 400 }
        )
      }

      if (result.code === 'INVALID_QUANTITY') {
        return NextResponse.json(
          { error: result.error || 'Invalid reserved quantity' },
          { status: 400 }
        )
      }

      if (result.code === 'INVALID_INPUT') {
        return NextResponse.json(
          { error: result.error || 'Invalid input data' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to select LPs' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        lp_selections: result.data,
        message: 'LPs selected successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/planning/transfer-orders/:id/lines/:lineId/lps:', error)

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
