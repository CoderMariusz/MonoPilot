/**
 * POST /api/production/work-orders/:id/outputs/preview
 * Story 4.12a: Preview consumption allocation before registering output
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { calculateConsumptionAllocation } from '@/lib/services/output-registration-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: woId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get user's org_id
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json(
        { error: 'Unauthorized', message: 'User not found' },
        { status: 401 }
      )
    }

    // Verify WO belongs to user's org
    const { data: wo, error: woError } = await supabase
      .from('work_orders')
      .select('id, org_id')
      .eq('id', woId)
      .single()

    if (woError || !wo || wo.org_id !== userRecord.org_id) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Work order not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { qty } = body

    if (!qty || qty <= 0) {
      return NextResponse.json(
        { error: 'INVALID_QTY', message: 'Quantity must be > 0' },
        { status: 400 }
      )
    }

    // Calculate allocation preview
    const allocation = await calculateConsumptionAllocation(woId, Number(qty))

    // Get reserved LPs for over-production selection (if needed)
    let reservedLps: Array<{ id: string; lp_number: string; qty: number }> = []
    if (allocation.isOverConsumption) {
      const { data: reservations } = await supabase
        .from('wo_material_reservations')
        .select('lp_id, reserved_qty, license_plates(id, lp_number)')
        .eq('wo_id', woId)

      reservedLps = reservations?.map((r) => {
        const lp = r.license_plates as unknown as { id: string; lp_number: string } | null
        return {
          id: r.lp_id,
          lp_number: lp?.lp_number || 'Unknown',
          qty: Number(r.reserved_qty),
        }
      }) || []
    }

    return NextResponse.json({
      data: {
        allocations: allocation.allocations,
        is_over_consumption: allocation.isOverConsumption,
        cumulative_after: allocation.cumulativeAfter,
        remaining_unallocated: allocation.remainingUnallocated,
        total_reserved: allocation.totalReserved,
        reserved_lps: reservedLps,
      },
    })
  } catch (error) {
    console.error('Allocation preview error:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
