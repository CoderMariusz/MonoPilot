import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import type { BOMAllergens } from '@/lib/validation/bom-schemas';

/**
 * BOM Allergen Inheritance API Routes
 * Story: 2.14 Allergen Inheritance
 *
 * GET /api/technical/boms/:id/allergens - Calculate inherited allergens from BOM items
 */

// ============================================================================
// GET /api/technical/boms/:id/allergens - Get allergens (AC-2.14.1-2.14.5)
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabase();

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify BOM exists and get product_id
    const { data: bom, error: bomError } = await supabase
      .from('boms')
      .select('id, product_id')
      .eq('id', params.id)
      .single();

    if (bomError || !bom) {
      return NextResponse.json({ error: 'BOM not found' }, { status: 404 });
    }

    // Fetch all BOM items (excluding by-products)
    const { data: items, error: itemsError } = await supabase
      .from('bom_items')
      .select('product_id')
      .eq('bom_id', params.id)
      .eq('is_by_product', false); // Only input items

    if (itemsError) {
      console.error('Error fetching BOM items:', itemsError);
      throw new Error(`Failed to fetch BOM items: ${itemsError.message}`);
    }

    if (!items || items.length === 0) {
      // No items, return empty allergens
      return NextResponse.json(
        {
          allergens: {
            contains: [],
            may_contain: [],
          },
        },
        { status: 200 }
      );
    }

    // Extract product IDs
    const productIds = items.map(item => item.product_id);

    // Fetch allergens for all component products
    const { data: productAllergens, error: allergensError } = await supabase
      .from('product_allergens')
      .select(`
        allergen_id,
        relation_type,
        allergen:allergens!allergen_id (
          id,
          name,
          code
        )
      `)
      .in('product_id', productIds);

    if (allergensError) {
      console.error('Error fetching product allergens:', allergensError);
      throw new Error(`Failed to fetch allergens: ${allergensError.message}`);
    }

    // Group allergens by relation_type
    const containsMap = new Map<string, { id: string; name: string; code: string }>();
    const mayContainMap = new Map<string, { id: string; name: string; code: string }>();

    (productAllergens || []).forEach(pa => {
      const allergen = pa.allergen as any;
      if (!allergen) return;

      const allergenData = {
        id: allergen.id,
        name: allergen.name,
        code: allergen.code,
      };

      if (pa.relation_type === 'contains') {
        containsMap.set(allergen.id, allergenData);
      } else if (pa.relation_type === 'may_contain') {
        mayContainMap.set(allergen.id, allergenData);
      }
    });

    // Convert maps to arrays
    const contains = Array.from(containsMap.values());
    const may_contain = Array.from(mayContainMap.values());

    // Fetch product's own allergens for comparison
    const { data: bomProductAllergens, error: bomProductError } = await supabase
      .from('product_allergens')
      .select(`
        allergen_id,
        relation_type
      `)
      .eq('product_id', bom.product_id);

    if (bomProductError) {
      console.error('Error fetching BOM product allergens:', bomProductError);
      // Continue without comparison
    }

    // Check for mismatch
    let mismatch_warning: string | undefined;

    if (bomProductAllergens) {
      const productContainsIds = new Set(
        bomProductAllergens
          .filter(pa => pa.relation_type === 'contains')
          .map(pa => pa.allergen_id)
      );
      const productMayContainIds = new Set(
        bomProductAllergens
          .filter(pa => pa.relation_type === 'may_contain')
          .map(pa => pa.allergen_id)
      );

      const bomContainsIds = new Set(contains.map(a => a.id));
      const bomMayContainIds = new Set(may_contain.map(a => a.id));

      // Simple comparison: check if sets are different
      const containsDiff =
        productContainsIds.size !== bomContainsIds.size ||
        ![...productContainsIds].every(id => bomContainsIds.has(id));

      const mayContainDiff =
        productMayContainIds.size !== bomMayContainIds.size ||
        ![...productMayContainIds].every(id => bomMayContainIds.has(id));

      if (containsDiff || mayContainDiff) {
        mismatch_warning =
          'BOM allergens differ from product allergens. Consider updating product allergens to match BOM composition.';
      }
    }

    const allergens: BOMAllergens = {
      contains,
      may_contain,
      mismatch_warning,
    };

    return NextResponse.json(
      {
        allergens,
        total_contains: contains.length,
        total_may_contain: may_contain.length,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/technical/boms/[id]/allergens:', error);

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
