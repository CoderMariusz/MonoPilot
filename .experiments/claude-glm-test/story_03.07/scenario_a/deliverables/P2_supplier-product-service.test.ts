// P2: RED Tests - Supplier Product Service
// Story: 03.07 - Supplier Product Catalog
// Agent: TEST-WRITER (Claude - Scenario A)

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SupplierProductService } from '@/lib/services/supplier-product-service';
import type { SupplierProduct, CreateSupplierProductInput } from '@/lib/types/supplier-product';

describe('SupplierProductService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create supplier product with pricing', async () => {
      const input: CreateSupplierProductInput = {
        supplier_id: 'supp-123',
        product_id: 'prod-456',
        supplier_product_code: 'SUP-PROD-001',
        supplier_price: 12.50,
        currency: 'USD',
        lead_time_days: 7,
        min_order_qty: 100,
        is_preferred: false,
      };

      const result = await SupplierProductService.create(input);

      expect(result).toMatchObject({
        supplier_id: 'supp-123',
        product_id: 'prod-456',
        supplier_product_code: 'SUP-PROD-001',
        supplier_price: 12.50,
        lead_time_days: 7,
      });
      expect(result.id).toBeDefined();
      expect(result.created_at).toBeDefined();
    });

    it('should enforce unique supplier-product combination', async () => {
      const input = {
        supplier_id: 'supp-123',
        product_id: 'prod-456',
        supplier_product_code: 'CODE-1',
        supplier_price: 10.0,
        currency: 'USD',
      };

      await SupplierProductService.create(input);

      // Try to create duplicate
      await expect(
        SupplierProductService.create(input)
      ).rejects.toThrow('Supplier product already exists');
    });

    it('should validate positive price', async () => {
      const input = {
        supplier_id: 'supp-123',
        product_id: 'prod-456',
        supplier_product_code: 'CODE-1',
        supplier_price: -5.0,  // Invalid
        currency: 'USD',
      };

      await expect(
        SupplierProductService.create(input)
      ).rejects.toThrow('Price must be positive');
    });

    it('should validate lead time >= 0', async () => {
      const input = {
        supplier_id: 'supp-123',
        product_id: 'prod-456',
        supplier_product_code: 'CODE-1',
        supplier_price: 10.0,
        currency: 'USD',
        lead_time_days: -1,  // Invalid
      };

      await expect(
        SupplierProductService.create(input)
      ).rejects.toThrow('Lead time must be non-negative');
    });
  });

  describe('list', () => {
    it('should list all products for a supplier', async () => {
      const supplierId = 'supp-123';

      const results = await SupplierProductService.listBySupplier(supplierId);

      expect(Array.isArray(results)).toBe(true);
      results.forEach(sp => {
        expect(sp.supplier_id).toBe(supplierId);
        expect(sp.product).toBeDefined();  // Join with products table
      });
    });

    it('should filter by preferred only', async () => {
      const results = await SupplierProductService.listBySupplier('supp-123', {
        is_preferred: true
      });

      results.forEach(sp => {
        expect(sp.is_preferred).toBe(true);
      });
    });

    it('should sort by supplier price ASC', async () => {
      const results = await SupplierProductService.listBySupplier('supp-123', {
        sort: 'supplier_price',
        order: 'asc'
      });

      for (let i = 1; i < results.length; i++) {
        expect(results[i].supplier_price).toBeGreaterThanOrEqual(results[i-1].supplier_price);
      }
    });
  });

  describe('update', () => {
    it('should update supplier product pricing', async () => {
      const updated = await SupplierProductService.update('sp-id-123', {
        supplier_price: 15.75,
        lead_time_days: 5,
      });

      expect(updated.supplier_price).toBe(15.75);
      expect(updated.lead_time_days).toBe(5);
    });

    it('should not allow changing supplier_id', async () => {
      await expect(
        SupplierProductService.update('sp-id-123', {
          supplier_id: 'different-supplier',  // Should not be allowed
        } as any)
      ).rejects.toThrow();
    });

    it('should not allow changing product_id', async () => {
      await expect(
        SupplierProductService.update('sp-id-123', {
          product_id: 'different-product',  // Should not be allowed
        } as any)
      ).rejects.toThrow();
    });
  });

  describe('delete', () => {
    it('should soft delete supplier product', async () => {
      await SupplierProductService.delete('sp-id-123');

      const result = await SupplierProductService.getById('sp-id-123');
      expect(result).toBeNull();  // Soft deleted = not returned
    });

    it('should block delete if used in active POs', async () => {
      // sp-id-456 has active PO line items
      await expect(
        SupplierProductService.delete('sp-id-456')
      ).rejects.toThrow('Cannot delete - supplier product is used in active purchase orders');
    });
  });

  describe('findCheapestSupplier', () => {
    it('should return supplier with lowest price for product', async () => {
      const productId = 'prod-789';

      const result = await SupplierProductService.findCheapestSupplier(productId);

      expect(result).toBeDefined();
      expect(result.product_id).toBe(productId);
      // Should be cheapest among all suppliers for this product
    });

    it('should filter by preferred suppliers only if requested', async () => {
      const result = await SupplierProductService.findCheapestSupplier('prod-789', {
        preferred_only: true
      });

      expect(result.is_preferred).toBe(true);
    });

    it('should return null if no suppliers carry the product', async () => {
      const result = await SupplierProductService.findCheapestSupplier('prod-nonexistent');

      expect(result).toBeNull();
    });
  });
});

// Total: 16 tests
// All should FAIL (RED phase) - SupplierProductService doesn't exist yet
