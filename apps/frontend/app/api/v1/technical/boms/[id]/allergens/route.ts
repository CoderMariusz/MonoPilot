/**
 * BOM Allergens Recalculation API Route (Story 02.3 - MVP)
 * POST /api/v1/technical/boms/:id/allergens
 *
 * Purpose: Recalculate allergen inheritance from BOM ingredients
 *
 * Algorithm (MVP - single-level):
 * 1. Get BOM items (ingredients)
 * 2. Fetch allergens from each ingredient (relation_type='contains' only)
 * 3. Aggregate unique allergens
 * 4. Upsert as auto-inherited (source='auto')
 * 5. Remove stale auto allergens
 * 6. Preserve manual allergens
 *
 * Authentication: Required
 * Authorization: Technical write permission (PROD_MANAGER, ADMIN, SUPER_ADMIN)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { ProductAllergenService } from '@/lib/services/product-allergen-service'

/**
 * POST /api/v1/technical/boms/:id/allergens
 * Recalculate allergen inheritance from BOM
 *
 * Returns:
 * - 200: RecalculateAllergensResponse
 * - 401: Unauthorized
 * - 403: Forbidden (insufficient permissions)
 * - 404: BOM not found
 * - 422: Incomplete ingredient allergen data
 * - 500: Internal Server Error
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const { id } = await params

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

    // Get BOM to find product_id
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select('id, product_id, version')
      .eq('id', id)
      .single()

    if (bomError || !bom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 })
    }

    // Recalculate allergen inheritance using service
    const response = await ProductAllergenService.calculateAllergenInheritance(
      supabase,
      id,
      bom.product_id,
      userData.org_id
    )

    return NextResponse.json(response, { status: 200 })
  } catch (error: any) {
    if (error.message === 'BOM not found') {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 })
    }

    if (error.message?.includes('incomplete.*ingredient')) {
      return NextResponse.json(
        {
          error: 'Some BOM ingredients have no allergen declarations',
          details: error.message,
        },
        { status: 422 }
      )
    }

    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
