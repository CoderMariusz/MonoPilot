import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/server';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const bomId = parseInt(params.id);

    if (isNaN(bomId)) {
      return NextResponse.json({ error: 'Invalid BOM ID' }, { status: 400 });
    }

    // Get current BOM with items
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select(`
        *,
        bom_items (*)
      `)
      .eq('id', bomId)
      .single();

    if (bomError || !bom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 });
    }

    // If BOM is active, clone-on-edit
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

      // Copy BOM items to the clone
      if (bom.bom_items && bom.bom_items.length > 0) {
        const clonedItems = bom.bom_items.map((item: any) => ({
          bom_id: clonedBom.id,
          material_id: item.material_id,
          quantity: item.quantity,
          uom: item.uom,
          sequence: item.sequence,
          priority: item.priority,
          production_lines: item.production_lines,
          production_line_restrictions: item.production_line_restrictions,
          scrap_std_pct: item.scrap_std_pct,
          is_optional: item.is_optional,
          is_phantom: item.is_phantom,
          consume_whole_lp: item.consume_whole_lp,
          unit_cost_std: item.unit_cost_std,
          tax_code_id: item.tax_code_id,
          lead_time_days: item.lead_time_days,
          moq: item.moq
        }));

        const { error: itemsError } = await supabase
          .from('bom_items')
          .insert(clonedItems);

        if (itemsError) {
          return NextResponse.json({ error: 'Failed to copy BOM items' }, { status: 500 });
        }
      }

      // Apply header updates to the clone
      const { error: updateError } = await supabase
        .from('boms')
        .update(body)
        .eq('id', clonedBom.id);

      if (updateError) {
        return NextResponse.json({ error: 'Failed to update cloned BOM' }, { status: 500 });
      }

      return NextResponse.json({ 
        id: clonedBom.id, 
        status: 'draft',
        cloned: true 
      });
    }

    // For draft BOMs, update directly
    const { error: updateError } = await supabase
      .from('boms')
      .update(body)
      .eq('id', bomId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update BOM' }, { status: 500 });
    }

    return NextResponse.json({ 
      id: bomId, 
      status: 'draft',
      cloned: false 
    });

  } catch (error) {
    console.error('BOM update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bomId = parseInt(params.id);
    const url = new URL(req.url);
    const mode = url.searchParams.get('mode') ?? 'soft';

    if (isNaN(bomId)) {
      return NextResponse.json({ error: 'Invalid BOM ID' }, { status: 400 });
    }

    if (mode === 'hard') {
      try {
        // Delete BOM items first
        const { error: itemsError } = await supabase
          .from('bom_items')
          .delete()
          .eq('bom_id', bomId);

        if (itemsError) {
          return NextResponse.json({ error: 'Failed to delete BOM items' }, { status: 500 });
        }

        // Delete BOM (trigger will block if not draft or used by WOs)
        const { error: bomError } = await supabase
          .from('boms')
          .delete()
          .eq('id', bomId);

        if (bomError) {
          return NextResponse.json({ 
            error: bomError.message, 
            hint: 'Archive instead' 
          }, { status: 409 });
        }

        return NextResponse.json({ ok: true, mode: 'hard' });
      } catch (error: any) {
        return NextResponse.json({ 
          error: error.message, 
          hint: 'Archive instead' 
        }, { status: 409 });
      }
    }

    // Soft delete = archive
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

    return NextResponse.json({ ok: true, mode: 'archive' });

  } catch (error) {
    console.error('BOM delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
