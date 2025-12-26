/**
 * API Route: /api/v1/settings/tax-codes/validate-code
 * Story: 01.13 - Tax Codes CRUD
 * Methods: GET (check uniqueness)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

/**
 * GET /api/v1/settings/tax-codes/validate-code
 * Check if tax code is available (unique)
 *
 * Query Parameters:
 * - code: string (required)
 * - country_code: string (required)
 * - exclude_id: string (optional) - exclude this tax code ID from check
 *
 * Response: { available: boolean }
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

    // Get user's org_id and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 })
    }

    const orgId = userData.org_id
    // Role can be object or array depending on Supabase query
    const roleData = userData.role as any
    const userRole = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code

    // Check permissions - use lowercase role codes as stored in DB
    if (!['owner', 'admin'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const code = searchParams.get('code')
    const countryCode = searchParams.get('country_code')
    const excludeId = searchParams.get('exclude_id')

    if (!code || !countryCode) {
      return NextResponse.json(
        { error: 'Code and country_code required' },
        { status: 400 }
      )
    }

    // Build query
    let query = supabase
      .from('tax_codes')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', code.toUpperCase())
      .eq('country_code', countryCode.toUpperCase())
      .eq('is_deleted', false)

    // Exclude specific tax code if provided
    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query.single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 = not found (expected for available codes)
      console.error('Failed to validate tax code:', error)
      return NextResponse.json({ error: 'Failed to validate tax code' }, { status: 500 })
    }

    // If data exists, code is NOT available
    const available = !data

    return NextResponse.json({ available })
  } catch (error) {
    console.error('Error in GET /api/v1/settings/tax-codes/validate-code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
