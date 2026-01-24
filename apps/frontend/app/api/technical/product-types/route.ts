/**
 * API Route: /api/technical/product-types
 * Story 2.5: Product Types - List and Create
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { productTypeCreateSchema } from '@/lib/validation/product-schemas'
import { ZodError } from 'zod'

// GET /api/technical/product-types - List all product types from product_types table
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

    // Get filter parameter
    const activeOnly = req.nextUrl.searchParams.get('active') !== 'false'

    // Fetch product types from product_types table (matches products.product_type_id FK)
    let query = supabase
      .from('product_types')
      .select('id, code, name, description, color, is_default, is_active, display_order, created_at')
      .eq('org_id', orgId)
      .order('display_order', { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    let { data: productTypes, error } = await query

    if (error) {
      console.error('Error fetching product types:', error)
      return NextResponse.json(
        { error: 'Failed to fetch product types', details: error.message },
        { status: 500 }
      )
    }

    // If no product types exist for this org, seed default types
    if (!productTypes || productTypes.length === 0) {
      const defaultTypes = [
        { code: 'RM', name: 'Raw Material', description: 'Ingredients and raw materials', color: 'blue', display_order: 1 },
        { code: 'WIP', name: 'Work in Progress', description: 'Semi-finished products', color: 'yellow', display_order: 2 },
        { code: 'FG', name: 'Finished Goods', description: 'Final products ready for sale', color: 'green', display_order: 3 },
        { code: 'PKG', name: 'Packaging', description: 'Packaging materials', color: 'purple', display_order: 4 },
        { code: 'BP', name: 'Byproduct', description: 'Production byproducts', color: 'orange', display_order: 5 },
      ]

      const { data: insertedTypes, error: insertError } = await supabase
        .from('product_types')
        .insert(defaultTypes.map(t => ({
          ...t,
          org_id: orgId,
          is_default: true,
          is_active: true,
        })))
        .select()

      if (insertError) {
        console.error('Error seeding default product types:', insertError)
        // Return empty array - seeding failed but shouldn't break the app
      } else {
        productTypes = insertedTypes
      }
    }

    return NextResponse.json({
      types: productTypes || [],
      total: productTypes?.length || 0
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/technical/product-types:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/technical/product-types - Create custom product type
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
    const validated = productTypeCreateSchema.parse(body)

    // Check if code already exists
    const { data: existing } = await supabase
      .from('product_types')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', validated.code)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Product type code already exists', code: 'TYPE_CODE_EXISTS' },
        { status: 400 }
      )
    }

    // Get next display_order
    const { data: maxOrder } = await supabase
      .from('product_types')
      .select('display_order')
      .eq('org_id', orgId)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrder?.display_order || 0) + 1

    // Insert custom product type
    const { data, error } = await supabase
      .from('product_types')
      .insert({
        ...validated,
        is_default: false,
        is_active: true,
        org_id: orgId,
        display_order: nextOrder,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating product type:', error)
      return NextResponse.json(
        { error: 'Failed to create product type', details: error.message },
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

    console.error('Unexpected error in POST /api/technical/product-types:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
