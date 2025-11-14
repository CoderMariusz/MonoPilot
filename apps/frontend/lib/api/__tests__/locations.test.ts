/**
 * Unit Tests for LocationsAPI
 *
 * Tests cover:
 * - CRUD operations
 * - Warehouse relationship
 * - Location code uniqueness
 * - Active filter
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LocationsAPI } from '../locations';

vi.mock('../../supabase/client-browser', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '../../supabase/client-browser';

describe('LocationsAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch only active locations', async () => {
      const mockLocations = [
        {
          id: 1,
          warehouse_id: 1,
          code: 'A-01-01',
          name: 'Aisle A Bin 1',
          is_active: true,
        },
        {
          id: 2,
          warehouse_id: 1,
          code: 'A-01-02',
          name: 'Aisle A Bin 2',
          is_active: true,
        },
      ];

      const mockEq = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockLocations, error: null }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await LocationsAPI.getAll();

      expect(supabase.from).toHaveBeenCalledWith('locations');
      expect(mockEq).toHaveBeenCalledWith('is_active', true);
      expect(result).toEqual(mockLocations);
    });

    it('should return empty array when no locations exist', async () => {
      const mockEq = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await LocationsAPI.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should fetch location by id with warehouse data', async () => {
      const mockLocation = {
        id: 1,
        warehouse_id: 1,
        code: 'A-01-01',
        name: 'Aisle A Bin 1',
        warehouse: { id: 1, name: 'Main Warehouse', code: 'MAIN' },
      };

      const mockSingle = vi
        .fn()
        .mockResolvedValue({ data: mockLocation, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await LocationsAPI.getById(1);

      expect(result).toEqual(mockLocation);
      expect(result?.warehouse).toBeDefined();
    });

    it('should return null when location not found', async () => {
      const mockSingle = vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await LocationsAPI.getById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create new location with warehouse reference', async () => {
      const newLocation = {
        warehouse_id: 1,
        code: 'B-02-03',
        name: 'Aisle B Bin 3',
        type: 'storage',
      };

      const createdLocation = { id: 3, ...newLocation, is_active: true };

      const mockSingle = vi
        .fn()
        .mockResolvedValue({ data: createdLocation, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      const result = await LocationsAPI.create(newLocation as any);

      expect(mockInsert).toHaveBeenCalledWith(newLocation);
      expect(result).toEqual(createdLocation);
      expect(result.warehouse_id).toBe(1);
    });

    it('should throw error when code is duplicate', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Duplicate key', code: '23505' },
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      await expect(LocationsAPI.create({ code: 'DUP' } as any)).rejects.toThrow(
        'Failed to create location'
      );
    });
  });

  describe('update', () => {
    it('should update location and set updated_at', async () => {
      const updateData = { name: 'Updated Name', type: 'staging' };
      const updatedLocation = {
        id: 1,
        ...updateData,
        updated_at: expect.any(String),
      };

      const mockSingle = vi
        .fn()
        .mockResolvedValue({ data: updatedLocation, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      const result = await LocationsAPI.update(1, updateData);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updateData,
          updated_at: expect.any(String),
        })
      );
      expect(result).toEqual(updatedLocation);
    });
  });

  describe('delete', () => {
    it('should soft delete location (set is_active=false)', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      await LocationsAPI.delete(1);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false,
          updated_at: expect.any(String),
        })
      );
    });

    it('should throw error when location has active inventory', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: { message: 'FK constraint - active LPs exist', code: '23503' },
      });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      await expect(LocationsAPI.delete(1)).rejects.toThrow(
        'Failed to delete location'
      );
    });
  });
});
