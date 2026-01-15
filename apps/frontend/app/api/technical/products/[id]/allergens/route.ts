import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Product Allergens API Routes
 * Story: 2.4 Product Allergens
 *
 * GET /api/technical/products/:id/allergens - Get product allergens
 * PUT /api/technical/products/:id/allergens - Update product allergens
 */

interface AllergenData {
  id: string
  code: string
  name: string
}

// GET - Fetch product allergens
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, org_id')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Fetch product allergens with allergen details
    const { data: productAllergens, error: allergensError } = await supabase
      .from('product_allergens')
      .select(`
        allergen_id,
        relation_type,
        allergen:allergens!allergen_id (
          id,
          code,
          name_en
        )
      `)
      .eq('product_id', productId)

    if (allergensError) {
      console.error('Error fetching product allergens:', allergensError)
      throw new Error(`Failed to fetch allergens: ${allergensError.message}`)
    }

    // Group by relation_type
    const contains: AllergenData[] = []
    const may_contain: AllergenData[] = []

    ;(productAllergens || []).forEach((pa) => {
      const allergen = pa.allergen as unknown as { id: string; code: string; name_en: string } | null
      if (!allergen) return

      const allergenData: AllergenData = {
        id: allergen.id,
        code: allergen.code,
        name: allergen.name_en,
      }

      if (pa.relation_type === 'contains') {
        contains.push(allergenData)
      } else if (pa.relation_type === 'may_contain') {
        may_contain.push(allergenData)
      }
    })

    return NextResponse.json({
      allergens: {
        contains,
        may_contain,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/technical/products/[id]/allergens:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT - Update product allergens (replace all)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await params
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
      .select('org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify product exists and belongs to user's org
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, org_id')
      .eq('id', productId)
      .single()

    if (productError || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    if (product.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // Parse request body
    const body = await request.json()
    const { contains = [], may_contain = [] } = body as {
      contains: string[]
      may_contain: string[]
    }

    // Validate allergen IDs exist
    const allAllergenIds = [...new Set([...contains, ...may_contain])]

    if (allAllergenIds.length > 0) {
      const { data: validAllergens, error: validError } = await supabase
        .from('allergens')
        .select('id')
        .in('id', allAllergenIds)

      if (validError) {
        throw new Error(`Failed to validate allergens: ${validError.message}`)
      }

      const validIds = new Set((validAllergens || []).map((a) => a.id))
      const invalidIds = allAllergenIds.filter((id) => !validIds.has(id))

      if (invalidIds.length > 0) {
        return NextResponse.json(
          { error: `Invalid allergen IDs: ${invalidIds.join(', ')}` },
          { status: 400 }
        )
      }
    }

    // Delete existing product allergens
    const { error: deleteError } = await supabase
      .from('product_allergens')
      .delete()
      .eq('product_id', productId)

    if (deleteError) {
      console.error('Error deleting product allergens:', deleteError)
      throw new Error(`Failed to update allergens: ${deleteError.message}`)
    }

    // Insert new allergens if any
    const allergensToInsert: Array<{
      product_id: string
      allergen_id: string
      relation_type: 'contains' | 'may_contain'
      org_id: string
      source: 'manual'
      created_by: string
    }> = []

    contains.forEach((allergenId) => {
      allergensToInsert.push({
        product_id: productId,
        allergen_id: allergenId,
        relation_type: 'contains',
        org_id: currentUser.org_id,
        source: 'manual',
        created_by: session.user.id,
      })
    })

    may_contain.forEach((allergenId) => {
      allergensToInsert.push({
        product_id: productId,
        allergen_id: allergenId,
        relation_type: 'may_contain',
        org_id: currentUser.org_id,
        source: 'manual',
        created_by: session.user.id,
      })
    })

    if (allergensToInsert.length > 0) {
      const { error: insertError } = await supabase
        .from('product_allergens')
        .insert(allergensToInsert)

      if (insertError) {
        console.error('Error inserting product allergens:', insertError)
        throw new Error(`Failed to save allergens: ${insertError.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Updated allergens: ${contains.length} contains, ${may_contain.length} may contain`,
    })
  } catch (error) {
    console.error('Error in PUT /api/technical/products/[id]/allergens:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    )
  }
}
