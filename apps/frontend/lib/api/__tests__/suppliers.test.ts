/**
 * Unit Tests for SuppliersAPI
 *
 * Tests cover:
 * - CRUD operations
 * - Supplier code uniqueness
 * - Contact information handling
 * - Payment terms
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SuppliersAPI } from '../suppliers';

vi.mock('../../supabase/client-browser', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

import { supabase } from '../../supabase/client-browser';

describe('SuppliersAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch only active suppliers', async () => {
      const mockSuppliers = [
        {
          id: 1,
          name: 'ABC Ingredients Ltd',
          code: 'ABC',
          email: 'info@abc.com',
          is_active: true,
        },
        {
          id: 2,
          name: 'XYZ Packaging Co',
          code: 'XYZ',
          email: 'sales@xyz.com',
          is_active: true,
        },
      ];

      const mockEq = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: mockSuppliers, error: null }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await SuppliersAPI.getAll();

      expect(supabase.from).toHaveBeenCalledWith('suppliers');
      expect(mockEq).toHaveBeenCalledWith('is_active', true);
      expect(result).toEqual(mockSuppliers);
    });

    it('should return empty array when no suppliers exist', async () => {
      const mockEq = vi.fn().mockReturnValue({
        order: vi.fn().mockResolvedValue({ data: [], error: null }),
      });

      const mockSelect = vi.fn().mockReturnValue({
        eq: mockEq,
      });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await SuppliersAPI.getAll();

      expect(result).toEqual([]);
    });
  });

  describe('getById', () => {
    it('should fetch supplier by id', async () => {
      const mockSupplier = {
        id: 1,
        name: 'ABC Ingredients Ltd',
        code: 'ABC',
        email: 'info@abc.com',
        phone: '+44 20 1234 5678',
        address: '123 Supply St, London',
        payment_terms: 'Net 30',
        is_active: true,
      };

      const mockSingle = vi
        .fn()
        .mockResolvedValue({ data: mockSupplier, error: null });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await SuppliersAPI.getById(1);

      expect(result).toEqual(mockSupplier);
      expect(result?.payment_terms).toBe('Net 30');
    });

    it('should return null when supplier not found', async () => {
      const mockSingle = vi
        .fn()
        .mockResolvedValue({ data: null, error: { message: 'Not found' } });
      const mockEq = vi.fn().mockReturnValue({ single: mockSingle });
      const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({
        select: mockSelect,
      });

      const result = await SuppliersAPI.getById(999);

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create new supplier with contact details', async () => {
      const newSupplier = {
        name: 'New Supplier Inc',
        code: 'NEW',
        email: 'contact@newsupplier.com',
        phone: '+1 555 0123',
        address: '456 Trade Blvd',
        payment_terms: 'Net 60',
      };

      const createdSupplier = { id: 3, ...newSupplier, is_active: true };

      const mockSingle = vi
        .fn()
        .mockResolvedValue({ data: createdSupplier, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      const result = await SuppliersAPI.create(newSupplier as any);

      expect(mockInsert).toHaveBeenCalledWith(newSupplier);
      expect(result).toEqual(createdSupplier);
      expect(result.email).toBe('contact@newsupplier.com');
      expect(result.payment_terms).toBe('Net 60');
    });

    it('should throw error when supplier code is duplicate', async () => {
      const mockSingle = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'Duplicate key violation', code: '23505' },
      });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockInsert = vi.fn().mockReturnValue({ select: mockSelect });

      (supabase.from as any).mockReturnValue({
        insert: mockInsert,
      });

      await expect(SuppliersAPI.create({ code: 'DUP' } as any)).rejects.toThrow(
        'Failed to create supplier'
      );
    });
  });

  describe('update', () => {
    it('should update supplier contact information', async () => {
      const updateData = {
        email: 'newemail@supplier.com',
        phone: '+44 20 9999 8888',
        payment_terms: 'Net 45',
      };

      const updatedSupplier = {
        id: 1,
        name: 'ABC Ltd',
        ...updateData,
        updated_at: expect.any(String),
      };

      const mockSingle = vi
        .fn()
        .mockResolvedValue({ data: updatedSupplier, error: null });
      const mockSelect = vi.fn().mockReturnValue({ single: mockSingle });
      const mockEq = vi.fn().mockReturnValue({ select: mockSelect });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      const result = await SuppliersAPI.update(1, updateData);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          ...updateData,
          updated_at: expect.any(String),
        })
      );
      expect(result.email).toBe('newemail@supplier.com');
      expect(result.payment_terms).toBe('Net 45');
    });
  });

  describe('delete', () => {
    it('should soft delete supplier (set is_active=false)', async () => {
      const mockEq = vi.fn().mockResolvedValue({ error: null });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      await SuppliersAPI.delete(1);

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          is_active: false,
          updated_at: expect.any(String),
        })
      );
    });

    it('should throw error when supplier has active purchase orders', async () => {
      const mockEq = vi.fn().mockResolvedValue({
        error: { message: 'FK constraint - active POs exist', code: '23503' },
      });
      const mockUpdate = vi.fn().mockReturnValue({ eq: mockEq });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      await expect(SuppliersAPI.delete(1)).rejects.toThrow(
        'Failed to delete supplier'
      );
    });
  });
});
