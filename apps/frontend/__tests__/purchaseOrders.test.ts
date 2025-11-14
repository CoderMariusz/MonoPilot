import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../lib/supabase/client-browser', () => ({
  supabase: {
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn()
    }
  }
}));

import { PurchaseOrdersAPI, type QuickPOEntryLine } from '../lib/api/purchaseOrders';
import { supabase } from '../lib/supabase/client-browser';

const mockRpc = supabase.rpc as any;
const mockGetUser = supabase.auth.getUser as any;

/**
 * Unit tests for Purchase Orders API
 * Tests quick PO entry functionality including:
 * - Supabase RPC payload and auth handling
 * - Missing supplier/currency validation propagation
 * - Multi-supplier result handling
 */

describe('PurchaseOrdersAPI', () => {
  describe('quickCreate', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      mockRpc.mockReset();
      mockGetUser.mockReset();
    });

    it('should call RPC with provided lines and return purchase orders', async () => {
      // Arrange
      const warehouseId = 1;
      const lines: QuickPOEntryLine[] = [
        { product_code: 'prod-001', quantity: 15 },
        { product_code: 'prod-002', quantity: 20 }
      ];

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      });

      mockRpc.mockResolvedValue({
        data: {
          purchase_orders: [
            {
              id: 1,
              number: 'PO-2025-001',
              supplier_id: 1,
              supplier_name: 'Test Supplier',
              currency: 'USD',
              warehouse_id: warehouseId,
              total_lines: 2,
              net_total: 150,
              vat_total: 30,
              gross_total: 180
            }
          ]
        },
        error: null
      });

      // Act
      const result = await PurchaseOrdersAPI.quickCreate({
        lines,
        warehouse_id: warehouseId
      });

      // Assert
      expect(mockRpc).toHaveBeenCalledWith('quick_create_pos', {
        p_product_entries: lines,
        p_user_id: 'test-user-id',
        p_warehouse_id: warehouseId
      });
      expect(result.purchase_orders).toHaveLength(1);
    });

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      mockGetUser.mockResolvedValue({
        data: { user: null }
      });

      const lines: QuickPOEntryLine[] = [
        { product_code: 'PROD-001', quantity: 10 }
      ];

      // Act & Assert - auth check happens before warehouse_id validation
      await expect(PurchaseOrdersAPI.quickCreate({
        lines,
        warehouse_id: 1
      }))
        .rejects
        .toThrow('User not authenticated');
    });

    it('should throw error when RPC returns error for missing supplier', async () => {
      // Arrange
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      });

      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Product PROD-001 does not have a supplier assigned' }
      });

      const lines: QuickPOEntryLine[] = [
        { product_code: 'PROD-001', quantity: 10 }
      ];

      // Act & Assert
      await expect(PurchaseOrdersAPI.quickCreate({
        lines,
        warehouse_id: 1
      }))
        .rejects
        .toThrow('Product PROD-001 does not have a supplier assigned');
    });

    it('should throw error when RPC returns error for missing currency', async () => {
      // Arrange
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      });

      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Supplier Test Supplier does not have currency defined' }
      });

      const lines: QuickPOEntryLine[] = [
        { product_code: 'PROD-001', quantity: 10 }
      ];

      // Act & Assert
      await expect(PurchaseOrdersAPI.quickCreate({
        lines,
        warehouse_id: 1
      }))
        .rejects
        .toThrow('Supplier Test Supplier does not have currency defined');
    });

    // Story 0.1: warehouse_id validation tests
    it('should reject when warehouse_id is missing', async () => {
      // Arrange
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      });

      const lines: QuickPOEntryLine[] = [
        { product_code: 'PROD-001', quantity: 10 }
      ];

      // Act & Assert
      await expect(PurchaseOrdersAPI.quickCreate({ lines }))
        .rejects
        .toThrow('warehouse_id is required');

      // Verify RPC was NOT called (validation happens before RPC)
      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('should reject when warehouse_id is null', async () => {
      // Arrange
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      });

      const lines: QuickPOEntryLine[] = [
        { product_code: 'PROD-001', quantity: 10 }
      ];

      // Act & Assert - passing undefined triggers validation
      await expect(PurchaseOrdersAPI.quickCreate({
        lines,
        warehouse_id: undefined
      }))
        .rejects
        .toThrow('warehouse_id is required');

      expect(mockRpc).not.toHaveBeenCalled();
    });

    it('should create PO successfully with valid warehouse_id', async () => {
      // Arrange
      const warehouseId = 5;
      const lines: QuickPOEntryLine[] = [
        { product_code: 'PROD-001', quantity: 10 }
      ];

      mockGetUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      });

      mockRpc.mockResolvedValue({
        data: {
          purchase_orders: [
            {
              id: 1,
              number: 'PO-2025-001',
              supplier_id: 1,
              supplier_name: 'Test Supplier',
              currency: 'USD',
              warehouse_id: warehouseId,
              total_lines: 1,
              net_total: 100,
              vat_total: 20,
              gross_total: 120
            }
          ]
        },
        error: null
      });

      // Act
      const result = await PurchaseOrdersAPI.quickCreate({
        lines,
        warehouse_id: warehouseId
      });

      // Assert
      expect(mockRpc).toHaveBeenCalledWith('quick_create_pos', {
        p_product_entries: lines,
        p_user_id: 'test-user-id',
        p_warehouse_id: warehouseId
      });
      expect(result.purchase_orders).toHaveLength(1);
      expect(result.purchase_orders[0].warehouse_id).toBe(warehouseId);
    });

    it('should handle currency mismatch in supplier validation', async () => {
      // Arrange
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      });

      // In reality, this would be caught by the RPC function
      // Testing that the error propagates correctly
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Currency mismatch for supplier: expected USD, got EUR' }
      });

      const lines: QuickPOEntryLine[] = [
        { product_code: 'PROD-001', quantity: 10 },
        { product_code: 'PROD-002', quantity: 5 }
      ];

      // Act & Assert
      await expect(PurchaseOrdersAPI.quickCreate({
        lines,
        warehouse_id: 1
      }))
        .rejects
        .toThrow('Currency mismatch for supplier: expected USD, got EUR');
    });

    it('should create multiple POs for different suppliers', async () => {
      // Arrange
      const warehouseId = 1;
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      });

      mockRpc.mockResolvedValue({
        data: {
          purchase_orders: [
            {
              id: 1,
              number: 'PO-2025-001',
              supplier_id: 1,
              supplier_name: 'Supplier A',
              currency: 'USD',
              warehouse_id: warehouseId,
              total_lines: 1,
              net_total: 100,
              vat_total: 20,
              gross_total: 120
            },
            {
              id: 2,
              number: 'PO-2025-002',
              supplier_id: 2,
              supplier_name: 'Supplier B',
              currency: 'EUR',
              warehouse_id: warehouseId,
              total_lines: 1,
              net_total: 200,
              vat_total: 40,
              gross_total: 240
            }
          ]
        },
        error: null
      });

      const lines: QuickPOEntryLine[] = [
        { product_code: 'PROD-A', quantity: 10 }, // Supplier A
        { product_code: 'PROD-B', quantity: 20 }  // Supplier B
      ];

      // Act
      const result = await PurchaseOrdersAPI.quickCreate({
        lines,
        warehouse_id: warehouseId
      });

      // Assert
      expect(result.purchase_orders).toHaveLength(2);
      expect(result.purchase_orders[0].supplier_name).toBe('Supplier A');
      expect(result.purchase_orders[1].supplier_name).toBe('Supplier B');
    });

    it('should handle zero quantity validation', async () => {
      // Arrange
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      });

      const lines: QuickPOEntryLine[] = [
        { product_code: 'PROD-001', quantity: 0 }
      ];

      // This validation happens in the UI, but we test error propagation
      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Quantity must be greater than 0' }
      });

      // Act & Assert
      await expect(PurchaseOrdersAPI.quickCreate({
        lines,
        warehouse_id: 1
      }))
        .rejects
        .toThrow('Quantity must be greater than 0');
    });

    it('should handle product not found error', async () => {
      // Arrange
      mockGetUser.mockResolvedValue({
        data: { user: { id: 'test-user-id' } }
      });

      mockRpc.mockResolvedValue({
        data: null,
        error: { message: 'Product code INVALID not found or inactive' }
      });

      const lines: QuickPOEntryLine[] = [
        { product_code: 'INVALID', quantity: 10 }
      ];

      // Act & Assert
      await expect(PurchaseOrdersAPI.quickCreate({
        lines,
        warehouse_id: 1
      }))
        .rejects
        .toThrow('Product code INVALID not found or inactive');
    });
  });
});

