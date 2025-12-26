/**
 * User Management API Routes - Individual User
 * Story: 01.5a - User Management CRUD (MVP)
 *
 * PUT /api/v1/settings/users/:id - Update user
 */



import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { UpdateUserSchema } from '@/lib/validation/user-schemas'

interface RouteContext {
  params: {
    id: string
  }
}

/**
 * PUT /api/v1/settings/users/:id
 * Update existing user
 *
 * Body:
 * - first_name: string (optional, 1-100 chars)
 * - last_name: string (optional, 1-100 chars)
 * - role_id: UUID (optional, valid system role)
 * - language: 'pl' | 'en' | 'de' | 'fr' (optional)
 */
export async function PUT(
  request: Request,
  { params }: RouteContext
) {
  try {
    const supabase = await createServerSupabase()
    const { id } = params

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

    // Check permissions (only SUPER_ADMIN and ADMIN can update users)
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
    const validationResult = UpdateUserSchema.safeParse(body)
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

    // Build update object
    const updateData: any = {}
    if (validatedData.first_name !== undefined) updateData.first_name = validatedData.first_name
    if (validatedData.last_name !== undefined) updateData.last_name = validatedData.last_name
    if (validatedData.role_id !== undefined) updateData.role_id = validatedData.role_id
    if (validatedData.language !== undefined) updateData.language = validatedData.language
    updateData.updated_at = new Date().toISOString()

    // Update user (RLS will ensure org_id matches)
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', userData.org_id)
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

    if (updateError) {
      // Check for not found (either doesn't exist or different org - ADR-013)
      if (updateError.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 404 }
        )
      }

      console.error('Error updating user:', updateError)
      return NextResponse.json(
        { error: updateError.message },
        { status: 500 }
      )
    }

    if (!updatedUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(updatedUser, { status: 200 })
  } catch (error: any) {
    console.error('Unexpected error in PUT /api/v1/settings/users/:id:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
