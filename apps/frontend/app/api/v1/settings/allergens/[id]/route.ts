/**
 * API Route: Single Allergen
 * Story: 01.12 - Allergens Management
 *
 * Endpoints:
 * - GET /api/v1/settings/allergens/:id - Get allergen by ID
 * - PUT/DELETE - Return 405 (read-only enforcement)
 *
 * Acceptance Criteria:
 * - AC-AL-03: Returns single allergen by ID
 * - AC-RO-02: Read-only enforcement (405 for mutations)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * GET /api/v1/settings/allergens/:id
 *
 * Returns single allergen by ID.
 * NO org_id filter - allergens are global reference data.
 *
 * Response: 200 OK with allergen object
 * Error: 401 Unauthorized if not authenticated
 *        404 Not Found if allergen doesn't exist
 *        500 Internal Server Error on database failure
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { id } = params

    // Validate ID format (basic UUID check)
    if (!id || id.length === 0) {
      return NextResponse.json(
        { error: 'Invalid allergen ID' },
        { status: 400 }
      )
    }

    // Fetch single allergen (NO org_id filter - global data)
    // RLS policy: allergens_select_authenticated (is_active = true)
    const { data: allergen, error } = await supabase
      .from('allergens')
      .select('*')
      .eq('id', id)
      .eq('is_active', true)
      .single()

    if (error || !allergen) {
      console.error('[Allergens API] Allergen not found:', id, error)
      return NextResponse.json(
        { error: 'Allergen not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(allergen, { status: 200 })
  } catch (error) {
    console.error('[Allergens API] Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/v1/settings/allergens/:id
 *
 * AC-RO-02: Read-only enforcement
 * Returns 405 Method Not Allowed
 */
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed. EU allergens are read-only in MVP.' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}

/**
 * DELETE /api/v1/settings/allergens/:id
 *
 * AC-RO-02: Read-only enforcement
 * Returns 405 Method Not Allowed
 */
export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. EU allergens are read-only in MVP.' },
    { status: 405, headers: { 'Allow': 'GET' } }
  )
}
