/**
 * API Route: Customer Management
 * Story: 07.1 - Customers CRUD
 *
 * GET /api/shipping/customers - List customers with filters and pagination
 * POST /api/shipping/customers - Create new customer
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  createCustomerSchema,
  customerListQuerySchema,
} from '@/lib/validation/customer-schemas'
import {
  listCustomers,
  createCustomer,
} from '@/lib/services/customer-service'
import { ZodError } from 'zod'
import { getAuthContext, checkPermission, validateOrigin } from '@/lib/api/auth-helpers'

/**
 * Sanitize search input to prevent SQL injection via LIKE wildcards
 */
function sanitizeSearchInput(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&')
}

/**
 * GET /api/shipping/customers
 * List customers with filters, search, and pagination
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { orgId } = authContext

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const queryParams = {
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      category: searchParams.get('category') ?? undefined,
      is_active: searchParams.get('is_active') ?? undefined,
      sort_by: searchParams.get('sort_by') ?? undefined,
      sort_order: searchParams.get('sort_order') ?? undefined,
    }

    // Validate query parameters
    const validatedParams = customerListQuerySchema.parse(queryParams)

    const { page = 1, limit = 50, search, category, is_active, sort_by = 'created_at', sort_order = 'asc' } = validatedParams

    // Build query with explicit org_id filter
    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)

    // Apply search filter
    if (search) {
      const sanitized = sanitizeSearchInput(search)
      query = query.or(`customer_code.ilike.%${sanitized}%,name.ilike.%${sanitized}%`)
    }

    // Apply category filter
    if (category) {
      query = query.eq('category', category)
    }

    // Apply is_active filter
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active)
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' })

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Failed to fetch customers:', error)
      return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 })
    }

    const total = count ?? 0
    const pages = Math.ceil(total / limit)

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total,
        pages,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/shipping/customers:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}

/**
 * POST /api/shipping/customers
 * Create a new customer
 */
export async function POST(request: NextRequest) {
  try {
    // CSRF protection
    const originError = validateOrigin(request)
    if (originError) {
      return originError
    }

    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    // Check role permissions (admin, manager, sales can create)
    const allowedRoles = ['owner', 'admin', 'manager', 'sales']
    const permissionError = checkPermission(authContext, allowedRoles)
    if (permissionError) {
      return permissionError
    }

    const { userId, orgId } = authContext

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createCustomerSchema.parse(body)

    // Validate customer code format
    if (!/^[A-Za-z0-9_-]+$/.test(validatedData.customer_code)) {
      return NextResponse.json(
        { error: 'Invalid character in customer_code', code: 'INVALID_CODE' },
        { status: 400 }
      )
    }

    // Validate allergen IDs if provided
    if (validatedData.allergen_restrictions && validatedData.allergen_restrictions.length > 0) {
      const { data: allergens } = await supabase
        .from('allergens')
        .select('id')
        .in('id', validatedData.allergen_restrictions)

      if (!allergens || allergens.length !== validatedData.allergen_restrictions.length) {
        return NextResponse.json(
          { error: 'Invalid allergen ID', code: 'INVALID_ALLERGEN' },
          { status: 400 }
        )
      }
    }

    // Check code uniqueness
    const normalizedCode = validatedData.customer_code.toUpperCase()
    const { data: existing } = await supabase
      .from('customers')
      .select('id')
      .eq('org_id', orgId)
      .ilike('customer_code', normalizedCode)
      .single()

    if (existing) {
      return NextResponse.json(
        { message: 'Customer code already exists in organization', code: 'DUPLICATE_CODE' },
        { status: 409 }
      )
    }

    // Create customer
    const { data: customer, error: createError } = await supabase
      .from('customers')
      .insert({
        org_id: orgId,
        customer_code: normalizedCode,
        name: validatedData.name,
        category: validatedData.category,
        email: validatedData.email ?? null,
        phone: validatedData.phone ?? null,
        tax_id: validatedData.tax_id ?? null,
        credit_limit: validatedData.credit_limit ?? null,
        payment_terms_days: validatedData.payment_terms_days ?? 30,
        allergen_restrictions: validatedData.allergen_restrictions && validatedData.allergen_restrictions.length > 0
          ? validatedData.allergen_restrictions
          : null,
        is_active: validatedData.is_active ?? true,
        notes: validatedData.notes ?? null,
        created_by: userId,
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create customer:', createError)
      if (createError.code === '23505') {
        return NextResponse.json(
          { message: 'Customer code already exists in organization', code: 'DUPLICATE_CODE' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: 'Failed to create customer' }, { status: 500 })
    }

    return NextResponse.json(customer, { status: 201 })
  } catch (error) {
    // Safely log error (Zod errors may have non-serializable properties)
    console.error('Error in POST /api/shipping/customers:', error instanceof Error ? error.message : 'Unknown error')

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: error.errors,
        },
        { status: 400 }
      )
    }

    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    if (errorMessage.includes('already exists')) {
      return NextResponse.json(
        {
          message: 'Customer code already exists in organization',
          code: 'DUPLICATE_CODE',
        },
        { status: 409 }
      )
    }

    return NextResponse.json(
      {
        error: 'An unexpected error occurred',
      },
      { status: 500 }
    )
  }
}
