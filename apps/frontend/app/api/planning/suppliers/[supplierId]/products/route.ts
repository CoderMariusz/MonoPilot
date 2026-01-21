/**
 * API Route: Supplier Products Collection
 * Story: 03.2 - Supplier-Product Assignment
 *
 * GET /api/planning/suppliers/:supplierId/products - List products for a supplier
 * POST /api/planning/suppliers/:supplierId/products - Assign product to supplier
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { assignProductSchema } from '@/lib/validation/supplier-product-validation'
import { ZodError } from 'zod'
import { validateOrigin, createCsrfErrorResponse } from '@/lib/csrf'

/**
 * GET /api/planning/suppliers/:supplierId/products
 * Get all products assigned to a supplier
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    const { supplierId } = await params
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search')
    const sort = searchParams.get('sort') || 'product_code'
    const order = searchParams.get('order') || 'asc'

    // Fetch supplier products with joined product data
    let query = supabaseAdmin
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
        product:products(id, code, name, base_uom, lead_time_days)
      `)
      .eq('supplier_id', supplierId)

    // Apply search filter on product code or name
    if (search) {
      // Phase 1: Implement server-side full-text search
      // Current limitation: PostgREST doesn't support full-text search on joined tables
      // TODO: Phase 1: Implement server-side full-text search using PostgreSQL tsvector
      // This would eliminate the need for in-memory filtering
    }

    // Apply sorting
    const ascending = order === 'asc'
    if (sort === 'product_code' || sort === 'product_name') {
      // For joined columns, we need to sort differently
      query = query.order('created_at', { ascending })
    } else if (sort === 'unit_price') {
      query = query.order('unit_price', { ascending, nullsFirst: false })
    } else if (sort === 'is_default') {
      query = query.order('is_default', { ascending: false })
    } else {
      query = query.order('created_at', { ascending })
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching supplier products:', error)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    // Filter by search if provided (in-memory filter for joined columns)
    let filteredData = data || []
    if (search) {
      const searchLower = search.toLowerCase()
      filteredData = filteredData.filter((sp: any) => {
        const product = sp.product
        if (!product) return false
        return (
          product.code?.toLowerCase().includes(searchLower) ||
          product.name?.toLowerCase().includes(searchLower) ||
          sp.supplier_product_code?.toLowerCase().includes(searchLower)
        )
      })
    }

    // Sort by product code or name if requested
    if (sort === 'product_code') {
      filteredData.sort((a: any, b: any) => {
        const codeA = a.product?.code || ''
        const codeB = b.product?.code || ''
        return ascending
          ? codeA.localeCompare(codeB)
          : codeB.localeCompare(codeA)
      })
    } else if (sort === 'product_name') {
      filteredData.sort((a: any, b: any) => {
        const nameA = a.product?.name || ''
        const nameB = b.product?.name || ''
        return ascending
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA)
      })
    }

    // Calculate metadata
    const defaultCount = filteredData.filter((sp: any) => sp.is_default).length

    return NextResponse.json({
      success: true,
      data: filteredData,
      meta: {
        total: filteredData.length,
        default_count: defaultCount,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/planning/suppliers/:supplierId/products:', error)

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
 * POST /api/planning/suppliers/:supplierId/products
 * Assign a product to a supplier
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ supplierId: string }> }
) {
  try {
    // CSRF Protection
    if (!validateOrigin(request)) {
      return NextResponse.json(
        { success: false, ...createCsrfErrorResponse() },
        { status: 403 }
      )
    }

    const { supplierId } = await params
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
    const validatedData = assignProductSchema.parse(body)

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

    // Verify product exists and belongs to user's org
    const { data: product, error: productError } = await supabaseAdmin
      .from('products')
      .select('id')
      .eq('id', validatedData.product_id)
      .eq('org_id', userData.org_id)
      .single()

    if (productError || !product) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      )
    }

    // If setting as default, unset other defaults for this product
    if (validatedData.is_default) {
      await supabaseAdmin
        .from('supplier_products')
        .update({ is_default: false, updated_at: new Date().toISOString() })
        .eq('product_id', validatedData.product_id)
        .eq('is_default', true)
    }

    // Insert new assignment
    const { data, error } = await supabaseAdmin
      .from('supplier_products')
      .insert({
        supplier_id: supplierId,
        product_id: validatedData.product_id,
        is_default: validatedData.is_default ?? false,
        supplier_product_code: validatedData.supplier_product_code ?? null,
        unit_price: validatedData.unit_price ?? null,
        currency: validatedData.currency ?? null,
        lead_time_days: validatedData.lead_time_days ?? null,
        moq: validatedData.moq ?? null,
        order_multiple: validatedData.order_multiple ?? null,
        notes: validatedData.notes ?? null,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating supplier product:', error)

      // Handle unique constraint violation
      if (error.code === '23505') {
        return NextResponse.json(
          { success: false, error: 'This product is already assigned to this supplier' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { success: false, error: 'Failed to assign product' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, data },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/planning/suppliers/:supplierId/products:', error)

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