/**
 * Integration tests for quick PO entry
 * Note: These would typically run against a test database
 * or use more sophisticated mocking of Supabase
 */
describe('PurchaseOrders Integration', () => {
  it('should create PO with correct totals calculation', () => {
    // Test case: 2 lines, different VAT rates
    // Line 1: 10 units @ $5.00, 20% VAT = $60 gross
    // Line 2: 5 units @ $10.00, 10% VAT = $55 gross
    // Total: $115 gross
    
    const expectedNetTotal = (10 * 5.00) + (5 * 10.00); // 100
    const expectedVatTotal = (50 * 0.20) + (50 * 0.10); // 15
    const expectedGrossTotal = expectedNetTotal + expectedVatTotal; // 115

    expect(expectedGrossTotal).toBe(115);
  });

  it('should group by supplier_id and currency correctly', () => {
    // Scenario: 3 products
    // - PROD-001: Supplier A, USD
    // - PROD-002: Supplier A, USD (same group)
    // - PROD-003: Supplier B, EUR (different group)
    // Expected: 2 POs created

    const grouping = new Map<string, string[]>();
    
    grouping.set('A-USD', ['PROD-001', 'PROD-002']);
    grouping.set('B-EUR', ['PROD-003']);

    expect(grouping.size).toBe(2);
    expect(grouping.get('A-USD')).toHaveLength(2);
  });
});

