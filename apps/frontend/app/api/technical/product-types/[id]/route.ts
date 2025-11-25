/**
 * API Route: /api/technical/product-types/[id]
 * Story 2.5: Product Types - Update
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { productTypeUpdateSchema } from '@/lib/validation/product-schemas'
import { ZodError } from 'zod'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/technical/product-types/[id] - Get single product type
export async function GET(req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase()
    const { id } = await context.params

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

    // Fetch product type
    const { data, error } = await supabase
      .from('product_type_config')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Product type not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Unexpected error in GET /api/technical/product-types/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/technical/product-types/[id] - Update product type
export async function PUT(req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase()
    const { id } = await context.params

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
        updated_by: session.user.id
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

// DELETE /api/technical/product-types/[id] - Delete custom product type
export async function DELETE(req: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase()
    const { id } = await context.params

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

    // Check if product type exists and is not default
    const { data: existing } = await supabase
      .from('product_type_config')
      .select('id, code, is_default')
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
        { error: 'Cannot delete default product types', code: 'CANNOT_DELETE_DEFAULT' },
        { status: 400 }
      )
    }

    // Check if any products use this type
    const { count: productCount } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('type', 'CUSTOM')
      .is('deleted_at', null)

    // Note: Since custom types use 'CUSTOM' in the enum and reference the config table,
    // we need to check if there are products referencing this specific custom type
    // For now, we'll just deactivate instead of hard delete if any CUSTOM products exist
    if (productCount && productCount > 0) {
      // Soft delete by deactivating
      const { error: updateError } = await supabase
        .from('product_type_config')
        .update({ is_active: false, updated_by: session.user.id })
        .eq('id', id)
        .eq('org_id', orgId)

      if (updateError) {
        console.error('Error deactivating product type:', updateError)
        return NextResponse.json(
          { error: 'Failed to deactivate product type', details: updateError.message },
          { status: 500 }
        )
      }

      return NextResponse.json({
        message: 'Product type deactivated (products exist using this type)',
        deactivated: true
      })
    }

    // Hard delete if no products use it
    const { error: deleteError } = await supabase
      .from('product_type_config')
      .delete()
      .eq('id', id)
      .eq('org_id', orgId)

    if (deleteError) {
      console.error('Error deleting product type:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete product type', details: deleteError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ message: 'Product type deleted successfully' })

  } catch (error) {
    console.error('Unexpected error in DELETE /api/technical/product-types/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
