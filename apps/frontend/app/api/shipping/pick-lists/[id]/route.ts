/**
 * API Route: Pick List Detail
 * Story: 07.8 - Pick List Generation + Wave Picking
 *
 * GET /api/shipping/pick-lists/:id - Get pick list detail with lines
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/api/auth-helpers'
import { PickListService, PickListError } from '@/lib/services/pick-list-service'

/**
 * GET /api/shipping/pick-lists/:id
 * Get pick list detail with all lines
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { orgId } = authContext

    // Get pick list detail
    const result = await PickListService.getPickListDetail(supabase, orgId, id)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error in GET /api/shipping/pick-lists/:id:', error)

    if (error instanceof PickListError) {
      return NextResponse.json(
        { error: { code: error.code, message: error.message } },
        { status: error.status }
      )
    }

    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
