/**
 * API Route: /api/v1/settings/warehouses/[id]
 * Story: 01.8 - Warehouses CRUD
 * Methods: GET (single), PUT (update)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { updateWarehouseSchema } from '@/lib/validation/warehouse-schemas'
import { ZodError } from 'zod'

/**
 * GET /api/v1/settings/warehouses/:id
 * Get warehouse details by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Fetch warehouse
    const { data: warehouse, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('id', params.id)
      .eq('org_id', orgId)
      .single()

    if (error || !warehouse) {
      // AC-09: Cross-tenant access returns 404 (not 403)
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    return NextResponse.json(warehouse)
  } catch (error) {
    console.error('Error in GET /api/v1/settings/warehouses/:id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PUT /api/v1/settings/warehouses/:id
 * Update warehouse
 *
 * Business Rules:
 * - Code immutable when warehouse has active inventory
 * - Code must be unique per org (if changed)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const userRole = (userData.role as any)?.code

    // Check role permissions
    if (!['SUPER_ADMIN', 'ADMIN', 'WAREHOUSE_MANAGER'].includes(userRole)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Check warehouse exists
    const { data: existingWarehouse, error: fetchError } = await supabase
      .from('warehouses')
      .select('id, code')
      .eq('id', params.id)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !existingWarehouse) {
      return NextResponse.json({ error: 'Warehouse not found' }, { status: 404 })
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateWarehouseSchema.parse(body)

    // Business Rule: Code immutability when warehouse has active inventory
    if (validatedData.code && validatedData.code !== existingWarehouse.code) {
      // Check for active inventory
      const { count: inventoryCount } = await supabase
        .from('license_plates')
        .select('*', { count: 'exact', head: true })
        .eq('warehouse_id', params.id)
        .gt('quantity', 0)

      if ((inventoryCount ?? 0) > 0) {
        return NextResponse.json(
          { error: 'Cannot change code for warehouse with active inventory' },
          { status: 400 }
        )
      }

      // Check code uniqueness
      const { data: duplicateWarehouse } = await supabase
        .from('warehouses')
        .select('id')
        .eq('org_id', orgId)
        .eq('code', validatedData.code)
        .neq('id', params.id)
        .single()

      if (duplicateWarehouse) {
        return NextResponse.json({ error: 'Warehouse code already exists' }, { status: 409 })
      }
    }

    // Build update payload
    const updatePayload: any = {
      updated_by: user.id,
    }

    if (validatedData.code) updatePayload.code = validatedData.code
    if (validatedData.name !== undefined) updatePayload.name = validatedData.name
    if (validatedData.type !== undefined) updatePayload.type = validatedData.type
    if (validatedData.address !== undefined) updatePayload.address = validatedData.address
    if (validatedData.contact_email !== undefined)
      updatePayload.contact_email = validatedData.contact_email
    if (validatedData.contact_phone !== undefined)
      updatePayload.contact_phone = validatedData.contact_phone
    if (validatedData.is_active !== undefined) updatePayload.is_active = validatedData.is_active

    // Update warehouse
    const { data: warehouse, error: updateError } = await supabase
      .from('warehouses')
      .update(updatePayload)
      .eq('id', params.id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update warehouse:', updateError)
      return NextResponse.json({ error: 'Failed to update warehouse' }, { status: 500 })
    }

    return NextResponse.json(warehouse)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in PUT /api/v1/settings/warehouses/:id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
