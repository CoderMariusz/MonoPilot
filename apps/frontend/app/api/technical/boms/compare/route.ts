import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { BOMCompareQuerySchema, type BOMItem, type BOMComparison } from '@/lib/validation/bom-schemas';
import { ZodError } from 'zod';

/**
 * BOM Compare API Routes
 * Story: 2.11 BOM Compare
 *
 * GET /api/technical/boms/compare?v1=<id>&v2=<id> - Compare two BOM versions
 */

// ============================================================================
// Helper: Calculate field differences
// ============================================================================

function calculateItemChanges(item1: BOMItem, item2: BOMItem): string[] {
  const changes: string[] = [];

  if (item1.quantity !== item2.quantity) {
    changes.push(`quantity: ${item1.quantity} → ${item2.quantity}`);
  }

  if (item1.uom !== item2.uom) {
    changes.push(`uom: ${item1.uom} → ${item2.uom}`);
  }

  if (item1.scrap_percent !== item2.scrap_percent) {
    changes.push(`scrap_percent: ${item1.scrap_percent}% → ${item2.scrap_percent}%`);
  }

  if (item1.sequence !== item2.sequence) {
    changes.push(`sequence: ${item1.sequence} → ${item2.sequence}`);
  }

  if (item1.consume_whole_lp !== item2.consume_whole_lp) {
    changes.push(`consume_whole_lp: ${item1.consume_whole_lp} → ${item2.consume_whole_lp}`);
  }

  if (item1.is_by_product !== item2.is_by_product) {
    changes.push(`is_by_product: ${item1.is_by_product} → ${item2.is_by_product}`);
  }

  if (item1.yield_percent !== item2.yield_percent) {
    changes.push(`yield_percent: ${item1.yield_percent}% → ${item2.yield_percent}%`);
  }

  // Compare condition_flags (arrays)
  const flags1 = JSON.stringify(item1.condition_flags || []);
  const flags2 = JSON.stringify(item2.condition_flags || []);
  if (flags1 !== flags2) {
    changes.push(`condition_flags: ${flags1} → ${flags2}`);
  }

  if (item1.condition_logic !== item2.condition_logic) {
    changes.push(`condition_logic: ${item1.condition_logic} → ${item2.condition_logic}`);
  }

  return changes;
}

// ============================================================================
// GET /api/technical/boms/compare - Compare BOMs (AC-2.11.1-2.11.4)
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    // Check authentication
    const { data: { session }, error: authError } = await supabase.auth.getSession();

    if (authError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const searchParams = request.nextUrl.searchParams;
    const query = {
      v1: searchParams.get('v1') || '',
      v2: searchParams.get('v2') || '',
    };

    const validatedQuery = BOMCompareQuerySchema.parse(query);

    // Fetch both BOMs with their items
    const [bom1Result, bom2Result] = await Promise.all([
      supabase
        .from('boms')
        .select(`
          id,
          version,
          items:bom_items (
            *,
            product:products!product_id (
              id,
              code,
              name,
              type,
              uom
            )
          )
        `)
        .eq('id', validatedQuery.v1)
        .single(),
      supabase
        .from('boms')
        .select(`
          id,
          version,
          items:bom_items (
            *,
            product:products!product_id (
              id,
              code,
              name,
              type,
              uom
            )
          )
        `)
        .eq('id', validatedQuery.v2)
        .single(),
    ]);

    if (bom1Result.error || !bom1Result.data) {
      return NextResponse.json(
        { error: `BOM v1 not found (ID: ${validatedQuery.v1})` },
        { status: 404 }
      );
    }

    if (bom2Result.error || !bom2Result.data) {
      return NextResponse.json(
        { error: `BOM v2 not found (ID: ${validatedQuery.v2})` },
        { status: 404 }
      );
    }

    const bom1 = bom1Result.data;
    const bom2 = bom2Result.data;

    // Extract items
    const items1 = (bom1.items || []) as unknown as BOMItem[];
    const items2 = (bom2.items || []) as unknown as BOMItem[];

    // Create maps by product_id for efficient lookup
    const items1Map = new Map<string, BOMItem>();
    const items2Map = new Map<string, BOMItem>();

    items1.forEach(item => items1Map.set(item.product_id, item));
    items2.forEach(item => items2Map.set(item.product_id, item));

    // Calculate differences
    const added: BOMItem[] = [];
    const removed: BOMItem[] = [];
    const changed: Array<{ item_v1: BOMItem; item_v2: BOMItem; changes: string[] }> = [];
    const unchanged: BOMItem[] = [];

    // Find added and unchanged/changed items
    items2.forEach(item2 => {
      const item1 = items1Map.get(item2.product_id);

      if (!item1) {
        // Item exists in v2 but not in v1 → Added
        added.push(item2);
      } else {
        // Item exists in both → Check if changed
        const changes = calculateItemChanges(item1, item2);

        if (changes.length > 0) {
          // Item changed
          changed.push({
            item_v1: item1,
            item_v2: item2,
            changes,
          });
        } else {
          // Item unchanged
          unchanged.push(item2);
        }
      }
    });

    // Find removed items
    items1.forEach(item1 => {
      const item2 = items2Map.get(item1.product_id);

      if (!item2) {
        // Item exists in v1 but not in v2 → Removed
        removed.push(item1);
      }
    });

    const comparison: BOMComparison = {
      added,
      removed,
      changed,
      unchanged,
    };

    return NextResponse.json(
      {
        comparison,
        v1: {
          id: bom1.id,
          version: bom1.version,
          items_count: items1.length,
        },
        v2: {
          id: bom2.id,
          version: bom2.version,
          items_count: items2.length,
        },
        summary: {
          added_count: added.length,
          removed_count: removed.length,
          changed_count: changed.length,
          unchanged_count: unchanged.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in GET /api/technical/boms/compare:', error);

    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
