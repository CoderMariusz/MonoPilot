/**
 * API Route: /api/v1/settings/warehouses
 * Story: 01.8 - Warehouses CRUD
 * Methods: GET (list), POST (create)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { createWarehouseSchema } from '@/lib/validation/warehouse-schemas'
import { ZodError } from 'zod'
import { getAuthContext, checkPermission, validateOrigin } from '@/lib/api/auth-helpers'

/**
 * Sanitize search input to prevent SQL injection via LIKE/ILIKE wildcards
 * Escapes %, _, and \ characters which have special meaning in LIKE patterns
 */
function sanitizeSearchInput(input: string): string {
  return input.replace(/[%_\\]/g, '\\$&')
}

/**
 * GET /api/v1/settings/warehouses
 * List warehouses with pagination, filtering, and search
 *
 * Query Parameters:
 * - search: Filter by code or name (min 2 chars)
 * - type: Filter by warehouse type (GENERAL, RAW_MATERIALS, WIP, FINISHED_GOODS, QUARANTINE)
 * - status: Filter by status (active, disabled)
 * - sort: Sort field (code, name, type, location_count, created_at)
 * - order: Sort order (asc, desc)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 20, max: 100)
 *
 * Performance Target: < 300ms
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
    const search = searchParams.get('search') || undefined
    const type = searchParams.get('type') || undefined
    const status = searchParams.get('status') || undefined
    const sort = searchParams.get('sort') || 'code'
    const order = searchParams.get('order') || 'asc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100)

    // Build query
    let query = supabase
      .from('warehouses')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)

    // Apply search filter (code or name)
    // Sanitize input to prevent SQL injection via LIKE wildcards
    if (search && search.length >= 2) {
      const sanitizedSearch = sanitizeSearchInput(search)
      query = query.or(`code.ilike.%${sanitizedSearch}%,name.ilike.%${sanitizedSearch}%`)
    }

    // Apply type filter
    if (type) {
      query = query.eq('type', type)
    }

    // Apply status filter
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'disabled') {
      query = query.eq('is_active', false)
    }

    // Apply sorting
    const validSortFields = ['code', 'name', 'type', 'location_count', 'created_at']
    const sortField = validSortFields.includes(sort) ? sort : 'code'
    query = query.order(sortField, { ascending: order === 'asc' })

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data: warehouses, error, count } = await query

    if (error) {
      console.error('Failed to fetch warehouses:', error)
      return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 })
    }

    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / limit) : 0

    return NextResponse.json({
      data: warehouses || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: totalPages,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/v1/settings/warehouses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/v1/settings/warehouses
 * Create new warehouse
 *
 * Request Body:
 * - code: string (required, 2-20 chars, uppercase alphanumeric + hyphens)
 * - name: string (required, 2-100 chars)
 * - type: WarehouseType (default: GENERAL)
 * - address: string (optional, max 500 chars)
 * - contact_email: string (optional, email format)
 * - contact_phone: string (optional, max 20 chars)
 * - is_active: boolean (default: true)
 *
 * Performance Target: < 1s
 * Permission: SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER
 */
export async function POST(request: NextRequest) {
  try {
    // CSRF protection: validate request origin
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

    // Check role permissions
    const allowedRoles = ['owner', 'admin', 'warehouse_manager']
    const permissionError = checkPermission(authContext, allowedRoles)
    if (permissionError) {
      return permissionError
    }

    const { userId, orgId } = authContext

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createWarehouseSchema.parse(body)

    // Check code uniqueness
    const { data: existingWarehouse } = await supabase
      .from('warehouses')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', validatedData.code)
      .single()

    if (existingWarehouse) {
      return NextResponse.json(
        { error: 'Warehouse code already exists', code: 'DUPLICATE_CODE' },
        { status: 409 }
      )
    }

    // Create warehouse
    const { data: warehouse, error: createError } = await supabase
      .from('warehouses')
      .insert({
        org_id: orgId,
        code: validatedData.code,
        name: validatedData.name,
        type: validatedData.type,
        address: validatedData.address || null,
        contact_email: validatedData.contact_email || null,
        contact_phone: validatedData.contact_phone || null,
        is_active: validatedData.is_active,
        is_default: false,
        location_count: 0,
        created_by: userId,
        updated_by: userId,
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create warehouse:', createError)
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: 'Warehouse code already exists', code: 'DUPLICATE_CODE' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: 'Failed to create warehouse' }, { status: 500 })
    }

    return NextResponse.json(warehouse, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/v1/settings/warehouses:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
