import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { CloneBOMSchema } from '@/lib/validation/bom-schemas';
import { incrementVersion } from '@/lib/services/bom-service';
import { ZodError } from 'zod';

/**
 * BOM Clone API Routes
 * Story: 2.10 BOM Clone
 *
 * POST /api/technical/boms/:id/clone - Clone BOM with all items
 */

// ============================================================================
// POST /api/technical/boms/:id/clone - Clone BOM (AC-2.10.1-2.10.4)
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
      .select('org_id, role:roles(code)')
      .eq('id', session.user.id)
      .single();

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Extract role code from joined data
    const roleData = currentUser.role as unknown as { code: string } | null
    const userRole = roleData?.code?.toLowerCase() || ''

    // Check authorization: Admin or Technical only
    if (!['admin', 'technical'].includes(userRole)) {
      return NextResponse.json(
        { error: 'Forbidden: Admin or Technical role required' },
        { status: 403 }
      );
    }

    // Parse and validate request body
    const body = await request.json();
    const validatedData = CloneBOMSchema.parse(body);

    // Fetch source BOM
    const { data: sourceBOM, error: bomError } = await supabase
      .from('boms')
      .select('*')
      .eq('id', id)
      .single();

    if (bomError || !sourceBOM) {
      return NextResponse.json({ error: 'Source BOM not found' }, { status: 404 });
    }

    // Calculate new version
    const newVersion = incrementVersion(sourceBOM.version);

    // Convert dates
    const effective_from = validatedData.effective_from instanceof Date
      ? validatedData.effective_from.toISOString().split('T')[0]
      : validatedData.effective_from;

    const effective_to = validatedData.effective_to
      ? (validatedData.effective_to instanceof Date
        ? validatedData.effective_to.toISOString().split('T')[0]
        : validatedData.effective_to)
      : null;

    // Create new BOM
    const { data: newBOM, error: createError } = await supabase
      .from('boms')
      .insert({
        org_id: sourceBOM.org_id,
        product_id: sourceBOM.product_id,
        version: newVersion,
        effective_from,
        effective_to,
        status: 'draft', // AC-2.10.3: Cloned BOMs default to draft
        output_qty: sourceBOM.output_qty,
        output_uom: sourceBOM.output_uom,
        notes: sourceBOM.notes,
        created_by: session.user.id,
        updated_by: session.user.id,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating cloned BOM:', createError);

      // Handle date overlap error (from database trigger)
      if (createError.message.includes('Date range overlaps') || createError.message.includes('BOM_DATE_OVERLAP')) {
        return NextResponse.json(
          {
            error: 'BOM_DATE_OVERLAP',
            message: 'Date range overlaps with existing BOM for this product. Please choose a different effective date.',
          },
          { status: 400 }
        );
      }

      throw new Error(`Failed to create cloned BOM: ${createError.message}`);
    }

    // Fetch all items from source BOM
    const { data: sourceItems, error: itemsError } = await supabase
      .from('bom_items')
      .select('*')
      .eq('bom_id', id)
      .order('sequence', { ascending: true });

    if (itemsError) {
      console.error('Error fetching source BOM items:', itemsError);
      // Rollback by deleting the created BOM
      await supabase.from('boms').delete().eq('id', newBOM.id);
      throw new Error(`Failed to fetch source BOM items: ${itemsError.message}`);
    }

    // Clone all items (only include columns that exist in bom_items table)
    if (sourceItems && sourceItems.length > 0) {
      const itemsToClone = sourceItems.map(item => ({
        bom_id: newBOM.id,
        product_id: item.product_id,
        quantity: item.quantity,
        uom: item.uom,
        scrap_percent: item.scrap_percent,
        sequence: item.sequence,
        operation_seq: item.operation_seq,
        notes: item.notes,
      }));

      const { error: cloneItemsError } = await supabase
        .from('bom_items')
        .insert(itemsToClone);

      if (cloneItemsError) {
        console.error('Error cloning BOM items:', cloneItemsError);
        // Rollback by deleting the created BOM (CASCADE will delete items)
        await supabase.from('boms').delete().eq('id', newBOM.id);
        throw new Error(`Failed to clone BOM items: ${cloneItemsError.message}`);
      }
    }

    // Fetch complete cloned BOM with items
    const { data: clonedBOM, error: fetchError } = await supabase
      .from('boms')
      .select(`
        *,
        product:products!product_id (
          id,
          code,
          name,
          base_uom,
          product_type:product_types (
            code,
            name
          )
        ),
        items:bom_items (
          *,
          component:products!product_id (
            id,
            code,
            name,
            base_uom,
            product_type:product_types (
              code,
              name
            )
          )
        )
      `)
      .eq('id', newBOM.id)
      .single();

    if (fetchError) {
      throw new Error(`Failed to fetch cloned BOM: ${fetchError.message}`);
    }

    return NextResponse.json(
      {
        bom: clonedBOM,
        message: `BOM v${sourceBOM.version} cloned to v${newVersion} successfully`,
        cloned_items_count: sourceItems?.length || 0,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error in POST /api/technical/boms/[id]/clone:', error);

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
