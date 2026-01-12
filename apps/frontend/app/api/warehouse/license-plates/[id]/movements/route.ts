/**
 * LP Movement History API Route (Story 05.16)
 * GET /api/warehouse/license-plates/:id/movements - Get movement history for an LP
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
    const { id: lpId } = await context.params

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse limit from query params
    const searchParams = request.nextUrl.searchParams
    const limitParam = searchParams.get('limit')
    const limit = limitParam ? Math.min(parseInt(limitParam, 10), 200) : 50

    // Get movement history
    const movements = await StockMoveService.getLPMovementHistory(supabase, lpId, limit)

    return NextResponse.json(
      { data: movements },
      { status: 200 }
    )
  } catch (error: unknown) {
    const err = error as Error
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
