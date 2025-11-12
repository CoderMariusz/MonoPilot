import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

/**
 * EPIC-001 Phase 3: Conditional Components
 * POST /api/technical/boms/[id]/evaluate-materials
 *
 * Evaluates BOM materials based on WO context (order flags, customer, etc.)
 * Returns only materials that match conditions or are unconditional
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bomId = parseInt(id);

    if (isNaN(bomId)) {
      return NextResponse.json({ error: 'Invalid BOM ID' }, { status: 400 });
    }

    const body = await req.json();
    const { context } = body;

    if (!context || typeof context !== 'object') {
      return NextResponse.json(
        { error: 'Context object is required' },
        { status: 400 }
      );
    }

    // Call RPC function to evaluate BOM materials
    const { data, error } = await supabase.rpc('evaluate_bom_materials', {
      p_bom_id: bomId,
      p_wo_context: context,
    });

    if (error) {
      console.error('Error evaluating BOM materials:', error);
      return NextResponse.json(
        { error: `Failed to evaluate BOM materials: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('BOM evaluate materials error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
