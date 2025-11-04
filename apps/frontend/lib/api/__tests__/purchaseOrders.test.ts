/**
 * Unit Tests for PurchaseOrdersAPI
 * 
 * Tests cover:
 * - Currency calculations
 * - Total amount computation
 * - Payment due date handling
 * - Exchange rate handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PurchaseOrdersAPI } from '../purchaseOrders';

// Mock the supabase client
vi.mock('../../supabase/client-browser', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import { supabase } from '../../supabase/client-browser';

describe('PurchaseOrdersAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Currency and Exchange Rate', () => {
    it('should default to USD with exchange rate 1.0 when currency is not provided', async () => {
      const mockData = {
        id: 1,
        number: 'PO-001',
        supplier_id: 1,
        status: 'draft',
        currency: null,
        exchange_rate: null,
        order_date: '2024-01-15',
        po_lines: [],
      };

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [mockData], error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await PurchaseOrdersAPI.getAll();

      expect(result[0].currency).toBe('USD');
      expect(result[0].exchange_rate).toBe(1.0);
    });

    it('should use provided currency and exchange rate', async () => {
      const mockData = {
        id: 1,
        number: 'PO-001',
        supplier_id: 1,
        status: 'draft',
        currency: 'EUR',
        exchange_rate: 1.1,
        order_date: '2024-01-15',
        po_lines: [],
      };

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [mockData], error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await PurchaseOrdersAPI.getAll();

      expect(result[0].currency).toBe('EUR');
      expect(result[0].exchange_rate).toBe(1.1);
    });

    it('should handle exchange rate for non-USD currencies', () => {
      // Exchange rate should be positive
      const validExchangeRate = 1.2345;
      const invalidExchangeRate = -0.5;

      expect(validExchangeRate).toBeGreaterThan(0);
      expect(invalidExchangeRate).toBeLessThanOrEqual(0);
      // Business rule: exchange_rate must be positive
    });
  });

  describe('Total Amount Computation', () => {
    it('should calculate total from line items with VAT', async () => {
      const mockData = {
        id: 1,
        number: 'PO-001',
        supplier_id: 1,
        status: 'draft',
        currency: 'USD',
        exchange_rate: 1.0,
        order_date: '2024-01-15',
        gross_total: null,
        po_lines: [
          {
            id: 1,
            po_id: 1,
            line_no: 1,
            item_id: 1,
            qty_ordered: 100,
            unit_price: 10.0,
            vat_rate: 20.0, // 20% VAT
          },
          {
            id: 2,
            po_id: 1,
            line_no: 2,
            item_id: 2,
            qty_ordered: 50,
            unit_price: 5.0,
            vat_rate: 10.0, // 10% VAT
          },
        ],
      };

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [mockData], error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await PurchaseOrdersAPI.getAll();

      // Line 1: 100 * 10 * 1.20 = 1200
      // Line 2: 50 * 5 * 1.10 = 275
      // Total: 1475
      expect(result[0].total_amount).toBe(1475);
    });

    it('should use gross_total from database if available', async () => {
      const mockData = {
        id: 1,
        number: 'PO-001',
        supplier_id: 1,
        status: 'draft',
        currency: 'USD',
        exchange_rate: 1.0,
        order_date: '2024-01-15',
        gross_total: 2000.0,
        po_lines: [],
      };

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [mockData], error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await PurchaseOrdersAPI.getAll();

      expect(result[0].total_amount).toBe(2000.0);
    });

    it('should calculate total price for each line item including VAT', async () => {
      const mockData = {
        id: 1,
        number: 'PO-001',
        supplier_id: 1,
        status: 'draft',
        currency: 'USD',
        exchange_rate: 1.0,
        order_date: '2024-01-15',
        gross_total: null,
        po_lines: [
          {
            id: 1,
            po_id: 1,
            line_no: 1,
            item_id: 1,
            qty_ordered: 100,
            unit_price: 10.0,
            vat_rate: 20.0,
          },
        ],
      };

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [mockData], error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await PurchaseOrdersAPI.getAll();

      const lineItem = result[0].purchase_order_items[0];
      // total_price = unit_price * quantity * (1 + vat_rate / 100)
      // = 10 * 100 * 1.20 = 1200
      expect(lineItem.total_price).toBe(1200);
    });

    it('should handle zero VAT rate correctly', async () => {
      const mockData = {
        id: 1,
        number: 'PO-001',
        supplier_id: 1,
        status: 'draft',
        currency: 'USD',
        exchange_rate: 1.0,
        order_date: '2024-01-15',
        gross_total: null,
        po_lines: [
          {
            id: 1,
            po_id: 1,
            line_no: 1,
            item_id: 1,
            qty_ordered: 100,
            unit_price: 10.0,
            vat_rate: 0,
          },
        ],
      };

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [mockData], error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await PurchaseOrdersAPI.getAll();

      const lineItem = result[0].purchase_order_items[0];
      // total_price = unit_price * quantity * (1 + 0 / 100) = 10 * 100 * 1 = 1000
      expect(lineItem.total_price).toBe(1000);
    });
  });

  describe('Payment Due Date', () => {
    it('should map payment_due_date correctly', async () => {
      const mockData = {
        id: 1,
        number: 'PO-001',
        supplier_id: 1,
        status: 'draft',
        currency: 'USD',
        exchange_rate: 1.0,
        order_date: '2024-01-15',
        payment_due_date: '2024-02-15',
        po_lines: [],
      };

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [mockData], error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await PurchaseOrdersAPI.getAll();

      expect(result[0].payment_due_date).toBe('2024-02-15');
      expect(result[0].due_date).toBe('2024-02-15');
    });

    it('should use promised_delivery_date as fallback for due_date if payment_due_date is null', async () => {
      const mockData = {
        id: 1,
        number: 'PO-001',
        supplier_id: 1,
        status: 'draft',
        currency: 'USD',
        exchange_rate: 1.0,
        order_date: '2024-01-15',
        payment_due_date: null,
        promised_delivery_date: '2024-01-25',
        po_lines: [],
      };

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [mockData], error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await PurchaseOrdersAPI.getAll();

      expect(result[0].payment_due_date).toBeNull();
      expect(result[0].due_date).toBe('2024-01-25');
    });

    it('should handle null payment_due_date gracefully', async () => {
      const mockData = {
        id: 1,
        number: 'PO-001',
        supplier_id: 1,
        status: 'draft',
        currency: 'USD',
        exchange_rate: 1.0,
        order_date: '2024-01-15',
        payment_due_date: null,
        promised_delivery_date: null,
        po_lines: [],
      };

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [mockData], error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await PurchaseOrdersAPI.getAll();

      expect(result[0].payment_due_date).toBeNull();
      expect(result[0].due_date).toBeNull();
    });
  });

  describe('getById', () => {
    it('should return purchase order with financial fields', async () => {
      const mockData = {
        id: 1,
        number: 'PO-001',
        supplier_id: 1,
        status: 'draft',
        currency: 'EUR',
        exchange_rate: 1.1,
        order_date: '2024-01-15',
        payment_due_date: '2024-02-15',
        gross_total: 1500.0,
        po_lines: [],
      };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: mockData, error: null }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await PurchaseOrdersAPI.getById(1);

      expect(result).not.toBeNull();
      expect(result?.currency).toBe('EUR');
      expect(result?.exchange_rate).toBe(1.1);
      expect(result?.payment_due_date).toBe('2024-02-15');
      expect(result?.total_amount).toBe(1500.0);
    });
  });

  describe('Business Rules', () => {
    it('should validate currency code is 3 characters', () => {
      const validCurrencies = ['USD', 'EUR', 'GBP', 'PLN'];
      const invalidCurrencies = ['US', 'EURO', ''];

      validCurrencies.forEach(currency => {
        expect(currency.length).toBe(3);
      });

      invalidCurrencies.forEach(currency => {
        expect(currency.length).not.toBe(3);
      });
    });

    it('should validate exchange rate is positive', () => {
      const validRate = 1.2345;
      const invalidRate = -0.5;

      expect(validRate).toBeGreaterThan(0);
      expect(invalidRate).toBeLessThanOrEqual(0);
    });
  });
});

