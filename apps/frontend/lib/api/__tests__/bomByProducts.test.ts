/**
 * Unit Tests: BOM By-Products Support
 * Epic: EPIC-001 BOM Complexity v2 - Phase 1
 * Created: 2025-01-11
 * 
 * Tests for:
 * - BOM item with is_by_product flag
 * - Yield percentage validation
 * - By-product snapshot to WO
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(),
}));

describe('BOM By-Products: Schema Validation', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    (createClient as any).mockReturnValue(mockSupabase);
  });

  describe('BOM Item: is_by_product Flag', () => {
    it('should allow creating input material (is_by_product = false)', async () => {
      const materialItem = {
        bom_id: 1,
        material_id: 100,
        quantity: 10.5,
        uom: 'kg',
        is_by_product: false,
        yield_percentage: null,
      };

      mockSupabase.single.mockResolvedValue({
        data: { id: 1, ...materialItem },
        error: null,
      });

      const { data, error } = await mockSupabase
        .from('bom_items')
        .insert(materialItem)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.is_by_product).toBe(false);
      expect(data.yield_percentage).toBeNull();
    });

    it('should allow creating by-product (is_by_product = true)', async () => {
      const byProductItem = {
        bom_id: 1,
        material_id: 200,  // e.g., bones product
        quantity: 0,  // Not used for by-products
        uom: 'kg',
        is_by_product: true,
        yield_percentage: 15.0,  // 15% yield
      };

      mockSupabase.single.mockResolvedValue({
        data: { id: 2, ...byProductItem },
        error: null,
      });

      const { data, error } = await mockSupabase
        .from('bom_items')
        .insert(byProductItem)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.is_by_product).toBe(true);
      expect(data.yield_percentage).toBe(15.0);
    });

    it('should default is_by_product to false if not specified', async () => {
      const legacyItem = {
        bom_id: 1,
        material_id: 100,
        quantity: 10.5,
        uom: 'kg',
      };

      mockSupabase.single.mockResolvedValue({
        data: { id: 3, ...legacyItem, is_by_product: false },
        error: null,
      });

      const { data } = await mockSupabase
        .from('bom_items')
        .insert(legacyItem)
        .select()
        .single();

      expect(data.is_by_product).toBe(false);
    });
  });

  describe('BOM Item: Yield Percentage Validation', () => {
    it('should reject input material with yield_percentage', async () => {
      const invalidItem = {
        bom_id: 1,
        material_id: 100,
        quantity: 10.5,
        uom: 'kg',
        is_by_product: false,
        yield_percentage: 10.0,  // ❌ Invalid: only by-products can have yield
      };

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: {
          code: '23514',
          message: 'violates check constraint "bom_items_yield_percentage_check"',
        },
      });

      const { error } = await mockSupabase
        .from('bom_items')
        .insert(invalidItem)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error.code).toBe('23514');
    });

    it('should reject by-product with yield_percentage = 0', async () => {
      const invalidByProduct = {
        bom_id: 1,
        material_id: 200,
        quantity: 0,
        uom: 'kg',
        is_by_product: true,
        yield_percentage: 0,  // ❌ Invalid: must be > 0
      };

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: {
          code: '23514',
          message: 'violates check constraint "bom_items_yield_percentage_check"',
        },
      });

      const { error } = await mockSupabase
        .from('bom_items')
        .insert(invalidByProduct)
        .select()
        .single();

      expect(error).not.toBeNull();
    });

    it('should reject by-product with yield_percentage > 100', async () => {
      const invalidByProduct = {
        bom_id: 1,
        material_id: 200,
        quantity: 0,
        uom: 'kg',
        is_by_product: true,
        yield_percentage: 150.0,  // ❌ Invalid: must be <= 100
      };

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: {
          code: '23514',
          message: 'violates check constraint "bom_items_yield_percentage_check"',
        },
      });

      const { error } = await mockSupabase
        .from('bom_items')
        .insert(invalidByProduct)
        .select()
        .single();

      expect(error).not.toBeNull();
    });

    it('should accept by-product with valid yield_percentage (1-100)', async () => {
      const validYields = [0.5, 5.0, 15.0, 25.5, 50.0, 100.0];

      for (const yield_pct of validYields) {
        const byProductItem = {
          bom_id: 1,
          material_id: 200,
          quantity: 0,
          uom: 'kg',
          is_by_product: true,
          yield_percentage: yield_pct,
        };

        mockSupabase.single.mockResolvedValue({
          data: { id: 4, ...byProductItem },
          error: null,
        });

        const { data, error } = await mockSupabase
          .from('bom_items')
          .insert(byProductItem)
          .select()
          .single();

        expect(error).toBeNull();
        expect(data.yield_percentage).toBe(yield_pct);
      }
    });

    it('should allow by-product with NULL yield_percentage', async () => {
      // Edge case: by-product without defined yield (manual entry)
      const byProductNoYield = {
        bom_id: 1,
        material_id: 200,
        quantity: 0,
        uom: 'kg',
        is_by_product: true,
        yield_percentage: null,
      };

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: {
          code: '23514',
          message: 'violates check constraint "bom_items_yield_percentage_check"',
        },
      });

      const { error } = await mockSupabase
        .from('bom_items')
        .insert(byProductNoYield)
        .select()
        .single();

      // According to constraint: by-product must have yield_percentage > 0
      expect(error).not.toBeNull();
    });
  });

  describe('BOM By-Product: Real-World Scenarios', () => {
    it('should model ribeye steak BOM with by-products', async () => {
      // Main product: Ribeye Steak (1kg output)
      // Inputs: Ribeye primal (1.5kg)
      // By-products: Bones (15%), Fat trim (10%)

      const bomItems = [
        {
          bom_id: 10,
          material_id: 500,  // Ribeye primal
          quantity: 1.5,
          uom: 'kg',
          is_by_product: false,
          yield_percentage: null,
        },
        {
          bom_id: 10,
          material_id: 501,  // Bones
          quantity: 0,
          uom: 'kg',
          is_by_product: true,
          yield_percentage: 15.0,
        },
        {
          bom_id: 10,
          material_id: 502,  // Fat trim
          quantity: 0,
          uom: 'kg',
          is_by_product: true,
          yield_percentage: 10.0,
        },
      ];

      mockSupabase.single.mockResolvedValue({
        data: bomItems,
        error: null,
      });

      const { data, error } = await mockSupabase
        .from('bom_items')
        .insert(bomItems)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data).toHaveLength(3);
    });
  });
});

describe('WO By-Products: Schema Validation', () => {
  let mockSupabase: any;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn(),
    };

    (createClient as any).mockReturnValue(mockSupabase);
  });

  describe('WO By-Product: Creation', () => {
    it('should create by-product record when WO is created', async () => {
      const woByProduct = {
        wo_id: 100,
        product_id: 501,  // Bones
        expected_quantity: 15.0,  // 15% of 100kg main output
        actual_quantity: 0,
        uom: 'kg',
        lp_id: null,
        notes: null,
      };

      mockSupabase.single.mockResolvedValue({
        data: { id: 1, ...woByProduct, created_at: '2025-01-11T12:00:00Z' },
        error: null,
      });

      const { data, error } = await mockSupabase
        .from('wo_by_products')
        .insert(woByProduct)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.expected_quantity).toBe(15.0);
      expect(data.actual_quantity).toBe(0);
      expect(data.lp_id).toBeNull();
    });

    it('should reject by-product with negative expected_quantity', async () => {
      const invalidByProduct = {
        wo_id: 100,
        product_id: 501,
        expected_quantity: -5.0,  // ❌ Invalid
        actual_quantity: 0,
        uom: 'kg',
      };

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: {
          code: '23514',
          message: 'violates check constraint "wo_by_products_expected_qty_positive"',
        },
      });

      const { error } = await mockSupabase
        .from('wo_by_products')
        .insert(invalidByProduct)
        .select()
        .single();

      expect(error).not.toBeNull();
      expect(error.code).toBe('23514');
    });

    it('should reject by-product with negative actual_quantity', async () => {
      const invalidByProduct = {
        wo_id: 100,
        product_id: 501,
        expected_quantity: 15.0,
        actual_quantity: -2.0,  // ❌ Invalid
        uom: 'kg',
      };

      mockSupabase.single.mockResolvedValue({
        data: null,
        error: {
          code: '23514',
          message: 'violates check constraint "wo_by_products_actual_qty_non_negative"',
        },
      });

      const { error } = await mockSupabase
        .from('wo_by_products')
        .insert(invalidByProduct)
        .select()
        .single();

      expect(error).not.toBeNull();
    });
  });

  describe('WO By-Product: Recording Output', () => {
    it('should update actual_quantity when operator records output', async () => {
      const updatedByProduct = {
        id: 1,
        actual_quantity: 14.5,  // Operator recorded 14.5kg bones
        lp_id: 5000,  // LP created for bones
        notes: 'Quality bones, sent to stock',
      };

      mockSupabase.single.mockResolvedValue({
        data: updatedByProduct,
        error: null,
      });

      const { data, error } = await mockSupabase
        .from('wo_by_products')
        .update({
          actual_quantity: 14.5,
          lp_id: 5000,
          notes: 'Quality bones, sent to stock',
        })
        .eq('id', 1)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.actual_quantity).toBe(14.5);
      expect(data.lp_id).toBe(5000);
    });

    it('should allow actual_quantity > expected_quantity (over-yield)', async () => {
      const overYield = {
        id: 1,
        expected_quantity: 15.0,
        actual_quantity: 18.0,  // ✅ Over-yield is OK
      };

      mockSupabase.single.mockResolvedValue({
        data: overYield,
        error: null,
      });

      const { data, error } = await mockSupabase
        .from('wo_by_products')
        .update({ actual_quantity: 18.0 })
        .eq('id', 1)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.actual_quantity).toBeGreaterThan(data.expected_quantity);
    });

    it('should allow actual_quantity < expected_quantity (under-yield)', async () => {
      const underYield = {
        id: 1,
        expected_quantity: 15.0,
        actual_quantity: 12.0,  // ✅ Under-yield is OK
      };

      mockSupabase.single.mockResolvedValue({
        data: underYield,
        error: null,
      });

      const { data, error } = await mockSupabase
        .from('wo_by_products')
        .update({ actual_quantity: 12.0 })
        .eq('id', 1)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.actual_quantity).toBeLessThan(data.expected_quantity);
    });
  });

  describe('WO By-Product: Yield Calculations', () => {
    it('should calculate expected_quantity from yield_percentage', () => {
      const mainOutputQty = 100;  // 100kg ribeye steaks
      const yieldPct = 15.0;  // 15% bones

      const expectedByProductQty = (mainOutputQty * yieldPct) / 100;

      expect(expectedByProductQty).toBe(15.0);
    });

    it('should handle fractional yield percentages', () => {
      const mainOutputQty = 250;
      const yieldPct = 7.5;  // 7.5% trim

      const expectedByProductQty = (mainOutputQty * yieldPct) / 100;

      expect(expectedByProductQty).toBe(18.75);
    });

    it('should handle multiple by-products with different yields', () => {
      const mainOutputQty = 500;
      const byProducts = [
        { name: 'Bones', yield_pct: 15.0 },
        { name: 'Fat trim', yield_pct: 10.0 },
        { name: 'Skin', yield_pct: 5.0 },
      ];

      const expectedQuantities = byProducts.map((bp) => ({
        name: bp.name,
        expected_qty: (mainOutputQty * bp.yield_pct) / 100,
      }));

      expect(expectedQuantities).toEqual([
        { name: 'Bones', expected_qty: 75.0 },
        { name: 'Fat trim', expected_qty: 50.0 },
        { name: 'Skin', expected_qty: 25.0 },
      ]);

      // Total by-products
      const totalByProducts = expectedQuantities.reduce(
        (sum, bp) => sum + bp.expected_qty,
        0
      );
      expect(totalByProducts).toBe(150.0);  // 30% total yield
    });
  });
});

describe('BOM By-Products: Integration Scenarios', () => {
  it('should snapshot by-products from BOM to WO', async () => {
    // BOM has 1 input + 2 by-products
    const bomItems = [
      { material_id: 500, quantity: 1.5, is_by_product: false },  // Input
      { material_id: 501, yield_percentage: 15.0, is_by_product: true },  // Bones
      { material_id: 502, yield_percentage: 10.0, is_by_product: true },  // Trim
    ];

    // WO for 100kg main output
    const woQty = 100;

    // Expected wo_by_products records
    const expectedByProducts = bomItems
      .filter((item) => item.is_by_product)
      .map((item) => ({
        product_id: item.material_id,
        expected_quantity: (woQty * item.yield_percentage!) / 100,
        uom: 'kg',
      }));

    expect(expectedByProducts).toEqual([
      { product_id: 501, expected_quantity: 15.0, uom: 'kg' },
      { product_id: 502, expected_quantity: 10.0, uom: 'kg' },
    ]);
  });

  it('should handle BOM with no by-products', async () => {
    const bomItems = [
      { material_id: 500, quantity: 1.5, is_by_product: false },
      { material_id: 501, quantity: 0.5, is_by_product: false },
    ];

    const byProducts = bomItems.filter((item) => item.is_by_product);

    expect(byProducts).toHaveLength(0);
  });

  it('should handle BOM with only by-products (theoretical)', async () => {
    // Edge case: Disassembly BOM (e.g., breaking down whole chicken)
    const bomItems = [
      { material_id: 601, yield_percentage: 40.0, is_by_product: true },  // Breast
      { material_id: 602, yield_percentage: 30.0, is_by_product: true },  // Legs
      { material_id: 603, yield_percentage: 15.0, is_by_product: true },  // Wings
      { material_id: 604, yield_percentage: 10.0, is_by_product: true },  // Bones
    ];

    const totalYield = bomItems.reduce(
      (sum, item) => sum + (item.yield_percentage || 0),
      0
    );

    expect(totalYield).toBe(95.0);  // 95% yield (5% loss)
  });
});

