/**
 * API Route: /api/v1/settings/warehouses/[id]
 * Story: 01.8 - Warehouses CRUD
 * Methods: GET (getById), PUT (update), DELETE (soft delete)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { updateWarehouseSchema } from '@/lib/validation/warehouse-schemas'
import { ZodError } from 'zod'
import { getAuthContext, checkPermission } from '@/lib/api/auth-helpers'

/**
 * GET /api/v1/settings/warehouses/:id
 * Get single warehouse by ID
 *
 * Returns 404 for cross-org access (not 403) - security best practice
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    const { orgId } = authContext

    // Fetch warehouse
    const { data: warehouse, error } = await supabase
      .from('warehouses')
      .select('*')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (error || !warehouse) {
      // Return 404 for both not found AND cross-tenant access
      return NextResponse.json(
        { error: 'Warehouse not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
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
 * Request Body: Partial<CreateWarehouseInput>
 * - Code change blocked if warehouse has active inventory
 *
 * Permission: SUPER_ADMIN, ADMIN, WAREHOUSE_MANAGER
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    // Check role permissions
    const allowedRoles = ['owner', 'admin', 'warehouse_manager']
    const permissionError = checkPermission(authContext, allowedRoles)
    if (permissionError) {
      return permissionError
    }

    const { userId, orgId } = authContext

    // Check if warehouse exists
    const { data: existingWarehouse, error: fetchError } = await supabase
      .from('warehouses')
      .select('id, code')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !existingWarehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = updateWarehouseSchema.parse(body)

    // Check code change with inventory
    if (validatedData.code && validatedData.code !== existingWarehouse.code) {
      // Check for active inventory (license plates with qty > 0)
      const { data: activeLPs, error: lpError } = await supabase
        .from('license_plates')
        .select('id')
        .eq('warehouse_id', id)
        .gt('quantity', 0)
        .limit(1)

      // If table doesn't exist, allow code change
      if (!lpError && activeLPs && activeLPs.length > 0) {
        return NextResponse.json(
          {
            error: 'Cannot change code for warehouse with active inventory',
            code: 'CODE_IMMUTABLE',
          },
          { status: 400 }
        )
      }

      // Check code uniqueness if code is being changed
      const { data: codeCheck } = await supabase
        .from('warehouses')
        .select('id')
        .eq('org_id', orgId)
        .eq('code', validatedData.code)
        .neq('id', id)
        .single()

      if (codeCheck) {
        return NextResponse.json(
          { error: 'Warehouse code already exists', code: 'DUPLICATE_CODE' },
          { status: 409 }
        )
      }
    }

    // Build update object with only provided fields
    const updateData: Record<string, any> = {
      updated_by: userId,
      updated_at: new Date().toISOString(),
    }

    if (validatedData.code !== undefined) updateData.code = validatedData.code
    if (validatedData.name !== undefined) updateData.name = validatedData.name
    if (validatedData.type !== undefined) updateData.type = validatedData.type
    if (validatedData.address !== undefined) updateData.address = validatedData.address
    if (validatedData.contact_email !== undefined) updateData.contact_email = validatedData.contact_email
    if (validatedData.contact_phone !== undefined) updateData.contact_phone = validatedData.contact_phone
    if (validatedData.is_active !== undefined) updateData.is_active = validatedData.is_active

    // Update warehouse
    const { data: warehouse, error: updateError } = await supabase
      .from('warehouses')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', orgId)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update warehouse:', updateError)
      if (updateError.code === '23505') {
        return NextResponse.json(
          { error: 'Warehouse code already exists', code: 'DUPLICATE_CODE' },
          { status: 409 }
        )
      }
      return NextResponse.json({ error: 'Failed to update warehouse' }, { status: 500 })
    }

    return NextResponse.json(warehouse)
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Error in PUT /api/v1/settings/warehouses/:id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/v1/settings/warehouses/:id
 * Soft delete warehouse (sets is_active = false)
 *
 * Permission: SUPER_ADMIN, ADMIN only
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Get authenticated user context
    const authContext = await getAuthContext(supabase)
    if (authContext instanceof NextResponse) {
      return authContext
    }

    // Check role permissions - ADMIN+ only for delete
    const allowedRoles = ['owner', 'admin']
    const permissionError = checkPermission(authContext, allowedRoles)
    if (permissionError) {
      return permissionError
    }

    const { userId, orgId } = authContext

    // Check if warehouse exists
    const { data: existingWarehouse, error: fetchError } = await supabase
      .from('warehouses')
      .select('id')
      .eq('id', id)
      .eq('org_id', orgId)
      .single()

    if (fetchError || !existingWarehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found', code: 'NOT_FOUND' },
        { status: 404 }
      )
    }

    // Perform soft delete (set is_active = false)
    const { error: deleteError } = await supabase
      .from('warehouses')
      .update({
        is_active: false,
        disabled_at: new Date().toISOString(),
        disabled_by: userId,
        updated_by: userId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('org_id', orgId)

    if (deleteError) {
      console.error('Failed to delete warehouse:', deleteError)
      return NextResponse.json({ error: 'Failed to delete warehouse' }, { status: 500 })
    }

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/v1/settings/warehouses/:id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
