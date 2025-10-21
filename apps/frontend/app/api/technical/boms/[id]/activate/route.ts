import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bomId = parseInt(params.id);

    if (isNaN(bomId)) {
      return NextResponse.json({ error: 'Invalid BOM ID' }, { status: 400 });
    }

    // Get current BOM
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select('*')
      .eq('id', bomId)
      .single();

    if (bomError || !bom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 });
    }

    if (bom.status !== 'draft') {
      return NextResponse.json({ 
        error: 'Only draft BOMs can be activated' 
      }, { status: 400 });
    }

    // Archive all other active BOMs for the same product
    const { data: archivedBoms, error: archiveError } = await supabase
      .from('boms')
      .update({ 
        status: 'archived', 
        archived_at: new Date().toISOString() 
      })
      .eq('product_id', bom.product_id)
      .eq('status', 'active')
      .select('id');

    if (archiveError) {
      return NextResponse.json({ error: 'Failed to archive previous BOMs' }, { status: 500 });
    }

    // Activate the target BOM
    const { error: activateError } = await supabase
      .from('boms')
      .update({ 
        status: 'active',
        effective_from: new Date().toISOString()
      })
      .eq('id', bomId);

    if (activateError) {
      return NextResponse.json({ error: 'Failed to activate BOM' }, { status: 500 });
    }

    return NextResponse.json({ 
      id: bomId, 
      status: 'active',
      previous_archived: archivedBoms?.length || 0
    });

  } catch (error) {
    console.error('BOM activate error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
