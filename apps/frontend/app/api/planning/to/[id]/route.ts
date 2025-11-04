// TO Individual API Routes - Phase 1 Planning Module
// Handles individual TO operations (GET, PUT, DELETE)

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/planning/to/[id] - Get single TO
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const toId = parseInt(id);
    
    if (isNaN(toId)) {
      return NextResponse.json({ error: 'Invalid TO ID' }, { status: 400 });
    }
    
    const { data: to, error } = await supabase
      .from('to_header')
      .select(`
        *,
        from_warehouse:warehouses!to_header_from_wh_id_fkey(*),
        to_warehouse:warehouses!to_header_to_wh_id_fkey(*),
        to_lines:to_line(*, item:products(*), from_location:locations(*), to_location:locations(*))
      `)
      .eq('id', toId)
      .single();
    
    if (error) {
      console.error('Error fetching TO:', error);
      return NextResponse.json({ error: 'TO not found' }, { status: 404 });
    }
    
    return NextResponse.json({ data: to });
    
  } catch (error) {
    console.error('TO GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PUT /api/planning/to/[id] - Update TO
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const toId = parseInt(id);
    const body = await request.json();
    
    if (isNaN(toId)) {
      return NextResponse.json({ error: 'Invalid TO ID' }, { status: 400 });
    }
    
    const {
      from_wh_id,
      to_wh_id,
      requested_date
    } = body;
    
    // Check if TO exists and is in draft status
    const { data: existingTO } = await supabase
      .from('to_header')
      .select('status')
      .eq('id', toId)
      .single();
    
    if (!existingTO) {
      return NextResponse.json({ error: 'TO not found' }, { status: 404 });
    }
    
    if (existingTO.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft TOs can be updated' },
        { status: 400 }
      );
    }
    
    // Update TO header
    const { data: updatedTO, error: updateError } = await supabase
      .from('to_header')
      .update({
        from_wh_id,
        to_wh_id,
        requested_date,
        updated_at: new Date().toISOString()
      })
      .eq('id', toId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating TO:', updateError);
      return NextResponse.json({ error: 'Failed to update TO' }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'TO updated successfully',
      data: updatedTO
    });
    
  } catch (error) {
    console.error('TO PUT error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/planning/to/[id] - Delete TO (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient();
    const { id } = await params;
    const toId = parseInt(id);
    
    if (isNaN(toId)) {
      return NextResponse.json({ error: 'Invalid TO ID' }, { status: 400 });
    }
    
    // Check if TO exists and is in draft status
    const { data: existingTO } = await supabase
      .from('to_header')
      .select('status')
      .eq('id', toId)
      .single();
    
    if (!existingTO) {
      return NextResponse.json({ error: 'TO not found' }, { status: 404 });
    }
    
    if (existingTO.status !== 'draft') {
      return NextResponse.json(
        { error: 'Only draft TOs can be deleted' },
        { status: 400 }
      );
    }
    
    // Delete TO (cascade will handle lines)
    const { error: deleteError } = await supabase
      .from('to_header')
      .delete()
      .eq('id', toId);
    
    if (deleteError) {
      console.error('Error deleting TO:', deleteError);
      return NextResponse.json({ error: 'Failed to delete TO' }, { status: 500 });
    }
    
    return NextResponse.json({
      message: 'TO deleted successfully'
    });
    
  } catch (error) {
    console.error('TO DELETE error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
