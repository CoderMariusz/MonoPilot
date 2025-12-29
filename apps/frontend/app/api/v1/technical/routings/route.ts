/**
 * Routings API Routes - Story 02.7
 *
 * GET /api/v1/technical/routings - List routings with filters and pagination
 * POST /api/v1/technical/routings - Create new routing (with optional clone)
 *
 * Auth: Required
 * GET: All authenticated users can view
 * POST: Requires technical write permission (C)
 *
 * Response Format:
 * GET: { routings: Routing[], total: number, page?: number, limit?: number }
 * POST: { code, name, ... } (created routing object)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { createRoutingSchemaV1, routingFiltersSchema } from '@/lib/validation/routing-schemas'
import { ZodError } from 'zod'

// ============================================================================
// Types
// ============================================================================

interface Routing {
  id: string
  org_id: string
  code: string
  name: string
  description: string | null
  version: number
  is_active: boolean
  is_reusable: boolean
  setup_cost: number
  working_cost_per_unit: number
  overhead_percent: number
  currency: string
  operations_count?: number
  boms_count?: number
  created_at: string
  updated_at: string
}

// ============================================================================
// GET /api/v1/technical/routings - List Routings
// ============================================================================

export async function GET(request: NextRequest) {
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

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const filters = routingFiltersSchema.safeParse({
      is_active: searchParams.get('is_active') || undefined,
      search: searchParams.get('search') || undefined,
      page: searchParams.get('page') || undefined,
      limit: searchParams.get('limit') || undefined,
      sortBy: searchParams.get('sortBy') || undefined,
      sortOrder: searchParams.get('sortOrder') || undefined,
    })

    if (!filters.success) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: filters.error.errors },
        { status: 400 }
      )
    }

    const { is_active, search, page = 1, limit = 25, sortBy = 'name', sortOrder = 'asc' } = filters.data

    // Build query
    let query = supabase
      .from('routings')
      .select('*', { count: 'exact' })
      .eq('org_id', userData.org_id)

    // Apply filters
    if (is_active !== undefined) {
      query = query.eq('is_active', is_active)
    }

    if (search) {
      query = query.or(`code.ilike.%${search}%,name.ilike.%${search}%`)
    }

    // Apply sorting
    const sortColumn = sortBy || 'name'
    const ascending = sortOrder !== 'desc'
    query = query.order(sortColumn, { ascending })

    // Apply pagination
    const offset = ((page || 1) - 1) * (limit || 25)
    query = query.range(offset, offset + (limit || 25) - 1)

    const { data: routings, error: queryError, count } = await query

    if (queryError) {
      console.error('Query error:', queryError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // Get operations count for each routing
    const routingsWithCounts: Routing[] = routings || []
    if (routingsWithCounts.length > 0) {
      const routingIds = routingsWithCounts.map(r => r.id)

      // Get operations counts
      const { data: opCounts } = await supabase
        .from('routing_operations')
        .select('routing_id')
        .in('routing_id', routingIds)

      // Get BOMs counts (if routing_id exists in boms table)
      const { data: bomCounts } = await supabase
        .from('boms')
        .select('routing_id')
        .in('routing_id', routingIds)
        .not('routing_id', 'is', null)

      // Add counts to routings
      for (const routing of routingsWithCounts) {
        routing.operations_count = opCounts?.filter(op => op.routing_id === routing.id).length || 0
        routing.boms_count = bomCounts?.filter(bom => bom.routing_id === routing.id).length || 0
      }
    }

    return NextResponse.json({
      routings: routingsWithCounts,
      total: count || 0,
      page: page || 1,
      limit: limit || 25,
    })
  } catch (error) {
    console.error('GET routings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ============================================================================
// POST /api/v1/technical/routings - Create Routing
// ============================================================================

export async function POST(request: NextRequest) {
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

    // Check permissions - need Technical write permission (C for create)
    const roleData = userData.role as { code?: string; permissions?: Record<string, string> } | null
    const techPerm = roleData?.permissions?.technical || ''
    const roleCode = roleData?.code || ''

    const isAdmin = roleCode === 'admin' || roleCode === 'super_admin'
    const hasTechWrite = techPerm.includes('C')

    if (!isAdmin && !hasTechWrite) {
      return NextResponse.json(
        { error: 'You do not have permission to create routings' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = createRoutingSchemaV1.safeParse(body)

    if (!validationResult.success) {
      // Format error messages for specific fields
      const errors = validationResult.error.errors
      const firstError = errors[0]

      // Return user-friendly error messages
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

    const data = validationResult.data
    const { cloneFrom, ...routingData } = data

    // Handle clone operation
    if (cloneFrom) {
      return handleClone(supabaseAdmin, userData.org_id, cloneFrom, routingData)
    }

    // Check for duplicate code
    const { data: existing } = await supabaseAdmin
      .from('routings')
      .select('id')
      .eq('org_id', userData.org_id)
      .eq('code', routingData.code)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: `Code ${routingData.code} already exists in your organization` },
        { status: 409 }
      )
    }

    // Create routing
    const { data: newRouting, error: createError } = await supabaseAdmin
      .from('routings')
      .insert({
        org_id: userData.org_id,
        code: routingData.code,
        name: routingData.name,
        description: routingData.description || null,
        is_active: routingData.is_active ?? true,
        is_reusable: routingData.is_reusable ?? true,
        setup_cost: routingData.setup_cost ?? 0,
        working_cost_per_unit: routingData.working_cost_per_unit ?? 0,
        overhead_percent: routingData.overhead_percent ?? 0,
        currency: routingData.currency ?? 'PLN',
        created_by: user.id,
      })
      .select()
      .single()

    if (createError) {
      console.error('Create error:', createError)
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: `Code ${routingData.code} already exists in your organization` },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: 'Failed to create routing' }, { status: 500 })
    }

    return NextResponse.json(newRouting, { status: 201 })
  } catch (error) {
    console.error('POST routing error:', error)

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
// Helper: Handle Clone Operation
// ============================================================================

async function handleClone(
  supabaseAdmin: ReturnType<typeof createServerSupabaseAdmin>,
  orgId: string,
  sourceId: string,
  newData: {
    code: string
    name: string
    description?: string
    is_active?: boolean
    is_reusable?: boolean
    setup_cost?: number
    working_cost_per_unit?: number
    overhead_percent?: number
    currency?: string
  }
) {
  // Get source routing
  const { data: source, error: sourceError } = await supabaseAdmin
    .from('routings')
    .select('*')
    .eq('id', sourceId)
    .eq('org_id', orgId)
    .single()

  if (sourceError || !source) {
    return NextResponse.json(
      { error: 'Source routing not found' },
      { status: 404 }
    )
  }

  // Check for duplicate code
  const { data: existing } = await supabaseAdmin
    .from('routings')
    .select('id')
    .eq('org_id', orgId)
    .eq('code', newData.code)
    .single()

  if (existing) {
    return NextResponse.json(
      { error: `Code ${newData.code} already exists in your organization` },
      { status: 409 }
    )
  }

  // Create new routing from source
  const { data: newRouting, error: createError } = await supabaseAdmin
    .from('routings')
    .insert({
      org_id: orgId,
      code: newData.code,
      name: newData.name,
      description: newData.description ?? source.description,
      is_active: newData.is_active ?? source.is_active,
      is_reusable: newData.is_reusable ?? source.is_reusable,
      setup_cost: newData.setup_cost ?? source.setup_cost,
      working_cost_per_unit: newData.working_cost_per_unit ?? source.working_cost_per_unit,
      overhead_percent: newData.overhead_percent ?? source.overhead_percent,
      currency: newData.currency ?? source.currency,
    })
    .select()
    .single()

  if (createError || !newRouting) {
    console.error('Clone create error:', createError)
    return NextResponse.json({ error: 'Failed to clone routing' }, { status: 500 })
  }

  // Clone operations
  const { data: sourceOps, error: opsError } = await supabaseAdmin
    .from('routing_operations')
    .select('*')
    .eq('routing_id', sourceId)
    .order('sequence', { ascending: true })

  if (opsError) {
    // Rollback: delete the newly created routing
    await supabaseAdmin.from('routings').delete().eq('id', newRouting.id)
    return NextResponse.json({ error: 'Failed to clone operations' }, { status: 500 })
  }

  let operationsCount = 0
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

  return NextResponse.json({
    ...newRouting,
    operations_count: operationsCount,
  }, { status: 201 })
}
