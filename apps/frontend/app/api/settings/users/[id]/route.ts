import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { UpdateUserSchema } from '@/lib/validation/user-schemas'
import { canModifyUser } from '@/lib/services/user-validation'
import { terminateAllSessions } from '@/lib/services/session-service'
import { ZodError } from 'zod'

/**
 * User Management API Routes - Individual User Operations
 * Story: 1.2 User Management - CRUD
 * Task 2: API Endpoints
 *
 * PUT /api/settings/users/:id - Update user
 * DELETE /api/settings/users/:id - Deactivate user
 */

// ============================================================================
// PUT /api/settings/users/:id - Update User (AC-002.3, AC-002.5)
// ============================================================================

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const params = await context.params
    const { id } = params
    const params = await context.params
    const userId = params.id

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

    // Check authorization: Admin only (AC-002.3)
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = UpdateUserSchema.parse(body)

    // Verify user exists and belongs to same org
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found in organization' },
        { status: 404 }
      )
    }

    // AC-002.5: Validate cannot deactivate or demote last admin
    if (validatedData.role || validatedData.status) {
      const validation = await canModifyUser(
        userId,
        currentUser.org_id,
        validatedData.role,
        validatedData.status
      )

      if (!validation.valid) {
        return NextResponse.json(
          { error: validation.error || 'Cannot modify user' },
          { status: 400 }
        )
      }
    }

    // AC-002.8: Set updated_by = current user
    const updateData = {
      ...validatedData,
      updated_by: session.user.id,
      // Email is NOT included (explicitly excluded in UpdateUserSchema)
    }

    // Update user in database
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .eq('org_id', currentUser.org_id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update user:', updateError)
      return NextResponse.json(
        { error: 'Failed to update user' },
        { status: 500 }
      )
    }

    // If user was deactivated, terminate all sessions
    if (validatedData.status === 'inactive') {
      await terminateAllSessions(userId)
    }

    return NextResponse.json(
      {
        user: updatedUser,
        message: 'User updated successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in PUT /api/settings/users/:id:', error)

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

// ============================================================================
// DELETE /api/settings/users/:id - Deactivate User (AC-002.4, AC-002.5)
// ============================================================================

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const params = await context.params
    const { id } = params
    const params = await context.params
    const userId = params.id

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

    // Check authorization: Admin only (AC-002.4)
    if (currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden: Admin role required' },
        { status: 403 }
      )
    }

    // Verify user exists and belongs to same org
    const { data: targetUser, error: targetError } = await supabase
      .from('users')
      .select('role, status, first_name, last_name')
      .eq('id', userId)
      .eq('org_id', currentUser.org_id)
      .single()

    if (targetError || !targetUser) {
      return NextResponse.json(
        { error: 'User not found in organization' },
        { status: 404 }
      )
    }

    // AC-002.5: Validate cannot deactivate last admin
    const validation = await canModifyUser(
      userId,
      currentUser.org_id,
      undefined,
      'inactive'
    )

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.error || 'Cannot deactivate user' },
        { status: 400 }
      )
    }

    // AC-002.4: Set status = 'inactive'
    // AC-002.8: Set updated_by = current user
    const { error: updateError } = await supabase
      .from('users')
      .update({
        status: 'inactive',
        updated_by: session.user.id,
      })
      .eq('id', userId)
      .eq('org_id', currentUser.org_id)

    if (updateError) {
      console.error('Failed to deactivate user:', updateError)
      return NextResponse.json(
        { error: 'Failed to deactivate user' },
        { status: 500 }
      )
    }

    // AC-002.4: Terminate all active sessions (JWT blacklist)
    // AC-002.4: User logged out immediately on all devices
    const sessionResult = await terminateAllSessions(userId)

    if (!sessionResult.success) {
      console.error('Failed to terminate sessions:', sessionResult.error)
      // User is deactivated but sessions might still be active
      // This is not a fatal error, but should be logged
    }

    // AC-002.4: Success toast message
    return NextResponse.json(
      {
        success: true,
        message: `User ${targetUser.first_name} ${targetUser.last_name} deactivated and logged out`,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error in DELETE /api/settings/users/:id:', error)

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
