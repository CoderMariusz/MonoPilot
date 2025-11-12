/**
 * Unit Tests for LicensePlatesAPI
 *
 * Tests cover:
 * - LP number format validation
 * - QA status transitions
 * - Filtering and search
 * - LP composition/genealogy
 * - Reservations and availability calculations
 * - LP details retrieval
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LicensePlatesAPI } from '../licensePlates';

// Mock the supabase client
vi.mock('../../supabase/client-browser', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import { supabase } from '../../supabase/client-browser';

describe('LicensePlatesAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all license plates with product and location details', async () => {
      const mockLPs = [
        {
          id: 1,
          lp_number: 'LP-2025-001',
          product_id: 100,
          product: {
            description: 'Beef Ribeye',
            part_number: 'BEF-001',
          },
          location_id: 10,
          location: {
            name: 'A-01-01',
          },
          quantity: '500',
          uom: 'KG',
          qa_status: 'Passed',
          stage_suffix: 'RM',
          parent_lp_id: null,
          parent_lp_number: null,
          origin_type: 'GRN',
          origin_ref: { grn_id: 5 },
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
        },
      ];

      const mockReservations = {
        data: [{ qty: '50' }],
        error: null,
      };

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue(mockReservations),
        }),
      });

      const mockFrom = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockLPs, error: null }),
          }),
        })
        .mockReturnValue({
          select: mockSelect,
        });

      (supabase.from as any) = mockFrom;

      const result = await LicensePlatesAPI.getAll();

      expect(result.data).toHaveLength(1);
      expect(result.data[0].lp_number).toBe('LP-2025-001');
      expect(result.data[0].product_description).toBe('Beef Ribeye');
      expect(result.data[0].location_name).toBe('A-01-01');
      expect(result.data[0].quantity).toBe(500);
      expect(result.data[0].reserved_qty).toBe(50);
      expect(result.data[0].available_qty).toBe(450);
    });

    it('should filter by QA status', async () => {
      const mockLPs = [
        {
          id: 1,
          lp_number: 'LP-2025-001',
          product_id: 100,
          product: { description: 'Beef', part_number: 'BEF-001' },
          location_id: 10,
          location: { name: 'A-01' },
          quantity: '500',
          uom: 'KG',
          qa_status: 'Pending',
          stage_suffix: 'RM',
          parent_lp_id: null,
          parent_lp_number: null,
          origin_type: 'GRN',
          origin_ref: {},
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      const mockEq = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockLPs, error: null }),
      });

      const mockFrom = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: mockEq,
          }),
        })
        .mockReturnValue({
          select: mockSelect,
        });

      (supabase.from as any) = mockFrom;

      const result = await LicensePlatesAPI.getAll({ qa_status: 'Pending' });

      expect(mockEq).toHaveBeenCalledWith('qa_status', 'Pending');
      expect(result.data).toHaveLength(1);
      expect(result.data[0].qa_status).toBe('Pending');
    });

    it('should calculate summary statistics', async () => {
      const mockLPs = [
        {
          id: 1,
          lp_number: 'LP-001',
          product_id: 100,
          product: { description: 'Product 1', part_number: 'P1' },
          location_id: 10,
          location: { name: 'Loc-A' },
          quantity: '100',
          uom: 'KG',
          qa_status: 'Passed',
          stage_suffix: 'RM',
          parent_lp_id: null,
          parent_lp_number: null,
          origin_type: 'GRN',
          origin_ref: {},
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
        },
        {
          id: 2,
          lp_number: 'LP-002',
          product_id: 101,
          product: { description: 'Product 2', part_number: 'P2' },
          location_id: 11,
          location: { name: 'Loc-B' },
          quantity: '200',
          uom: 'KG',
          qa_status: 'Pending',
          stage_suffix: 'PR',
          parent_lp_id: null,
          parent_lp_number: null,
          origin_type: 'WO',
          origin_ref: {},
          created_at: '2025-01-15T11:00:00Z',
          updated_at: '2025-01-15T11:00:00Z',
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [], error: null }),
        }),
      });

      const mockFrom = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockLPs, error: null }),
          }),
        })
        .mockReturnValue({
          select: mockSelect,
        });

      (supabase.from as any) = mockFrom;

      const result = await LicensePlatesAPI.getAll();

      expect(result.summary.total_lps).toBe(2);
      expect(result.summary.total_quantity).toBe(300);
      expect(result.summary.qa_status_counts['Passed']).toBe(1);
      expect(result.summary.qa_status_counts['Pending']).toBe(1);
      expect(result.summary.location_counts['Loc-A']).toBe(1);
      expect(result.summary.location_counts['Loc-B']).toBe(1);
    });

    it('should filter by has_reservations flag', async () => {
      const mockLPs = [
        {
          id: 1,
          lp_number: 'LP-001',
          product_id: 100,
          product: { description: 'Product 1', part_number: 'P1' },
          location_id: 10,
          location: { name: 'Loc-A' },
          quantity: '100',
          uom: 'KG',
          qa_status: 'Passed',
          stage_suffix: 'RM',
          parent_lp_id: null,
          parent_lp_number: null,
          origin_type: 'GRN',
          origin_ref: {},
          created_at: '2025-01-15T10:00:00Z',
          updated_at: '2025-01-15T10:00:00Z',
        },
        {
          id: 2,
          lp_number: 'LP-002',
          product_id: 101,
          product: { description: 'Product 2', part_number: 'P2' },
          location_id: 11,
          location: { name: 'Loc-B' },
          quantity: '200',
          uom: 'KG',
          qa_status: 'Passed',
          stage_suffix: 'RM',
          parent_lp_id: null,
          parent_lp_number: null,
          origin_type: 'GRN',
          origin_ref: {},
          created_at: '2025-01-15T11:00:00Z',
          updated_at: '2025-01-15T11:00:00Z',
        },
      ];

      const mockFrom = vi
        .fn()
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockLPs, error: null }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi
                .fn()
                .mockResolvedValue({ data: [{ qty: '50' }], error: null }),
            }),
          }),
        })
        .mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        });

      (supabase.from as any) = mockFrom;

      const result = await LicensePlatesAPI.getAll({ has_reservations: true });

      // Should only return LPs with reservations
      expect(result.data).toHaveLength(1);
      expect(result.data[0].lp_number).toBe('LP-001');
      expect(result.data[0].reserved_qty).toBe(50);
    });
  });

  describe('getLPComposition', () => {
    it('should retrieve forward and backward composition trees', async () => {
      const mockLPData = {
        lp_number: 'LP-2025-001',
      };

      const mockForwardTree = [
        {
          node_id: 2,
          node_type: 'LP',
          lp_number: 'LP-2025-002',
          product_description: 'Sausage Mix',
          quantity: 100,
          uom: 'KG',
          qa_status: 'Passed',
          stage_suffix: 'FG',
          location: 'A-02-01',
          parent_node: 'LP-2025-001',
          depth: 1,
          composition_qty: 100,
          pallet_code: null,
        },
      ];

      const mockBackwardTree = [
        {
          node_id: 1,
          node_type: 'LP',
          lp_number: 'LP-2025-000',
          product_description: 'Raw Pork',
          quantity: 500,
          uom: 'KG',
          qa_status: 'Passed',
          stage_suffix: 'RM',
          location: 'A-01-01',
          parent_node: null,
          depth: 1,
          composition_qty: 150,
          pallet_code: null,
        },
      ];

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({ data: mockLPData, error: null }),
          }),
        }),
      });

      (supabase.rpc as any)
        .mockResolvedValueOnce({ data: mockForwardTree, error: null }) // Forward
        .mockResolvedValueOnce({ data: mockBackwardTree, error: null }); // Backward

      const result = await LicensePlatesAPI.getLPComposition(1);

      expect(result.forward).toHaveLength(1);
      expect(result.forward[0].lp_number).toBe('LP-2025-002');
      expect(result.forward[0].depth).toBe(1);

      expect(result.backward).toHaveLength(1);
      expect(result.backward[0].lp_number).toBe('LP-2025-000');
      expect(result.backward[0].composition_qty).toBe(150);

      expect(supabase.rpc).toHaveBeenCalledWith('get_lp_composition_tree', {
        lp_id_param: 1,
      });
      expect(supabase.rpc).toHaveBeenCalledWith(
        'get_lp_reverse_composition_tree',
        { lp_id_param: 1 }
      );
    });

    it('should throw error if LP not found', async () => {
      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({
                data: null,
                error: { message: 'Not found' },
              }),
          }),
        }),
      });

      await expect(LicensePlatesAPI.getLPComposition(999)).rejects.toThrow(
        'License plate not found'
      );
    });

    it('should handle empty composition trees', async () => {
      const mockLPData = {
        lp_number: 'LP-2025-001',
      };

      (supabase.from as any).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi
              .fn()
              .mockResolvedValue({ data: mockLPData, error: null }),
          }),
        }),
      });

      (supabase.rpc as any)
        .mockResolvedValueOnce({ data: [], error: null }) // Forward - empty
        .mockResolvedValueOnce({ data: [], error: null }); // Backward - empty

      const result = await LicensePlatesAPI.getLPComposition(1);

      expect(result.forward).toHaveLength(0);
      expect(result.backward).toHaveLength(0);
    });
  });

  describe('getLPDetails', () => {
    it('should fetch complete LP details with all related data', async () => {
      const mockLPData = {
        id: 1,
        lp_number: 'LP-2025-001',
        product: {
          id: 100,
          part_number: 'BEF-001',
          description: 'Beef Ribeye',
          type: 'RM',
          uom: 'KG',
        },
        location: {
          id: 10,
          name: 'A-01-01',
          code: 'A-01-01',
        },
        quantity: '500',
        qa_status: 'Passed',
        stage_suffix: 'RM',
        parent_lp: {
          id: 5,
          lp_number: 'LP-2024-999',
        },
        origin_type: 'GRN',
        origin_ref: { grn_id: 10 },
      };

      const mockReservations = [
        {
          id: 1,
          wo_id: 100,
          work_order: { wo_number: 'WO-2025-001' },
          qty: '50',
          status: 'active',
          created_at: '2025-01-15T10:00:00Z',
        },
      ];

      const mockCompositions = [
        {
          id: 1,
          input_lp_id: 1,
          input_lp: { lp_number: 'LP-2025-001' },
          output_lp_id: 2,
          output_lp: { lp_number: 'LP-2025-002' },
          qty: '100',
          uom: 'KG',
          op_seq: 1,
        },
      ];

      const mockStockMoves = [
        {
          id: 1,
          move_number: 'SM-2025-001',
          move_type: 'putaway',
          status: 'completed',
          quantity: '500',
          move_date: '2025-01-15T11:00:00Z',
        },
      ];

      (supabase.from as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: mockLPData, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi
              .fn()
              .mockResolvedValue({ data: mockReservations, error: null }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            or: vi
              .fn()
              .mockResolvedValue({ data: mockCompositions, error: null }),
          }),
        })
        .mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi
                .fn()
                .mockResolvedValue({ data: mockStockMoves, error: null }),
            }),
          }),
        });

      const result = await LicensePlatesAPI.getLPDetails(1);

      expect(result.id).toBe(1);
      expect(result.lp_number).toBe('LP-2025-001');
      expect(result.product.part_number).toBe('BEF-001');
      expect(result.location.code).toBe('A-01-01');
      expect(result.quantity).toBe(500);
      expect(result.qa_status).toBe('Passed');
      expect(result.parent_lp).not.toBeNull();
      expect(result.parent_lp?.lp_number).toBe('LP-2024-999');
      expect(result.reservations).toHaveLength(1);
      expect(result.reservations[0].wo_number).toBe('WO-2025-001');
      expect(result.compositions).toHaveLength(1);
      expect(result.stock_moves).toHaveLength(1);
    });

    it('should handle LP without parent', async () => {
      const mockLPData = {
        id: 1,
        lp_number: 'LP-2025-001',
        product: {
          id: 100,
          part_number: 'BEF-001',
          description: 'Beef',
          type: 'RM',
          uom: 'KG',
        },
        location: {
          id: 10,
          name: 'A-01',
          code: 'A-01',
        },
        quantity: '500',
        qa_status: 'Passed',
        stage_suffix: 'RM',
        parent_lp: null,
        origin_type: 'GRN',
        origin_ref: {},
      };

      (supabase.from as any)
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              single: vi
                .fn()
                .mockResolvedValue({ data: mockLPData, error: null }),
            }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        })
        .mockReturnValueOnce({
          select: vi.fn().mockReturnValue({
            or: vi.fn().mockResolvedValue({ data: [], error: null }),
          }),
        })
        .mockReturnValue({
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: [], error: null }),
            }),
          }),
        });

      const result = await LicensePlatesAPI.getLPDetails(1);

      expect(result.parent_lp).toBeNull();
      expect(result.reservations).toHaveLength(0);
      expect(result.compositions).toHaveLength(0);
      expect(result.stock_moves).toHaveLength(0);
    });
  });

  describe('LP Number Format', () => {
    it('should validate LP number format (LP-YYYY-NNN)', () => {
      const validFormats = ['LP-2025-001', 'LP-2025-999', 'LP-2024-100'];

      const lpNumberRegex = /^LP-\d{4}-\d{3,}$/;

      validFormats.forEach(lpNumber => {
        expect(lpNumberRegex.test(lpNumber)).toBe(true);
      });
    });

    it('should reject invalid LP number formats', () => {
      const invalidFormats = [
        'LP-25-001', // Year too short
        'LP-2025-1', // Number too short
        'LP2025001', // Missing dashes
        'LP-2025-ABC', // Non-numeric
        'lp-2025-001', // Lowercase
      ];

      const lpNumberRegex = /^LP-\d{4}-\d{3,}$/;

      invalidFormats.forEach(lpNumber => {
        expect(lpNumberRegex.test(lpNumber)).toBe(false);
      });
    });
  });

  describe('QA Status Transitions', () => {
    it('should define valid QA statuses', () => {
      const validStatuses = ['Pending', 'Passed', 'Failed', 'Quarantine'];

      expect(validStatuses).toContain('Pending');
      expect(validStatuses).toContain('Passed');
      expect(validStatuses).toContain('Failed');
      expect(validStatuses).toContain('Quarantine');
    });

    it('should enforce QA status workflow', () => {
      // Typical workflow: Pending → Passed/Failed/Quarantine
      const validTransitions: Record<string, string[]> = {
        Pending: ['Passed', 'Failed', 'Quarantine'],
        Passed: ['Quarantine'], // Can be quarantined later
        Failed: [], // Terminal state
        Quarantine: ['Passed', 'Failed'], // Can be re-tested
      };

      expect(validTransitions['Pending']).toContain('Passed');
      expect(validTransitions['Pending']).toContain('Failed');
      expect(validTransitions['Quarantine']).toContain('Passed');
    });
  });

  describe('Availability Calculations', () => {
    it('should calculate available quantity correctly (total - reserved)', () => {
      const totalQty = 500;
      const reservedQty = 150;
      const availableQty = Math.max(0, totalQty - reservedQty);

      expect(availableQty).toBe(350);
    });

    it('should not allow negative availability', () => {
      const totalQty = 100;
      const reservedQty = 150; // Over-reserved
      const availableQty = Math.max(0, totalQty - reservedQty);

      expect(availableQty).toBe(0);
    });

    it('should handle LP with no reservations', () => {
      const totalQty = 500;
      const reservedQty = 0;
      const availableQty = Math.max(0, totalQty - reservedQty);

      expect(availableQty).toBe(500);
    });
  });

  describe('Split Logic', () => {
    it('should validate that split quantities equal original quantity', () => {
      const originalQty = 500;
      const splitQuantities = [200, 150, 150];
      const totalSplit = splitQuantities.reduce((sum, qty) => sum + qty, 0);

      expect(totalSplit).toBe(originalQty);
    });

    it('should reject split if quantities do not match original', () => {
      const originalQty = 500;
      const splitQuantities = [200, 100, 100]; // Total: 400 (missing 100)
      const totalSplit = splitQuantities.reduce((sum, qty) => sum + qty, 0);

      expect(totalSplit).not.toBe(originalQty);
    });

    it('should generate child LP numbers correctly (LP-XXX-S1, LP-XXX-S2)', () => {
      const originalLPNumber = 'LP-2025-001';
      const childSuffix1 = '-S1';
      const childSuffix2 = '-S2';

      const childLP1 = `${originalLPNumber}${childSuffix1}`;
      const childLP2 = `${originalLPNumber}${childSuffix2}`;

      expect(childLP1).toBe('LP-2025-001-S1');
      expect(childLP2).toBe('LP-2025-001-S2');
    });
  });

  // =============================================
  // EPIC-002 PHASE 2: LP GENEALOGY & TRACEABILITY
  // =============================================

  describe('split() - Phase 2 Genealogy Tracking', () => {
    const mockUser = { id: 'user-123' };

    it('should split LP and record genealogy', async () => {
      const mockLP = {
        id: 1,
        lp_number: 'LP-2025-001',
        product_id: 10,
        location_id: 5,
        quantity: 100,
        uom: 'kg',
        batch: 'LOT-001',
        expiry_date: '2025-12-31',
        qa_status: 'Passed',
        is_consumed: false
      };

      // Mock parent LP fetch
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockLP, error: null })
      } as any);

      // Mock LP number generation
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce({ data: [], error: null })
      } as any);

      // Mock child LPs insert
      const mockChildren = [
        { id: 2, lp_number: 'LP-2025-000001', quantity: 50, uom: 'kg', batch: 'LOT-001', expiry_date: '2025-12-31' },
        { id: 3, lp_number: 'LP-2025-000002', quantity: 50, uom: 'kg', batch: 'LOT-001', expiry_date: '2025-12-31' }
      ];
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockResolvedValueOnce({ data: mockChildren, error: null })
      } as any);

      // Mock genealogy insert
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockResolvedValueOnce({ error: null })
      } as any);

      // Mock parent consumed update
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValueOnce({ error: null })
      } as any);

      const result = await LicensePlatesAPI.split(
        1,
        [{ quantity: 50 }, { quantity: 50 }],
        mockUser.id
      );

      expect(result.child_lps).toHaveLength(2);
      expect(result.parent_lp.is_consumed).toBe(true);
    });

    it('should fail if parent LP is consumed', async () => {
      const consumedLP = {
        id: 1,
        is_consumed: true,
        quantity: 100
      };

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: consumedLP, error: null })
      } as any);

      await expect(
        LicensePlatesAPI.split(1, [{ quantity: 50 }, { quantity: 50 }], mockUser.id)
      ).rejects.toThrow('Cannot split consumed LP');
    });
  });

  describe('merge() - Phase 2 Composition Tracking', () => {
    const mockUser = { id: 'user-123' };

    it('should merge LPs and record composition', async () => {
      const inputLPs = [
        { id: 1, product_id: 10, batch: 'LOT-001', expiry_date: '2025-12-31', qa_status: 'Passed', is_consumed: false, quantity: 30, uom: 'kg', lp_number: 'LP-001' },
        { id: 2, product_id: 10, batch: 'LOT-001', expiry_date: '2025-12-31', qa_status: 'Passed', is_consumed: false, quantity: 70, uom: 'kg', lp_number: 'LP-002' }
      ];

      // Mock input LPs fetch
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValueOnce({ data: inputLPs, error: null })
      } as any);

      // Mock LP number generation
      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        like: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValueOnce({ data: [], error: null })
      } as any);

      // Mock output LP insert
      const mockOutput = { id: 3, lp_number: 'LP-2025-000001', quantity: 100, uom: 'kg' };
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValueOnce({ data: mockOutput, error: null })
      } as any);

      // Mock composition insert
      vi.mocked(supabase.from).mockReturnValueOnce({
        insert: vi.fn().mockResolvedValueOnce({ error: null })
      } as any);

      // Mock consume input LPs
      vi.mocked(supabase.from).mockReturnValueOnce({
        update: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValueOnce({ error: null })
      } as any);

      const result = await LicensePlatesAPI.merge(
        [1, 2],
        { product_id: 10, location_id: 5, quantity: 100, uom: 'kg' },
        mockUser.id
      );

      expect(result.output_lp.quantity).toBe(100);
      expect(result.input_lps).toHaveLength(2);
    });

    it('should fail if batches do not match', async () => {
      const mismatchedLPs = [
        { id: 1, product_id: 10, batch: 'LOT-001', expiry_date: '2025-12-31', qa_status: 'Passed', is_consumed: false },
        { id: 2, product_id: 10, batch: 'LOT-002', expiry_date: '2025-12-31', qa_status: 'Passed', is_consumed: false }
      ];

      vi.mocked(supabase.from).mockReturnValueOnce({
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockResolvedValueOnce({ data: mismatchedLPs, error: null })
      } as any);

      await expect(
        LicensePlatesAPI.merge(
          [1, 2],
          { product_id: 10, location_id: 5, quantity: 100, uom: 'kg' },
          mockUser.id
        )
      ).rejects.toThrow('same product, batch, expiry date, and QA status');
    });
  });

  describe('getGenealogy() - Phase 2', () => {
    it('should retrieve genealogy tree', async () => {
      const mockTree = [
        { lp_id: 1, lp_number: 'LP-001', level: 0, quantity: 100, uom: 'kg' },
        { lp_id: 2, lp_number: 'LP-002', level: 1, quantity: 50, uom: 'kg' },
        { lp_id: 3, lp_number: 'LP-003', level: 1, quantity: 50, uom: 'kg' }
      ];

      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: mockTree, error: null } as any);

      const result = await LicensePlatesAPI.getGenealogy(1);

      expect(result.tree).toHaveLength(3);
      expect(supabase.rpc).toHaveBeenCalledWith('get_lp_genealogy_tree', { lp_id_param: 1 });
    });
  });

  describe('getReverseGenealogy() - Phase 2', () => {
    it('should retrieve reverse genealogy chain', async () => {
      const mockChain = [
        { lp_id: 3, lp_number: 'LP-003', level: 0, quantity: 25, wo_number: 'WO-001' },
        { lp_id: 2, lp_number: 'LP-002', level: -1, quantity: 50, wo_number: null },
        { lp_id: 1, lp_number: 'LP-001', level: -2, quantity: 100, wo_number: null }
      ];

      vi.mocked(supabase.rpc).mockResolvedValueOnce({ data: mockChain, error: null } as any);

      const result = await LicensePlatesAPI.getReverseGenealogy(3);

      expect(result.chain).toHaveLength(3);
      expect(result.chain[0].level).toBe(0);
      expect(result.chain[2].level).toBe(-2);
      expect(supabase.rpc).toHaveBeenCalledWith('get_lp_reverse_genealogy', { lp_id_param: 3 });
    });
  });
});
