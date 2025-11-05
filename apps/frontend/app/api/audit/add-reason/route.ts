import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { entity_type, entity_id, reason } = await req.json();

    if (!entity_type || !entity_id) {
      return NextResponse.json(
        { error: 'entity_type and entity_id are required' },
        { status: 400 }
      );
    }

    // Call the database function to add reason to the most recent audit event
    const { error } = await supabase.rpc('add_audit_reason', {
      p_entity_type: entity_type,
      p_entity_id: entity_id,
      p_reason: reason || null
    });

    if (error) {
      console.error('Failed to add audit reason:', error);
      return NextResponse.json(
        { error: 'Failed to add audit reason' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add audit reason error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

