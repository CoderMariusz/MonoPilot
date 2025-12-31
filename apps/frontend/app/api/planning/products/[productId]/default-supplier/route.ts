/**
 * API Route: Default Supplier for Product
 * Story: 03.2 - Supplier-Product Assignment
 *
 * GET /api/planning/products/:productId/default-supplier - Get default supplier
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/planning/products/:productId/default-supplier
 * Get the default supplier for a product
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const { productId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user's org_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { success: false, error: 'User organization not found' },
        { status: 403 }
      )
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Verify product exists and belongs to user's org
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', productId)
      .eq('org_id', userData.org_id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // Find the default supplier for this product
    const { data, error } = await supabaseAdmin
      .from('supplier_products')
      .select(`
        id,
        supplier_id,
        product_id,
        is_default,
        supplier_product_code,
        unit_price,
        currency,
        lead_time_days,
        moq,
        order_multiple,
        last_purchase_date,
        last_purchase_price,
        notes,
        created_at,
        updated_at,
        supplier:suppliers(id, code, name, currency)
      `)
      .eq('product_id', productId)
      .eq('is_default', true)
      .single()

    // If no default found (PGRST116 error), return null data
    if (error) {
      if (error.code === 'PGRST116') {
        // No default supplier found
        return NextResponse.json({
          success: true,
          data: null,
        })
      }

      console.error('Error fetching default supplier:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch default supplier' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error in GET /api/planning/products/:productId/default-supplier:', error)

    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred',
        ...(process.env.NODE_ENV === 'development' && {
          debug: error instanceof Error ? error.message : 'Unknown error',
        }),
      },
      { status: 500 }
    )
  }
}
