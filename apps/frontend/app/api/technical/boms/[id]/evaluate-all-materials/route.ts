import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

/**
 * EPIC-001 Phase 3: Conditional Components
 * POST /api/technical/boms/[id]/evaluate-all-materials
 *
 * Get all BOM materials with condition evaluation results (for UI display)
 * Returns ALL materials (conditional and unconditional) with evaluation status
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

    // Call RPC function to get all BOM materials with evaluation
    const { data, error } = await supabase.rpc('get_all_bom_materials_with_evaluation', {
      p_bom_id: bomId,
      p_wo_context: context,
    });

    if (error) {
      console.error('Error evaluating all BOM materials:', error);
      return NextResponse.json(
        { error: `Failed to evaluate BOM materials: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('BOM evaluate all materials error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
