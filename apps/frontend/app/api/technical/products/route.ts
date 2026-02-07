/**
 * API Route: /api/technical/products
 * Story 2.1: Product CRUD - List and Create
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { productCreateSchema, productListQuerySchema } from '@/lib/validation/product-schemas'
import { ZodError } from 'zod'

// GET /api/technical/products - List products with filtering and pagination
export async function GET(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user to get org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const orgId = currentUser.org_id

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries())
    const params = productListQuerySchema.parse(searchParams)

    // Build query - join with product_types to get type code/name
    let query = supabase
      .from('products')
      .select('*, product_type:product_types(id, code, name)', { count: 'exact' })
      .eq('org_id', orgId)
      .is('deleted_at', null)

    // Apply filters
    if (params.code) {
      // Exact match by product code (case-insensitive)
      query = query.ilike('code', params.code)
    } else if (params.search) {
      query = query.or(`code.ilike.%${params.search}%,name.ilike.%${params.search}%`)
    }

    // Handle type filter (can be code like "RM" or UUID)
    const typeParam = searchParams.type || searchParams.product_type_id
    if (typeParam) {
      const types = Array.isArray(typeParam) ? typeParam : [typeParam]
      
      // Check if it's a UUID or a code
      const isUUID = types[0]?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)
      
      if (isUUID) {
        // Filter by UUID directly
        query = query.in('product_type_id', types)
      } else {
        // Filter by product type code - need to join
        // Get product type IDs from codes first
        const { data: productTypes } = await supabase
          .from('product_types')
          .select('id')
          .in('code', types)
        
        if (productTypes && productTypes.length > 0) {
          const typeIds = productTypes.map((pt: { id: string }) => pt.id)
          query = query.in('product_type_id', typeIds)
        } else {
          // No matching types found - return empty result
          return NextResponse.json({
            data: [],
            pagination: {
              page: params.page,
              limit: params.limit,
              total: 0,
              totalPages: 0
            }
          })
        }
      }
    } else if (params.product_type_id) {
      const types = Array.isArray(params.product_type_id) ? params.product_type_id : [params.product_type_id]
      query = query.in('product_type_id', types)
    }

    if (params.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status]
      query = query.in('status', statuses)
    }

    // TODO: Enable when categories table is created
    // if (params.category_id) {
    //   query = query.eq('category_id', params.category_id)
    // }

    // Apply sorting
    query = query.order(params.sort, { ascending: params.order === 'asc' })

    // Apply pagination
    const from = (params.page - 1) * params.limit
    const to = from + params.limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching products:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products', details: error.message },
        { status: 500 }
      )
    }

    // Fetch BOM counts for each product
    let productsWithBomCount = data || []
    if (data && data.length > 0) {
      const productIds = data.map((p: { id: string }) => p.id)
      const { data: bomCounts } = await supabase
        .from('boms')
        .select('product_id')
        .in('product_id', productIds)

      // Count BOMs per product
      const bomCountMap: Record<string, number> = {}
      bomCounts?.forEach((bom: { product_id: string }) => {
        bomCountMap[bom.product_id] = (bomCountMap[bom.product_id] || 0) + 1
      })

      // Add bom_count to each product
      productsWithBomCount = data.map((product: { id: string }) => ({
        ...product,
        bom_count: bomCountMap[product.id] || 0
      }))
    }

    return NextResponse.json({
      data: productsWithBomCount,
      pagination: {
        page: params.page,
        limit: params.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / params.limit)
      }
    })

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Unexpected error in GET /api/technical/products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/technical/products - Create new product
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get current user to get org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const orgId = currentUser.org_id

    // Parse and validate request body
    const body = await req.json()
    const validated = productCreateSchema.parse(body)

    // Check if product code already exists
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', validated.code)
      .is('deleted_at', null)
      .single()

    if (existing) {
      return NextResponse.json(
        {
          error: 'Product code already exists',
          code: 'PRODUCT_CODE_EXISTS',
          details: { field: 'code' }
        },
        { status: 400 }
      )
    }

    // Insert product (version defaults to 1.0)
    const { data, error } = await supabase
      .from('products')
      .insert({
        ...validated,
        org_id: orgId,
        created_by: session.user.id,
        updated_by: session.user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product:', error)
      return NextResponse.json(
        { error: 'Failed to create product', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data, { status: 201 })

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Unexpected error in POST /api/technical/products:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
