/**
 * BOM Alternatives API Route (Story 02.6)
 *
 * GET /api/v1/technical/boms/:id/items/:itemId/alternatives - List alternatives
 * POST /api/v1/technical/boms/:id/items/:itemId/alternatives - Create alternative
 *
 * Auth: Required
 * GET Roles: All authenticated users (technical.R)
 * POST Roles: ADMIN, SUPER_ADMIN, PRODUCTION_MANAGER (technical.C)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createAlternativeSchema } from '@/lib/validation/bom-alternative'
import type {
  AlternativesListResponse,
  AlternativeResponse,
} from '@/lib/types/bom-alternative'

/**
 * GET /api/v1/technical/boms/:id/items/:itemId/alternatives
 * List all alternatives for a BOM item
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: bomId, itemId } = await params
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user org_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const orgId = userData.org_id

    // Verify BOM exists and belongs to user's org
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select('id, org_id, product_id')
      .eq('id', bomId)
      .single()

    if (bomError || !bom) {
      return NextResponse.json(
        { error: 'BOM_NOT_FOUND', message: 'BOM not found' },
        { status: 404 }
      )
    }

    if (bom.org_id !== orgId) {
      return NextResponse.json(
        { error: 'BOM_NOT_FOUND', message: 'BOM not found' },
        { status: 404 }
      )
    }

    // Verify BOM item exists
    const { data: item, error: itemError } = await supabase
      .from('bom_items')
      .select(`
        id,
        bom_id,
        product_id,
        quantity,
        uom,
        product:products!product_id (
          id,
          code,
          name,
          type
        )
      `)
      .eq('id', itemId)
      .eq('bom_id', bomId)
      .single()

    if (itemError || !item) {
      return NextResponse.json(
        { error: 'ITEM_NOT_FOUND', message: 'BOM item not found' },
        { status: 404 }
      )
    }

    // Get alternatives for this item
    const { data: alternatives, error: altError } = await supabase
      .from('bom_alternatives')
      .select(`
        id,
        bom_item_id,
        alternative_product_id,
        quantity,
        uom,
        preference_order,
        notes,
        created_at,
        product:products!alternative_product_id (
          id,
          code,
          name,
          type
        )
      `)
      .eq('bom_item_id', itemId)
      .eq('org_id', orgId)
      .order('preference_order', { ascending: true })

    if (altError) {
      console.error('Error fetching alternatives:', altError)
      // Return empty array if table doesn't exist yet
      const response: AlternativesListResponse = {
        alternatives: [],
        primary_item: {
          id: item.id,
          product_code: (item.product as any)?.code || '',
          product_name: (item.product as any)?.name || '',
          product_type: (item.product as any)?.type || '',
          quantity: item.quantity,
          uom: item.uom,
        },
      }
      return NextResponse.json(response)
    }

    // Format response
    const formattedAlternatives = (alternatives || []).map((alt: any) => ({
      id: alt.id,
      bom_item_id: alt.bom_item_id,
      alternative_product_id: alt.alternative_product_id,
      alternative_product_code: alt.product?.code || '',
      alternative_product_name: alt.product?.name || '',
      alternative_product_type: alt.product?.type || '',
      quantity: alt.quantity,
      uom: alt.uom,
      preference_order: alt.preference_order,
      notes: alt.notes,
      created_at: alt.created_at,
    }))

    const response: AlternativesListResponse = {
      alternatives: formattedAlternatives,
      primary_item: {
        id: item.id,
        product_code: (item.product as any)?.code || '',
        product_name: (item.product as any)?.name || '',
        product_type: (item.product as any)?.type || '',
        quantity: item.quantity,
        uom: item.uom,
      },
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Unexpected error in GET alternatives:', error)
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/technical/boms/:id/items/:itemId/alternatives
 * Create a new alternative for a BOM item
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id: bomId, itemId } = await params
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get user org_id and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        org_id,
        role:roles (
          code,
          permissions
        )
      `)
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const orgId = userData.org_id
    const roleCode = (userData.role as any)?.code || ''
    const techPerm = (userData.role as any)?.permissions?.technical || ''

    // Check permissions
    const isAdmin = roleCode === 'admin' || roleCode === 'super_admin' || roleCode === 'owner'
    const hasTechCreate = techPerm.includes('C')

    if (!isAdmin && !hasTechCreate) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Parse request body
    let body: any
    try {
      body = await request.json()
    } catch {
      return NextResponse.json(
        { error: 'INVALID_REQUEST', message: 'Invalid JSON body' },
        { status: 400 }
      )
    }

    // Validate request body
    const validation = createAlternativeSchema.safeParse(body)
    if (!validation.success) {
      const firstError = validation.error.errors[0]
      const errorCode = getErrorCode(firstError)
      return NextResponse.json(
        {
          error: errorCode,
          message: firstError.message,
          details: validation.error.errors,
        },
        { status: 400 }
      )
    }

    const { alternative_product_id, quantity, uom, preference_order, notes } = validation.data

    // Verify BOM exists and get product_id
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select('id, org_id, product_id')
      .eq('id', bomId)
      .single()

    if (bomError || !bom) {
      return NextResponse.json(
        { error: 'BOM_NOT_FOUND', message: 'BOM not found' },
        { status: 404 }
      )
    }

    if (bom.org_id !== orgId) {
      return NextResponse.json(
        { error: 'BOM_NOT_FOUND', message: 'BOM not found' },
        { status: 404 }
      )
    }

    // Verify BOM item exists and get product info
    const { data: item, error: itemError } = await supabase
      .from('bom_items')
      .select(`
        id,
        bom_id,
        product_id,
        product:products!product_id (
          id,
          type
        )
      `)
      .eq('id', itemId)
      .eq('bom_id', bomId)
      .single()

    if (itemError || !item) {
      return NextResponse.json(
        { error: 'ITEM_NOT_FOUND', message: 'BOM item not found' },
        { status: 404 }
      )
    }

    // Verify alternative product exists and get its type
    const { data: altProduct, error: altProductError } = await supabase
      .from('products')
      .select('id, code, name, type, org_id')
      .eq('id', alternative_product_id)
      .single()

    if (altProductError || !altProduct) {
      return NextResponse.json(
        { error: 'PRODUCT_NOT_FOUND', message: 'Alternative product not found' },
        { status: 404 }
      )
    }

    if (altProduct.org_id !== orgId) {
      return NextResponse.json(
        { error: 'PRODUCT_NOT_FOUND', message: 'Alternative product not found' },
        { status: 404 }
      )
    }

    // Validate: Cannot be same as primary product
    if (alternative_product_id === item.product_id) {
      return NextResponse.json(
        { error: 'SAME_AS_PRIMARY', message: 'Alternative cannot be same as primary component' },
        { status: 400 }
      )
    }

    // Validate: Cannot be same as BOM product (circular reference)
    if (alternative_product_id === bom.product_id) {
      return NextResponse.json(
        { error: 'CIRCULAR_REFERENCE', message: 'Cannot add BOM product as alternative' },
        { status: 400 }
      )
    }

    // Validate: Type must match
    const primaryType = (item.product as any)?.type
    if (primaryType && altProduct.type && primaryType !== altProduct.type) {
      return NextResponse.json(
        {
          error: 'TYPE_MISMATCH',
          message: `Alternative must be same product type as primary (${primaryType})`,
        },
        { status: 400 }
      )
    }

    // Check for duplicate alternative
    const { data: existingAlts } = await supabase
      .from('bom_alternatives')
      .select('id')
      .eq('bom_item_id', itemId)
      .eq('alternative_product_id', alternative_product_id)
      .eq('org_id', orgId)

    if (existingAlts && existingAlts.length > 0) {
      return NextResponse.json(
        { error: 'DUPLICATE_ALTERNATIVE', message: 'Alternative already exists for this item' },
        { status: 400 }
      )
    }

    // Determine preference order if not provided
    let finalPreferenceOrder = preference_order
    if (!finalPreferenceOrder) {
      const { data: maxOrderAlts } = await supabase
        .from('bom_alternatives')
        .select('preference_order')
        .eq('bom_item_id', itemId)
        .eq('org_id', orgId)
        .order('preference_order', { ascending: false })
        .limit(1)

      finalPreferenceOrder = maxOrderAlts && maxOrderAlts.length > 0
        ? maxOrderAlts[0].preference_order + 1
        : 2
    }

    // Create alternative
    const { data: newAlt, error: createError } = await supabase
      .from('bom_alternatives')
      .insert({
        bom_item_id: itemId,
        org_id: orgId,
        alternative_product_id,
        quantity,
        uom,
        preference_order: finalPreferenceOrder,
        notes: notes || null,
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating alternative:', createError)
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: 'DUPLICATE_ALTERNATIVE', message: 'Alternative already exists for this item' },
          { status: 400 }
        )
      }
      return NextResponse.json(
        { error: 'CREATE_FAILED', message: 'Failed to create alternative' },
        { status: 500 }
      )
    }

    const response: AlternativeResponse = {
      alternative: {
        id: newAlt.id,
        bom_item_id: newAlt.bom_item_id,
        alternative_product_id: newAlt.alternative_product_id,
        alternative_product_code: altProduct.code,
        alternative_product_name: altProduct.name,
        alternative_product_type: altProduct.type,
        quantity: newAlt.quantity,
        uom: newAlt.uom,
        preference_order: newAlt.preference_order,
        notes: newAlt.notes,
        created_at: newAlt.created_at,
      },
      message: 'Alternative created successfully',
    }

    return NextResponse.json(response, { status: 201 })
  } catch (error) {
    console.error('Unexpected error in POST alternative:', error)
    return NextResponse.json(
      { error: 'CREATE_FAILED', message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

/**
 * Map validation error to error code
 */
function getErrorCode(error: any): string {
  const path = error.path?.[0]
  const message = error.message?.toLowerCase() || ''

  if (path === 'quantity') {
    if (message.includes('greater than 0') || message.includes('positive')) {
      return 'INVALID_QUANTITY'
    }
    if (message.includes('decimal')) {
      return 'INVALID_QUANTITY'
    }
  }

  if (path === 'preference_order') {
    if (message.includes('2 or higher') || message.includes('reserved')) {
      return 'PREFERENCE_TOO_LOW'
    }
  }

  return 'INVALID_REQUEST'
}
