/**
 * API Route: /api/v1/settings/tax-codes
 * Story: 01.13 - Tax Codes CRUD
 * Methods: GET (list), POST (create)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { taxCodeCreateSchema } from '@/lib/validation/tax-code-schemas'
import { ZodError } from 'zod'

/**
 * GET /api/v1/settings/tax-codes
 * List tax codes with pagination, filtering, and search
 *
 * Query Parameters:
 * - search: Filter by code or name (min 2 chars)
 * - country_code: Filter by country (ISO 3166-1 alpha-2)
 * - status: Filter by status (active/expired/scheduled/all)
 * - sort: Sort field (code, name, rate, country_code, valid_from, created_at)
 * - order: Sort order (asc/desc)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
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
    const search = searchParams.get('search') || undefined
    const countryCode = searchParams.get('country_code') || undefined
    const statusFilter = searchParams.get('status') || 'all'
    const sort = searchParams.get('sort') || 'created_at'
    const order = searchParams.get('order') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    // Calculate today's date for status filtering
    const today = new Date().toISOString().split('T')[0]

    // Build count query
    let countQuery = supabase
      .from('tax_codes')
      .select('*', { count: 'exact', head: true })
      .eq('org_id', orgId)
      .eq('is_deleted', false)

    // Apply search filter to count
    if (search && search.length >= 2) {
      countQuery = countQuery.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
    }

    // Apply country filter to count
    if (countryCode) {
      countQuery = countQuery.eq('country_code', countryCode.toUpperCase())
    }

    // Apply status filter to count query (BEFORE pagination)
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        countQuery = countQuery.lte('valid_from', today).or(`valid_to.is.null,valid_to.gte.${today}`)
      } else if (statusFilter === 'expired') {
        countQuery = countQuery.lt('valid_to', today)
      } else if (statusFilter === 'scheduled') {
        countQuery = countQuery.gt('valid_from', today)
      }
    }

    // Execute count query
    const { count } = await countQuery

    // Build data query
    let dataQuery = supabase
      .from('tax_codes')
      .select('*')
      .eq('org_id', orgId)
      .eq('is_deleted', false)

    // Apply search filter to data
    if (search && search.length >= 2) {
      dataQuery = dataQuery.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
    }

    // Apply country filter to data
    if (countryCode) {
      dataQuery = dataQuery.eq('country_code', countryCode.toUpperCase())
    }

    // Apply status filter to data query (BEFORE pagination)
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        dataQuery = dataQuery.lte('valid_from', today).or(`valid_to.is.null,valid_to.gte.${today}`)
      } else if (statusFilter === 'expired') {
        dataQuery = dataQuery.lt('valid_to', today)
      } else if (statusFilter === 'scheduled') {
        dataQuery = dataQuery.gt('valid_from', today)
      }
    }

    // Apply sorting
    const validSortFields = ['code', 'name', 'rate', 'country_code', 'valid_from', 'created_at']
    const sortField = validSortFields.includes(sort) ? sort : 'created_at'
    dataQuery = dataQuery.order(sortField, { ascending: order === 'asc' })

    // Apply pagination
    const offset = (page - 1) * limit
    dataQuery = dataQuery.range(offset, offset + limit - 1)

    // Execute data query
    const { data: taxCodes, error } = await dataQuery

    if (error) {
      console.error('Failed to fetch tax codes:', error)
      return NextResponse.json({ error: 'Failed to fetch tax codes' }, { status: 500 })
    }

    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / limit) : 0

    return NextResponse.json({
      data: taxCodes || [],
      total: count || 0,
      page,
      limit,
      total_pages: totalPages,
    })
  } catch (error) {
    console.error('Error in GET /api/v1/settings/tax-codes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/v1/settings/tax-codes
 * Create new tax code
 *
 * Request Body:
 * - code: string (required, 2-20 chars, uppercase alphanumeric + hyphens)
 * - name: string (required, 2-100 chars)
 * - rate: number (required, 0-100, 2 decimals)
 * - country_code: string (required, 2 chars, uppercase ISO 3166-1 alpha-2)
 * - valid_from: string (required, YYYY-MM-DD)
 * - valid_to: string (optional, YYYY-MM-DD)
 * - is_default: boolean (optional, default: false)
 */
export async function POST(request: NextRequest) {
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
    const roleCode = (userData.role as any)?.code

    // Check permissions (ADMIN or SUPER_ADMIN only)
    if (!['ADMIN', 'SUPER_ADMIN'].includes(roleCode)) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()

    let validatedData
    try {
      validatedData = taxCodeCreateSchema.parse(body)
    } catch (error) {
      if (error instanceof ZodError) {
        return NextResponse.json(
          {
            error: 'Validation failed',
            details: error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            })),
          },
          { status: 400 }
        )
      }
      throw error
    }

    // Auto-uppercase code and country_code (redundant with DB trigger, but for safety)
    const code = validatedData.code.toUpperCase()
    const countryCode = validatedData.country_code.toUpperCase()

    // Check for duplicate code within same org and country
    const { data: existingCode, error: checkError } = await supabase
      .from('tax_codes')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', code)
      .eq('country_code', countryCode)
      .eq('is_deleted', false)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      // PGRST116 = not found (expected)
      console.error('Failed to check duplicate code:', checkError)
      return NextResponse.json({ error: 'Failed to check duplicate code' }, { status: 500 })
    }

    if (existingCode) {
      return NextResponse.json(
        { error: `Tax code "${code}" already exists for country ${countryCode}` },
        { status: 409 }
      )
    }

    // Create tax code
    const { data: taxCode, error: insertError } = await supabase
      .from('tax_codes')
      .insert({
        org_id: orgId,
        code,
        name: validatedData.name,
        rate: validatedData.rate,
        country_code: countryCode,
        valid_from: validatedData.valid_from,
        valid_to: validatedData.valid_to || null,
        is_default: validatedData.is_default || false,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Failed to create tax code:', insertError)
      return NextResponse.json({ error: 'Failed to create tax code' }, { status: 500 })
    }

    return NextResponse.json(taxCode, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/v1/settings/tax-codes:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
