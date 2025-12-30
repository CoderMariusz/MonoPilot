/**
 * Product Allergen DELETE Route (Story 02.3 - MVP)
 * DELETE /api/v1/technical/products/:id/allergens/:allergenId
 *
 * Purpose: Remove specific allergen declaration from product
 *
 * Authentication: Required
 * Authorization: Technical delete permission (PROD_MANAGER, ADMIN, SUPER_ADMIN)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { ProductAllergenService } from '@/lib/services/product-allergen-service'

/**
 * DELETE /api/v1/technical/products/:id/allergens/:allergenId
 * Remove allergen declaration from product
 *
 * Query params:
 * - relation_type?: 'contains' | 'may_contain' (optional filter)
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
  { params }: { params: Promise<{ id: string; allergenId: string }> }
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

    // Get optional relation_type filter from query params
    const searchParams = request.nextUrl.searchParams
    const relationType = searchParams.get('relation_type') as
      | 'contains'
      | 'may_contain'
      | undefined

    // Remove allergen using service
    await ProductAllergenService.removeProductAllergen(
      supabase,
      id,
      allergenId,
      relationType
    )

    return new NextResponse(null, { status: 204 })
  } catch (error: any) {
    console.error(
      'Error in DELETE /api/v1/technical/products/:id/allergens/:allergenId:',
      error
    )

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
