// API Route: Cancel Purchase Order
// Story 03.3: PO CRUD + Lines
// POST /api/planning/purchase-orders/:id/cancel - Cancel PO

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { PurchaseOrderService } from '@/lib/services/purchase-order-service'
import { cancelPOSchema } from '@/lib/validation/purchase-order'
import { checkPOPermission, getPermissionRequirement } from '@/lib/utils/po-permissions'
import { ZodError } from 'zod'

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
    if (!checkPOPermission(currentUser, 'cancel')) {
      return NextResponse.json(
        { error: `Forbidden: ${getPermissionRequirement('cancel')} required` },
        { status: 403 }
      )
    }

    // Parse optional request body for reason
    let reason: string | undefined
    try {
      const body = await request.json()
      const validated = cancelPOSchema.parse(body)
      reason = validated.reason
    } catch {
      // No body or invalid body is OK - reason is optional
    }

    // Cancel PO using service
    const result = await PurchaseOrderService.cancel(
      id,
      currentUser.org_id,
      session.user.id,
      reason
    )

    if (!result.success) {
      const statusMap: Record<string, number> = {
        NOT_FOUND: 404,
        INVALID_STATUS: 400,
        HAS_RECEIPTS: 400,
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
      status: 'cancelled',
      message: 'Purchase order cancelled successfully',
    })
  } catch (error) {
    console.error('Error in POST /api/planning/purchase-orders/:id/cancel:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
