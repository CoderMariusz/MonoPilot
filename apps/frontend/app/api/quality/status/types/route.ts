/**
 * Quality Status Types API Route
 * Story: 06.1 - Quality Status Types
 *
 * Route:
 * - GET /api/quality/status/types - Get all 7 quality status types
 *
 * @see {@link docs/2-MANAGEMENT/epics/current/06-quality/06.1.quality-status-types.md}
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { QualityStatusService } from '@/lib/services/quality-status-service'

/**
 * GET /api/quality/status/types
 * Get all available quality status types
 *
 * Response:
 * - 200: { types: QualityStatusType[] }
 * - 401: { error: 'Unauthorized' }
 * - 500: { error: string }
 *
 * Performance: <200ms
 */
export async function GET(request: NextRequest) {
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

    // Get all status types (static config, very fast)
    const types = await QualityStatusService.getStatusTypes()

    return NextResponse.json({ types })
  } catch (error) {
    console.error('Error in GET /api/quality/status/types:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/quality/status/types
 * Phase 1B+ Feature: Create custom status type
 *
 * Response:
 * - 501: { error: 'Not Implemented', message: string }
 */
export async function POST(request: NextRequest) {
  return NextResponse.json(
    {
      error: 'Not Implemented',
      message: 'Custom status types available in Phase 1B',
    },
    { status: 501 }
  )
}
