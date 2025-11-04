// PO Corrections API Route - Phase 1 Planning Module
// Handles PO financial corrections

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/planning/po/[id]/corrections - Get PO corrections
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
    
    const { data: corrections, error } = await supabase
      .from('po_correction')
      .select(`
        *,
        po_line:po_line(*, item:products(*))
      `)
      .eq('po_id', poId)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Error fetching PO corrections:', error);
      return NextResponse.json({ error: 'Failed to fetch PO corrections' }, { status: 500 });
    }
    
    return NextResponse.json({ data: corrections });
    
  } catch (error) {
    console.error('PO corrections GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/planning/po/[id]/corrections - Add PO correction
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
      po_line_id,
      reason,
      delta_amount
    } = body;
    
    // Validate required fields
    if (!reason || delta_amount === undefined || delta_amount === null) {
      return NextResponse.json(
        { error: 'Missing required fields: reason, delta_amount' },
        { status: 400 }
      );
    }
    
    // Check if PO exists
    const { data: po } = await supabase
      .from('po_header')
      .select('id, status')
      .eq('id', poId)
      .single();
    
    if (!po) {
      return NextResponse.json({ error: 'PO not found' }, { status: 404 });
    }
    
    // If po_line_id is provided, check if line exists
    if (po_line_id) {
      const { data: poLine } = await supabase
        .from('po_line')
        .select('id')
        .eq('id', po_line_id)
        .eq('po_id', poId)
        .single();
      
      if (!poLine) {
        return NextResponse.json(
          { error: 'PO line not found' },
          { status: 404 }
        );
      }
    }
    
    // Create PO correction
    const { data: newCorrection, error: correctionError } = await supabase
      .from('po_correction')
      .insert({
        po_id: poId,
        po_line_id: po_line_id || null,
        reason,
        delta_amount,
        created_by: (await supabase.auth.getUser()).data.user?.id
      })
      .select(`
        *,
        po_line:po_line(*, item:products(*))
      `)
      .single();
    
    if (correctionError) {
      console.error('Error creating PO correction:', correctionError);
      return NextResponse.json({ error: 'Failed to create PO correction' }, { status: 500 });
    }
    
    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        entity: 'po_correction',
        entity_id: newCorrection.id,
        action: 'create',
        before: null,
        after: {
          po_id: poId,
          po_line_id,
          reason,
          delta_amount
        },
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        created_at: new Date().toISOString()
      });
    
    return NextResponse.json({
      message: 'PO correction added successfully',
      data: newCorrection
    }, { status: 201 });
    
  } catch (error) {
    console.error('PO correction POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
