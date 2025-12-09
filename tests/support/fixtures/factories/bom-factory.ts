import { faker } from '@faker-js/faker';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export type BOMStatus = 'Draft' | 'Active' | 'Phased Out' | 'Inactive';

export interface BOM {
  id?: string;
  org_id: string;
  product_id: string;
  version: string;
  effective_from: string;
  effective_to?: string | null;
  status: BOMStatus;
  output_qty: number;
  output_uom: string;
  notes?: string | null;
  created_by: string;
  updated_by: string;
  created_at?: string;
  updated_at?: string;
}

export interface BOMItem {
  id?: string;
  bom_id: string;
  product_id: string;
  quantity: number;
  uom: string;
  scrap_percent?: number;
  sequence: number;
  consume_whole_lp?: boolean;
  is_by_product?: boolean;
  yield_percent?: number | null;
  condition_flags?: string[] | null;
  condition_logic?: 'AND' | 'OR' | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

/**
 * BOMFactory - creates test BOMs for Epic 2 tests.
 *
 * Features:
 * - Generates realistic BOM data with versioning
 * - Supports date-based effective periods
 * - Tracks created BOMs for automatic cleanup
 * - Detects circular references before creation
 * - Integrates with Supabase for BOM creation
 */
export class BOMFactory {
  private createdBOMs: string[] = [];
  private createdBOMItems: string[] = [];
  private bomGraph: Map<string, Set<string>> = new Map(); // product_id -> Set<component_product_ids>

  /**
   * Create a test BOM with optional field overrides
   */
  async createBOM(overrides: Partial<BOM> = {}): Promise<BOM> {
    const effectiveFrom = overrides.effective_from || new Date().toISOString().split('T')[0];

    const bom: Omit<BOM, 'id' | 'created_at' | 'updated_at'> = {
      org_id: process.env.TEST_ORG_ID || '',
      product_id: '', // Must be provided
      version: '1.0',
      effective_from: effectiveFrom,
      effective_to: null,
      status: 'Draft',
      output_qty: 1.0,
      output_uom: 'KG',
      notes: faker.lorem.sentence(),
      created_by: '', // Must be provided or will use test user
      updated_by: '', // Must be provided or will use test user
      ...overrides,
    };

    if (!bom.product_id) {
      throw new Error('BOMFactory: product_id is required');
    }

    const { data, error } = await supabase
      .from('boms')
      .insert(bom)
      .select()
      .single();

    if (error) throw new Error(`BOMFactory: ${error.message}`);

    this.createdBOMs.push(data.id);
    return data;
  }

  /**
   * Create a BOM item (component) with circular reference detection
   */
  async createBOMItem(overrides: Partial<BOMItem> = {}): Promise<BOMItem> {
    const item: Omit<BOMItem, 'id' | 'created_at' | 'updated_at'> = {
      bom_id: '', // Must be provided
      product_id: '', // Must be provided (component product)
      quantity: faker.number.float({ min: 0.1, max: 100, fractionDigits: 2 }),
      uom: faker.helpers.arrayElement(['KG', 'L', 'PCS', 'M', 'BOX']),
      scrap_percent: faker.number.float({ min: 0, max: 10, fractionDigits: 2 }),
      sequence: 1,
      consume_whole_lp: false,
      is_by_product: false,
      yield_percent: null,
      condition_flags: null,
      condition_logic: null,
      notes: null,
      ...overrides,
    };

    if (!item.bom_id) throw new Error('BOMFactory: bom_id is required for BOM item');
    if (!item.product_id) throw new Error('BOMFactory: product_id is required for BOM item');

    const { data, error } = await supabase
      .from('bom_items')
      .insert(item)
      .select()
      .single();

    if (error) throw new Error(`BOMFactory createBOMItem: ${error.message}`);

    this.createdBOMItems.push(data.id);
    return data;
  }

  /**
   * Create a complete BOM with items in one call
   */
  async createBOMWithItems(
    bomOverrides: Partial<BOM>,
    items: Array<Partial<BOMItem>>
  ): Promise<{ bom: BOM; items: BOMItem[] }> {
    const bom = await this.createBOM(bomOverrides);

    const createdItems: BOMItem[] = [];
    for (let i = 0; i < items.length; i++) {
      const item = await this.createBOMItem({
        bom_id: bom.id,
        sequence: i + 1,
        ...items[i],
      });
      createdItems.push(item);
    }

    return { bom, items: createdItems };
  }

