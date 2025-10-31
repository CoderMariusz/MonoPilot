// PO Approve API Route - Phase 1 Planning Module
// Handles PO approval workflow

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validatePOAction } from '@/lib/planning/status';

// PATCH /api/planning/po/[id]/approve - Approve PO
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const poId = parseInt(params.id);
    const body = await request.json();
    
    if (isNaN(poId)) {
      return NextResponse.json({ error: 'Invalid PO ID' }, { status: 400 });
    }
    
    const { approved_by } = body;
    
    if (!approved_by) {
      return NextResponse.json(
        { error: 'approved_by is required' },
        { status: 400 }
      );
    }
    
    // Get current PO and lines
    const { data: po, error: poError } = await supabase
      .from('po_header')
      .select(`
        *,
        po_lines:po_line(*, item:products(*))
      `)
      .eq('id', poId)
      .single();
    
    if (poError || !po) {
      return NextResponse.json({ error: 'PO not found' }, { status: 404 });
    }
    
    // Validate approval action
    const validation = validatePOAction({
      po,
      lines: po.po_lines || [],
      userRole: 'planner_approver', // TODO: Get from session
      action: 'approve',
      formData: { approved_by }
    });
    
    if (!validation.isValid) {
      return NextResponse.json({
        error: 'Validation failed',
        details: validation.errors,
        warnings: validation.warnings
      }, { status: 400 });
    }
    
    // Update PO status
    const { data: updatedPO, error: updateError } = await supabase
      .from('po_header')
      .update({
        status: 'approved',
        approved_by,
        updated_at: new Date().toISOString()
      })
      .eq('id', poId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error approving PO:', updateError);
      return NextResponse.json({ error: 'Failed to approve PO' }, { status: 500 });
    }
    
    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        entity: 'po_header',
        entity_id: poId,
        action: 'approve',
        before: { status: po.status },
        after: { status: 'approved', approved_by },
        actor_id: approved_by,
        created_at: new Date().toISOString()
      });
    
    return NextResponse.json({
      message: 'PO approved successfully',
      data: updatedPO,
      warnings: validation.warnings
    });
    
  } catch (error) {
    console.error('PO approve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
