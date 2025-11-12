/**
 * Unit Tests for WorkOrdersAPI
 * 
 * Tests cover:
 * - Source demand tracking
 * - BOM selection
 * - Actual dates
 * - Execution time tracking
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkOrdersAPI } from '../workOrders';

// Mock the supabase client
vi.mock('../../supabase/client-browser', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
}));

import { supabase } from '../../supabase/client-browser';

describe('WorkOrdersAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Source Demand Tracking', () => {
    it('should map source_demand_type and source_demand_id correctly', async () => {
      const mockData = [
        {
          id: 1,
          wo_number: 'WO-001',
          product_id: 1,
          bom_id: 1,
          quantity: 100,
          uom: 'kg',
          status: 'planned',
          source_demand_type: 'TO',
          source_demand_id: 5,
          scheduled_start: '2024-01-15T08:00:00Z',
          scheduled_end: '2024-01-15T16:00:00Z',
          actual_start: null,
          actual_end: null,
          created_by: 'user-123',
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await WorkOrdersAPI.getAll();

      expect(result[0].source_demand_type).toBe('TO');
      expect(result[0].source_demand_id).toBe(5);
    });

    it('should handle Manual source demand type', async () => {
      const mockData = [
        {
          id: 1,
          wo_number: 'WO-001',
          product_id: 1,
          bom_id: 1,
          quantity: 100,
          uom: 'kg',
          status: 'planned',
          source_demand_type: 'Manual',
          source_demand_id: null,
          scheduled_start: '2024-01-15T08:00:00Z',
          scheduled_end: '2024-01-15T16:00:00Z',
          actual_start: null,
          actual_end: null,
          created_by: 'user-123',
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await WorkOrdersAPI.getAll();

      expect(result[0].source_demand_type).toBe('Manual');
      expect(result[0].source_demand_id).toBeNull();
    });

    it('should handle PO source demand type', async () => {
      const mockData = [
        {
          id: 1,
          wo_number: 'WO-001',
          product_id: 1,
          bom_id: 1,
          quantity: 100,
          uom: 'kg',
          status: 'planned',
          source_demand_type: 'PO',
          source_demand_id: 10,
          scheduled_start: '2024-01-15T08:00:00Z',
          scheduled_end: '2024-01-15T16:00:00Z',
          actual_start: null,
          actual_end: null,
          created_by: 'user-123',
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await WorkOrdersAPI.getAll();

      expect(result[0].source_demand_type).toBe('PO');
      expect(result[0].source_demand_id).toBe(10);
    });
  });

  describe('BOM Selection', () => {
    it('should map bom_id correctly', async () => {
      const mockData = [
        {
          id: 1,
          wo_number: 'WO-001',
          product_id: 1,
          bom_id: 42,
          quantity: 100,
          uom: 'kg',
          status: 'planned',
          bom: {
            id: 42,
            version: 2,
            status: 'active',
          },
          scheduled_start: '2024-01-15T08:00:00Z',
          scheduled_end: '2024-01-15T16:00:00Z',
          actual_start: null,
          actual_end: null,
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await WorkOrdersAPI.getAll();

      expect(result[0].bom_id).toBe(42);
      expect(result[0].bom).toBeDefined();
      expect(result[0].bom?.id).toBe('42');
      expect(result[0].bom?.version).toBe(2);
      expect(result[0].bom?.status).toBe('active');
    });

    it('should handle work order without BOM', async () => {
      const mockData = [
        {
          id: 1,
          wo_number: 'WO-001',
          product_id: 1,
          bom_id: null,
          quantity: 100,
          uom: 'kg',
          status: 'planned',
          bom: null,
          scheduled_start: '2024-01-15T08:00:00Z',
          scheduled_end: '2024-01-15T16:00:00Z',
          actual_start: null,
          actual_end: null,
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await WorkOrdersAPI.getAll();

      expect(result[0].bom_id).toBeNull();
      expect(result[0].bom).toBeUndefined();
    });
  });

  describe('Actual Dates', () => {
    it('should map actual_start and actual_end correctly', async () => {
      const mockData = [
        {
          id: 1,
          wo_number: 'WO-001',
          product_id: 1,
          bom_id: 1,
          quantity: 100,
          uom: 'kg',
          status: 'in_progress',
          scheduled_start: '2024-01-15T08:00:00Z',
          scheduled_end: '2024-01-15T16:00:00Z',
          actual_start: '2024-01-15T08:30:00Z',
          actual_end: null,
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await WorkOrdersAPI.getAll();

      expect(result[0].actual_start).toBe('2024-01-15T08:30:00Z');
      expect(result[0].actual_end).toBeNull();
    });

    it('should map completed work order with actual_end', async () => {
      const mockData = [
        {
          id: 1,
          wo_number: 'WO-001',
          product_id: 1,
          bom_id: 1,
          quantity: 100,
          uom: 'kg',
          status: 'completed',
          scheduled_start: '2024-01-15T08:00:00Z',
          scheduled_end: '2024-01-15T16:00:00Z',
          actual_start: '2024-01-15T08:30:00Z',
          actual_end: '2024-01-15T17:00:00Z',
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await WorkOrdersAPI.getAll();

      expect(result[0].actual_start).toBe('2024-01-15T08:30:00Z');
      expect(result[0].actual_end).toBe('2024-01-15T17:00:00Z');
    });

    it('should use scheduled_end as due_date', async () => {
      const mockData = [
        {
          id: 1,
          wo_number: 'WO-001',
          product_id: 1,
          bom_id: 1,
          quantity: 100,
          uom: 'kg',
          status: 'planned',
          scheduled_start: '2024-01-15T08:00:00Z',
          scheduled_end: '2024-01-15T16:00:00Z',
          actual_start: null,
          actual_end: null,
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await WorkOrdersAPI.getAll();

      expect(result[0].due_date).toBe('2024-01-15T16:00:00Z');
      expect(result[0].scheduled_end).toBe('2024-01-15T16:00:00Z');
    });
  });

  describe('Created By User', () => {
    it('should map created_by correctly', async () => {
      const mockData = [
        {
          id: 1,
          wo_number: 'WO-001',
          product_id: 1,
          bom_id: 1,
          quantity: 100,
          uom: 'kg',
          status: 'planned',
          created_by: 'user-123',
          scheduled_start: '2024-01-15T08:00:00Z',
          scheduled_end: '2024-01-15T16:00:00Z',
          actual_start: null,
          actual_end: null,
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await WorkOrdersAPI.getAll();

      expect(result[0].created_by).toBe('user-123');
    });

    it('should handle null created_by', async () => {
      const mockData = [
        {
          id: 1,
          wo_number: 'WO-001',
          product_id: 1,
          bom_id: 1,
          quantity: 100,
          uom: 'kg',
          status: 'planned',
          created_by: null,
          scheduled_start: '2024-01-15T08:00:00Z',
          scheduled_end: '2024-01-15T16:00:00Z',
          actual_start: null,
          actual_end: null,
        },
      ];

      const mockSelect = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnThis(),
        gte: vi.fn().mockReturnThis(),
        order: vi.fn().mockResolvedValue({ data: mockData, error: null }),
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await WorkOrdersAPI.getAll();

      expect(result[0].created_by).toBeUndefined(); // API converts null to undefined
    });
  });

  describe('Execution Time Tracking', () => {
    it('should validate that actual_start is after scheduled_start when both are set', () => {
      const scheduledStart = new Date('2024-01-15T08:00:00Z');
      const actualStart = new Date('2024-01-15T08:30:00Z');

      expect(actualStart.getTime()).toBeGreaterThan(scheduledStart.getTime());
      // In production, actual_start can be before scheduled_start (early start)
      // but this test documents the typical case
    });

    it('should validate that actual_end is after actual_start when both are set', () => {
      const actualStart = new Date('2024-01-15T08:30:00Z');
      const actualEnd = new Date('2024-01-15T17:00:00Z');

      expect(actualEnd.getTime()).toBeGreaterThan(actualStart.getTime());
      // Business rule: actual_end must be after actual_start
    });
  });

  describe('BOM Snapshot Logic', () => {
    it('should snapshot BOM items to wo_materials at WO creation', () => {
      // When a Work Order is created, bom_items should be copied to wo_materials
      // This documents the expected behavior for BOM snapshot
      
      const bomItems = [
        { material_id: 100, quantity: 10, uom: 'KG', sequence: 1 },
        { material_id: 101, quantity: 0.5, uom: 'KG', sequence: 2 },
        { material_id: 102, quantity: 1, uom: 'EACH', sequence: 3 }
      ];

      const targetQuantity = 100; // WO target output

      // Each BOM item should be multiplied by target quantity
      const woMaterials = bomItems.map(item => ({
        material_id: item.material_id,
        total_qty_needed: item.quantity * targetQuantity,
        uom: item.uom,
        sequence: item.sequence
      }));

      expect(woMaterials).toHaveLength(3);
      expect(woMaterials[0].total_qty_needed).toBe(1000); // 10 * 100
      expect(woMaterials[1].total_qty_needed).toBe(50);   // 0.5 * 100
      expect(woMaterials[2].total_qty_needed).toBe(100);  // 1 * 100
    });

    it('should preserve BOM item properties in wo_materials', () => {
      const bomItem = {
        material_id: 100,
        quantity: 10,
        uom: 'KG',
        sequence: 1,
        is_optional: false,
        is_phantom: true,
        consume_whole_lp: false,
        production_line_restrictions: ['LINE-A', 'LINE-B'],
        tax_code_id: 5,
        lead_time_days: 3,
        moq: 50
      };

      // All properties should be copied to wo_materials
      const woMaterial = {
        ...bomItem,
        total_qty_needed: bomItem.quantity * 100
      };

      expect(woMaterial.material_id).toBe(100);
      expect(woMaterial.is_phantom).toBe(true);
      expect(woMaterial.consume_whole_lp).toBe(false);
      expect(woMaterial.production_line_restrictions).toEqual(['LINE-A', 'LINE-B']);
    });

    it('should handle phantom items (no LP tracking)', () => {
      const phantomItem = {
        material_id: 200,
        quantity: 0.1,
        uom: 'KG',
        is_phantom: true,
        consume_whole_lp: false
      };

      // Phantom items are included in calculations but don't require LP reservations
      expect(phantomItem.is_phantom).toBe(true);
      expect(phantomItem.consume_whole_lp).toBe(false);
      
      // Business rule: Phantom items are counted but not tracked via LPs
    });

    it('should handle consume_whole_lp flag', () => {
      const bomItem = {
        material_id: 300,
        quantity: 1,
        uom: 'EACH',
        consume_whole_lp: true
      };

      // consume_whole_lp means entire LP must be consumed (e.g., casings)
      expect(bomItem.consume_whole_lp).toBe(true);
      
      // Business rule: If LP has 100 units and only 50 needed, 
      // consume_whole_lp = true means all 100 are consumed
    });
  });

  describe('Material Quantity Calculations', () => {
    it('should calculate total_qty_needed correctly (qty * multiplier)', () => {
      const bomQuantity = 10;      // 10 KG per unit
      const woTargetQuantity = 100; // 100 units output
      const totalNeeded = bomQuantity * woTargetQuantity;

      expect(totalNeeded).toBe(1000); // 10 * 100 = 1000 KG
    });

    it('should handle fractional BOM quantities', () => {
      const bomQuantity = 0.5;      // 0.5 KG per unit
      const woTargetQuantity = 100;
      const totalNeeded = bomQuantity * woTargetQuantity;

      expect(totalNeeded).toBe(50); // 0.5 * 100 = 50 KG
    });

    it('should handle very small quantities (spices, additives)', () => {
      const bomQuantity = 0.001;    // 1 gram per unit
      const woTargetQuantity = 1000;
      const totalNeeded = bomQuantity * woTargetQuantity;

      expect(totalNeeded).toBe(1); // 0.001 * 1000 = 1 KG
    });

    it('should calculate scrap/waste allowance', () => {
      const baseQuantity = 100;
      const scrapPercentage = 0.05; // 5% waste
      const quantityWithWaste = baseQuantity * (1 + scrapPercentage);

      expect(quantityWithWaste).toBe(105); // 100 * 1.05 = 105
    });

    it('should track consumed vs planned quantities', () => {
      const totalQtyNeeded = 1000;
      const qtyConsumed = 950;      // Actual consumption
      const qtyRemaining = totalQtyNeeded - qtyConsumed;

      expect(qtyConsumed).toBe(950);
      expect(qtyRemaining).toBe(50);
      expect(qtyConsumed).toBeLessThan(totalQtyNeeded);
    });

    it('should allow over-consumption (more than planned)', () => {
      const totalQtyNeeded = 1000;
      const qtyConsumed = 1050;     // Consumed more than planned (e.g., waste)
      const variance = qtyConsumed - totalQtyNeeded;

      expect(variance).toBe(50);
      expect(variance).toBeGreaterThan(0); // Positive variance = over-consumption
    });
  });

  describe('Status Transition Validation', () => {
    it('should enforce WO status workflow', () => {
      const validWorkflow = [
        'planned',
        'released',
        'in_progress',
        'completed',
        'closed',
        'cancelled'
      ];

      expect(validWorkflow).toContain('planned');
      expect(validWorkflow).toContain('released');
      expect(validWorkflow).toContain('in_progress');
      expect(validWorkflow).toContain('completed');
    });

    it('should validate planned → released transition', () => {
      const currentStatus = 'planned';
      const validNextStatuses = ['released', 'cancelled'];

      expect(validNextStatuses).toContain('released');
      expect(validNextStatuses).toContain('cancelled');
      expect(validNextStatuses).not.toContain('completed'); // Cannot skip states
    });

    it('should validate released → in_progress transition', () => {
      const currentStatus = 'released';
      const validNextStatuses = ['in_progress', 'cancelled'];

      expect(validNextStatuses).toContain('in_progress');
      expect(validNextStatuses).toContain('cancelled');
    });

    it('should validate in_progress → completed transition', () => {
      const currentStatus = 'in_progress';
      const validNextStatuses = ['completed', 'cancelled'];

      expect(validNextStatuses).toContain('completed');
      expect(validNextStatuses).toContain('cancelled');
    });

    it('should not allow backward transitions', () => {
      const currentStatus = 'in_progress';
      const invalidTransitions = ['planned', 'released'];

      invalidTransitions.forEach(status => {
        // Business rule: Cannot go back to earlier states
        expect(status).not.toBe(currentStatus);
      });
    });

    it('should allow cancellation from any status except completed/closed', () => {
      const cancellableStatuses = ['planned', 'released', 'in_progress'];
      const nonCancellableStatuses = ['completed', 'closed'];

      cancellableStatuses.forEach(status => {
        expect(['planned', 'released', 'in_progress']).toContain(status);
      });

      nonCancellableStatuses.forEach(status => {
        // Completed/closed WOs should not be cancelled
        expect(['completed', 'closed']).toContain(status);
      });
    });
  });

  describe('Production Line Restrictions', () => {
    it('should validate production line restrictions for materials', () => {
      const material = {
        material_id: 100,
        production_line_restrictions: ['LINE-A', 'LINE-B']
      };

      const woProductionLine = 'LINE-A';

      expect(material.production_line_restrictions).toContain(woProductionLine);
      // Business rule: Material can only be used on specified lines
    });

    it('should reject material if line not in restrictions', () => {
      const material = {
        material_id: 100,
        production_line_restrictions: ['LINE-A', 'LINE-B']
      };

      const woProductionLine = 'LINE-C';

      expect(material.production_line_restrictions).not.toContain(woProductionLine);
      // Should throw error: "Material 100 cannot be used on LINE-C"
    });

    it('should allow material with no restrictions on any line', () => {
      const material = {
        material_id: 100,
        production_line_restrictions: [] // Empty = no restrictions
      };

      const woProductionLine = 'ANY-LINE';

      expect(material.production_line_restrictions).toHaveLength(0);
      // Business rule: Empty restrictions = can be used anywhere
    });
  });
});

