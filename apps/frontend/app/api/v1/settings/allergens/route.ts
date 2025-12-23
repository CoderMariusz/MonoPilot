/**
 * API Route: Allergens List
 * Story: 01.12 - Allergens Management
 *
 * Endpoints:
 * - GET /api/v1/settings/allergens - List all 14 EU allergens (global, read-only)
 * - POST/PUT/DELETE - Return 405 (read-only enforcement)
 *
 * Acceptance Criteria:
 * - AC-AL-01: Returns 14 EU allergens sorted by display_order
 * - AC-AL-02: Performance < 200ms
 * - AC-RO-01: Read-only enforcement (405 for mutations)
 * - AC-ML-01: Multi-language support (EN, PL, DE, FR)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * GET /api/v1/settings/allergens
 *
 * Returns all active EU allergens sorted by display_order.
 * NO org_id filter - allergens are global reference data.
 *
 * Response: 200 OK with array of 14 allergens
 * Error: 401 Unauthorized if not authenticated
 *        500 Internal Server Error on database failure
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Auth check - required for RLS policy
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch all active allergens (NO org_id filter - global data)
    // RLS policy: allergens_select_authenticated (is_active = true)
    const { data: allergens, error } = await supabase
      .from('allergens')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('[Allergens API] Failed to fetch allergens:', error)
      return NextResponse.json(
        { error: 'Failed to fetch allergens', details: error.message },
        { status: 500 }
      )
    }

    // AC-AL-01: Should return 14 EU allergens
    return NextResponse.json(allergens || [], { status: 200 })
  } catch (error) {
    console.error('[Allergens API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/settings/allergens
 *
 * AC-RO-01: Read-only enforcement
 * Returns 405 Method Not Allowed
 */
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. EU allergens are read-only in MVP.' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}

/**
 * PUT /api/v1/settings/allergens
 *
 * AC-RO-01: Read-only enforcement
 * Returns 405 Method Not Allowed
 */
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. EU allergens are read-only in MVP.' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}

/**
 * DELETE /api/v1/settings/allergens
 *
 * AC-RO-01: Read-only enforcement
 * Returns 405 Method Not Allowed
 */
export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. EU allergens are read-only in MVP.' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}
