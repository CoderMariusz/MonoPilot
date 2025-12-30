/**
 * BOM Single Item API Routes (Story 02.4 - Track C)
 *
 * GET /api/v1/technical/boms/:id - Get single BOM with product details
 * PUT /api/v1/technical/boms/:id - Update BOM (product_id immutable)
 * DELETE /api/v1/technical/boms/:id - Delete BOM if not in use
 *
 * Auth: Required
 * PUT Roles: ADMIN, SUPER_ADMIN, PRODUCTION_MANAGER (technical role)
 * DELETE Roles: ADMIN, SUPER_ADMIN only
 * GET Roles: All authenticated users
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase/server'
import { z } from 'zod'
import type { BOMWithProduct, UpdateBOMRequest } from '@/lib/types/bom'
import { API_TO_DB_STATUS } from '@/lib/validation/bom-schema'

// Validation schema for update BOM
const updateBOMSchema = z.object({
  effective_from: z.string().refine((val) => !val || !isNaN(Date.parse(val)), 'Invalid date').optional(),
  effective_to: z.string().refine((val) => !val || !isNaN(Date.parse(val)), 'Invalid date').nullable().optional(),
  status: z.enum(['draft', 'active', 'phased_out', 'inactive']).optional(),
  output_qty: z.number().positive('Output quantity must be greater than 0').max(999999999, 'Output quantity too large').optional(),
  output_uom: z.string().min(1, 'Unit of measure is required').max(20).optional(),
  notes: z.string().max(2000).nullable().optional(),
})

/**
 * GET /api/v1/technical/boms/:id
 * Get single BOM with product details
 */
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

    // Get BOM with product details (RLS enforces org isolation)
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select(`
        *,
        product:products!product_id (
          id,
          code,
          name,
          type,
          uom
        )
      `)
      .eq('id', (await params).id)
      .single()

    if (bomError || !bom) {
      return NextResponse.json(
        { error: 'BOM_NOT_FOUND', message: 'BOM not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(bom as BOMWithProduct)
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * PUT /api/v1/technical/boms/:id
 * Update BOM header fields (product_id is immutable)
 */
export async function PUT(
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

    // Get user org_id and role
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

    if (userError || !userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - need Technical write permission (U for update)
    const techPerm = (userData.role as any)?.permissions?.technical || ''
    const roleCode = (userData.role as any)?.code || ''

    // Allow: admin, super_admin, or users with Technical U permission
    const isAdmin = roleCode === 'admin' || roleCode === 'super_admin'
    const hasTechWrite = techPerm.includes('U')

    if (!isAdmin && !hasTechWrite) {
      return NextResponse.json({ error: 'FORBIDDEN', message: 'Insufficient permissions' }, { status: 403 })
    }

    // Check if BOM exists
    const { data: existingBom, error: fetchError } = await supabase
      .from('boms')
      .select('id, product_id, effective_from, effective_to, version')
      .eq('id', (await params).id)
      .single()

    if (fetchError || !existingBom) {
      return NextResponse.json(
        { error: 'BOM_NOT_FOUND', message: 'BOM not found' },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validationResult = updateBOMSchema.safeParse(body)

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', details: validationResult.error.errors },
        { status: 400 }
      )
    }

    const data = validationResult.data

    // Validate date range if both dates provided
    const effectiveFrom = data.effective_from || existingBom.effective_from
    const effectiveTo = data.effective_to !== undefined ? data.effective_to : existingBom.effective_to

    if (effectiveTo && new Date(effectiveTo) <= new Date(effectiveFrom)) {
      return NextResponse.json(
        { error: 'INVALID_DATE_RANGE', message: 'Effective To must be after Effective From' },
        { status: 400 }
      )
    }

    // Check for date overlap with other BOMs (excluding current)
    const { data: overlappingBOMs, error: overlapError } = await supabase
      .from('boms')
      .select('id, version, effective_from, effective_to')
      .eq('product_id', existingBom.product_id)
      .neq('id', (await params).id)

    if (!overlapError && overlappingBOMs) {
      const newFrom = new Date(effectiveFrom)
      const newTo = effectiveTo ? new Date(effectiveTo) : null

      for (const existing of overlappingBOMs) {
        const existingFrom = new Date(existing.effective_from)
        const existingTo = existing.effective_to ? new Date(existing.effective_to) : null

        // Check overlap: ranges overlap if NOT (newTo < existingFrom OR newFrom > existingTo)
        const newEndsBeforeExisting = newTo && newTo < existingFrom
        const newStartsAfterExisting = existingTo && newFrom > existingTo

        if (!newEndsBeforeExisting && !newStartsAfterExisting) {
          return NextResponse.json(
            {
              error: 'DATE_OVERLAP',
              message: `Date range overlaps with existing BOM v${existing.version}`,
            },
            { status: 400 }
          )
        }
      }
    }

    // Build update object
    const updateData: Record<string, any> = {
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    }

    if (data.effective_from !== undefined) updateData.effective_from = data.effective_from
    if (data.effective_to !== undefined) updateData.effective_to = data.effective_to
    if (data.output_qty !== undefined) updateData.output_qty = data.output_qty
    if (data.output_uom !== undefined) updateData.output_uom = data.output_uom
    if (data.notes !== undefined) updateData.notes = data.notes

    // Map status to database format using shared constant (DRY)
    if (data.status !== undefined) {
      updateData.status = API_TO_DB_STATUS[data.status] || data.status
    }

    // Update BOM
    const { data: updatedBom, error: updateError } = await supabase
      .from('boms')
      .update(updateData)
      .eq('id', (await params).id)
      .select(`
        *,
        product:products!product_id (
          id,
          code,
          name,
          type,
          uom
        )
      `)
      .single()

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json(updatedBom as BOMWithProduct)
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}

/**
 * DELETE /api/v1/technical/boms/:id
 * Delete BOM if not used in Work Orders
 */
export async function DELETE(
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

    // Get user role
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

    if (userError || !userData) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check permissions - only ADMIN or SUPER_ADMIN can delete
    const roleCode = (userData.role as any)?.code || ''
    const isAdmin = roleCode === 'admin' || roleCode === 'super_admin'

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only administrators can delete BOMs' },
        { status: 403 }
      )
    }

    // Check if BOM exists
    const { data: existingBom, error: fetchError } = await supabase
      .from('boms')
      .select('id')
      .eq('id', (await params).id)
      .single()

    if (fetchError || !existingBom) {
      return NextResponse.json(
        { error: 'BOM_NOT_FOUND', message: 'BOM not found' },
        { status: 404 }
      )
    }

    // Check if BOM is used in Work Orders
    const { data: workOrders, error: woError } = await supabase
      .from('work_orders')
      .select('id, wo_number')
      .eq('bom_id', (await params).id)
      .limit(10)

    if (!woError && workOrders && workOrders.length > 0) {
      const woNumbers = workOrders.map((wo: any) => wo.wo_number).join(', ')
      return NextResponse.json(
        {
          error: 'BOM_IN_USE',
          message: `Cannot delete BOM used in Work Orders: ${woNumbers}`,
        },
        { status: 400 }
      )
    }

    // Delete BOM (cascade to bom_items handled by FK constraints)
    const { error: deleteError } = await supabase
      .from('boms')
      .delete()
      .eq('id', (await params).id)

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'BOM deleted successfully',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
