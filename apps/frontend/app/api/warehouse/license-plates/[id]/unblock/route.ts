/**
 * Unblock License Plate API Route (Story 05.6)
 * PUT /api/warehouse/license-plates/:id/unblock
 *
 * Unblock a blocked LP
 *
 * Business Rules:
 * - LP must be currently blocked
 * - Changes status to 'available'
 * - Creates audit transaction entry
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { unblockLP } from '@/lib/services/license-plate-detail-service'

export async function PUT(
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

    // Unblock LP using service
    const updatedLP = await unblockLP(supabase, lpId)

    return NextResponse.json({
      id: updatedLP.id,
      lp_number: updatedLP.lp_number,
      status: updatedLP.status,
      updated_at: updatedLP.updated_at,
      message: 'LP unblocked successfully',
    })
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: 'License Plate not found', code: 'LP_NOT_FOUND' },
          { status: 404 }
        )
      }
      if (error.message.includes('cannot be unblocked')) {
        return NextResponse.json(
          { error: error.message, code: 'INVALID_STATUS' },
          { status: 400 }
        )
      }
    }

    console.error('Error in PUT /api/warehouse/license-plates/:id/unblock:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