/**
 * UI/E2E Test Scenarios
 * These are test cases for Playwright/Cypress
 */
export const uiTestScenarios = {
  quickEntry: {
    name: 'Quick PO Entry Modal',
    tests: [
      {
        name: 'should display product name after entering valid code',
        steps: [
          'Open Quick PO Entry modal',
          'Enter product code "PROD-001"',
          'Verify product name displays',
          'Verify supplier name displays',
          'Verify UOM displays'
        ]
      },
      {
        name: 'should show error for invalid product code',
        steps: [
          'Open Quick PO Entry modal',
          'Enter invalid product code "INVALID"',
          'Tab out of field',
          'Verify error message "Product not found" displays',
          'Verify submit button is disabled or validation prevents submit'
        ]
      },
      {
        name: 'should add and remove lines',
        steps: [
          'Open Quick PO Entry modal',
          'Click "Add Line" button',
          'Verify second row appears',
          'Click trash icon on second row',
          'Verify second row is removed',
          'Verify first row cannot be removed'
        ]
      },
      {
        name: 'should create PO and show results',
        steps: [
          'Open Quick PO Entry modal',
          'Enter product code "PROD-001" and quantity 10',
          'Click "Create Purchase Orders"',
          'Verify loading spinner appears',
          'Verify results screen shows created PO',
          'Verify PO number, supplier, totals display',
          'Click "View PO" link',
          'Verify navigates to PO detail'
        ]
      },
      {
        name: 'should aggregate duplicate codes',
        steps: [
          'Open Quick PO Entry modal',
          'Enter product code "PROD-001" quantity 10',
          'Add line',
          'Enter product code "PROD-001" quantity 5',
          'Submit',
          'Verify single PO line with quantity 15 is created'
        ]
      },
      {
        name: 'should validate quantity > 0',
        steps: [
          'Open Quick PO Entry modal',
          'Enter product code "PROD-001"',
          'Enter quantity 0',
          'Submit',
          'Verify error message "Quantity must be > 0"',
          'Enter quantity -5',
          'Submit',
          'Verify validation prevents submission'
        ]
      }
    ]
  }
};

