/**
 * Stock Moves API Routes - List and Create (Story 05.16)
 * GET /api/warehouse/stock-moves - List stock moves with filters
 * POST /api/warehouse/stock-moves - Create stock move
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { StockMoveService } from '@/lib/services/stock-move-service'
import { createStockMoveSchema, listStockMovesSchema } from '@/lib/validation/stock-move-schemas'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate query params
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      search: searchParams.get('search') || undefined,
      moveType: searchParams.get('moveType') || undefined,
      lpId: searchParams.get('lpId') || undefined,
      locationId: searchParams.get('locationId') || undefined,
      dateFrom: searchParams.get('dateFrom') || undefined,
      dateTo: searchParams.get('dateTo') || undefined,
      status: searchParams.get('status') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
    }

    // Validate query params
    const validated = listStockMovesSchema.parse(queryParams)

    const result = await StockMoveService.list(supabase, validated)

    return NextResponse.json(
      {
        data: result.data,
        meta: result.pagination,
      },
      { status: 200 }
    )
  } catch (error: unknown) {
    const err = error as Error & { name?: string; errors?: unknown[] }
    if (err.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: err.errors },
        { status: 400 }
      )
    }
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()

    // Validate input
    const validated = createStockMoveSchema.parse(body)

    // Create stock move
    const move = await StockMoveService.create(supabase, validated, user.id)

    return NextResponse.json(move, { status: 201 })
  } catch (error: unknown) {
    const err = error as Error & { name?: string; errors?: unknown[] }
    if (err.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: err.errors },
        { status: 400 }
      )
    }

    // Handle specific business errors
    if (err.message?.includes('not available for movement')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    if (err.message?.includes('exceeds available')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    if (err.message?.includes('location required')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    if (err.message?.includes('location not')) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    if (err.message?.includes('not found')) {
      return NextResponse.json({ error: err.message }, { status: 404 })
    }

    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
