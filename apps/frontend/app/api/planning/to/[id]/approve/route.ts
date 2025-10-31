// TO Approve API Route - Phase 1 Planning Module
// Handles TO approval workflow

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateTOAction } from '@/lib/planning/status';

// PATCH /api/planning/to/[id]/approve - Approve TO
export async function PATCH(
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
    
    const { approved_by } = body;
    
    if (!approved_by) {
      return NextResponse.json(
        { error: 'approved_by is required' },
        { status: 400 }
      );
    }
    
    // Get current TO and lines
    const { data: to, error: toError } = await supabase
      .from('to_header')
      .select(`
        *,
        to_lines:to_line(*, item:products(*))
      `)
      .eq('id', toId)
      .single();
    
    if (toError || !to) {
      return NextResponse.json({ error: 'TO not found' }, { status: 404 });
    }
    
    // Validate approval action
    const validation = validateTOAction({
      to,
      lines: to.to_lines || [],
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
    
    // Update TO status
    const { data: updatedTO, error: updateError } = await supabase
      .from('to_header')
      .update({
        status: 'approved',
        approved_by,
        updated_at: new Date().toISOString()
      })
      .eq('id', toId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error approving TO:', updateError);
      return NextResponse.json({ error: 'Failed to approve TO' }, { status: 500 });
    }
    
    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        entity: 'to_header',
        entity_id: toId,
        action: 'approve',
        before: { status: to.status },
        after: { status: 'approved', approved_by },
        actor_id: approved_by,
        created_at: new Date().toISOString()
      });
    
    return NextResponse.json({
      message: 'TO approved successfully',
      data: updatedTO,
      warnings: validation.warnings
    });
    
  } catch (error) {
    console.error('TO approve error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
