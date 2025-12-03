/**
 * By-Product Registration API
 * Story 4.14: By-Product Registration
 * POST /api/production/work-orders/:id/by-products
 * GET /api/production/work-orders/:id/by-products
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  registerByProduct,
  getWOByProducts,
  BYPRODUCT_ERROR_CODES,
} from '@/lib/services/byproduct-service'

/**
 * GET - List by-products for a work order (AC-4.14.1)
 */
export async function GET(
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const byProducts = await getWOByProducts(woId)

    return NextResponse.json({ data: byProducts })
  } catch (error) {
    console.error('Get by-products error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST - Register a by-product output (AC-4.14.3, AC-4.14.10)
 */
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
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userRecord) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    // Parse request body (AC-4.14.10)
    const body = await request.json()
    const { by_product_id, qty, qa_status, location_id, notes, main_output_id } = body

    // Validate required fields (AC-4.14.8)
    if (!by_product_id) {
      return NextResponse.json(
        { error: 'by_product_id is required' },
        { status: 400 }
      )
    }

    if (!qty || qty <= 0) {
      return NextResponse.json(
        { error: 'By-product quantity must be > 0' },
        { status: 400 }
      )
    }

    // Register by-product
    const result = await registerByProduct(
      {
        woId,
        byProductMaterialId: by_product_id,
        qty,
        qaStatus: qa_status,
        locationId: location_id,
        notes,
        mainOutputId: main_output_id,
      },
      user.id,
      userRecord.org_id
    )

    return NextResponse.json({
      success: true,
      data: result,
    })
  } catch (error: unknown) {
    console.error('Register by-product error:', error)

    // Handle known error codes (AC-4.14.8)
    const err = error as { code?: string; message?: string }
    if (err.code === BYPRODUCT_ERROR_CODES.WO_NOT_IN_PROGRESS) {
      return NextResponse.json(
        { error: err.message || 'WO not in progress' },
        { status: 400 }
      )
    }

    if (err.code === BYPRODUCT_ERROR_CODES.BYPRODUCT_NOT_FOUND) {
      return NextResponse.json(
        { error: err.message || 'By-product not found in WO' },
        { status: 400 }
      )
    }

    if (err.code === BYPRODUCT_ERROR_CODES.INVALID_QTY) {
      return NextResponse.json(
        { error: err.message || 'Invalid quantity' },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
