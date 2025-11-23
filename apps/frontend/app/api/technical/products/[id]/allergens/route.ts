/**
 * API Route: /api/technical/products/[id]/allergens
 * Story 2.4: Product Allergens - Manage allergen assignments
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseAdmin } from '@/lib/supabase/server'
import { allergenAssignmentSchema } from '@/lib/validation/product-schemas'
import { ZodError } from 'zod'

type RouteContext = {
  params: Promise<{ id: string }>
}

// PUT /api/technical/products/[id]/allergens - Update product allergens
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

    // Verify product exists
    const { data: product } = await supabase
      .from('products')
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .is('deleted_at', null)
      .single()

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await req.json()
    const validated = allergenAssignmentSchema.parse(body)

    // Verify all allergen IDs exist and belong to the org
    const allAllergenIds = [...validated.contains, ...validated.may_contain]

    if (allAllergenIds.length > 0) {
      const { data: allergens, error: allergenError } = await supabase
        .from('allergens')
        .select('id')
        .eq('org_id', orgId)
        .in('id', allAllergenIds)

      if (allergenError || !allergens || allergens.length !== allAllergenIds.length) {
        return NextResponse.json(
          { error: 'One or more allergens not found' },
          { status: 400 }
        )
      }
    }

    // Delete existing allergen assignments
    const { error: deleteError } = await supabase
      .from('product_allergens')
      .delete()
      .eq('product_id', id)
      .eq('org_id', orgId)

    if (deleteError) {
      console.error('Error deleting existing allergens:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete existing allergens', details: deleteError.message },
        { status: 500 }
      )
    }

    // Insert new allergen assignments
    const newAssignments = [
      ...validated.contains.map(allergenId => ({
        product_id: id,
        allergen_id: allergenId,
        relation_type: 'contains',
        org_id: orgId,
        created_by: user.id
      })),
      ...validated.may_contain.map(allergenId => ({
        product_id: id,
        allergen_id: allergenId,
        relation_type: 'may_contain',
        org_id: orgId,
        created_by: user.id
      }))
    ]

    if (newAssignments.length > 0) {
      const { error: insertError } = await supabase
        .from('product_allergens')
        .insert(newAssignments)

      if (insertError) {
        console.error('Error inserting allergens:', insertError)
        return NextResponse.json(
          { error: 'Failed to insert allergens', details: insertError.message },
          { status: 500 }
        )
      }
    }

    // Fetch updated allergens with details
    const { data: updatedAllergens } = await supabase
      .from('product_allergens')
      .select(`
        allergen_id,
        relation_type,
        allergens (id, code, name)
      `)
      .eq('product_id', id)
      .eq('org_id', orgId)

    const allergens = {
      contains: updatedAllergens
        ?.filter((pa: any) => pa.relation_type === 'contains')
        .map((pa: any) => pa.allergens) || [],
      may_contain: updatedAllergens
        ?.filter((pa: any) => pa.relation_type === 'may_contain')
        .map((pa: any) => pa.allergens) || []
    }

    return NextResponse.json({
      success: true,
      allergens
    })

  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request body', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Unexpected error in PUT /api/technical/products/[id]/allergens:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
