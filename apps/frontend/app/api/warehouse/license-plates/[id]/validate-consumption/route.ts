/**
 * Validate LP for Consumption API Route (Story 05.4)
 * POST /api/warehouse/license-plates/:id/validate-consumption
 *
 * Validate if an LP can be consumed in production
 *
 * Request Body: (empty - ID from URL)
 *
 * Response:
 * - valid: boolean
 * - error?: string (if invalid)
 * - current_status?: string
 * - current_qa_status?: string
 *
 * Business Rules (CRITICAL for Epic 04):
 * - LP status must be 'available' or 'reserved'
 * - QA status must be 'passed'
 * - Returns detailed validation result
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { LPStatusService } from '@/lib/services/lp-status-service'

export async function POST(
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

    // Validate LP for consumption (uses RLS internally)
    const result = await LPStatusService.validateLPForConsumption(lpId)

    // Return validation result
    return NextResponse.json({
      valid: result.valid,
      error: result.error,
      current_status: result.currentStatus,
      current_qa_status: result.currentQAStatus,
    })
  } catch (error) {
    console.error('Error in POST /api/warehouse/license-plates/:id/validate-consumption:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
