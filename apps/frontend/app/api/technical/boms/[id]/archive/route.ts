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

    if (bom.status === 'archived') {
      return NextResponse.json({ 
        error: 'BOM is already archived' 
      }, { status: 400 });
    }

    // Archive the BOM
    const { error: archiveError } = await supabase
      .from('boms')
      .update({ 
        status: 'archived',
        archived_at: new Date().toISOString()
      })
      .eq('id', bomId);

    if (archiveError) {
      return NextResponse.json({ error: 'Failed to archive BOM' }, { status: 500 });
    }

    return NextResponse.json({ 
      id: bomId, 
      status: 'archived' 
    });

  } catch (error) {
    console.error('BOM archive error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
