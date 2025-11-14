/**
 * Unit Tests for WarehousesAPI
 *
 * Tests cover:
 * - CRUD operations (getAll, getById, create, update, delete)
 * - Active filter (is_active=true)
 * - Soft delete behavior
 * - Error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WarehousesAPI } from '../warehouses';

// Mock the supabase client
vi.mock('../../supabase/client-browser', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '../../supabase/client-browser';

describe('WarehousesAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch only active warehouses', async () => {
      const mockWarehouses = [
        { id: 1, name: 'Main Warehouse', code: 'MAIN', is_active: true },
        { id: 2, name: 'Secondary Warehouse', code: 'SEC', is_active: true },
      ];

      const mockEq = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockWarehouses, error: null }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await WarehousesAPI.getAll();

      expect(supabase.from).toHaveBeenCalledWith('warehouses');
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockEq).toHaveBeenCalledWith('is_active', true);
      expect(result).toEqual(mockWarehouses);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no warehouses exist', async () => {
      const mockEq = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await WarehousesAPI.getAll();

      expect(result).toEqual([]);
    });

    it('should throw error when database query fails', async () => {
      const mockEq = vi.fn().mockReturnValue({
        order: vi
          .fn()
          .mockResolvedValue({ data: null, error: { message: 'DB Error' } }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      await expect(WarehousesAPI.getAll()).rejects.toThrow(
        'Failed to fetch warehouses'
      );
    });
  });

  describe('getById', () => {
    it('should fetch warehouse by id', async () => {
      const mockWarehouse = {
        id: 1,
        name: 'Main Warehouse',
        code: 'MAIN',
        is_active: true,
      };

      const mockSingle = vi
        .fn()
        .mockResolvedValue({ data: mockWarehouse, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await WarehousesAPI.getById(1);

      expect(supabase.from).toHaveBeenCalledWith('warehouses');
      expect(mockEq).toHaveBeenCalledWith('id', 1);
      expect(result).toEqual(mockWarehouse);
    });

    it('should return null when warehouse not found', async () => {
      const mockSingle = vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await WarehousesAPI.getById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create new warehouse', async () => {
      const newWarehouse = {
        name: 'New Warehouse',
        code: 'NEW',
        address: '123 St',
      };
      const createdWarehouse = { id: 3, ...newWarehouse, is_active: true };

      const mockSingle = vi
        .fn()
        .mockResolvedValue({ data: createdWarehouse, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      const result = await WarehousesAPI.create(newWarehouse as any);

      expect(supabase.from).toHaveBeenCalledWith('warehouses');
      expect(mockInsert).toHaveBeenCalledWith(newWarehouse);
      expect(result).toEqual(createdWarehouse);
    });

    it('should throw error when creation fails', async () => {
      const mockSingle = vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'Duplicate' } });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      await expect(
        WarehousesAPI.create({ name: 'Dup' } as any)
      ).rejects.toThrow('Failed to create warehouse');
    });
  });

  describe('update', () => {
    it('should update warehouse and set updated_at', async () => {
      const updateData = { name: 'Updated Name' };
      const updatedWarehouse = {
        id: 1,
        name: 'Updated Name',
        updated_at: expect.any(String),
      };

      const mockSingle = vi
        .fn()
        .mockResolvedValue({ data: updatedWarehouse, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      const result = await WarehousesAPI.update(1, updateData);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Updated Name',
          updated_at: expect.any(String),
        })
      );
      expect(mockEq).toHaveBeenCalledWith('id', 1);
      expect(result).toEqual(updatedWarehouse);
    });
  });

  describe('delete', () => {
    it('should soft delete warehouse (set is_active=false)', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      await WarehousesAPI.delete(1);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false,
          updated_at: expect.any(String),
        })
      );
      expect(mockEq).toHaveBeenCalledWith('id', 1);
    });

    it('should throw error when delete fails', async () => {
      const mockEq = vi
        .fn()
        .mockResolvedValue({ error: { message: 'FK constraint' } });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      await expect(WarehousesAPI.delete(1)).rejects.toThrow(
        'Failed to delete warehouse'
      );
    });
  });
});
