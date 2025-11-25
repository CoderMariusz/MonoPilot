/**
 * API Route: /api/technical/product-types
 * Story 2.5: Product Types - List and Create
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { productTypeCreateSchema } from '@/lib/validation/product-schemas'
import { ZodError } from 'zod'

// Default product types (built-in)
const DEFAULT_TYPES = [
  { code: 'RM', name: 'Raw Material', is_default: true },
  { code: 'WIP', name: 'Work In Progress', is_default: true },
  { code: 'FG', name: 'Finished Good', is_default: true },
  { code: 'PKG', name: 'Packaging', is_default: true },
  { code: 'BP', name: 'By-Product', is_default: true },
]

// GET /api/technical/product-types - List all product types (default + custom)
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

    // Fetch custom product types
    let query = supabase
      .from('product_type_config')
      .select('id, code, name, is_default, is_active, created_at')
      .eq('org_id', orgId)
      .order('code', { ascending: true })

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data: customTypes, error } = await query

    if (error) {
      console.error('Error fetching product types:', error)
      return NextResponse.json(
        { error: 'Failed to fetch product types', details: error.message },
        { status: 500 }
      )
    }

    // Combine default types with custom types
    const allTypes = [
      ...DEFAULT_TYPES.map((t) => ({
        id: `default-${t.code}`,
        ...t,
        is_active: true,
        is_editable: false,
      })),
      ...(customTypes || []).map((t) => ({
        ...t,
        is_editable: !t.is_default,
      })),
    ]

    return NextResponse.json({
      types: allTypes,
      total: allTypes.length
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
      .from('product_type_config')
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

    // Insert custom product type
    const { data, error } = await supabase
      .from('product_type_config')
      .insert({
        ...validated,
        is_default: false,
        is_active: true,
        org_id: orgId,
        created_by: session.user.id,
        updated_by: session.user.id
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
