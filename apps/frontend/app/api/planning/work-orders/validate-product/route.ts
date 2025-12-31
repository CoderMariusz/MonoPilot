/**
 * API Route: /api/planning/work-orders/validate-product
 * Story 03.10: Validate product has active BOM for scheduled date
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { WorkOrderService, WorkOrderError } from '@/lib/services/work-order-service'
import { bomForDateSchema } from '@/lib/validation/work-order'
import { ZodError } from 'zod'

// GET /api/planning/work-orders/validate-product?product_id=xxx&scheduled_date=yyyy-mm-dd
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
    const validated = bomForDateSchema.parse(searchParams)

    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, code, name, base_uom, status')
      .eq('id', validated.product_id)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .single()

    if (productError || !product) {
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          error: 'Product not found',
        },
      })
    }

    if (product.status !== 'active') {
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          error: 'Product is not active',
        },
      })
    }

    // Validate BOM exists
    const bomValidation = await WorkOrderService.validateProductHasActiveBom(
      supabase,
      validated.product_id,
      orgId,
      new Date(validated.scheduled_date)
    )

    return NextResponse.json({
      success: true,
      data: {
        valid: bomValidation.valid,
        product: {
          id: product.id,
          code: product.code,
          name: product.name,
          base_uom: product.base_uom,
        },
        bom: bomValidation.bom || null,
        warning: bomValidation.valid ? null : bomValidation.error,
      },
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

    console.error('Error in GET /api/planning/work-orders/validate-product:', error)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } },
      { status: 500 }
    )
  }
}
