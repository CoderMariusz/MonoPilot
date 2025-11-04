// PO Reopen API Route - Phase 1 Planning Module
// Handles PO reopening workflow

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validatePOAction } from '@/lib/planning/status';

// PATCH /api/planning/po/[id]/reopen - Reopen PO
export async function PATCH(
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
    
    const { reopen_reason } = body;
    
    if (!reopen_reason) {
      return NextResponse.json(
        { error: 'reopen_reason is required' },
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
    
    // Validate reopen action
    const validation = validatePOAction({
      po,
      lines: po.po_lines || [],
      userRole: 'planner_approver', // TODO: Get from session
      action: 'reopen',
      formData: { reopen_reason }
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
        status: 'draft',
        approved_by: null, // Clear approval
        updated_at: new Date().toISOString()
      })
      .eq('id', poId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error reopening PO:', updateError);
      return NextResponse.json({ error: 'Failed to reopen PO' }, { status: 500 });
    }
    
    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        entity: 'po_header',
        entity_id: poId,
        action: 'reopen',
        before: { status: po.status },
        after: { 
          status: 'draft',
          reopen_reason
        },
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        created_at: new Date().toISOString()
      });
    
    return NextResponse.json({
      message: 'PO reopened successfully',
      data: updatedPO,
      warnings: validation.warnings
    });
    
  } catch (error) {
    console.error('PO reopen error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
