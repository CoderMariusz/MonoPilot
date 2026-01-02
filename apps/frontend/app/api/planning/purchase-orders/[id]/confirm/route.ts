// API Route: Confirm Purchase Order
// Story 03.3: PO CRUD + Lines
// POST /api/planning/purchase-orders/:id/confirm - Confirm PO

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { PurchaseOrderService } from '@/lib/services/purchase-order-service'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Authorization: Planner, Manager, Admin, Owner
    const role = (currentUser.role as any)?.code?.toLowerCase() || ''
    if (!['planner', 'manager', 'admin', 'owner'].includes(role)) {
      return NextResponse.json(
        { error: 'Forbidden: Insufficient permissions' },
        { status: 403 }
      )
    }

    // Confirm PO using service
    const result = await PurchaseOrderService.confirm(
      id,
      currentUser.org_id,
      session.user.id
    )

    if (!result.success) {
      const statusMap: Record<string, number> = {
        NOT_FOUND: 404,
        INVALID_STATUS: 400,
        DATABASE_ERROR: 500,
      }
      const status = statusMap[result.code ?? ''] ?? 400

      return NextResponse.json(
        { error: result.error, code: result.code },
        { status }
      )
    }

    return NextResponse.json({
      id: result.data?.id,
      status: 'confirmed',
      message: 'Purchase order confirmed successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/planning/purchase-orders/:id/confirm:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
