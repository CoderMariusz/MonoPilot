// TO Line Individual API Route - Phase 1 Planning Module
// Handles individual TO line operations (GET, PUT, DELETE)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/planning/to/line/[lineId] - Get TO line
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
      .from('to_line')
      .select(`
        *,
        item:products(*),
        from_location:locations(*),
        to_location:locations(*),
        to_header:to_header(*)
      `)
      .eq('id', lineIdNum)
      .single();
    
    if (error || !line) {
      return NextResponse.json({ error: 'TO line not found' }, { status: 404 });
    }
    
    return NextResponse.json({ data: line });
    
  } catch (error) {
    console.error('TO line GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/planning/to/line/[lineId] - Update TO line
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
      qty_planned,
      from_location_id,
      to_location_id,
      scan_required,
      approved_line
    } = body;
    
    // Check if line exists and TO is in draft status
    const { data: existingLine } = await supabase
      .from('to_line')
      .select(`
        *,
        to_header:to_header(status)
      `)
      .eq('id', lineIdNum)
      .single();
    
    if (!existingLine) {
      return NextResponse.json({ error: 'TO line not found' }, { status: 404 });
    }
    
    if (existingLine.to_header.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft TOs can have lines updated' },
        { status: 400 }
      );
    }
    
    // Update TO line
    const { data: updatedLine, error: updateError } = await supabase
      .from('to_line')
      .update({
        item_id,
        uom,
        qty_planned,
        from_location_id,
        to_location_id,
        scan_required,
        approved_line,
        updated_at: new Date().toISOString()
      })
      .eq('id', lineIdNum)
      .select(`
        *,
        item:products(*),
        from_location:locations(*),
        to_location:locations(*)
      `)
      .single();
    
    if (updateError) {
      console.error('Error updating TO line:', updateError);
      return NextResponse.json({ error: 'Failed to update TO line' }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'TO line updated successfully',
      data: updatedLine
    });
    
  } catch (error) {
    console.error('TO line PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/planning/to/line/[lineId] - Delete TO line
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
    
    // Check if line exists and TO is in draft status
    const { data: existingLine } = await supabase
      .from('to_line')
      .select(`
        *,
        to_header:to_header(status)
      `)
      .eq('id', lineIdNum)
      .single();
    
    if (!existingLine) {
      return NextResponse.json({ error: 'TO line not found' }, { status: 404 });
    }
    
    if (existingLine.to_header.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft TOs can have lines deleted' },
        { status: 400 }
      );
    }
    
    // Delete TO line
    const { error: deleteError } = await supabase
      .from('to_line')
      .delete()
      .eq('id', lineIdNum);
    
    if (deleteError) {
      console.error('Error deleting TO line:', deleteError);
      return NextResponse.json({ error: 'Failed to delete TO line' }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'TO line deleted successfully'
    });
    
  } catch (error) {
    console.error('TO line DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
