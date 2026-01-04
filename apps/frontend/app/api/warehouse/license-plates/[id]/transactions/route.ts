/**
 * License Plate Transactions API Route (Story 05.6)
 * GET /api/warehouse/license-plates/:id/transactions
 *
 * Get transaction history for an LP
 *
 * Query Parameters:
 * - page: number (default: 1)
 * - limit: number (default: 50, max: 100)
 *
 * Returns paginated list of LP transactions
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getLPTransactions } from '@/lib/services/license-plate-detail-service'
import { z } from 'zod'

const querySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: lpId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = querySchema.parse({
      page: searchParams.get('page') || '1',
      limit: searchParams.get('limit') || '50',
    })

    // Get LP transactions using service
    const result = await getLPTransactions(supabase, lpId, queryParams)

    return NextResponse.json({
      data: result.data,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        total_pages: Math.ceil(result.total / result.limit),
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors[0].message },
        { status: 400 }
      )
    }

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: 'License Plate not found', code: 'LP_NOT_FOUND' },
        { status: 404 }
      )
    }

    console.error('Error in GET /api/warehouse/license-plates/:id/transactions:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
