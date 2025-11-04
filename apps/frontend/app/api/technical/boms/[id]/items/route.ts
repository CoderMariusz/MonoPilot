import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { items } = await req.json();
    const { id } = await params;
    const bomId = parseInt(id);

    if (isNaN(bomId)) {
      return NextResponse.json({ error: 'Invalid BOM ID' }, { status: 400 });
    }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Items must be an array' }, { status: 400 });
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

    let targetBomId = bomId;

    // If BOM is active, clone-on-edit first
    if (bom.status === 'active') {
      const { data: clonedBom, error: cloneError } = await supabase
        .from('boms')
        .insert({
          product_id: bom.product_id,
          version: `${bom.version}-draft-${Date.now()}`,
          status: 'draft',
          requires_routing: bom.requires_routing,
          default_routing_id: bom.default_routing_id,
          notes: bom.notes,
          effective_from: bom.effective_from,
          effective_to: bom.effective_to
        })
        .select()
        .single();

      if (cloneError || !clonedBom) {
        return NextResponse.json({ error: 'Failed to clone BOM' }, { status: 500 });
      }

      targetBomId = clonedBom.id;
    }

    // Delete existing items for target BOM
    const { error: deleteError } = await supabase
      .from('bom_items')
      .delete()
      .eq('bom_id', targetBomId);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete existing items' }, { status: 500 });
    }

    // Insert new items
    if (items.length > 0) {
      const itemsToInsert = items.map((item: any) => ({
        bom_id: targetBomId,
        material_id: item.material_id,
        quantity: item.quantity,
        uom: item.uom,
        sequence: item.sequence || 1,
        priority: item.priority,
        production_lines: item.production_lines || [],
        production_line_restrictions: item.production_line_restrictions || [],
        scrap_std_pct: item.scrap_std_pct || 0,
        is_optional: item.is_optional || false,
        is_phantom: item.is_phantom || false,
        consume_whole_lp: item.consume_whole_lp || false,
        unit_cost_std: item.unit_cost_std,
        tax_code_id: item.tax_code_id,
        lead_time_days: item.lead_time_days,
        moq: item.moq
      }));

      const { error: insertError } = await supabase
        .from('bom_items')
        .insert(itemsToInsert);

      if (insertError) {
        return NextResponse.json({ error: 'Failed to insert BOM items' }, { status: 500 });
      }
    }

    return NextResponse.json({ 
      bom_id: targetBomId, 
      status: bom.status === 'active' ? 'draft' : bom.status 
    });

  } catch (error) {
    console.error('BOM items update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
