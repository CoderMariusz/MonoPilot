import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  deleteToLineLp,
} from '@/lib/services/transfer-order-service'

/**
 * TO Line LP Selection Detail API Route
 * Story: 3.9 - LP Selection for TO
 *
 * DELETE /api/planning/transfer-orders/:id/lines/:lineId/lps/:lpId - Delete LP selection
 */

// ============================================================================
// DELETE /api/planning/transfer-orders/:id/lines/:lineId/lps/:lpId - Delete LP Selection
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string; lpId: string }> }
) {
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

    const { lpId } = await params

    // Call service method
    const result = await deleteToLineLp(lpId)

    if (!result.success) {
      if (result.code === 'NOT_FOUND') {
        return NextResponse.json(
          { error: 'LP selection not found' },
          { status: 404 }
        )
      }

      if (result.code === 'INVALID_STATUS') {
        return NextResponse.json(
          { error: result.error || 'Cannot delete LP selection' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: result.error || 'Failed to delete LP selection' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        message: 'LP selection deleted successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/planning/transfer-orders/:id/lines/:lineId/lps/:lpId:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
