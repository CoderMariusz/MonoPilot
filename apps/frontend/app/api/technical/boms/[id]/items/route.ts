import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { CreateBOMItemSchema, ReorderBOMItemsSchema } from '@/lib/validation/bom-schemas';
import { ZodError } from 'zod';

/**
 * BOM Items API Routes
 * Story: 2.7 BOM Items Management
 *
 * GET /api/technical/boms/:id/items - List BOM items
 * POST /api/technical/boms/:id/items - Add new item to BOM
 */

// ============================================================================
// GET /api/technical/boms/:id/items - List items (AC-2.7.2)
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createServerSupabase();

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify BOM exists and user has access (RLS)
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select('id')
      .eq('id', id)
      .single();

    if (bomError || !bom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 });
    }

    // Fetch BOM items with product details
    const { data: items, error } = await supabase
      .from('bom_items')
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
      .eq('bom_id', id)
      .order('sequence', { ascending: true });

    if (error) {
      console.error('Error fetching BOM items:', error);
      throw new Error(`Failed to fetch BOM items: ${error.message}`);
    }

    return NextResponse.json({ items: items || [] }, { status: 200 });
  } catch (error) {
    console.error('Error in GET /api/technical/boms/[id]/items:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// POST /api/technical/boms/:id/items - Add item (AC-2.7.1)
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Verify BOM exists and user has access
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select('id')
      .eq('id', id)
      .single();

    if (bomError || !bom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 });
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CreateBOMItemSchema.parse(body);

    // Verify product exists
    const { data: product, error: productError } = await supabase
      .from('products')
      .select('id, uom')
      .eq('id', validatedData.product_id)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Auto-assign sequence if not provided
    let sequence = validatedData.sequence;
    if (!sequence) {
      const { data: maxItem } = await supabase
        .from('bom_items')
        .select('sequence')
        .eq('bom_id', id)
        .order('sequence', { ascending: false })
        .limit(1)
        .single();

      sequence = maxItem ? maxItem.sequence + 1 : 1;
    }

    // Insert BOM item
    const { data: item, error: insertError } = await supabase
      .from('bom_items')
      .insert({
        bom_id: id,
        product_id: validatedData.product_id,
        quantity: validatedData.quantity,
        uom: validatedData.uom,
        scrap_percent: validatedData.scrap_percent ?? 0,
        sequence,
        consume_whole_lp: validatedData.consume_whole_lp ?? false,
        is_by_product: validatedData.is_by_product ?? false,
        yield_percent: validatedData.yield_percent ?? null,
        condition_flags: validatedData.condition_flags ?? null,
        condition_logic: validatedData.condition_logic ?? null,
        notes: validatedData.notes ?? null,
      })
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

    if (insertError) {
      console.error('Error creating BOM item:', insertError);
      throw new Error(`Failed to create BOM item: ${insertError.message}`);
    }

    return NextResponse.json(
      {
        item,
        message: 'BOM item added successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/technical/boms/[id]/items:', error);

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
// PUT /api/technical/boms/:id/items/reorder - Reorder items (AC-2.7.3)
// ============================================================================

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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

    // Parse and validate request body
    const body = await request.json();
    const validatedData = ReorderBOMItemsSchema.parse(body);

    // Update all items in a transaction-like batch
    const updates = validatedData.items.map(item =>
      supabase
        .from('bom_items')
        .update({ sequence: item.sequence })
        .eq('id', item.id)
        .eq('bom_id', id)
    );

    const results = await Promise.all(updates);

    const errors = results.filter(r => r.error);
    if (errors.length > 0) {
      console.error('Errors reordering items:', errors);
      throw new Error('Failed to reorder some items');
    }

    // Fetch updated items
    const { data: items, error: fetchError } = await supabase
      .from('bom_items')
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
      .eq('bom_id', id)
      .order('sequence', { ascending: true });

    if (fetchError) {
      throw new Error(`Failed to fetch updated items: ${fetchError.message}`);
    }

    return NextResponse.json(
      {
        items: items || [],
        message: 'Items reordered successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in PUT /api/technical/boms/[id]/items/reorder:', error);

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
