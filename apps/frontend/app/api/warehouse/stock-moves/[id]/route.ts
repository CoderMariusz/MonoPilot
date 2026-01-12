/**
 * Stock Move Detail API Routes (Story 05.16)
 * GET /api/warehouse/stock-moves/:id - Get stock move details
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { StockMoveService } from '@/lib/services/stock-move-service'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(
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

    const move = await StockMoveService.getById(supabase, id)

    if (!move) {
      return NextResponse.json(
        { error: 'Stock move not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(move, { status: 200 })
  } catch (error: unknown) {
    const err = error as Error
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
