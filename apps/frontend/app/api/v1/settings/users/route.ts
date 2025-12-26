/**
 * User Management API Routes
 * Story: 01.5a - User Management CRUD (MVP)
 *
 * GET /api/v1/settings/users - List users with pagination/search/filter
 * POST /api/v1/settings/users - Create new user
 */
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { CreateUserSchema } from '@/lib/validation/user-schemas'
import type { User } from '@/lib/types/user'

/**
 * GET /api/v1/settings/users
 * List users with pagination, search, and filters
 *
 * Query params:
 * - page: number (default: 1)
 * - limit: number (default: 25, max: 100)
 * - search: string (search by name or email)
 * - role: string (filter by role code)
 * - status: 'active' | 'inactive'
 * - sortBy: string (default: created_at)
 * - sortOrder: 'asc' | 'desc' (default: desc)
 */
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabase()
    const { searchParams } = new URL(request.url)

    // Get current user for org context
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id
    const { data: userData } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', authUser.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions (SUPER_ADMIN, ADMIN, or VIEWER)
    const allowedRoles = ['owner', 'admin', 'viewer']
    // Role can be object or array depending on Supabase query
    const roleData = userData.role as any
    const roleCode = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code
    if (!allowedRoles.includes(roleCode || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse query params
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25')))
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'created_at'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Build query
    let query = supabase
      .from('users')
      .select(`
        id,
        org_id,
        email,
        first_name,
        last_name,
        role_id,
        role:roles(id, code, name),
        language,
        is_active,
        last_login_at,
        created_at,
        updated_at
      `, { count: 'exact' })
      .eq('org_id', userData.org_id)

    // Apply search filter
    if (search) {
      query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`)
    }

    // Apply role filter
    if (role) {
      query = query.eq('role.code', role)
    }

    // Apply status filter
    if (status) {
      query = query.eq('is_active', status === 'active')
    }

    // Apply pagination
    const offset = (page - 1) * limit
    const end = page * limit - 1

    // Execute query with ordering
    const { data: users, count, error } = await query
      .range(offset, end)
      .order(sortBy, { ascending: sortOrder === 'asc' })

    if (error) {
      console.error('Error fetching users:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      users,
      total: count || 0,
      page,
      limit,
    })
  } catch (error: any) {
    console.error('Unexpected error in GET /api/v1/settings/users:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/v1/settings/users
 * Create new user
 *
 * Body:
 * - email: string (required, email format)
 * - first_name: string (required, 1-100 chars)
 * - last_name: string (required, 1-100 chars)
 * - role_id: UUID (required, valid system role)
 * - language: 'pl' | 'en' | 'de' | 'fr' (optional, default: 'en')
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabase()

    // Get current user for org context
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()
    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id and role
    const { data: userData } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', authUser.id)
      .single()

    if (!userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions (only SUPER_ADMIN and ADMIN can create users)
    const allowedRoles = ['owner', 'admin']
    // Role can be object or array depending on Supabase query
    const roleData = userData.role as any
    const roleCode = Array.isArray(roleData) ? roleData[0]?.code : roleData?.code
    if (!allowedRoles.includes(roleCode || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Parse and validate request body
    let body: any
    try {
      body = await request.json()
    } catch (e) {
      return NextResponse.json(
        { error: 'Validation error', details: 'Invalid JSON' },
        { status: 400 }
      )
    }

    // Validate with Zod schema
    const validationResult = CreateUserSchema.safeParse(body)
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: validationResult.error.errors
        },
        { status: 400 }
      )
    }

    const validatedData = validationResult.data

    // Resolve role_id: use provided role_id or look up from role code
    let resolvedRoleId = validatedData.role_id
    if (!resolvedRoleId && validatedData.role) {
      const { data: roleData, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('code', validatedData.role)
        .single()

      if (roleError || !roleData) {
        return NextResponse.json(
          { error: 'Invalid role', details: `Role "${validatedData.role}" not found` },
          { status: 400 }
        )
      }
      resolvedRoleId = roleData.id
    }

    if (!resolvedRoleId) {
      return NextResponse.json(
        { error: 'Validation error', details: 'Role is required' },
        { status: 400 }
      )
    }

    // Create user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email: validatedData.email,
        first_name: validatedData.first_name,
        last_name: validatedData.last_name,
        role_id: resolvedRoleId,
        language: validatedData.language || 'en',
        org_id: userData.org_id,
        is_active: true,
      })
      .select(`
        id,
        org_id,
        email,
        first_name,
        last_name,
        role_id,
        role:roles(id, code, name),
        language,
        is_active,
        created_at,
        updated_at
      `)
      .single()

    if (createError) {
      // Check for duplicate email (PostgreSQL unique constraint violation)
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: 'Email already exists' },
          { status: 409 }
        )
      }

      console.error('Error creating user:', createError)
      return NextResponse.json(
        { error: createError.message },
        { status: 500 }
      )
    }

    return NextResponse.json(newUser, { status: 201 })
  } catch (error: any) {
    console.error('Unexpected error in POST /api/v1/settings/users:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
