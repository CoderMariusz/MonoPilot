/**
 * Stock Move Cancel API Route (Story 05.16)
 * POST /api/warehouse/stock-moves/:id/cancel - Cancel a stock move
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { StockMoveService } from '@/lib/services/stock-move-service'
import { cancelStockMoveSchema } from '@/lib/validation/stock-move-schemas'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const supabase = await createServerSupabase()
    const { id } = await context.params

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validated = cancelStockMoveSchema.parse(body)

    // Cancel stock move
    const move = await StockMoveService.cancel(supabase, id, validated, user.id)

    return NextResponse.json(move, { status: 200 })
  } catch (error: unknown) {
    const err = error as Error & { name?: string; errors?: unknown[] }

    if (err.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: err.errors },
        { status: 400 }
      )
    }

    // Handle specific business errors
    if (err.message?.includes('not found')) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }
    if (err.message?.includes('already cancelled')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    if (err.message?.includes('older than 24 hours')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }

    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
