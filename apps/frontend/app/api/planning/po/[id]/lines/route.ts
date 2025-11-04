// PO Lines API Route - Phase 1 Planning Module
// Handles PO line items CRUD operations

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/planning/po/[id]/lines - Get PO lines
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
    
    const { data: lines, error } = await supabase
      .from('po_line')
      .select(`
        *,
        item:products(*),
        default_location:locations(*)
      `)
      .eq('po_id', poId)
      .order('line_no');
    
    if (error) {
      console.error('Error fetching PO lines:', error);
      return NextResponse.json({ error: 'Failed to fetch PO lines' }, { status: 500 });
    }
    
    return NextResponse.json({ data: lines });
    
  } catch (error) {
    console.error('PO lines GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/planning/po/[id]/lines - Add PO line
export async function POST(
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
      item_id,
      uom,
      qty_ordered,
      unit_price,
      vat_rate = 0,
      requested_delivery_date,
      promised_delivery_date,
      default_location_id,
      note
    } = body;
    
    // Validate required fields
    if (!item_id || !uom || !qty_ordered || !unit_price) {
      return NextResponse.json(
        { error: 'Missing required fields: item_id, uom, qty_ordered, unit_price' },
        { status: 400 }
      );
    }
    
    // Check if PO exists and is in draft status
    const { data: po } = await supabase
      .from('po_header')
      .select('status')
      .eq('id', poId)
      .single();
    
    if (!po) {
      return NextResponse.json({ error: 'PO not found' }, { status: 404 });
    }
    
    if (po.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft POs can have lines added' },
        { status: 400 }
      );
    }
    
    // Get next line number
    const { data: existingLines } = await supabase
      .from('po_line')
      .select('line_no')
      .eq('po_id', poId)
      .order('line_no', { ascending: false })
      .limit(1);
    
    const nextLineNo = existingLines?.[0]?.line_no ? existingLines[0].line_no + 1 : 1;
    
    // Create PO line
    const { data: newLine, error: lineError } = await supabase
      .from('po_line')
      .insert({
        po_id: poId,
        line_no: nextLineNo,
        item_id,
        uom,
        qty_ordered,
        unit_price,
        vat_rate,
        requested_delivery_date,
        promised_delivery_date,
        default_location_id,
        note
      })
      .select(`
        *,
        item:products(*),
        default_location:locations(*)
      `)
      .single();
    
    if (lineError) {
      console.error('Error creating PO line:', lineError);
      return NextResponse.json({ error: 'Failed to create PO line' }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'PO line added successfully',
      data: newLine
    }, { status: 201 });
    
  } catch (error) {
    console.error('PO line POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
