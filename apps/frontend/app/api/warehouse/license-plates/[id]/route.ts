/**
 * License Plate Detail API Route
 * Story 05.6: LP Detail View with joined relationships
 *
 * Endpoints:
 * - GET /api/warehouse/license-plates/:id - Get LP detail with joins
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getLPDetail, getLPTransactions } from '@/lib/services/license-plate-detail-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action?: string }> }
) {
  try {
    const { id, action } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Handle transaction history endpoint
    if (action === 'transactions') {
      const url = new URL(request.url)
      const page = parseInt(url.searchParams.get('page') || '1')
      const limit = parseInt(url.searchParams.get('limit') || '10')

      const result = await getLPTransactions(supabase, id, { page, limit })
      return NextResponse.json(result)
    }

    // Get LP detail with joined relationships
    const lp = await getLPDetail(supabase, id)

    if (!lp) {
      return NextResponse.json(
        { error: 'License Plate not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(lp)
  } catch (error) {
    console.error('Error in GET /api/warehouse/license-plates/:id:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; action?: string }> }
) {
  try {
    const { id, action } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Block/unblock actions are handled by dedicated routes:
    // PUT /api/warehouse/license-plates/:id/block
    // PUT /api/warehouse/license-plates/:id/unblock

    // Default PUT (not implemented)
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in PUT /api/warehouse/license-plates/:id:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
