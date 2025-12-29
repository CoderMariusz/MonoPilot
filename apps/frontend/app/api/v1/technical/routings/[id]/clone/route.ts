/**
 * Clone Routing API Route - Story 02.7
 *
 * POST /api/v1/technical/routings/:id/clone - Clone routing with operations
 *
 * Auth: Required
 * Permission: Technical write (C)
 *
 * Response: { routing: Routing, operationsCount: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { cloneRoutingSchema } from '@/lib/validation/routing-schemas'

// ============================================================================
// POST /api/v1/technical/routings/:id/clone - Clone Routing
// ============================================================================

export async function POST(
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
    const hasTechWrite = techPerm.includes('C')

    if (!isAdmin && !hasTechWrite) {
      return NextResponse.json(
        { error: 'You do not have permission to clone routings' },
        { status: 403 }
      )
    }

    const { id: sourceId } = await params

    // Get source routing
    const { data: source, error: sourceError } = await supabase
      .from('routings')
      .select('*')
      .eq('id', sourceId)
      .eq('org_id', userData.org_id)
      .single()

    if (sourceError || !source) {
      return NextResponse.json({ error: 'Source routing not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = cloneRoutingSchema.safeParse(body)

    if (!validationResult.success) {
      const errors = validationResult.error.errors
      const firstError = errors[0]

      if (firstError.path.includes('code')) {
        if (firstError.message.includes('at least 2')) {
          return NextResponse.json(
            { error: 'Code must be at least 2 characters' },
            { status: 400 }
          )
        }
        if (firstError.message.includes('uppercase')) {
          return NextResponse.json(
            { error: 'Code can only contain uppercase letters, numbers, and hyphens' },
            { status: 400 }
          )
        }
      }

      if (firstError.path.includes('name') && firstError.message.includes('required')) {
        return NextResponse.json(
          { error: 'Routing name is required' },
          { status: 400 }
        )
      }

      return NextResponse.json(
        { error: 'Invalid request data', details: errors },
        { status: 400 }
      )
    }

    const { code, name, description, copyOperations = true } = validationResult.data

    // Check for duplicate code
    const { data: existing } = await supabaseAdmin
      .from('routings')
      .select('id')
      .eq('org_id', userData.org_id)
      .eq('code', code)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: `Code ${code} already exists in your organization` },
        { status: 409 }
      )
    }

    // Create new routing from source
    const { data: newRouting, error: createError } = await supabaseAdmin
      .from('routings')
      .insert({
        org_id: userData.org_id,
        code: code,
        name: name,
        description: description ?? source.description,
        is_active: source.is_active,
        is_reusable: source.is_reusable,
        setup_cost: source.setup_cost,
        working_cost_per_unit: source.working_cost_per_unit,
        overhead_percent: source.overhead_percent,
        currency: source.currency,
        created_by: user.id,
      })
      .select()
      .single()

    if (createError || !newRouting) {
      console.error('Clone create error:', createError)
      if (createError?.code === '23505') {
        return NextResponse.json(
          { error: `Code ${code} already exists in your organization` },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: 'Failed to clone routing' }, { status: 500 })
    }

    let operationsCount = 0

    // Clone operations if requested
    if (copyOperations) {
      const { data: sourceOps, error: opsError } = await supabaseAdmin
        .from('routing_operations')
        .select('*')
        .eq('routing_id', sourceId)
        .order('sequence', { ascending: true })

      if (opsError) {
        // Rollback: delete the newly created routing
        await supabaseAdmin.from('routings').delete().eq('id', newRouting.id)
        return NextResponse.json({ error: 'Failed to fetch source operations' }, { status: 500 })
      }

      if (sourceOps && sourceOps.length > 0) {
        const clonedOps = sourceOps.map(op => ({
          routing_id: newRouting.id,
          sequence: op.sequence,
          operation_name: op.operation_name,
          machine_id: op.machine_id,
          line_id: op.line_id,
          expected_duration_minutes: op.expected_duration_minutes,
          setup_time_minutes: op.setup_time_minutes,
          cleanup_time_minutes: op.cleanup_time_minutes,
          labor_cost: op.labor_cost,
          expected_yield_percent: op.expected_yield_percent,
          instructions: op.instructions,
        }))

        const { error: insertError } = await supabaseAdmin
          .from('routing_operations')
          .insert(clonedOps)

        if (insertError) {
          // Rollback: delete the newly created routing
          await supabaseAdmin.from('routings').delete().eq('id', newRouting.id)
          return NextResponse.json({ error: 'Failed to clone operations' }, { status: 500 })
        }

        operationsCount = clonedOps.length
      }
    }

    return NextResponse.json({
      data: {
        routing: newRouting,
        routingId: newRouting.id,
        operationsCount: operationsCount,
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Clone routing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
