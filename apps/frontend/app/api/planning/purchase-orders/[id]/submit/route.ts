// API Route: Submit Purchase Order
// Story 03.3: PO CRUD + Lines
// POST /api/planning/purchase-orders/:id/submit - Submit PO (draft -> confirmed)

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { PurchaseOrderService } from '@/lib/services/purchase-order-service'
import { checkPOPermission, getPermissionRequirement } from '@/lib/utils/po-permissions'

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

    // Authorization: MAJOR-02 Fix - Use centralized permission check
    if (!checkPOPermission(currentUser, 'submit')) {
      return NextResponse.json(
        { error: `Forbidden: ${getPermissionRequirement('submit')} required` },
        { status: 403 }
      )
    }

    // Submit PO using service
    const result = await PurchaseOrderService.submit(
      id,
      currentUser.org_id,
      session.user.id
    )

    if (!result.success) {
      // Map error codes to HTTP status
      const statusMap: Record<string, number> = {
        NOT_FOUND: 404,
        INVALID_STATUS: 400,
        NO_LINES: 400,
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
      status: result.data?.status,
      approval_required: false, // Simplified - no approval in MVP
      message: 'Purchase order submitted successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/planning/purchase-orders/:id/submit:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
