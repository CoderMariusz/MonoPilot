// API Route: Individual Purchase Order Operations
// Epic 3 Batch 3A - Story 3.1: Purchase Order CRUD
// GET /api/planning/purchase-orders/:id - Get PO details
// PUT /api/planning/purchase-orders/:id - Update PO
// DELETE /api/planning/purchase-orders/:id - Delete PO

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { updatePurchaseOrderSchema, type UpdatePurchaseOrderInput } from '@/lib/validation/planning-schemas'
import { checkPOPermission, getPermissionRequirement } from '@/lib/utils/po-permissions'
import { ZodError } from 'zod'

// GET /api/planning/purchase-orders/:id - Get PO details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // AC-1.6: Fetch PO with supplier, warehouse, and lines
    const { data, error } = await supabaseAdmin
      .from('purchase_orders')
      .select(`
        *,
        suppliers(id, code, name, currency, payment_terms, tax_code_id),
        warehouses(id, code, name),
        lines:purchase_order_lines(
          *,
          products(id, code, name, base_uom)
        )
      `)
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    return NextResponse.json({ purchase_order: data })
  } catch (error) {
    console.error('Error in GET /api/planning/purchase-orders/:id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/planning/purchase-orders/:id - Update PO
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Authorization: MAJOR-02 Fix - Use centralized permission check
    if (!checkPOPermission(currentUser, 'edit')) {
      return NextResponse.json(
        { error: `Forbidden: ${getPermissionRequirement('edit')} required` },
        { status: 403 }
      )
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // AC-1.7: Fetch current PO to check status and validate edit permissions
    const { data: currentPO, error: fetchError } = await supabaseAdmin
      .from('purchase_orders')
      .select('status, org_id')
      .eq('id', id)
      .single()

    if (fetchError || !currentPO) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Verify org_id isolation
    if (currentPO.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // AC-1.7: Validation - Cannot edit PO in Closed or Receiving status
    if (['closed', 'receiving'].includes(currentPO.status.toLowerCase())) {
      return NextResponse.json(
        { error: 'Cannot edit PO in Closed or Receiving status' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData: UpdatePurchaseOrderInput = updatePurchaseOrderSchema.parse(body)

    // Prepare update data (AC-1.7: Can edit limited fields only)
    const updateData = {
      expected_delivery_date: validatedData.expected_delivery_date
        ? validatedData.expected_delivery_date.toISOString().split('T')[0]
        : undefined,
      payment_terms: validatedData.payment_terms,
      shipping_method: validatedData.shipping_method,
      notes: validatedData.notes,
      updated_by: session.user.id,
      updated_at: new Date().toISOString(),
    }

    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData]
      }
    })

    // Update PO
    const { data, error: updateError } = await supabaseAdmin
      .from('purchase_orders')
      .update(updateData)
      .eq('id', id)
      .eq('org_id', currentUser.org_id)
      .select(`
        *,
        suppliers(id, code, name, currency),
        warehouses(id, code, name)
      `)
      .single()

    if (updateError) {
      console.error('Error updating purchase order:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      purchase_order: data,
      message: 'Purchase order updated successfully',
    })
  } catch (error) {
    console.error('Error in PUT /api/planning/purchase-orders/:id:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/planning/purchase-orders/:id - Delete PO
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase()

    // Check authentication
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current user
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Authorization: MAJOR-02 Fix - Use centralized permission check
    if (!checkPOPermission(currentUser, 'delete')) {
      return NextResponse.json(
        { error: `Forbidden: ${getPermissionRequirement('delete')} required` },
        { status: 403 }
      )
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // AC-1.8: Check PO status first
    const { data: po } = await supabaseAdmin
      .from('purchase_orders')
      .select('status, org_id')
      .eq('id', id)
      .single()

    if (!po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Verify org_id isolation
    if (po.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // AC-1.8: Can only delete POs in Draft status
    if (po.status.toLowerCase() !== 'draft') {
      return NextResponse.json(
        { error: 'Can only delete POs in Draft status' },
        { status: 403 }
      )
    }

    // Auto-delete PO lines if PO is in Draft status
    // Note: purchase_order_lines doesn't have org_id - it's enforced via FK to purchase_orders
    const { error: deleteLinesError } = await supabaseAdmin
      .from('purchase_order_lines')
      .delete()
      .eq('po_id', id)

    if (deleteLinesError) {
      console.error('Error deleting PO lines:', deleteLinesError)
      return NextResponse.json({ error: 'Failed to delete PO lines' }, { status: 500 })
    }

    // Delete PO
    const { error: deleteError } = await supabaseAdmin
      .from('purchase_orders')
      .delete()
      .eq('id', id)
      .eq('org_id', currentUser.org_id)

    if (deleteError) {
      console.error('Error deleting purchase order:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Purchase order deleted successfully',
    })
  } catch (error) {
    console.error('Error in DELETE /api/planning/purchase-orders/:id:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
