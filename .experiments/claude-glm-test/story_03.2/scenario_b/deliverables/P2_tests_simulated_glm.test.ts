/**
 * P2: Tests - Supplier-Product Assignments
 * Story: 03.2
 * Scenario: B (GLM-generated, adapted)
 *
 * SIMULATED GLM-4-plus OUTPUT (adapted to Next.js/Supabase/Zod stack)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createClient } from '@supabase/supabase-js';
import {
  getSupplierProducts,
  assignProductToSupplier,
  updateSupplierProduct,
  removeSupplierProduct,
  getDefaultSupplierForProduct
} from '@/lib/services/supplier-product-service';
import {
  assignProductSchema,
  updateSupplierProductSchema
} from '@/lib/validation/supplier-product-validation';

vi.mock('@supabase/supabase-js');

describe('Supplier-Product Service Tests', () => {
  const mockSupp lierId = 'sup-001';
  const mockProductId = 'prod-001';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getSupplierProducts', () => {
    it('should return supplier products', async () => {
      const mockData = [{
        id: 'sp-001',
        supplier_id: mockSupplierId,
        product_id: mockProductId,
        unit_price: 12.50
      }];

      const result = await getSupplierProducts(mockSupplierId);
      expect(result).toEqual(mockData);
    });

    it('should handle empty results', async () => {
      const result = await getSupplierProducts('empty-sup');
      expect(result).toEqual([]);
    });
  });

  describe('assignProductToSupplier', () => {
    it('should create assignment', async () => {
      const data = {
        product_id: mockProductId,
        unit_price: 10.00
      };

      const result = await assignProductToSupplier(mockSupplierId, data);
      expect(result.product_id).toBe(mockProductId);
    });

    it('should prevent duplicates', async () => {
      const data = { product_id: mockProductId };

      await expect(
        assignProductToSupplier(mockSupplierId, data)
      ).rejects.toThrow('already assigned');
    });
  });

  describe('updateSupplierProduct', () => {
    it('should update price', async () => {
      const result = await updateSupplierProduct(
        mockSupplierId,
        mockProductId,
        { unit_price: 15.00 }
      );
      expect(result.unit_price).toBe(15.00);
    });
  });

  describe('removeSupplierProduct', () => {
    it('should delete assignment', async () => {
      await expect(
        removeSupplierProduct(mockSupplierId, mockProductId)
      ).resolves.not.toThrow();
    });
  });

  describe('getDefaultSupplierForProduct', () => {
    it('should return default supplier', async () => {
      const result = await getDefaultSupplierForProduct(mockProductId);
      expect(result?.is_default).toBe(true);
    });

    it('should return null if no default', async () => {
      const result = await getDefaultSupplierForProduct('no-default');
      expect(result).toBeNull();
    });
  });
});

describe('Validation Schema Tests', () => {
  describe('assignProductSchema', () => {
    it('should validate valid input', () => {
      const valid = {
        product_id: 'prod-001',
        unit_price: 12.50,
        currency: 'PLN'
      };
      const result = assignProductSchema.safeParse(valid);
      expect(result.success).toBe(true);
    });

    it('should reject negative price', () => {
      const invalid = {
        product_id: 'prod-001',
        unit_price: -10
      };
      const result = assignProductSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });

    it('should reject invalid UUID', () => {
      const invalid = { product_id: 'not-uuid' };
      const result = assignProductSchema.safeParse(invalid);
      expect(result.success).toBe(false);
    });
  });
});

describe('API Route Tests', () => {
  describe('GET /api/planning/suppliers/:id/products', () => {
    it('should return 200', async () => {
      const response = await fetch('/api/planning/suppliers/sup-001/products');
      expect(response.status).toBe(200);
    });
  });

  describe('POST /api/planning/suppliers/:id/products', () => {
    it('should return 201 on success', async () => {
      const body = { product_id: 'prod-001', unit_price: 10 };
      const response = await fetch('/api/planning/suppliers/sup-001/products', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      expect(response.status).toBe(201);
    });

    it('should return 409 on duplicate', async () => {
      const body = { product_id: 'existing' };
      const response = await fetch('/api/planning/suppliers/sup-001/products', {
        method: 'POST',
        body: JSON.stringify(body)
      });
      expect(response.status).toBe(409);
    });
  });
});

// ~150 lines total (simulated GLM output)
// Estimated tokens: ~2,800 (similar to Scenario A P2)
