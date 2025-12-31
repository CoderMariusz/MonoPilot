// API Route: Supplier-Product Relationships
// GET /api/planning/suppliers/products - Get supplier-product relationships
// Supports filtering by product_id to get all suppliers for a product

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { validateOrigin, createCsrfErrorResponse } from '@/lib/csrf'

// GET /api/planning/suppliers/products - Get supplier-product assignments
// Query params:
// - product_id: Filter by product ID (returns all suppliers for this product)
// - supplier_id: Filter by supplier ID (returns all products for this supplier)
// - is_default: Filter by default flag ('true' or 'false')
export async function GET(request: NextRequest) {
  try {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const productId = searchParams.get('product_id')
    const supplierId = searchParams.get('supplier_id')
    const isDefault = searchParams.get('is_default')

    const supabaseAdmin = createServerSupabaseAdmin()

    let query = supabaseAdmin
      .from('supplier_products')
      .select(`
        *,
        suppliers(id, code, name, currency, is_active),
        products(id, code, name, uom)
      `)
      .eq('org_id', currentUser.org_id)

    // Apply filters
    if (productId) {
      query = query.eq('product_id', productId)
    }

    if (supplierId) {
      query = query.eq('supplier_id', supplierId)
    }

    if (isDefault !== null && isDefault !== undefined) {
      query = query.eq('is_default', isDefault === 'true')
    }

    // Order by is_default (defaults first), then by supplier code
    query = query.order('is_default', { ascending: false })

    const { data, error } = await query

    if (error) {
      console.error('Error fetching supplier-product relationships:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      assignments: data || [],
      total: data?.length || 0,
    })
  } catch (error) {
    console.error('Error in GET /api/planning/suppliers/products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/planning/suppliers/products - Create supplier-product assignment
export async function POST(request: NextRequest) {
  try {
    // CSRF Protection: Validate request origin
    if (!validateOrigin(request)) {
      return NextResponse.json(createCsrfErrorResponse(), { status: 403 })
    }

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

    // Authorization: Purchasing, Manager, Admin
    if (!['purchasing', 'manager', 'admin'].includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden: Purchasing role or higher required' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { supplier_id, product_id, is_default, unit_price, lead_time_days, min_order_qty, moq } = body

    if (!supplier_id || !product_id) {
      return NextResponse.json(
        { error: 'supplier_id and product_id are required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // If setting as default, first unset any existing default for this product
    if (is_default) {
      await supabaseAdmin
        .from('supplier_products')
        .update({ is_default: false })
        .eq('product_id', product_id)
        .eq('org_id', currentUser.org_id)
        .eq('is_default', true)
    }

    // Check if relationship already exists
    const { data: existing } = await supabaseAdmin
      .from('supplier_products')
      .select('id')
      .eq('supplier_id', supplier_id)
      .eq('product_id', product_id)
      .eq('org_id', currentUser.org_id)
      .maybeSingle()

    if (existing) {
      // Update existing relationship
      const { data, error: updateError } = await supabaseAdmin
        .from('supplier_products')
        .update({
          is_default: is_default ?? false,
          unit_price: unit_price ?? null,
          lead_time_days: lead_time_days ?? null,
          moq: moq ?? min_order_qty ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select(`
          *,
          suppliers(id, code, name, currency, is_active),
          products(id, code, name, uom)
        `)
        .single()

      if (updateError) {
        console.error('Error updating supplier-product:', updateError)
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      return NextResponse.json({
        assignment: data,
        message: 'Supplier-product assignment updated successfully',
      })
    }

    // Create new relationship
    const { data, error: insertError } = await supabaseAdmin
      .from('supplier_products')
      .insert({
        supplier_id,
        product_id,
        org_id: currentUser.org_id,
        is_default: is_default ?? false,
        unit_price: unit_price ?? null,
        lead_time_days: lead_time_days ?? null,
        moq: moq ?? min_order_qty ?? null,
      })
      .select(`
        *,
        suppliers(id, code, name, currency, is_active),
        products(id, code, name, uom)
      `)
      .single()

    if (insertError) {
      console.error('Error creating supplier-product:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json(
      {
        assignment: data,
        message: 'Supplier-product assignment created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/planning/suppliers/products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/planning/suppliers/products - Delete supplier-product assignment
// Query params: supplier_id and product_id (both required)
export async function DELETE(request: NextRequest) {
  try {
    // CSRF Protection: Validate request origin
    if (!validateOrigin(request)) {
      return NextResponse.json(createCsrfErrorResponse(), { status: 403 })
    }

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

    // Authorization: Purchasing, Manager, Admin
    if (!['purchasing', 'manager', 'admin'].includes(currentUser.role.toLowerCase())) {
      return NextResponse.json(
        { error: 'Forbidden: Purchasing role or higher required' },
        { status: 403 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const supplierId = searchParams.get('supplier_id')
    const productId = searchParams.get('product_id')

    if (!supplierId || !productId) {
      return NextResponse.json(
        { error: 'supplier_id and product_id query parameters are required' },
        { status: 400 }
      )
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    const { error: deleteError } = await supabaseAdmin
      .from('supplier_products')
      .delete()
      .eq('supplier_id', supplierId)
      .eq('product_id', productId)
      .eq('org_id', currentUser.org_id)

    if (deleteError) {
      console.error('Error deleting supplier-product:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Supplier-product assignment deleted successfully',
    })
  } catch (error) {
    console.error('Error in DELETE /api/planning/suppliers/products:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
