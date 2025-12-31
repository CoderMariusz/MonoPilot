/**
 * API Route: /api/planning/work-orders/available-boms
 * Story 03.10: Get all active BOMs for product (manual BOM selection)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { WorkOrderService, WorkOrderError } from '@/lib/services/work-order-service'
import { availableBomsSchema } from '@/lib/validation/work-order'
import { ZodError } from 'zod'

// GET /api/planning/work-orders/available-boms?product_id=xxx
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } },
        { status: 401 }
      )
    }

    // Get current user's org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found' } },
        { status: 404 }
      )
    }

    const orgId = currentUser.org_id

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams.entries())
    const validated = availableBomsSchema.parse(searchParams)

    // Get all active BOMs
    const boms = await WorkOrderService.getAvailableBoms(
      supabase,
      validated.product_id,
      orgId
    )

    return NextResponse.json({
      success: true,
      data: boms,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Validation failed',
            details: error.errors,
          },
        },
        { status: 400 }
      )
    }

    if (error instanceof WorkOrderError) {
      return NextResponse.json(
        {
          success: false,
          error: { code: error.code, message: error.message },
        },
        { status: error.status }
      )
    }

    console.error('Error in GET /api/planning/work-orders/available-boms:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
