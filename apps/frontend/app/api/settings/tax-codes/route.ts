import { NextRequest, NextResponse } from 'next/server'
import { listTaxCodes, createTaxCode } from '@/lib/services/tax-code-service'
import { taxCodeCreateSchema } from '@/lib/validation/tax-code-schemas'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'

/**
 * GET /api/settings/tax-codes
 * List tax codes with optional filters
 * AC-009.3: Tax codes list view
 *
 * Query params:
 * - search: filter by code or description
 * - sort_by: code|description|rate
 * - sort_direction: asc|desc
 *
 * Auth: Authenticated users (RLS enforces org isolation)
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Extract query params
    const searchParams = request.nextUrl.searchParams
    const filters = {
      search: searchParams.get('search') || undefined,
      sort_by: (searchParams.get('sort_by') as 'code' | 'name' | 'rate') || undefined,
      sort_direction: (searchParams.get('sort_direction') as 'asc' | 'desc') || undefined,
    }

    // Fetch tax codes
    const result = await listTaxCodes(filters)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      taxCodes: result.data,
      total: result.total,
    })
  } catch (error) {
    console.error('Error in GET /api/settings/tax-codes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings/tax-codes
 * Create a new tax code
 * AC-009.2: Admin can add custom tax codes
 *
 * Body: { code, description, rate }
 *
 * Auth: Admin only
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin role using admin client to bypass RLS
    const supabaseAdmin = createServerSupabaseAdmin()
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('role:roles(code)')
      .eq('id', user.id)
      .single()

    if (userError || !userData) {
      console.error('[Tax Codes API POST] User not found:', { userId: user.id, userError })
      return NextResponse.json(
        {
          error: 'Forbidden - User role not found',
          details: userError?.message || 'No user record found in public.users',
          code: userError?.code
        },
        { status: 403 }
      )
    }

    const roleData = userData.role as any
    const role = (
      typeof roleData === 'string'
        ? roleData
        : Array.isArray(roleData)
          ? roleData[0]?.code
          : roleData?.code
    )?.toLowerCase()
    const allowedRoles = ['admin', 'owner', 'super_admin', 'superadmin']

    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = taxCodeCreateSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    // Create tax code
    const result = await createTaxCode(validationResult.data)

    if (!result.success) {
      // Handle specific error codes
      if (result.code === 'DUPLICATE_CODE') {
        return NextResponse.json(
          { error: result.error },
          { status: 409 } // Conflict
        )
      }

      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json(result.data, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/settings/tax-codes:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
