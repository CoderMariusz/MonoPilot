// TO Lines API Route - Phase 1 Planning Module
// Handles TO line items CRUD operations

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/planning/to/[id]/lines - Get TO lines
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const toId = parseInt(params.id);
    
    if (isNaN(toId)) {
      return NextResponse.json({ error: 'Invalid TO ID' }, { status: 400 });
    }
    
    const { data: lines, error } = await supabase
      .from('to_line')
      .select(`
        *,
        item:products(*),
        from_location:locations(*),
        to_location:locations(*)
      `)
      .eq('to_id', toId)
      .order('line_no');
    
    if (error) {
      console.error('Error fetching TO lines:', error);
      return NextResponse.json({ error: 'Failed to fetch TO lines' }, { status: 500 });
    }
    
    return NextResponse.json({ data: lines });
    
  } catch (error) {
    console.error('TO lines GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/planning/to/[id]/lines - Add TO line
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const toId = parseInt(params.id);
    const body = await request.json();
    
    if (isNaN(toId)) {
      return NextResponse.json({ error: 'Invalid TO ID' }, { status: 400 });
    }
    
    const {
      item_id,
      uom,
      qty_planned,
      from_location_id,
      to_location_id,
      scan_required = false,
      approved_line = false
    } = body;
    
    // Validate required fields
    if (!item_id || !uom || !qty_planned) {
      return NextResponse.json(
        { error: 'Missing required fields: item_id, uom, qty_planned' },
        { status: 400 }
      );
    }
    
    // Check if TO exists and is in draft status
    const { data: to } = await supabase
      .from('to_header')
      .select('status')
      .eq('id', toId)
      .single();
    
    if (!to) {
      return NextResponse.json({ error: 'TO not found' }, { status: 404 });
    }
    
    if (to.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft TOs can have lines added' },
        { status: 400 }
      );
    }
    
    // Get next line number
    const { data: existingLines } = await supabase
      .from('to_line')
      .select('line_no')
      .eq('to_id', toId)
      .order('line_no', { ascending: false })
      .limit(1);
    
    const nextLineNo = existingLines?.[0]?.line_no ? existingLines[0].line_no + 1 : 1;
    
    // Create TO line
    const { data: newLine, error: lineError } = await supabase
      .from('to_line')
      .insert({
        to_id: toId,
        line_no: nextLineNo,
        item_id,
        uom,
        qty_planned,
        from_location_id,
        to_location_id,
        scan_required,
        approved_line
      })
      .select(`
        *,
        item:products(*),
        from_location:locations(*),
        to_location:locations(*)
      `)
      .single();
    
    if (lineError) {
      console.error('Error creating TO line:', lineError);
      return NextResponse.json({ error: 'Failed to create TO line' }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'TO line added successfully',
      data: newLine
    }, { status: 201 });
    
  } catch (error) {
    console.error('TO line POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
