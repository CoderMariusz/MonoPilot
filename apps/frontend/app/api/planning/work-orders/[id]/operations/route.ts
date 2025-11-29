/**
 * WO Operations API
 * Story 3.14: Routing Copy to WO
 *
 * GET /api/planning/work-orders/[id]/operations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getWOOperations } from '@/lib/services/work-order-service'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const result = await getWOOperations(id)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch operations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      data: result.data,
      total: result.total || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/planning/work-orders/[id]/operations:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
