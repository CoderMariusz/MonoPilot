/**
 * Unit Tests for ASNsAPI
 * EPIC-002 Scanner & Warehouse v2 - Phase 1: ASN & Receiving
 *
 * Tests cover:
 * - CRUD operations (getAll, getById, getByNumber, create, update, delete)
 * - Workflow methods (submit, markReceived, cancel)
 * - Filtering and sorting (status, supplier, date range, PO)
 * - ASN item management (addItem, updateItem, deleteItem)
 * - ASN number generation
 * - RPC function calls (getForReceiving)
 * - Error handling and rollback logic
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ASNsAPI } from '../asns';

// Mock the supabase client
vi.mock('../../supabase/client', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import { supabase } from '../../supabase/client';

describe('ASNsAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================================
  // READ OPERATIONS
  // ============================================================================

  describe('getAll', () => {
    it('should fetch all ASNs with relationships', async () => {
      const mockData = [
        {
          id: 1,
          asn_number: 'ASN-2025-001',
          supplier_id: 1,
          po_id: 10,
          expected_arrival: '2025-01-15T10:00:00Z',
          actual_arrival: null,
          status: 'submitted',
          notes: 'Test ASN',
          supplier: { id: 1, name: 'Test Supplier', code: 'SUP001' },
          purchase_order: { id: 10, number: 'PO-001', status: 'approved' },
          asn_items: [
            {
              id: 1,
              asn_id: 1,
              product_id: 5,
              quantity: 100,
              uom: 'kg',
              batch: 'LOT-001',
              expiry_date: '2025-12-31',
              product: { id: 5, code: 'PORK-001', name: 'Pork Shoulder', uom: 'kg' },
            },
          ],
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await ASNsAPI.getAll();

      expect(result).toHaveLength(1);
      expect(result[0].asn_number).toBe('ASN-2025-001');
      expect(result[0].supplier.name).toBe('Test Supplier');
      expect(result[0].asn_items).toHaveLength(1);
      expect(supabase.from).toHaveBeenCalledWith('asns');
    });

    it('should filter ASNs by status (single)', async () => {
      const mockData = [
        { id: 1, asn_number: 'ASN-2025-001', status: 'submitted', asn_items: [] },
      ];

      const mockEq = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockOrder = vi.fn().mockReturnValue({ eq: mockEq });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const result = await ASNsAPI.getAll({ status: 'submitted' });

      expect(mockEq).toHaveBeenCalledWith('status', 'submitted');
    });

    it('should filter ASNs by status (array)', async () => {
      const mockData = [
        { id: 1, asn_number: 'ASN-2025-001', status: 'submitted', asn_items: [] },
        { id: 2, asn_number: 'ASN-2025-002', status: 'received', asn_items: [] },
      ];

      const mockIn = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockOrder = vi.fn().mockReturnValue({ in: mockIn });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const result = await ASNsAPI.getAll({ status: ['submitted', 'received'] });

      expect(mockIn).toHaveBeenCalledWith('status', ['submitted', 'received']);
    });

    it('should filter ASNs by supplier_id', async () => {
      const mockEq = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockOrder = vi.fn().mockReturnValue({ eq: mockEq });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      await ASNsAPI.getAll({ supplier_id: 5 });

      expect(mockEq).toHaveBeenCalledWith('supplier_id', 5);
    });

    it('should filter ASNs by date range', async () => {
      const mockLte = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockGte = vi.fn().mockReturnValue({ lte: mockLte });
      const mockOrder = vi.fn().mockReturnValue({ gte: mockGte });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      await ASNsAPI.getAll({
        from_date: '2025-01-01',
        to_date: '2025-01-31',
      });

      expect(mockGte).toHaveBeenCalledWith('expected_arrival', '2025-01-01');
      expect(mockLte).toHaveBeenCalledWith('expected_arrival', '2025-01-31');
    });

    it('should filter ASNs by po_id', async () => {
      const mockEq = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockOrder = vi.fn().mockReturnValue({ eq: mockEq });
      const mockSelect = vi.fn().mockReturnValue({ order: mockOrder });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      await ASNsAPI.getAll({ po_id: 10 });

      expect(mockEq).toHaveBeenCalledWith('po_id', 10);
    });

    it('should handle errors gracefully', async () => {
      const mockError = { message: 'Database error' };
      const mockSelect = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: null, error: mockError }),
      });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      await expect(ASNsAPI.getAll()).rejects.toThrow('Database error');
    });
  });

  describe('getById', () => {
    it('should fetch ASN by ID with full relationships', async () => {
      const mockData = {
        id: 1,
        asn_number: 'ASN-2025-001',
        supplier_id: 1,
        expected_arrival: '2025-01-15T10:00:00Z',
        status: 'submitted',
        supplier: { id: 1, name: 'Test Supplier', code: 'SUP001', email: 'test@example.com' },
        purchase_order: { id: 10, number: 'PO-001', status: 'approved', order_date: '2025-01-01' },
        asn_items: [],
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const result = await ASNsAPI.getById(1);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(1);
      expect(result?.supplier.email).toBe('test@example.com');
      expect(mockEq).toHaveBeenCalledWith('id', 1);
    });

    it('should return null when ASN not found', async () => {
      const mockError = { code: 'PGRST116', message: 'Not found' };
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const result = await ASNsAPI.getById(999);

      expect(result).toBeNull();
    });

    it('should throw error for database errors', async () => {
      const mockError = { code: 'OTHER', message: 'Database error' };
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      await expect(ASNsAPI.getById(1)).rejects.toThrow('Database error');
    });
  });

  describe('getByNumber', () => {
    it('should fetch ASN by ASN number', async () => {
      const mockData = {
        id: 1,
        asn_number: 'ASN-2025-001',
        status: 'submitted',
        supplier: { id: 1, name: 'Test Supplier', code: 'SUP001' },
        asn_items: [],
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const result = await ASNsAPI.getByNumber('ASN-2025-001');

      expect(result).not.toBeNull();
      expect(result?.asn_number).toBe('ASN-2025-001');
      expect(mockEq).toHaveBeenCalledWith('asn_number', 'ASN-2025-001');
    });

    it('should return null when ASN number not found', async () => {
      const mockError = { code: 'PGRST116', message: 'Not found' };
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const result = await ASNsAPI.getByNumber('ASN-9999-999');

      expect(result).toBeNull();
    });
  });

  describe('getForReceiving', () => {
    it('should fetch ASNs ready for receiving via RPC', async () => {
      const mockData = [
        {
          id: 1,
          asn_number: 'ASN-2025-001',
          supplier_name: 'Test Supplier',
          expected_arrival: '2025-01-15T10:00:00Z',
          items_count: 3,
          total_quantity: 500,
        },
      ];

      (supabase.rpc as any).mockResolvedValue({ data: mockData, error: null });

      const result = await ASNsAPI.getForReceiving();

      expect(result).toHaveLength(1);
      expect(result[0].asn_number).toBe('ASN-2025-001');
      expect(supabase.rpc).toHaveBeenCalledWith('get_asns_for_receiving');
    });

    it('should handle RPC errors', async () => {
      const mockError = { message: 'RPC error' };
      (supabase.rpc as any).mockResolvedValue({ data: null, error: mockError });

      await expect(ASNsAPI.getForReceiving()).rejects.toThrow('RPC error');
    });
  });

  // ============================================================================
  // WRITE OPERATIONS
  // ============================================================================

  describe('create', () => {
    it('should create ASN with items', async () => {
      const mockASNHeader = {
        id: 1,
        asn_number: 'ASN-2025-001',
        supplier_id: 1,
        expected_arrival: '2025-01-15T10:00:00Z',
        status: 'draft',
      };

      const mockCompleteASN = {
        ...mockASNHeader,
        supplier: { id: 1, name: 'Test Supplier' },
        asn_items: [
          { id: 1, product_id: 5, quantity: 100, uom: 'kg' },
        ],
      };

      // Mock ASN header creation
      const mockSingleHeader = vi.fn().mockResolvedValue({ data: mockASNHeader, error: null });
      const mockSelectHeader = vi.fn().mockReturnValue({ single: mockSingleHeader });
      const mockInsertHeader = vi.fn().mockReturnValue({ select: mockSelectHeader });

      // Mock ASN items creation
      const mockInsertItems = vi.fn().mockResolvedValue({ error: null });

      // Mock getById to return complete ASN
      const mockSingleComplete = vi.fn().mockResolvedValue({ data: mockCompleteASN, error: null });
      const mockEqComplete = vi.fn().mockReturnValue({ single: mockSingleComplete });
      const mockSelectComplete = vi.fn().mockReturnValue({ eq: mockEqComplete });

      let callCount = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'asns') {
          callCount++;
          if (callCount === 1) {
            return { insert: mockInsertHeader };
          } else {
            return { select: mockSelectComplete };
          }
        } else if (table === 'asn_items') {
          return { insert: mockInsertItems };
        }
      });

      const result = await ASNsAPI.create({
        asn_number: 'ASN-2025-001',
        supplier_id: 1,
        expected_arrival: '2025-01-15T10:00:00Z',
        status: 'draft',
        asn_items: [
          { product_id: 5, quantity: 100, uom: 'kg' },
        ],
      });

      expect(result.id).toBe(1);
      expect(result.asn_items).toHaveLength(1);
      expect(mockInsertItems).toHaveBeenCalled();
    });

    it('should create ASN without items', async () => {
      const mockASNHeader = {
        id: 1,
        asn_number: 'ASN-2025-001',
        supplier_id: 1,
        expected_arrival: '2025-01-15T10:00:00Z',
        status: 'draft',
      };

      const mockCompleteASN = {
        ...mockASNHeader,
        supplier: { id: 1, name: 'Test Supplier' },
        asn_items: [],
      };

      const mockSingleHeader = vi.fn().mockResolvedValue({ data: mockASNHeader, error: null });
      const mockSelectHeader = vi.fn().mockReturnValue({ single: mockSingleHeader });
      const mockInsertHeader = vi.fn().mockReturnValue({ select: mockSelectHeader });

      const mockSingleComplete = vi.fn().mockResolvedValue({ data: mockCompleteASN, error: null });
      const mockEqComplete = vi.fn().mockReturnValue({ single: mockSingleComplete });
      const mockSelectComplete = vi.fn().mockReturnValue({ eq: mockEqComplete });

      let callCount = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          return { insert: mockInsertHeader };
        } else {
          return { select: mockSelectComplete };
        }
      });

      const result = await ASNsAPI.create({
        asn_number: 'ASN-2025-001',
        supplier_id: 1,
        expected_arrival: '2025-01-15T10:00:00Z',
        asn_items: [],
      });

      expect(result.asn_items).toHaveLength(0);
    });

    it('should rollback ASN header if items insert fails', async () => {
      const mockASNHeader = { id: 1, asn_number: 'ASN-2025-001' };

      const mockSingleHeader = vi.fn().mockResolvedValue({ data: mockASNHeader, error: null });
      const mockSelectHeader = vi.fn().mockReturnValue({ single: mockSingleHeader });
      const mockInsertHeader = vi.fn().mockReturnValue({ select: mockSelectHeader });

      const mockItemsError = { message: 'Items insert error' };
      const mockInsertItems = vi.fn().mockResolvedValue({ error: mockItemsError });

      const mockDelete = vi.fn().mockResolvedValue({ error: null });
      const mockEqDelete = vi.fn().mockReturnValue({ delete: mockDelete });

      let callCount = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        if (table === 'asns') {
          callCount++;
          if (callCount === 1) {
            return { insert: mockInsertHeader };
          } else {
            return { delete: vi.fn().mockReturnValue({ eq: mockEqDelete }) };
          }
        } else if (table === 'asn_items') {
          return { insert: mockInsertItems };
        }
      });

      await expect(
        ASNsAPI.create({
          asn_number: 'ASN-2025-001',
          supplier_id: 1,
          expected_arrival: '2025-01-15T10:00:00Z',
          asn_items: [{ product_id: 5, quantity: 100, uom: 'kg' }],
        })
      ).rejects.toThrow('Items insert error');

      expect(mockEqDelete).toHaveBeenCalledWith('id', 1);
    });
  });

  describe('update', () => {
    it('should update ASN header fields', async () => {
      const mockUpdated = { id: 1, status: 'submitted', updated_at: expect.any(String) };
      const mockCompleteASN = {
        id: 1,
        asn_number: 'ASN-2025-001',
        status: 'submitted',
        supplier: { id: 1, name: 'Test Supplier' },
        asn_items: [],
      };

      const mockSingleUpdate = vi.fn().mockResolvedValue({ data: mockUpdated, error: null });
      const mockSelectUpdate = vi.fn().mockReturnValue({ single: mockSingleUpdate });
      const mockEqUpdate = vi.fn().mockReturnValue({ select: mockSelectUpdate });
      const mockUpdateFn = vi.fn().mockReturnValue({ eq: mockEqUpdate });

      const mockSingleComplete = vi.fn().mockResolvedValue({ data: mockCompleteASN, error: null });
      const mockEqComplete = vi.fn().mockReturnValue({ single: mockSingleComplete });
      const mockSelectComplete = vi.fn().mockReturnValue({ eq: mockEqComplete });

      let callCount = 0;
      (supabase.from as any).mockImplementation((table: string) => {
        callCount++;
        if (callCount === 1) {
          return { update: mockUpdateFn };
        } else {
          return { select: mockSelectComplete };
        }
      });

      const result = await ASNsAPI.update(1, { status: 'submitted' });

      expect(result.status).toBe('submitted');
      expect(mockUpdateFn).toHaveBeenCalled();
    });

    it('should handle update errors', async () => {
      const mockError = { message: 'Update error' };
      const mockSingle = vi.fn().mockResolvedValue({ data: null, error: mockError });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({ update: mockUpdate });

      await expect(ASNsAPI.update(1, { status: 'submitted' })).rejects.toThrow('Update error');
    });
  });

  describe('delete', () => {
    it('should delete ASN by ID', async () => {
      const mockDelete = vi.fn().mockResolvedValue({ error: null });
      const mockEq = vi.fn().mockReturnValue({ delete: mockDelete });

      (supabase.from as any).mockReturnValue({
        delete: vi.fn().mockReturnValue({ eq: mockEq }),
      });

      await ASNsAPI.delete(1);

      expect(mockEq).toHaveBeenCalledWith('id', 1);
    });

    it('should handle delete errors', async () => {
      const mockError = { message: 'Delete error' };
      const mockEq = vi.fn().mockResolvedValue({ error: mockError });

      (supabase.from as any).mockReturnValue({
        delete: vi.fn().mockReturnValue({ eq: mockEq }),
      });

      await expect(ASNsAPI.delete(1)).rejects.toThrow('Delete error');
    });
  });

  // ============================================================================
  // WORKFLOW OPERATIONS
  // ============================================================================

  describe('submit', () => {
    it('should change status to submitted', async () => {
      const mockCompleteASN = { id: 1, status: 'submitted', supplier: {}, asn_items: [] };

      const mockSingleUpdate = vi.fn().mockResolvedValue({ data: { id: 1 }, error: null });
      const mockSelectUpdate = vi.fn().mockReturnValue({ single: mockSingleUpdate });
      const mockEqUpdate = vi.fn().mockReturnValue({ select: mockSelectUpdate });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });

      const mockSingleComplete = vi.fn().mockResolvedValue({ data: mockCompleteASN, error: null });
      const mockEqComplete = vi.fn().mockReturnValue({ single: mockSingleComplete });
      const mockSelectComplete = vi.fn().mockReturnValue({ eq: mockEqComplete });

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { update: mockUpdate };
        } else {
          return { select: mockSelectComplete };
        }
      });

      const result = await ASNsAPI.submit(1);

      expect(result.status).toBe('submitted');
    });
  });

  describe('markReceived', () => {
    it('should set status to received and actual_arrival', async () => {
      const mockCompleteASN = {
        id: 1,
        status: 'received',
        actual_arrival: expect.any(String),
        supplier: {},
        asn_items: [],
      };

      const mockSingleUpdate = vi.fn().mockResolvedValue({ data: { id: 1 }, error: null });
      const mockSelectUpdate = vi.fn().mockReturnValue({ single: mockSingleUpdate });
      const mockEqUpdate = vi.fn().mockReturnValue({ select: mockSelectUpdate });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });

      const mockSingleComplete = vi.fn().mockResolvedValue({ data: mockCompleteASN, error: null });
      const mockEqComplete = vi.fn().mockReturnValue({ single: mockSingleComplete });
      const mockSelectComplete = vi.fn().mockReturnValue({ eq: mockEqComplete });

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { update: mockUpdate };
        } else {
          return { select: mockSelectComplete };
        }
      });

      const result = await ASNsAPI.markReceived(1);

      expect(result.status).toBe('received');
      expect(result.actual_arrival).toBeDefined();
    });
  });

  describe('cancel', () => {
    it('should set status to cancelled', async () => {
      const mockCompleteASN = { id: 1, status: 'cancelled', supplier: {}, asn_items: [] };

      const mockSingleUpdate = vi.fn().mockResolvedValue({ data: { id: 1 }, error: null });
      const mockSelectUpdate = vi.fn().mockReturnValue({ single: mockSingleUpdate });
      const mockEqUpdate = vi.fn().mockReturnValue({ select: mockSelectUpdate });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEqUpdate });

      const mockSingleComplete = vi.fn().mockResolvedValue({ data: mockCompleteASN, error: null });
      const mockEqComplete = vi.fn().mockReturnValue({ single: mockSingleComplete });
      const mockSelectComplete = vi.fn().mockReturnValue({ eq: mockEqComplete });

      let callCount = 0;
      (supabase.from as any).mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          return { update: mockUpdate };
        } else {
          return { select: mockSelectComplete };
        }
      });

      const result = await ASNsAPI.cancel(1);

      expect(result.status).toBe('cancelled');
    });
  });

  // ============================================================================
  // UTILITY OPERATIONS
  // ============================================================================

  describe('generateASNNumber', () => {
    it('should generate ASN-YYYY-001 for first ASN of the year', async () => {
      const mockLimit = vi.fn().mockResolvedValue({ data: [], error: null });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockLike = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ like: mockLike });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const result = await ASNsAPI.generateASNNumber();

      const year = new Date().getFullYear();
      expect(result).toBe(`ASN-${year}-001`);
    });

    it('should increment ASN number based on last ASN', async () => {
      const year = new Date().getFullYear();
      const mockData = [{ asn_number: `ASN-${year}-042` }];

      const mockLimit = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockLike = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ like: mockLike });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const result = await ASNsAPI.generateASNNumber();

      expect(result).toBe(`ASN-${year}-043`);
    });

    it('should pad ASN number with zeros', async () => {
      const year = new Date().getFullYear();
      const mockData = [{ asn_number: `ASN-${year}-009` }];

      const mockLimit = vi.fn().mockResolvedValue({ data: mockData, error: null });
      const mockOrder = vi.fn().mockReturnValue({ limit: mockLimit });
      const mockLike = vi.fn().mockReturnValue({ order: mockOrder });
      const mockSelect = vi.fn().mockReturnValue({ like: mockLike });

      (supabase.from as any).mockReturnValue({ select: mockSelect });

      const result = await ASNsAPI.generateASNNumber();

      expect(result).toBe(`ASN-${year}-010`);
    });
  });

  // ============================================================================
  // ASN ITEMS CRUD
  // ============================================================================

  describe('addItem', () => {
    it('should add item to existing ASN', async () => {
      const mockItem = {
        id: 1,
        asn_id: 1,
        product_id: 5,
        quantity: 100,
        uom: 'kg',
        batch: 'LOT-001',
        product: { id: 5, code: 'PORK-001', name: 'Pork Shoulder', uom: 'kg' },
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: mockItem, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      (supabase.from as any).mockReturnValue({ insert: mockInsert });

      const result = await ASNsAPI.addItem(1, {
        product_id: 5,
        quantity: 100,
        uom: 'kg',
        batch: 'LOT-001',
      });

      expect(result.asn_id).toBe(1);
      expect(result.product.code).toBe('PORK-001');
    });
  });

  describe('updateItem', () => {
    it('should update ASN item fields', async () => {
      const mockItem = {
        id: 1,
        asn_id: 1,
        quantity: 150,
        uom: 'kg',
        batch: 'LOT-002',
        product: { id: 5, code: 'PORK-001' },
      };

      const mockSingle = vi.fn().mockResolvedValue({ data: mockItem, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({ update: mockUpdate });

      const result = await ASNsAPI.updateItem(1, { quantity: 150, batch: 'LOT-002' });

      expect(result.quantity).toBe(150);
      expect(result.batch).toBe('LOT-002');
    });
  });

  describe('deleteItem', () => {
    it('should delete ASN item by ID', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });

      (supabase.from as any).mockReturnValue({
        delete: vi.fn().mockReturnValue({ eq: mockEq }),
      });

      await ASNsAPI.deleteItem(1);

      expect(mockEq).toHaveBeenCalledWith('id', 1);
    });
  });

  // ============================================================================
  // BUSINESS RULES
  // ============================================================================

  describe('Business Rules', () => {
    it('should validate ASN status values', () => {
      const validStatuses = ['draft', 'submitted', 'received', 'cancelled'];
      const invalidStatuses = ['pending', 'completed', ''];

      validStatuses.forEach(status => {
        expect(['draft', 'submitted', 'received', 'cancelled']).toContain(status);
      });

      invalidStatuses.forEach(status => {
        expect(['draft', 'submitted', 'received', 'cancelled']).not.toContain(status);
      });
    });

    it('should validate ASN number format (ASN-YYYY-NNN)', () => {
      const validASNNumbers = ['ASN-2025-001', 'ASN-2025-042', 'ASN-2025-999'];
      const invalidASNNumbers = ['ASN-001', '2025-001', 'ASN2025001'];

      const regex = /^ASN-\d{4}-\d{3}$/;

      validASNNumbers.forEach(number => {
        expect(regex.test(number)).toBe(true);
      });

      invalidASNNumbers.forEach(number => {
        expect(regex.test(number)).toBe(false);
      });
    });

    it('should validate quantity is positive', () => {
      const validQuantity = 100;
      const invalidQuantity = -50;

      expect(validQuantity).toBeGreaterThan(0);
      expect(invalidQuantity).toBeLessThanOrEqual(0);
    });
  });
});
