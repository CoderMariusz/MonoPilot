/**
 * API Route: Single Allergen Product Count
 * Story: TD-209 - Products Column in Allergens Table
 *
 * Endpoints:
 * - GET /api/v1/settings/allergens/[id]/count - Get product count for single allergen
 *
 * Returns product count for a specific allergen in the current user's organization.
 * Uses RPC function get_allergen_product_count(UUID) for single allergen lookup.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * GET /api/v1/settings/allergens/[id]/count
 *
 * Returns product count for a specific allergen in the user's organization.
 *
 * Response: 200 OK with { allergen_id, product_count }
 * Error: 400 Bad Request if invalid UUID
 *        401 Unauthorized if not authenticated
 *        404 Not Found if allergen doesn't exist
 *        500 Internal Server Error on database failure
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: allergenId } = await params
    const supabase = await createServerSupabase()

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(allergenId)) {
      return NextResponse.json(
        { error: 'Invalid allergen ID format. Must be a valid UUID.' },
        { status: 400 }
      )
    }

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify allergen exists
    const { data: allergen, error: allergenError } = await supabase
      .from('allergens')
      .select('id')
      .eq('id', allergenId)
      .eq('is_active', true)
      .single()

    if (allergenError || !allergen) {
      return NextResponse.json(
        { error: 'Allergen not found' },
        { status: 404 }
      )
    }

    // Get product count using RPC function
    const { data: count, error: rpcError } = await supabase
      .rpc('get_allergen_product_count', { p_allergen_id: allergenId })

    if (rpcError) {
      console.error('[Allergen Count API] Failed to fetch count:', rpcError)
      return NextResponse.json(
        { error: 'Failed to fetch product count', details: rpcError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      allergen_id: allergenId,
      product_count: count ?? 0,
    }, { status: 200 })
  } catch (error) {
    console.error('[Allergen Count API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/settings/allergens/[id]/count
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
 * PUT /api/v1/settings/allergens/[id]/count
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
 * DELETE /api/v1/settings/allergens/[id]/count
 *
 * Not supported - counts are derived data
 */
export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Counts are read-only derived data.' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}
