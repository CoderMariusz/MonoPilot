// TO Close API Route - Phase 1 Planning Module
// Handles TO closing workflow

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { validateTOAction } from '@/lib/planning/status';

// PATCH /api/planning/to/[id]/close - Close TO
export async function PATCH(
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
      close_reason,
      over_receipt_confirmed = false,
      short_close = false
    } = body;
    
    if (!close_reason) {
      return NextResponse.json(
        { error: 'close_reason is required' },
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
    
    // Validate close action
    const validation = validateTOAction({
      to,
      lines: to.to_lines || [],
      userRole: 'planner_approver', // TODO: Get from session
      action: 'close',
      formData: { close_reason }
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
        status: 'closed',
        updated_at: new Date().toISOString()
      })
      .eq('id', toId)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error closing TO:', updateError);
      return NextResponse.json({ error: 'Failed to close TO' }, { status: 500 });
    }
    
    // Log audit trail
    await supabase
      .from('audit_log')
      .insert({
        entity: 'to_header',
        entity_id: toId,
        action: 'close',
        before: { status: to.status },
        after: { 
          status: 'closed',
          close_reason,
          over_receipt_confirmed,
          short_close
        },
        actor_id: (await supabase.auth.getUser()).data.user?.id,
        created_at: new Date().toISOString()
      });
    
    return NextResponse.json({
      message: 'TO closed successfully',
      data: updatedTO,
      warnings: validation.warnings
    });
    
  } catch (error) {
    console.error('TO close error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
