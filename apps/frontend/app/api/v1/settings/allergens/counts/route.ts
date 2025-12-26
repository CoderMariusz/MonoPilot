/**
 * API Route: Allergen Product Counts (Batch)
 * Story: TD-209 - Products Column in Allergens Table
 *
 * Endpoints:
 * - GET /api/v1/settings/allergens/counts - Get product counts for all allergens
 *
 * Returns product counts per allergen for the current user's organization.
 * Uses RPC function get_all_allergen_product_counts() for efficient batch query.
 */

import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * Response type for allergen counts
 */
interface AllergenCountResponse {
  allergen_id: string
  product_count: number
}

/**
 * GET /api/v1/settings/allergens/counts
 *
 * Returns product counts for all allergens in the user's organization.
 * Efficient batch query - single RPC call returns all counts.
 *
 * Response: 200 OK with array of { allergen_id, product_count }
 * Error: 401 Unauthorized if not authenticated
 *        500 Internal Server Error on database failure
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all allergen product counts using RPC function
    const { data, error } = await supabase
      .rpc('get_all_allergen_product_counts')

    if (error) {
      console.error('[Allergen Counts API] Failed to fetch counts:', error)
      return NextResponse.json(
        { error: 'Failed to fetch allergen counts', details: error.message },
        { status: 500 }
      )
    }

    // Transform to consistent response format
    const counts: AllergenCountResponse[] = (data || []).map((row: { allergen_id: string; product_count: number }) => ({
      allergen_id: row.allergen_id,
      product_count: row.product_count,
    }))

    return NextResponse.json(counts, { status: 200 })
  } catch (error) {
    console.error('[Allergen Counts API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/settings/allergens/counts
 *
 * Not supported - counts are derived data
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Counts are read-only derived data.' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}

/**
 * PUT /api/v1/settings/allergens/counts
 *
 * Not supported - counts are derived data
 */
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. Counts are read-only derived data.' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}

/**
 * DELETE /api/v1/settings/allergens/counts
 *
 * Not supported - counts are derived data
 */
export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Counts are read-only derived data.' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}
