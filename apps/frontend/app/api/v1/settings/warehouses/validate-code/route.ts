/**
 * API Route: /api/v1/settings/warehouses/validate-code
 * Story: 01.8 - Warehouses CRUD
 * Method: GET
 *
 * Real-time code uniqueness validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'

// Code format regex: 2-20 uppercase alphanumeric characters with hyphens
const CODE_REGEX = /^[A-Z0-9-]{2,20}$/

/**
 * GET /api/v1/settings/warehouses/validate-code
 * Validate warehouse code uniqueness and format
 *
 * Query Parameters:
 * - code: string (required) - Code to validate
 * - exclude_id: string (optional) - Warehouse ID to exclude (for edit mode)
 *
 * Returns:
 * - { available: boolean, message?: string }
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
      return NextResponse.json(
        { error: 'Code parameter is required' },
        { status: 400 }
      )
    }

    // Normalize code to uppercase
    const normalizedCode = code.toUpperCase()

    // Validate code format
    if (!CODE_REGEX.test(normalizedCode)) {
      return NextResponse.json(
        {
          available: false,
          message: 'Code must be 2-20 uppercase alphanumeric characters with hyphens only',
          code: 'INVALID_CODE_FORMAT',
        },
        { status: 400 }
      )
    }

    // Check if code exists
    let query = supabase
      .from('warehouses')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', normalizedCode)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data: existingWarehouses, error } = await query

    if (error) {
      console.error('Failed to validate warehouse code:', error)
      return NextResponse.json(
        { error: 'Failed to validate code' },
        { status: 500 }
      )
    }

    const available = !existingWarehouses || existingWarehouses.length === 0

    return NextResponse.json({
      available,
      code: normalizedCode,
      message: available ? undefined : 'Warehouse code already exists',
    })
  } catch (error) {
    console.error('Error in GET /api/v1/settings/warehouses/validate-code:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
