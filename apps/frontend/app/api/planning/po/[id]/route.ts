// PO Individual API Routes - Phase 1 Planning Module
// Handles individual PO operations (GET, PUT, DELETE)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/planning/po/[id] - Get single PO
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const poId = parseInt(id);
    
    if (isNaN(poId)) {
      return NextResponse.json({ error: 'Invalid PO ID' }, { status: 400 });
    }
    
    const { data: po, error } = await supabase
      .from('po_header')
      .select(`
        *,
        supplier:suppliers(*),
        po_lines:po_line(*, item:products(*), default_location:locations(*)),
        po_corrections:po_correction(*)
      `)
      .eq('id', poId)
      .single();
    
    if (error) {
      console.error('Error fetching PO:', error);
      return NextResponse.json({ error: 'PO not found' }, { status: 404 });
    }
    
    return NextResponse.json({ data: po });
    
  } catch (error) {
    console.error('PO GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/planning/po/[id] - Update PO
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const poId = parseInt(id);
    const body = await request.json();
    
    if (isNaN(poId)) {
      return NextResponse.json({ error: 'Invalid PO ID' }, { status: 400 });
    }
    
    const {
      supplier_id,
      currency,
      exchange_rate,
      order_date,
      requested_delivery_date,
      promised_delivery_date,
      asn_ref,
      snapshot_supplier_name,
      snapshot_supplier_vat,
      snapshot_supplier_address
    } = body;
    
    // Check if PO exists and is in draft status
    const { data: existingPO } = await supabase
      .from('po_header')
      .select('status')
      .eq('id', poId)
      .single();
    
    if (!existingPO) {
      return NextResponse.json({ error: 'PO not found' }, { status: 404 });
    }
    
    if (existingPO.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft POs can be updated' },
        { status: 400 }
      );
    }
    
    // Update PO header
    const { data: updatedPO, error: updateError } = await supabase
      .from('po_header')
      .update({
        supplier_id,
        currency,
        exchange_rate,
        order_date,
        requested_delivery_date,
        promised_delivery_date,
        asn_ref,
        snapshot_supplier_name,
        snapshot_supplier_vat,
        snapshot_supplier_address,
        updated_at: new Date().toISOString()
      })
      .eq('id', poId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating PO:', updateError);
      return NextResponse.json({ error: 'Failed to update PO' }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'PO updated successfully',
      data: updatedPO
    });
    
  } catch (error) {
    console.error('PO PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/planning/po/[id] - Delete PO (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const poId = parseInt(id);
    
    if (isNaN(poId)) {
      return NextResponse.json({ error: 'Invalid PO ID' }, { status: 400 });
    }
    
    // Check if PO exists and is in draft status
    const { data: existingPO } = await supabase
      .from('po_header')
      .select('status')
      .eq('id', poId)
      .single();
    
    if (!existingPO) {
      return NextResponse.json({ error: 'PO not found' }, { status: 404 });
    }
    
    if (existingPO.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft POs can be deleted' },
        { status: 400 }
      );
    }
    
    // Delete PO (cascade will handle lines and corrections)
    const { error: deleteError } = await supabase
      .from('po_header')
      .delete()
      .eq('id', poId);
    
    if (deleteError) {
      console.error('Error deleting PO:', deleteError);
      return NextResponse.json({ error: 'Failed to delete PO' }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'PO deleted successfully'
    });
    
  } catch (error) {
    console.error('PO DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