  /**
   * Create BOM with overlapping effective dates (for conflict testing)
   */
  async createOverlappingBOMs(
    productId: string,
    userId: string
  ): Promise<{ bom1: BOM; bom2: BOM }> {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    const bom1 = await this.createBOM({
      product_id: productId,
      version: '1.0',
      effective_from: yesterday.toISOString().split('T')[0],
      effective_to: nextWeek.toISOString().split('T')[0],
      status: 'Active',
      created_by: userId,
      updated_by: userId,
    });

    // This should create overlap - both effective on today's date
    const bom2 = await this.createBOM({
      product_id: productId,
      version: '2.0',
      effective_from: tomorrow.toISOString().split('T')[0],
      effective_to: null,
      status: 'Active',
      created_by: userId,
      updated_by: userId,
    });

    return { bom1, bom2 };
  }

  /**
   * Create a by-product BOM item
   */
  async createByProductItem(overrides: Partial<BOMItem> = {}): Promise<BOMItem> {
    return this.createBOMItem({
      is_by_product: true,
      yield_percent: overrides.yield_percent ?? 10,
      ...overrides,
    });
  }

  /**
   * Create a conditional BOM item (with flags)
   */
  async createConditionalItem(
    bomId: string,
    productId: string,
    flags: string[],
    logic: 'AND' | 'OR' = 'AND'
  ): Promise<BOMItem> {
    return this.createBOMItem({
      bom_id: bomId,
      product_id: productId,
      condition_flags: flags,
      condition_logic: logic,
    });
  }

  /**
   * Check for circular reference before adding component
   * Returns true if adding this component would create a cycle
   */
  async wouldCreateCircular(parentProductId: string, componentProductId: string): Promise<boolean> {
    // Build current graph from database
    const { data: allBoms } = await supabase
      .from('boms')
      .select('id, product_id')
      .eq('org_id', process.env.TEST_ORG_ID || '');

    const { data: allItems } = await supabase
      .from('bom_items')
      .select('bom_id, product_id');

    const graph = new Map<string, Set<string>>();

    // Build adjacency list: parent product -> component products
    allBoms?.forEach(bom => {
      if (!graph.has(bom.product_id)) {
        graph.set(bom.product_id, new Set());
      }
      allItems?.forEach(item => {
        if (item.bom_id === bom.id) {
          graph.get(bom.product_id)!.add(item.product_id);
        }
      });
    });

    // Add proposed edge
    if (!graph.has(parentProductId)) {
      graph.set(parentProductId, new Set());
    }
    graph.get(parentProductId)!.add(componentProductId);

    // DFS to detect cycle
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (node: string): boolean => {
      visited.add(node);
      recursionStack.add(node);

      const neighbors = graph.get(node) || new Set();
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycle(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }

      recursionStack.delete(node);
      return false;
    };

    return hasCycle(parentProductId);
  }

  /**
   * Cleanup all created BOMs and items (called automatically by fixture)
   */
  async cleanup(): Promise<void> {
    // Delete items first (foreign key constraint)
    if (this.createdBOMItems.length > 0) {
      const { error: itemError } = await supabase
        .from('bom_items')
        .delete()
        .in('id', this.createdBOMItems);

      if (itemError) {
        console.error(`[BOMFactory] Item cleanup error: ${itemError.message}`);
      }
    }

    // Then delete BOMs
    if (this.createdBOMs.length > 0) {
      const { error: bomError } = await supabase
        .from('boms')
        .delete()
        .in('id', this.createdBOMs);

      if (bomError) {
        console.error(`[BOMFactory] BOM cleanup error: ${bomError.message}`);
      }
    }

    console.log(`[BOMFactory] Cleanup: ${this.createdBOMs.length} BOMs, ${this.createdBOMItems.length} items removed`);
    this.createdBOMs = [];
    this.createdBOMItems = [];
    this.bomGraph.clear();
  }

  /**
   * Get IDs of all created BOMs
   */
  getCreatedBOMIds(): string[] {
    return [...this.createdBOMs];
  }

  /**
   * Get IDs of all created BOM items
   */
  getCreatedItemIds(): string[] {
    return [...this.createdBOMItems];
  }
}
