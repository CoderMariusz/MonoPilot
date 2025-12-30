/**
 * API Route: /api/v1/settings/machines/[id]/status
 * Story: 01.10 - Machines CRUD
 * Methods: PATCH (updateStatus)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { machineStatusSchema } from '@/lib/validation/machine-schemas'
import { ZodError } from 'zod'

/**
 * PATCH /api/v1/settings/machines/:id/status
 * Update machine status only
 *
 * Request Body:
 * - status: MachineStatus (ACTIVE, MAINTENANCE, OFFLINE, DECOMMISSIONED)
 *
 * Permission: PROD_MANAGER+
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .eq('is_deleted', false)
      .single()

    if (fetchError || !existingMachine) {
      return NextResponse.json({ error: 'Machine not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = machineStatusSchema.parse(body)

    // Update status
    const { data: machine, error: updateError } = await supabase
      .from('machines')
      .update({
        status: validatedData.status,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update machine status:', updateError)
      return NextResponse.json({ error: 'Failed to update machine status' }, { status: 500 })
    }

    return NextResponse.json(machine)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in PATCH /api/v1/settings/machines/:id/status:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
