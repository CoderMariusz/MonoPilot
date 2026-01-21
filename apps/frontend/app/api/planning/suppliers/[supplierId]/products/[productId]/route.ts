/**
 * API Route: Individual Supplier Product Operations
 * Story: 03.2 - Supplier-Product Assignment
 *
 * GET /api/planning/suppliers/:supplierId/products/:productId - Get assignment details
 * PUT /api/planning/suppliers/:supplierId/products/:productId - Update assignment
 * DELETE /api/planning/suppliers/:supplierId/products/:productId - Remove assignment
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { updateSupplierProductSchema } from '@/lib/validation/supplier-product-validation'
import { ZodError } from 'zod'
import { validateOrigin, createCsrfErrorResponse } from '@/lib/csrf'

/**
 * GET /api/planning/suppliers/:supplierId/products/:productId
 * Get a specific supplier-product assignment
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string; productId: string }> }
) {
  try {
    const { supplierId, productId } = await params
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

    // Verify supplier exists and belongs to user's org
    const { data: supplier, error: supplierError } = await supabaseAdmin
      .from('suppliers')
      .select('id')
      .eq('id', supplierId)
      .eq('org_id', userData.org_id)
      .single()

    if (supplierError || !supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Get supplier-product assignment
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
        updated_at
      `)
      .eq('supplier_id', supplierId)
      .eq('product_id', productId)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { success: false, error: 'Supplier-product assignment not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error in GET /api/planning/suppliers/:supplierId/products/:productId:', error)

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

/**
 * PUT /api/planning/suppliers/:supplierId/products/:productId
 * Update a supplier-product assignment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string; productId: string }> }
) {
  try {
    // CSRF Protection
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { success: false, ...createCsrfErrorResponse() },
        { status: 403 }
      )
    }

    const { supplierId, productId } = await params
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

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateSupplierProductSchema.parse(body)

    const supabaseAdmin = createServerSupabaseAdmin()

    // Verify supplier exists and belongs to user's org
    const { data: supplier, error: supplierError } = await supabaseAdmin
      .from('suppliers')
      .select('id')
      .eq('id', supplierId)
      .eq('org_id', userData.org_id)
      .single()

    if (supplierError || !supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Check if assignment exists
    const { data: existingAssignment, error: existingError } = await supabaseAdmin
      .from('supplier_products')
      .select('id')
      .eq('supplier_id', supplierId)
      .eq('product_id', productId)
      .single()

    if (existingError || !existingAssignment) {
      return NextResponse.json(
        { success: false, error: 'Supplier-product assignment not found' },
        { status: 404 }
      )
    }

    // If setting as default, unset other defaults for this product
    if (validatedData.is_default === true) {
      await supabaseAdmin
        .from('supplier_products')
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq('product_id', productId)
        .eq('is_default', true)
        .neq('supplier_id', supplierId)
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (validatedData.is_default !== undefined) {
      updatePayload.is_default = validatedData.is_default
    }
    if (validatedData.supplier_product_code !== undefined) {
      updatePayload.supplier_product_code = validatedData.supplier_product_code
    }
    if (validatedData.unit_price !== undefined) {
      updatePayload.unit_price = validatedData.unit_price
    }
    if (validatedData.currency !== undefined) {
      updatePayload.currency = validatedData.currency
    }
    if (validatedData.lead_time_days !== undefined) {
      updatePayload.lead_time_days = validatedData.lead_time_days
    }
    if (validatedData.moq !== undefined) {
      updatePayload.moq = validatedData.moq
    }
    if (validatedData.order_multiple !== undefined) {
      updatePayload.order_multiple = validatedData.order_multiple
    }
    if (validatedData.notes !== undefined) {
      updatePayload.notes = validatedData.notes
    }

    // Update assignment
    const { data, error } = await supabaseAdmin
      .from('supplier_products')
      .update(updatePayload)
      .eq('supplier_id', supplierId)
      .eq('product_id', productId)
      .select()
      .single()

    if (error) {
      console.error('Error updating supplier product:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to update assignment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Error in PUT /api/planning/suppliers/:supplierId/products/:productId:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    // Handle JSON parse error
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON' },
        { status: 400 }
      )
    }

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

/**
 * DELETE /api/planning/suppliers/:supplierId/products/:productId
 * Remove a product assignment from a supplier
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string; productId: string }> }
) {
  try {
    // CSRF Protection
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { success: false, ...createCsrfErrorResponse() },
        { status: 403 }
      )
    }

    const { supplierId, productId } = await params
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

    // Verify supplier exists and belongs to user's org
    const { data: supplier, error: supplierError } = await supabaseAdmin
      .from('suppliers')
      .select('id')
      .eq('id', supplierId)
      .eq('org_id', userData.org_id)
      .single()

    if (supplierError || !supplier) {
      return NextResponse.json(
        { success: false, error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Check if assignment exists
    const { data: existingAssignment, error: existingError } = await supabaseAdmin
      .from('supplier_products')
      .select('id')
      .eq('supplier_id', supplierId)
      .eq('product_id', productId)
      .single()

    if (existingError || !existingAssignment) {
      return NextResponse.json(
        { success: false, error: 'Supplier-product assignment not found' },
        { status: 404 }
      )
    }

    // Delete assignment
    const { error } = await supabaseAdmin
      .from('supplier_products')
      .delete()
      .eq('supplier_id', supplierId)
      .eq('product_id', productId)

    if (error) {
      console.error('Error deleting supplier product:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to remove assignment' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product assignment removed',
    })
  } catch (error) {
    console.error('Error in DELETE /api/planning/suppliers/:supplierId/products/:productId:', error)

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
