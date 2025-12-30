/**
 * Product Allergens API Route (Story 02.3 - MVP)
 * GET/POST/DELETE /api/v1/technical/products/:id/allergens
 *
 * Purpose: CRUD operations for product allergen declarations
 *
 * Authentication: Required
 * Authorization:
 * - GET: Any authenticated user
 * - POST/DELETE: Technical write permission (PROD_MANAGER, ADMIN, SUPER_ADMIN)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { ProductAllergenService } from '@/lib/services/product-allergen-service'
import { addProductAllergenSchema } from '@/lib/validation/product-allergen-schema'
import { ZodError } from 'zod'

/**
 * GET /api/v1/technical/products/:id/allergens
 * List all allergen declarations for a product
 *
 * Returns:
 * - 200: ProductAllergensResponse
 * - 401: Unauthorized
 * - 404: Product not found
 * - 500: Internal Server Error
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get product allergens using service
    const response = await ProductAllergenService.getProductAllergens(
      supabase,
      (await params).id
    )

    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    console.error('Error in GET /api/v1/technical/products/:id/allergens:', error)

    if (error.message === 'Product not found') {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/technical/products/:id/allergens
 * Add manual allergen declaration to product
 *
 * Body: AddProductAllergenRequest
 * - allergen_id: string (UUID)
 * - relation_type: 'contains' | 'may_contain'
 * - reason?: string (required for may_contain, min 10 chars)
 *
 * Returns:
 * - 201: ProductAllergen
 * - 400: Validation error
 * - 401: Unauthorized
 * - 403: Forbidden (insufficient permissions)
 * - 404: Product not found
 * - 409: Duplicate allergen declaration
 * - 500: Internal Server Error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user org_id and check permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(
        `
        org_id,
        role:roles (
          code,
          permissions
        )
      `
      )
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check Technical write permission (C or U)
    const techPerm = (userData.role as any)?.permissions?.technical || ''
    if (!techPerm.includes('C') && !techPerm.includes('U')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validated = addProductAllergenSchema.parse(body)

    // Add allergen using service
    const allergen = await ProductAllergenService.addProductAllergen(
      supabase,
      (await params).id,
      userData.org_id,
      user.id,
      validated
    )

    return NextResponse.json(allergen, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/v1/technical/products/:id/allergens:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.errors },
        { status: 400 }
      )
    }

    if (error.message?.includes('already declared')) {
      return NextResponse.json(
        { error: error.message },
        { status: 409 }
      )
    }

    if (error.message === 'Invalid allergen ID') {
      return NextResponse.json(
        { error: 'Invalid allergen ID' },
        { status: 400 }
      )
    }

    if (error.message?.includes('reason.*required.*may contain')) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/v1/technical/products/:id/allergens/:allergenId
 * Remove allergen declaration from product
 *
 * Query params:
 * - relation_type?: 'contains' | 'may_contain' (filter by relation type)
 *
 * Returns:
 * - 204: No content (success)
 * - 401: Unauthorized
 * - 403: Forbidden (insufficient permissions)
 * - 404: Allergen declaration not found
 * - 500: Internal Server Error
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user permissions
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(
        `
        role:roles (
          code,
          permissions
        )
      `
      )
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check Technical write permission (D)
    const techPerm = (userData.role as any)?.permissions?.technical || ''
    if (!techPerm.includes('D')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get allergenId from URL path (parse manually)
    const urlParts = request.nextUrl.pathname.split('/')
    const allergenRecordId = urlParts[urlParts.length - 1]

    // Get optional relation_type filter from query params
    const searchParams = request.nextUrl.searchParams
    const relationType = searchParams.get('relation_type') as
      | 'contains'
      | 'may_contain'
      | undefined

    // Remove allergen using service
    await ProductAllergenService.removeProductAllergen(
      supabase,
      (await params).id,
      allergenRecordId,
      relationType
    )

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    console.error('Error in DELETE /api/v1/technical/products/:id/allergens/:allergenId:', error)

    if (error.message === 'Allergen declaration not found') {
      return NextResponse.json(
        { error: 'Allergen declaration not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
