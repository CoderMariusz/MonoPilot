import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { UpdateBOMItemSchema } from '@/lib/validation/bom-schemas';
import { ZodError } from 'zod';

/**
 * Individual BOM Item API Routes
 * Story: 2.7 BOM Items Management
 *
 * PUT /api/technical/boms/:id/items/:itemId - Update BOM item
 * DELETE /api/technical/boms/:id/items/:itemId - Delete BOM item
 */

// ============================================================================
// PUT /api/technical/boms/:id/items/:itemId - Update item (AC-2.7.4)
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    const supabase = await createServerSupabase();

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user to check role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', session.user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check authorization: Admin or Technical only
    if (!['admin', 'technical'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Technical role required' },
        { status: 403 }
      );
    }

    // Verify item exists and belongs to this BOM
    const { data: existingItem, error: itemError } = await supabase
      .from('bom_items')
      .select('id, bom_id')
      .eq('id', itemId)
      .eq('bom_id', id)
      .single();

    if (itemError || !existingItem) {
      return NextResponse.json({ error: 'BOM item not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = UpdateBOMItemSchema.parse(body);

    // Update BOM item
    const { data: item, error: updateError } = await supabase
      .from('bom_items')
      .update(validatedData)
      .eq('id', itemId)
      .select(`
        *,
        product:products!product_id (
          id,
          code,
          name,
          type,
          uom
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating BOM item:', updateError);
      throw new Error(`Failed to update BOM item: ${updateError.message}`);
    }

    return NextResponse.json(
      {
        item,
        message: 'BOM item updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PUT /api/technical/boms/[id]/items/[itemId]:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// DELETE /api/technical/boms/:id/items/:itemId - Delete item (AC-2.7.4)
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; itemId: string }> }
) {
  try {
    const { id, itemId } = await params
    const supabase = await createServerSupabase();

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current user to check role
    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, org_id')
      .eq('id', session.user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check authorization: Admin or Technical only
    if (!['admin', 'technical'].includes(currentUser.role)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Technical role required' },
        { status: 403 }
      );
    }

    // Verify item exists and belongs to this BOM
    const { data: existingItem, error: itemError } = await supabase
      .from('bom_items')
      .select('id, bom_id')
      .eq('id', itemId)
      .eq('bom_id', id)
      .single();

    if (itemError || !existingItem) {
      return NextResponse.json({ error: 'BOM item not found' }, { status: 404 });
    }

    // Delete BOM item
    const { error: deleteError } = await supabase
      .from('bom_items')
      .delete()
      .eq('id', itemId);

    if (deleteError) {
      console.error('Error deleting BOM item:', deleteError);
      throw new Error(`Failed to delete BOM item: ${deleteError.message}`);
    }

    return NextResponse.json(
      { message: 'BOM item deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in DELETE /api/technical/boms/[id]/items/[itemId]:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
