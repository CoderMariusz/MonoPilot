import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import {
  CreateUserSchema,
  UserFiltersSchema,
  type User,
} from '@/lib/validation/user-schemas'
import { ZodError } from 'zod'
import { logUserActivity } from '@/lib/activity/log-activity'

/**
 * User Management API Routes
 * Story: 1.2 User Management - CRUD
 * Task 2: API Endpoints
 *
 * GET /api/settings/users - List users with filters
 * POST /api/settings/users - Create new user
 */

// ============================================================================
// GET /api/settings/users - List Users (AC-002.2)
// ============================================================================

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
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check authorization: Admin or Manager only (AC-002.2)
    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Manager role required' },
        { status: 403 }
      )
    }

    // Parse query parameters for filtering
    const searchParams = request.nextUrl.searchParams
    const role = searchParams.get('role')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    // Validate filters
    const filters = UserFiltersSchema.parse({
      role: role || undefined,
      status: status || undefined,
      search: search || undefined,
    })

    // Build query - filter by org_id (RLS handles this too, but explicit for clarity)
    let query = supabase
      .from('users')
      .select('*')
      .eq('org_id', currentUser.org_id)
      .order('created_at', { ascending: false })

    // Apply role filter
    if (filters.role) {
      if (Array.isArray(filters.role)) {
        query = query.in('role', filters.role)
      } else {
        query = query.eq('role', filters.role)
      }
    }

    // Apply status filter
    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    // Apply search filter (name or email, case-insensitive)
    if (filters.search) {
      const searchTerm = `%${filters.search}%`
      query = query.or(
        `email.ilike.${searchTerm},first_name.ilike.${searchTerm},last_name.ilike.${searchTerm}`
      )
    }

    const { data: users, error: queryError } = await query

    if (queryError) {
      console.error('Failed to fetch users:', queryError)
      return NextResponse.json(
        { error: 'Failed to fetch users' },
        { status: 500 }
      )
    }

    return NextResponse.json({ users: users || [] }, { status: 200 })
  } catch (error) {
    console.error('Error in GET /api/settings/users:', error)

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

// ============================================================================
// POST /api/settings/users - Create User (AC-002.1, AC-002.6)
// ============================================================================

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

    // Get current user to check role and org_id
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check authorization: Admin only (AC-002.1)
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = CreateUserSchema.parse(body)

    // Generate a temporary password for Supabase Auth user creation
    // User will receive invitation email to set their own password (Story 1.3)
    const temporaryPassword = crypto.randomUUID()

    // AC-002.6: Create user in auth.users (Supabase Auth)
    const { data: authUser, error: authCreateError } =
      await supabase.auth.admin.createUser({
        email: validatedData.email,
        password: temporaryPassword,
        email_confirm: false, // User must confirm via invitation email
        user_metadata: {
          first_name: validatedData.first_name,
          last_name: validatedData.last_name,
          role: validatedData.role,
        },
      })

    if (authCreateError || !authUser.user) {
      console.error('Failed to create auth user:', authCreateError)

      // Handle duplicate email error
      if (authCreateError?.message?.includes('already registered')) {
        return NextResponse.json(
          { error: 'Email already registered' },
          { status: 409 }
        )
      }

      // Return detailed error for debugging
      return NextResponse.json(
        {
          error: 'Failed to create user in authentication system',
          details: authCreateError?.message || 'Unknown error',
          code: authCreateError?.code
        },
        { status: 500 }
      )
    }

    // AC-002.1: Insert into public.users table with status = 'invited'
    // AC-002.6: User ID matches between tables (same UUID)
    // AC-002.8: Set created_by = current user
    const newUser: Omit<User, 'created_at' | 'updated_at' | 'last_login_at'> = {
      id: authUser.user.id, // Same UUID as auth.users
      org_id: currentUser.org_id,
      email: validatedData.email,
      first_name: validatedData.first_name,
      last_name: validatedData.last_name,
      role: validatedData.role,
      status: 'invited', // AC-002.1: Default status
      created_by: session.user.id, // AC-002.8: Audit trail
      updated_by: session.user.id,
    }

    const { data: createdUser, error: insertError } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single()

    if (insertError) {
      console.error('Failed to insert user into public.users:', insertError)

      // Rollback: Delete auth user if database insert fails
      await supabase.auth.admin.deleteUser(authUser.user.id)

      // Handle unique constraint violation
      if (insertError.code === '23505') {
        return NextResponse.json(
          { error: 'User with this email already exists in organization' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to create user record' },
        { status: 500 }
      )
    }

    // TODO (Story 1.3): Send invitation email with magic link
    // await sendInvitationEmail(createdUser.email, invitationToken)

    // Log activity (Story 1.13: Main Dashboard)
    await logUserActivity(
      currentUser.org_id,
      session.user.id,
      'user_invited',
      createdUser.id,
      createdUser.email,
      {
        role: createdUser.role,
      }
    )

    return NextResponse.json(
      {
        user: createdUser,
        message: 'User created successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error in POST /api/settings/users:', error)

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
