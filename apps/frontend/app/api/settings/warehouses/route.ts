import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  createWarehouseSchema,
  warehouseFiltersSchema,
  type CreateWarehouseInput,
  type WarehouseFilters,
} from '@/lib/validation/warehouse-schemas'
import { ZodError } from 'zod'

/**
 * Warehouse API Routes (Legacy - redirects logic to V1 implementation style but keeps old response shape)
 * Story: 1.5 Warehouse Configuration
 * 
 * NOTE: New code should use /api/v1/settings/warehouses
 */

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to check role and org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check authorization
    // @ts-ignore
    const roleCode = currentUser.role?.code
    const allowedRoles = ['owner', 'admin', 'warehouse_manager', 'super_admin']
    // Case insensitive check for legacy reasons
    if (!allowedRoles.includes(roleCode?.toLowerCase())) {
      // Also check uppercase for safety if DB has mixed case
      if (!['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER'].includes(roleCode)) {
        return NextResponse.json(
          { error: 'Forbidden: Admin role required' },
          { status: 403 }
        )
      }
    }

    const orgId = currentUser.org_id

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const isActive = searchParams.get('is_active')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sort_by')
    const sortDirection = searchParams.get('sort_direction')

    // Build query
    let query = supabase
      .from('warehouses')
      .select('*', { count: 'exact' })
      .eq('org_id', orgId)

    // Apply search
    if (search) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
    }

    // Apply active filter
    if (isActive !== null && isActive !== undefined) {
      const activeBool = isActive === 'true'
      query = query.eq('is_active', activeBool)
    }

    // Apply sorting
    if (sortBy && ['code', 'name', 'type', 'location_count', 'created_at'].includes(sortBy)) {
      query = query.order(sortBy, { ascending: sortDirection === 'asc' })
    } else {
      query = query.order('created_at', { ascending: false })
    }

    // Execute
    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching warehouses:', error)
      return NextResponse.json({ error: 'Failed to fetch warehouses' }, { status: 500 })
    }

    return NextResponse.json(
      {
        warehouses: data || [],
        total: count || 0,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in GET /api/settings/warehouses:', error)
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user to check role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const orgId = currentUser.org_id
    // @ts-ignore
    const roleCode = currentUser.role?.code
    const allowedRoles = ['owner', 'admin', 'warehouse_manager', 'super_admin']

    if (!allowedRoles.includes(roleCode?.toLowerCase()) && !['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER'].includes(roleCode)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = createWarehouseSchema.parse(body)

    // Check uniqueness
    const { data: existing } = await supabase
      .from('warehouses')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', validatedData.code)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'Warehouse code already exists' },
        { status: 409 }
      )
    }

    // Create
    const { data: warehouse, error: createError } = await supabase
      .from('warehouses')
      .insert({
        org_id: orgId,
        code: validatedData.code,
        name: validatedData.name,
        type: validatedData.type || 'GENERAL',
        address: validatedData.address || null,
        contact_email: validatedData.contact_email || null,
        contact_phone: validatedData.contact_phone || null,
        is_active: validatedData.is_active ?? true,
        is_default: false,
        location_count: 0,
        created_by: session.user.id,
        updated_by: session.user.id
      })
      .select()
      .single()

    if (createError) {
      console.error('Error creating warehouse:', createError)
      return NextResponse.json(
        { error: 'Failed to create warehouse' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        warehouse: warehouse,
        message: 'Warehouse created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/settings/warehouses:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
