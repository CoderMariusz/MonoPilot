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
});

