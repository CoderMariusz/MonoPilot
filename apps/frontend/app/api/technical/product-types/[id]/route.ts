/**
 * API Route: /api/technical/product-types/[id]
 * Story 2.5: Product Types - Update
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase/server'
import { productTypeUpdateSchema } from '@/lib/validation/product-schemas'
import { ZodError } from 'zod'

type RouteContext = {
  params: Promise<{ id: string }>
}

// PUT /api/technical/product-types/[id] - Update product type
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const supabase = createServerSupabaseAdmin()
    const { id } = await context.params

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const orgId = user.user_metadata.org_id

    // Parse and validate request body
    const body = await req.json()
    const validated = productTypeUpdateSchema.parse(body)

    // Check if product type exists and is not default
    const { data: existing } = await supabase
      .from('product_type_config')
      .select('id, is_default')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Product type not found' },
        { status: 404 }
      )
    }

    if (existing.is_default) {
      return NextResponse.json(
        { error: 'Cannot edit default product types', code: 'CANNOT_EDIT_DEFAULT' },
        { status: 400 }
      )
    }

    // Update product type
    const { data, error } = await supabase
      .from('product_type_config')
      .update({
        ...validated,
        updated_by: user.id
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) {
      console.error('Error updating product type:', error)
      return NextResponse.json(
        { error: 'Failed to update product type', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Unexpected error in PUT /api/technical/product-types/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
