/**
 * API Route: My Picks
 * Story: 07.8 - Pick List Generation + Wave Picking
 *
 * GET /api/shipping/pick-lists/my-picks - Get current user's assigned pick lists
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { getAuthContext } from '@/lib/api/auth-helpers'
import { PickListService, PickListError } from '@/lib/services/pick-list-service'

/**
 * GET /api/shipping/pick-lists/my-picks
 * Get pick lists assigned to current user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { userId, orgId } = authContext

    // Get my picks
    const pickLists = await PickListService.getMyPicks(supabase, orgId, userId)

    return NextResponse.json({ pick_lists: pickLists })
  } catch (error) {
    console.error('Error in GET /api/shipping/pick-lists/my-picks:', error)

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
