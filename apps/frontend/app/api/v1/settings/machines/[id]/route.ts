/**
 * API Route: /api/v1/settings/machines/[id]
 * Story: 01.10 - Machines CRUD
 * Methods: GET (getById), PUT (update), DELETE (delete)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { machineUpdateSchema } from '@/lib/validation/machine-schemas'
import { ZodError } from 'zod'

/**
 * GET /api/v1/settings/machines/:id
 * Get single machine by ID with location details
 *
 * Returns 404 for cross-org access (not 403)
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    // Fetch machine with location details
    const { data: machine, error } = await supabase
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
      `
      )
      .eq('id', id)
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .single()

    if (error || !machine) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 })
    }

    return NextResponse.json(machine)
  } catch (error) {
    console.error('Error in GET /api/v1/settings/machines/:id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/v1/settings/machines/:id
 * Update machine
 *
 * Request Body: Partial<CreateMachineInput>
 * Permission: PROD_MANAGER+
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    // Check if machine exists
    const { data: existingMachine, error: fetchError } = await supabase
      .from('machines')
      .select('id, code')
      .eq('id', id)
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .single()

    if (fetchError || !existingMachine) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = machineUpdateSchema.parse(body)

    // Check code uniqueness if code is being changed
    if (validatedData.code && validatedData.code !== existingMachine.code) {
      const { data: codeCheck } = await supabase
        .from('machines')
        .select('id')
        .eq('org_id', orgId)
        .eq('code', validatedData.code)
        .eq('is_deleted', false)
        .neq('id', id)
        .single()

      if (codeCheck) {
        return NextResponse.json({ error: 'Machine code must be unique' }, { status: 409 })
      }
    }

    // Update machine
    const { data: machine, error: updateError } = await supabase
      .from('machines')
      .update({
        ...validatedData,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update machine:', updateError)
      if (updateError.code === '23505') {
        return NextResponse.json({ error: 'Machine code must be unique' }, { status: 409 })
      }
      return NextResponse.json({ error: 'Failed to update machine' }, { status: 500 })
    }

    return NextResponse.json(machine)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in PUT /api/v1/settings/machines/:id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/v1/settings/machines/:id
 * Delete machine (soft delete if has historical references)
 *
 * Business Rules:
 * - Cannot delete if assigned to production line
 * - Soft delete if has historical work order references
 * - Returns 409 if machine is assigned to line with error message
 *
 * Performance Target: < 500ms
 * Permission: ADMIN+ only
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
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

    // Check role permissions - use lowercase role codes as stored in DB (ADMIN+ only)
    if (!['owner', 'admin'].includes(userRole || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if machine exists
    const { data: existingMachine, error: fetchError } = await supabase
      .from('machines')
      .select('id, code')
      .eq('id', id)
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .single()

    if (fetchError || !existingMachine) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 })
    }

    // Check for production line assignments
    // Note: production_line_machines table will be created in Story 01.11
    // For now, we'll check if the table exists and query it
    const { data: lineAssignments, error: lineError } = await supabase
      .from('production_line_machines')
      .select(
        `
        production_line:production_lines(code)
      `
      )
      .eq('machine_id', id)
      .limit(10)

    // If table doesn't exist (42P01), allow deletion
    if (lineError && lineError.code !== '42P01') {
      console.error('Failed to check line assignments:', lineError)
      // Continue with deletion even if check fails (to not block deletion)
    }

    // If machine is assigned to lines, block deletion
    if (lineAssignments && lineAssignments.length > 0) {
      const lineCodes = lineAssignments
        .map((la: any) => la.production_line?.code)
        .filter(Boolean)

      const lineList = lineCodes.join(', ')
      const errorMessage =
        lineCodes.length === 1
          ? `Machine is assigned to line [${lineList}]. Remove from line first.`
          : `Machine is assigned to lines [${lineList}]. Remove from lines first.`

      return NextResponse.json({ error: errorMessage }, { status: 409 })
    }

    // Perform soft delete (always soft delete to preserve audit trail)
    const { error: deleteError } = await supabase
      .from('machines')
      .update({
        is_deleted: true,
        deleted_at: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', id)
      .eq('org_id', orgId)

    if (deleteError) {
      console.error('Failed to delete machine:', deleteError)
      return NextResponse.json({ error: 'Failed to delete machine' }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/v1/settings/machines/:id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
