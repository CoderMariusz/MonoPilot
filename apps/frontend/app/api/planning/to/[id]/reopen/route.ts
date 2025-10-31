// TO Reopen API Route - Phase 1 Planning Module
// Handles TO reopening workflow

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateTOAction } from '@/lib/planning/status';

// PATCH /api/planning/to/[id]/reopen - Reopen TO
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
    
    const { reopen_reason } = body;
    
    if (!reopen_reason) {
      return NextResponse.json(
        { error: 'reopen_reason is required' },
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
    
    // Validate reopen action
    const validation = validateTOAction({
      to,
      lines: to.to_lines || [],
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
    
    // Update TO status
    const { data: updatedTO, error: updateError } = await supabase
      .from('to_header')
      .update({
        status: 'draft',
        approved_by: null, // Clear approval
        updated_at: new Date().toISOString()
      })
      .eq('id', toId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error reopening TO:', updateError);
      return NextResponse.json({ error: 'Failed to reopen TO' }, { status: 500 });
    }
    
    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        entity: 'to_header',
        entity_id: toId,
        action: 'reopen',
        before: { status: to.status },
        after: { 
          status: 'draft',
          reopen_reason
        },
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        created_at: new Date().toISOString()
      });
    
    return NextResponse.json({
      message: 'TO reopened successfully',
      data: updatedTO,
      warnings: validation.warnings
    });
    
  } catch (error) {
    console.error('TO reopen error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
