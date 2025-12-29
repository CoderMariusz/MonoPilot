/**
 * Routing Detail API Routes - Story 02.7
 *
 * GET /api/v1/technical/routings/:id - Get routing detail
 * PUT /api/v1/technical/routings/:id - Update routing
 * DELETE /api/v1/technical/routings/:id - Delete routing
 *
 * Auth: Required
 * GET: All authenticated users can view
 * PUT/DELETE: Requires technical write permission
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { updateRoutingSchemaV1 } from '@/lib/validation/routing-schemas'
import { ZodError } from 'zod'

// ============================================================================
// GET /api/v1/technical/routings/:id - Get Routing Detail
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('org_id')
      .eq('id', user.id)
      .single()

    if (userError || !userData?.org_id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const { id } = await params

    // Get routing
    const { data: routing, error: queryError } = await supabase
      .from('routings')
      .select('*')
      .eq('id', id)
      .eq('org_id', userData.org_id)
      .single()

    if (queryError || !routing) {
      return NextResponse.json({ error: 'Routing not found' }, { status: 404 })
    }

    // Get operations count
    const { count: operationsCount } = await supabase
      .from('routing_operations')
      .select('id', { count: 'exact', head: true })
      .eq('routing_id', id)

    // Get BOMs count
    const { count: bomsCount } = await supabase
      .from('boms')
      .select('id', { count: 'exact', head: true })
      .eq('routing_id', id)

    return NextResponse.json({
      ...routing,
      operations_count: operationsCount || 0,
      boms_count: bomsCount || 0,
    })
  } catch (error) {
    console.error('GET routing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// PUT /api/v1/technical/routings/:id - Update Routing
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        org_id,
        role:roles (
          code,
          permissions
        )
      `)
      .eq('id', user.id)
      .single()

    if (userError || !userData?.org_id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check permissions
    const roleData = userData.role as { code?: string; permissions?: Record<string, string> } | null
    const techPerm = roleData?.permissions?.technical || ''
    const roleCode = roleData?.code || ''

    const isAdmin = roleCode === 'admin' || roleCode === 'super_admin'
    const hasTechWrite = techPerm.includes('U')

    if (!isAdmin && !hasTechWrite) {
      return NextResponse.json(
        { error: 'You do not have permission to update routings' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check if routing exists
    const { data: existing, error: existError } = await supabase
      .from('routings')
      .select('id, version')
      .eq('id', id)
      .eq('org_id', userData.org_id)
      .single()

    if (existError || !existing) {
      return NextResponse.json({ error: 'Routing not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()

    // CRITICAL: Reject code changes - code is immutable after creation (FR-2.54, TEC-008)
    if ('code' in body) {
      return NextResponse.json(
        { error: 'Code cannot be changed after creation' },
        { status: 400 }
      )
    }

    const validationResult = updateRoutingSchemaV1.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.errors
      const firstError = errors[0]

      if (firstError.path.includes('overhead_percent') && firstError.message.includes('100')) {
        return NextResponse.json(
          { error: 'Overhead percentage cannot exceed 100%' },
          { status: 400 }
        )
      }

      if (firstError.path.includes('setup_cost') && firstError.message.includes('negative')) {
        return NextResponse.json(
          { error: 'Setup cost cannot be negative' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Invalid request data', details: errors },
        { status: 400 }
      )
    }

    const updateData = validationResult.data

    // Build update object (only include provided fields)
    const updateFields: Record<string, unknown> = {}
    if (updateData.name !== undefined) updateFields.name = updateData.name
    if (updateData.description !== undefined) updateFields.description = updateData.description
    if (updateData.is_active !== undefined) updateFields.is_active = updateData.is_active
    if (updateData.is_reusable !== undefined) updateFields.is_reusable = updateData.is_reusable
    if (updateData.setup_cost !== undefined) updateFields.setup_cost = updateData.setup_cost
    if (updateData.working_cost_per_unit !== undefined) updateFields.working_cost_per_unit = updateData.working_cost_per_unit
    if (updateData.overhead_percent !== undefined) updateFields.overhead_percent = updateData.overhead_percent
    if (updateData.currency !== undefined) updateFields.currency = updateData.currency

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    // Update routing (version will be auto-incremented by trigger)
    const { data: updated, error: updateError } = await supabaseAdmin
      .from('routings')
      .update(updateFields)
      .eq('id', id)
      .eq('org_id', userData.org_id)
      .select()
      .single()

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json({ error: 'Failed to update routing' }, { status: 500 })
    }

    // Get counts
    const { count: operationsCount } = await supabase
      .from('routing_operations')
      .select('id', { count: 'exact', head: true })
      .eq('routing_id', id)

    const { count: bomsCount } = await supabase
      .from('boms')
      .select('id', { count: 'exact', head: true })
      .eq('routing_id', id)

    return NextResponse.json({
      ...updated,
      operations_count: operationsCount || 0,
      boms_count: bomsCount || 0,
    })
  } catch (error) {
    console.error('PUT routing error:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// DELETE /api/v1/technical/routings/:id - Delete Routing
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createServerSupabase()
    const supabaseAdmin = createServerSupabaseAdmin()

    // Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's org_id and role
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select(`
        org_id,
        role:roles (
          code,
          permissions
        )
      `)
      .eq('id', user.id)
      .single()

    if (userError || !userData?.org_id) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check permissions
    const roleData = userData.role as { code?: string; permissions?: Record<string, string> } | null
    const techPerm = roleData?.permissions?.technical || ''
    const roleCode = roleData?.code || ''

    const isAdmin = roleCode === 'admin' || roleCode === 'super_admin'
    const hasTechDelete = techPerm.includes('D')

    if (!isAdmin && !hasTechDelete) {
      return NextResponse.json(
        { error: 'You do not have permission to delete routings' },
        { status: 403 }
      )
    }

    const { id } = await params

    // Check if routing exists
    const { data: existing, error: existError } = await supabase
      .from('routings')
      .select('id, name')
      .eq('id', id)
      .eq('org_id', userData.org_id)
      .single()

    if (existError || !existing) {
      return NextResponse.json({ error: 'Routing not found' }, { status: 404 })
    }

    // Get affected BOMs count before delete
    const { count: affectedBoms } = await supabase
      .from('boms')
      .select('id', { count: 'exact', head: true })
      .eq('routing_id', id)

    // Note: BOMs will have routing_id set to NULL via FK ON DELETE SET NULL
    // Operations will be cascade deleted via FK ON DELETE CASCADE

    // Delete routing
    const { error: deleteError } = await supabaseAdmin
      .from('routings')
      .delete()
      .eq('id', id)
      .eq('org_id', userData.org_id)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete routing' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      affected_boms: affectedBoms || 0,
      message: affectedBoms
        ? `Routing deleted. ${affectedBoms} BOM(s) unassigned.`
        : 'Routing deleted successfully',
    })
  } catch (error) {
    console.error('DELETE routing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
