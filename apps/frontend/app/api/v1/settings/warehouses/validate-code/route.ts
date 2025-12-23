/**
 * API Route: /api/v1/settings/warehouses/validate-code
 * Story: 01.8 - Warehouses CRUD
 * Method: GET (validate code uniqueness)
 *
 * Check if warehouse code is available (for real-time validation)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * GET /api/v1/settings/warehouses/validate-code
 * Check if warehouse code is available
 *
 * Query Parameters:
 * - code: string (required) - Warehouse code to validate
 * - exclude_id: UUID (optional) - Exclude this warehouse ID (for edit mode)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const orgId = userData.org_id

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const excludeId = searchParams.get('exclude_id') || undefined

    if (!code) {
      return NextResponse.json({ error: 'Code parameter is required' }, { status: 400 })
    }

    // Validate code format
    const codeRegex = /^[A-Z0-9-]{2,20}$/
    if (!codeRegex.test(code.toUpperCase())) {
      return NextResponse.json(
        {
          available: false,
          message: 'Code must be 2-20 uppercase alphanumeric characters with hyphens only',
        },
        { status: 200 }
      )
    }

    // Check code availability
    let query = supabase
      .from('warehouses')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', code.toUpperCase())

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data: existingWarehouse } = await query.single()

    return NextResponse.json({
      available: !existingWarehouse,
    })
  } catch (error) {
    console.error('Error in GET /api/v1/settings/warehouses/validate-code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
