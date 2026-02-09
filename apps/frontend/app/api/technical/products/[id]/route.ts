/**
 * API Route: /api/technical/products/[id]
 * Story 2.1: Product CRUD - Get, Update, Delete
 * Story 2.2: Product Versioning - Auto-increment on update
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { productUpdateSchema } from '@/lib/validation/product-schemas'
import { ZodError } from 'zod'

type RouteContext = {
  params: Promise<{ id: string }>
}

// GET /api/technical/products/[id] - Get product details with allergens
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

    // Fetch product with allergens and product type (including archived products)
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_type:product_types (id, code, name),
        product_allergens (
          allergen_id,
          relation_type,
          allergens (id, code, name_en)
        ),
        created_by_user:users!products_created_by_fkey (id, first_name, last_name, email),
        updated_by_user:users!products_updated_by_fkey (id, first_name, last_name, email)
      `)
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error || !data) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Transform allergens to expected format
    const allergens = {
      contains: data.product_allergens
        ?.filter((pa: any) => pa.relation_type === 'contains')
        .map((pa: any) => pa.allergens) || [],
      may_contain: data.product_allergens
        ?.filter((pa: any) => pa.relation_type === 'may_contain')
        .map((pa: any) => pa.allergens) || []
    }

    // Remove nested data and add transformed allergens
    const { product_allergens, created_by_user, updated_by_user, ...product } = data

    return NextResponse.json({
      ...product,
      allergens,
      created_by: created_by_user,
      updated_by: updated_by_user
    })

  } catch (error) {
    console.error('Unexpected error in GET /api/technical/products/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/technical/products/[id] - Update product (auto-increments version)
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

    // Check if code is being modified (not allowed)
    if (body.code !== undefined) {
      return NextResponse.json(
        {
          error: 'Product code is immutable and cannot be changed',
          code: 'PRODUCT_CODE_IMMUTABLE'
        },
        { status: 400 }
      )
    }

    const validated = productUpdateSchema.parse(body)

    // Check if product exists
    const { data: existing } = await supabase
      .from('products')
      .select('id, version, barcode')
      .eq('id', id)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Check if barcode is being changed and if new barcode already exists (W2: Duplicate barcode validation)
    // CRITICAL: Must enforce constraint at all times to prevent race conditions
    if (validated.barcode && validated.barcode.trim() && validated.barcode !== existing.barcode) {
      const { data: existingBarcodes, error: barcodeError } = await supabase
        .from('products')
        .select('id, code')
        .eq('org_id', orgId)
        .eq('barcode', validated.barcode.trim())
        .neq('id', id)
        .is('deleted_at', null)

      // Log for debugging intermittent failures
      console.log(`[W6-BARCODE] PUT ${id} - Checking barcode "${validated.barcode}" for org "${orgId}" - Found: ${existingBarcodes?.length || 0}`)

      if (barcodeError) {
        console.error(`[W6-BARCODE] PUT ${id} - Database error checking barcode:`, barcodeError)
        return NextResponse.json(
          {
            error: 'Failed to validate barcode uniqueness',
            code: 'BARCODE_VALIDATION_ERROR',
            details: { error: barcodeError.message }
          },
          { status: 500 }
        )
      }

      if (existingBarcodes && existingBarcodes.length > 0) {
        return NextResponse.json(
          {
            error: 'Product barcode already exists',
            code: 'PRODUCT_BARCODE_EXISTS',
            details: {
              field: 'barcode',
              existingProduct: existingBarcodes[0].code
            }
          },
          { status: 400 }
        )
      }
    }

    // Update product (trigger will auto-increment version)
    const { data, error } = await supabase
      .from('products')
      .update({
        ...validated,
        updated_by: session.user.id
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) {
      console.error('Error updating product:', error)
      return NextResponse.json(
        { error: 'Failed to update product', details: error.message },
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

    console.error('Unexpected error in PUT /api/technical/products/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PATCH /api/technical/products/[id] - Restore archived product
export async function PATCH(req: NextRequest, context: RouteContext) {
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

    // Get the request body to determine action
    const body = await req.json()
    const action = body.action

    // Only support restore action
    if (action !== 'restore') {
      return NextResponse.json(
        { error: 'Invalid action. Only "restore" is supported.' },
        { status: 400 }
      )
    }

    // Check if product exists (should be archived)
    const { data: existing } = await supabase
      .from('products')
      .select('id, deleted_at')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    if (!existing.deleted_at) {
      return NextResponse.json(
        { error: 'Product is not archived' },
        { status: 400 }
      )
    }

    // Restore product by clearing deleted_at
    const { data, error } = await supabase
      .from('products')
      .update({
        deleted_at: null,
        updated_by: session.user.id
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (error) {
      console.error('Error restoring product:', error)
      return NextResponse.json(
        { error: 'Failed to restore product', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product restored successfully',
      data
    })

  } catch (error) {
    console.error('Unexpected error in PATCH /api/technical/products/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/technical/products/[id] - Soft delete product
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

    // Check if product exists
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .single()

    if (!existing) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // MAJOR-001 FIX: Check if product is referenced in active BOMs
    const { count: bomCount } = await supabase
      .from('bom_items')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', id)

    if (bomCount && bomCount > 0) {
      return NextResponse.json(
        { error: `Cannot delete product: referenced by ${bomCount} BOM item(s)` },
        { status: 400 }
      )
    }

    // Soft delete (set deleted_at)
    const { error } = await supabase
      .from('products')
      .update({
        deleted_at: new Date().toISOString(),
        updated_by: session.user.id
      })
      .eq('id', id)
      .eq('org_id', orgId)

    if (error) {
      console.error('Error deleting product:', error)
      return NextResponse.json(
        { error: 'Failed to delete product', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Product soft deleted'
    })

  } catch (error) {
    console.error('Unexpected error in DELETE /api/technical/products/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
