// PO Line Individual API Route - Phase 1 Planning Module
// Handles individual PO line operations (GET, PUT, DELETE)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/planning/po/line/[lineId] - Get PO line
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ lineId: string }> }
) {
  try {
    const supabase = createClient();
    const { lineId } = await params;
    const lineIdNum = parseInt(lineId);
    
    if (isNaN(lineIdNum)) {
      return NextResponse.json({ error: 'Invalid line ID' }, { status: 400 });
    }
    
    const { data: line, error } = await supabase
      .from('po_line')
      .select(`
        *,
        item:products(*),
        default_location:locations(*),
        po_header:po_header(*)
      `)
      .eq('id', lineIdNum)
      .single();
    
    if (error || !line) {
      return NextResponse.json({ error: 'PO line not found' }, { status: 404 });
    }
    
    return NextResponse.json({ data: line });
    
  } catch (error) {
    console.error('PO line GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/planning/po/line/[lineId] - Update PO line
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ lineId: string }> }
) {
  try {
    const supabase = createClient();
    const { lineId } = await params;
    const lineIdNum = parseInt(lineId);
    const body = await request.json();
    
    if (isNaN(lineIdNum)) {
      return NextResponse.json({ error: 'Invalid line ID' }, { status: 400 });
    }
    
    const {
      item_id,
      uom,
      qty_ordered,
      unit_price,
      vat_rate,
      requested_delivery_date,
      promised_delivery_date,
      default_location_id,
      note
    } = body;
    
    // Check if line exists and PO is in draft status
    const { data: existingLine } = await supabase
      .from('po_line')
      .select(`
        *,
        po_header:po_header(status)
      `)
      .eq('id', lineIdNum)
      .single();
    
    if (!existingLine) {
      return NextResponse.json({ error: 'PO line not found' }, { status: 404 });
    }
    
    if (existingLine.po_header.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft POs can have lines updated' },
        { status: 400 }
      );
    }
    
    // Update PO line
    const { data: updatedLine, error: updateError } = await supabase
      .from('po_line')
      .update({
        item_id,
        uom,
        qty_ordered,
        unit_price,
        vat_rate,
        requested_delivery_date,
        promised_delivery_date,
        default_location_id,
        note,
        updated_at: new Date().toISOString()
      })
      .eq('id', lineIdNum)
      .select(`
        *,
        item:products(*),
        default_location:locations(*)
      `)
      .single();
    
    if (updateError) {
      console.error('Error updating PO line:', updateError);
      return NextResponse.json({ error: 'Failed to update PO line' }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'PO line updated successfully',
      data: updatedLine
    });
    
  } catch (error) {
    console.error('PO line PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/planning/po/line/[lineId] - Delete PO line
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ lineId: string }> }
) {
  try {
    const supabase = createClient();
    const { lineId } = await params;
    const lineIdNum = parseInt(lineId);
    
    if (isNaN(lineIdNum)) {
      return NextResponse.json({ error: 'Invalid line ID' }, { status: 400 });
    }
    
    // Check if line exists and PO is in draft status
    const { data: existingLine } = await supabase
      .from('po_line')
      .select(`
        *,
        po_header:po_header(status)
      `)
      .eq('id', lineIdNum)
      .single();
    
    if (!existingLine) {
      return NextResponse.json({ error: 'PO line not found' }, { status: 404 });
    }
    
    if (existingLine.po_header.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft POs can have lines deleted' },
        { status: 400 }
      );
    }
    
    // Delete PO line
    const { error: deleteError } = await supabase
      .from('po_line')
      .delete()
      .eq('id', lineIdNum);
    
    if (deleteError) {
      console.error('Error deleting PO line:', deleteError);
      return NextResponse.json({ error: 'Failed to delete PO line' }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'PO line deleted successfully'
    });
    
  } catch (error) {
    console.error('PO line DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
