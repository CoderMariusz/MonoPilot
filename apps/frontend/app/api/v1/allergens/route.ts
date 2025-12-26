/**
 * Allergens API Route (Story 02.3 - MVP)
 * GET /api/v1/allergens
 *
 * Purpose: List all allergens for dropdowns (EU 14 from Settings 01.12)
 *
 * Authentication: Required (any authenticated user)
 * Authorization: Read-only (no permission check needed - global reference data)
 *
 * Returns: AllergensListResponse
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * GET /api/v1/allergens
 * List all active allergens (EU 14 from Settings story 01.12)
 *
 * Query params:
 * - lang: string (optional) - Language preference: en|pl|de|fr
 *
 * Returns:
 * - 200: { allergens: Allergen[] }
 * - 401: { error: "Unauthorized" }
 * - 500: { error: "Internal Server Error" }
 */
export async function GET(request: NextRequest) {
  try {
    // Create Supabase client
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch active allergens (global reference data - no org filter)
    const { data: allergens, error } = await supabase
      .from('allergens')
      .select(
        `
        id,
        code,
        name_en,
        name_pl,
        name_de,
        name_fr,
        icon_url,
        is_eu_mandatory,
        is_active,
        display_order
      `
      )
      .eq('is_active', true)
      .order('display_order')

    if (error) {
      console.error('Error fetching allergens:', error)
      return NextResponse.json(
        { error: 'Failed to fetch allergens' },
        { status: 500 }
      )
    }

    return NextResponse.json({ allergens: allergens || [] }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error in GET /api/v1/allergens:', error)
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    )
  }
}
