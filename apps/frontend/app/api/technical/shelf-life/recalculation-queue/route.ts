/**
 * API Route: Recalculation Queue
 * Story: 02.11 - Shelf Life Calculation + Expiry Management
 *
 * Endpoints:
 * - GET /api/technical/shelf-life/recalculation-queue - Get products needing recalculation
 */

import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getRecalculationQueue } from '@/lib/services/shelf-life-service'

/**
 * GET /api/technical/shelf-life/recalculation-queue
 * Get products needing shelf life recalculation
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get recalculation queue
    const queue = await getRecalculationQueue()

    return NextResponse.json(queue)
  } catch (error) {
    console.error('Error getting recalculation queue:', error)

    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Internal server error' },
      { status: 500 }
    )
  }
}
