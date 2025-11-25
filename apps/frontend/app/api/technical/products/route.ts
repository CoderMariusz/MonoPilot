/**
 * API Route: /api/technical/products
 * Story 2.1: Product CRUD - List and Create
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase/server'
import { productCreateSchema, productListQuerySchema } from '@/lib/validation/product-schemas'
import { ZodError } from 'zod'

// GET /api/technical/products - List products with filtering and pagination
export async function GET(req: NextRequest) {
  try {
    const supabase = createServerSupabaseAdmin()

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const orgId = user.user_metadata.org_id

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID not found in user metadata' },
        { status: 400 }
      )
    }

    // Parse and validate query parameters
    const searchParams = Object.fromEntries(req.nextUrl.searchParams.entries())
    const params = productListQuerySchema.parse(searchParams)

    // Build query
    let query = supabase
      .from('products')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)
      .is('deleted_at', null)

    // Apply filters
    if (params.search) {
      query = query.or(`code.ilike.%${params.search}%,name.ilike.%${params.search}%`)
    }

    if (params.type) {
      const types = Array.isArray(params.type) ? params.type : [params.type]
      query = query.in('type', types)
    }

    if (params.status) {
      const statuses = Array.isArray(params.status) ? params.status : [params.status]
      query = query.in('status', statuses)
    }

    if (params.category) {
      query = query.eq('category', params.category)
    }

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

    return NextResponse.json({
      data,
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
    const supabase = createServerSupabaseAdmin()

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const orgId = user.user_metadata.org_id

    if (!orgId) {
      return NextResponse.json(
        { error: 'Organization ID not found in user metadata' },
        { status: 400 }
      )
    }

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
        created_by: user.id,
        updated_by: user.id
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
