// API Route: Individual Purchase Order Line Operations
// Epic 3 Batch 3A - Story 3.2: PO Line Management
// PUT /api/planning/purchase-orders/:id/lines/:lineId - Update PO line
// DELETE /api/planning/purchase-orders/:id/lines/:lineId - Delete PO line

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase, createServerSupabaseAdmin } from '@/lib/supabase/server'
import { updatePOLineSchema, type UpdatePOLineInput } from '@/lib/validation/planning-schemas'
import { checkPOPermission, getPermissionRequirement } from '@/lib/utils/po-permissions'
import { ZodError } from 'zod'

// PUT /api/planning/purchase-orders/:id/lines/:lineId - Update PO line
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  try {
    const { id, lineId } = await params
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
    if (!checkPOPermission(currentUser, 'editLines')) {
      return NextResponse.json(
        { error: `Forbidden: ${getPermissionRequirement('editLines')} required` },
        { status: 403 }
      )
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Fetch current line to verify it exists
    const { data: currentLine, error: lineError } = await supabaseAdmin
      .from('po_lines')
      .select('po_id, org_id, product_id')
      .eq('id', lineId)
      .single()

    if (lineError || !currentLine) {
      return NextResponse.json({ error: 'PO line not found' }, { status: 404 })
    }

    // Verify org_id isolation
    if (currentLine.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'PO line not found' }, { status: 404 })
    }

    // Verify line belongs to the specified PO
    if (currentLine.po_id !== id) {
      return NextResponse.json({ error: 'PO line does not belong to this PO' }, { status: 400 })
    }

    // AC-2.8: Check PO status
    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .select('status, supplier_id')
      .eq('id', id)
      .single()

    if (poError || !po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // AC-2.8: Cannot edit lines if status = 'Closed' or 'Receiving'
    if (['closed', 'receiving'].includes(po.status.toLowerCase())) {
      return NextResponse.json(
        { error: 'Cannot edit lines of PO in Closed or Receiving status' },
        { status: 403 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData: UpdatePOLineInput = updatePOLineSchema.parse(body)

    // AC-2.5: Get tax rate from supplier's tax code
    const { data: supplier, error: supplierError } = await supabaseAdmin
      .from('suppliers')
      .select('tax_code_id, tax_codes(rate)')
      .eq('id', po.supplier_id)
      .single()

    if (supplierError || !supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    const tax_rate = (supplier.tax_codes as any)?.rate || 0

    // AC-2.3: Calculate line amounts with updated values
    const line_subtotal = Number(validatedData.quantity) * Number(validatedData.unit_price)
    const discount_amount = line_subtotal * (Number(validatedData.discount_percent || 0) / 100)
    const line_total = line_subtotal - discount_amount
    const tax_amount = line_total * (tax_rate / 100)
    const line_total_with_tax = line_total + tax_amount

    // Prepare update data (AC-2.3: Cannot edit product_id, uom, sequence)
    const updateData = {
      quantity: validatedData.quantity,
      unit_price: validatedData.unit_price,
      discount_percent: validatedData.discount_percent || 0,
      line_subtotal: Number(line_subtotal.toFixed(2)),
      discount_amount: Number(discount_amount.toFixed(2)),
      line_total: Number(line_total.toFixed(2)),
      tax_amount: Number(tax_amount.toFixed(2)),
      line_total_with_tax: Number(line_total_with_tax.toFixed(2)),
      expected_delivery_date: validatedData.expected_delivery_date
        ? validatedData.expected_delivery_date.toISOString().split('T')[0]
        : null,
      updated_at: new Date().toISOString(),
    }

    // Update line
    const { data, error: updateError } = await supabaseAdmin
      .from('po_lines')
      .update(updateData)
      .eq('id', lineId)
      .eq('org_id', currentUser.org_id)
      .select(`
        *,
        products(id, code, name, base_uom)
      `)
      .single()

    if (updateError) {
      console.error('Error updating PO line:', updateError)
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    // AC-2.6: Trigger recalculates PO totals automatically

    return NextResponse.json({
      line: data,
      message: 'PO line updated successfully',
    })
  } catch (error) {
    console.error('Error in PUT /api/planning/purchase-orders/:id/lines/:lineId:', error)

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      )
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/planning/purchase-orders/:id/lines/:lineId - Delete PO line
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; lineId: string }> }
) {
  try {
    const { id, lineId } = await params
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
    if (!checkPOPermission(currentUser, 'deleteLines')) {
      return NextResponse.json(
        { error: `Forbidden: ${getPermissionRequirement('deleteLines')} required` },
        { status: 403 }
      )
    }

    const supabaseAdmin = createServerSupabaseAdmin()

    // Fetch line to verify it exists
    const { data: line, error: lineError } = await supabaseAdmin
      .from('po_lines')
      .select('po_id, org_id, sequence')
      .eq('id', lineId)
      .single()

    if (lineError || !line) {
      return NextResponse.json({ error: 'PO line not found' }, { status: 404 })
    }

    // Verify org_id isolation
    if (line.org_id !== currentUser.org_id) {
      return NextResponse.json({ error: 'PO line not found' }, { status: 404 })
    }

    // Verify line belongs to the specified PO
    if (line.po_id !== id) {
      return NextResponse.json({ error: 'PO line does not belong to this PO' }, { status: 400 })
    }

    // AC-2.8: Check PO status
    const { data: po, error: poError } = await supabaseAdmin
      .from('purchase_orders')
      .select('status')
      .eq('id', id)
      .single()

    if (poError || !po) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // AC-2.8: Cannot delete lines if status = 'Closed' or 'Receiving'
    if (['closed', 'receiving'].includes(po.status.toLowerCase())) {
      return NextResponse.json(
        { error: 'Cannot delete lines of PO in Closed or Receiving status' },
        { status: 403 }
      )
    }

    // Delete line
    const { error: deleteError } = await supabaseAdmin
      .from('po_lines')
      .delete()
      .eq('id', lineId)
      .eq('org_id', currentUser.org_id)

    if (deleteError) {
      console.error('Error deleting PO line:', deleteError)
      return NextResponse.json({ error: deleteError.message }, { status: 500 })
    }

    // AC-2.4: Re-sequence remaining lines
    // Get all remaining lines for this PO
    const { data: remainingLines } = await supabaseAdmin
      .from('po_lines')
      .select('id')
      .eq('po_id', id)
      .eq('org_id', currentUser.org_id)
      .order('sequence', { ascending: true })

    if (remainingLines && remainingLines.length > 0) {
      // Update sequence numbers (1, 2, 3, ...)
      for (let i = 0; i < remainingLines.length; i++) {
        await supabaseAdmin
          .from('po_lines')
          .update({ sequence: i + 1 })
          .eq('id', remainingLines[i].id)
      }
    }

    // AC-2.6: Trigger recalculates PO totals automatically

    return NextResponse.json({
      success: true,
      message: 'PO line deleted successfully',
    })
  } catch (error) {
    console.error('Error in DELETE /api/planning/purchase-orders/:id/lines/:lineId:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
