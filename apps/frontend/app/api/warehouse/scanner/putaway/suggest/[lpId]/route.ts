/**
 * Scanner Putaway Suggest API Route (Story 05.21)
 * GET /api/warehouse/scanner/putaway/suggest/[lpId] - Get optimal location suggestion
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { ScannerPutawayService } from '@/lib/services/scanner-putaway-service'

export async function GET(
  request: Request,
  props: { params: Promise<{ lpId: string }> | { lpId: string } }
) {
  try {
    // Handle both Promise and direct params (for testing compatibility)
    const resolvedParams = await Promise.resolve(props.params)
    const params = resolvedParams as { lpId: string }
    const supabase = await createClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { lpId } = params

    // Validate LP ID is provided
    if (!lpId || lpId.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid LP ID format' },
        { status: 400 }
      )
    }

    // Check if LP exists (RLS will filter by org)
    const { data: lp, error: lpError } = await supabase
      .from('license_plates')
      .select('id, status')
      .eq('id', lpId)
      .single()

    if (lpError || !lp) {
      return NextResponse.json(
        { error: 'LP not found' },
        { status: 404 }
      )
    }

    // Get suggestion
    const suggestion = await ScannerPutawayService.suggestLocation(supabase, lpId)

    return NextResponse.json({
      suggested_location: suggestion.suggestedLocation,
      reason: suggestion.reason,
      reason_code: suggestion.reasonCode,
      alternatives: suggestion.alternatives,
      strategy_used: suggestion.strategyUsed,
      lp_details: suggestion.lpDetails,
    })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('LP not found')) {
      return NextResponse.json({ error: 'LP not found' }, { status: 404 })
    }

    if (errorMessage.includes('not available')) {
      return NextResponse.json({ error: errorMessage }, { status: 400 })
    }

    console.error('Scanner putaway suggest error:', error)
    return NextResponse.json(
      { error: 'Failed to get putaway suggestion' },
      { status: 500 }
    )
  }
}
