/**
 * API Route: /api/v1/settings/machines
 * Story: 01.10 - Machines CRUD
 * Methods: GET (list), POST (create)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { machineCreateSchema } from '@/lib/validation/machine-schemas'
import { ZodError } from 'zod'

/**
 * GET /api/v1/settings/machines
 * List machines with pagination, filtering, and search
 *
 * Query Parameters:
 * - search: Filter by code or name
 * - type: Filter by machine type (9 types)
 * - status: Filter by status (ACTIVE, MAINTENANCE, OFFLINE, DECOMMISSIONED)
 * - location_id: Filter by location UUID
 * - sortBy: Sort field (code, name, type, status, created_at)
 * - sortOrder: Sort order (asc/desc)
 * - page: Page number (default: 1)
 * - limit: Items per page (default: 25, max: 100)
 *
 * Performance Target: < 300ms for 100 machines
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
    const type = searchParams.get('type') || undefined
    const status = searchParams.get('status') || undefined
    const location_id = searchParams.get('location_id') || undefined
    const sortBy = searchParams.get('sortBy') || 'code'
    const sortOrder = searchParams.get('sortOrder') || 'asc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '25'), 100)

    // Build query
    let query = supabase
      .from('machines')
      .select(
        `
        *,
        location:locations(
          id,
          code,
          name,
          full_path,
          warehouse_id
        )
      `,
        { count: 'exact' }
      )
      .eq('org_id', orgId)
      .eq('is_deleted', false)

    // Apply search filter (code or name)
    if (search) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
    }

    // Apply type filter
    if (type) {
      query = query.eq('type', type)
    }

    // Apply status filter
    if (status) {
      query = query.eq('status', status)
    }

    // Apply location filter
    if (location_id) {
      query = query.eq('location_id', location_id)
    }

    // Apply sorting
    const validSortFields = ['code', 'name', 'type', 'status', 'created_at']
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'code'
    query = query.order(sortField, { ascending: sortOrder === 'asc' })

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    // Execute query
    const { data: machines, error, count } = await query

    if (error) {
      console.error('Failed to fetch machines:', error)
      return NextResponse.json({ error: 'Failed to fetch machines' }, { status: 500 })
    }

    // Calculate pagination metadata
    const totalPages = count ? Math.ceil(count / limit) : 0

    return NextResponse.json({
      data: machines || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: totalPages,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/v1/settings/machines:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/v1/settings/machines
 * Create new machine
 *
 * Request Body:
 * - code: string (required, uppercase alphanumeric + hyphens, max 50 chars)
 * - name: string (required, max 100 chars)
 * - description: string (optional, max 500 chars)
 * - type: MachineType (required, 9 types)
 * - status: MachineStatus (optional, default: ACTIVE)
 * - units_per_hour: number (optional, integer >= 0)
 * - setup_time_minutes: number (optional, integer >= 0)
 * - max_batch_size: number (optional, integer >= 0)
 * - location_id: string (optional, UUID)
 *
 * Performance Target: < 500ms
 * Permission: PROD_MANAGER+
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
    // Role can be object or array depending on Supabase query
    const roleData = userData.role as any
    const userRole = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code

    // Check role permissions - use lowercase role codes as stored in DB
    if (!['owner', 'admin', 'production_manager'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = machineCreateSchema.parse(body)

    // Check code uniqueness
    const { data: existingMachine } = await supabase
      .from('machines')
      .select('id')
      .eq('org_id', orgId)
      .eq('code', validatedData.code)
      .eq('is_deleted', false)
      .single()

    if (existingMachine) {
      return NextResponse.json({ error: 'Machine code must be unique' }, { status: 409 })
    }

    // Create machine
    const { data: machine, error: createError } = await supabase
      .from('machines')
      .insert({
        org_id: orgId,
        code: validatedData.code,
        name: validatedData.name,
        description: validatedData.description || null,
        type: validatedData.type,
        status: validatedData.status || 'ACTIVE',
        units_per_hour: validatedData.units_per_hour || null,
        setup_time_minutes: validatedData.setup_time_minutes || null,
        max_batch_size: validatedData.max_batch_size || null,
        location_id: validatedData.location_id || null,
        is_deleted: false,
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (createError) {
      console.error('Failed to create machine:', createError)
      if (createError.code === '23505') {
        return NextResponse.json({ error: 'Machine code must be unique' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to create machine' }, { status: 500 })
    }

    return NextResponse.json(machine, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in POST /api/v1/settings/machines:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
