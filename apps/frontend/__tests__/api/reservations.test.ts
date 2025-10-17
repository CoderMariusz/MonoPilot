/**
 * API Integration Tests for Reservations
 * Tests the LP reservations API endpoints
 */

import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => ({
    select: jest.fn(() => ({
      eq: jest.fn(() => ({
        single: jest.fn(() => ({
          data: null,
          error: null
        }))
      })),
      order: jest.fn(() => ({
        data: [],
        error: null
      }))
    })),
    insert: jest.fn(() => ({
      select: jest.fn(() => ({
        single: jest.fn(() => ({
          data: null,
          error: null
        }))
      }))
    })),
    update: jest.fn(() => ({
      eq: jest.fn(() => ({
        data: null,
        error: null
      }))
    })),
    delete: jest.fn(() => ({
      eq: jest.fn(() => ({
        data: null,
        error: null
      }))
    }))
  })),
  rpc: jest.fn(() => ({
    data: null,
    error: null
  }))
};

jest.mock('../../lib/supabase/client', () => ({
  supabase: mockSupabase
}));

describe('Reservations API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('Create Reservation', () => {
    it('should create reservation successfully', async () => {
      const mockReservation = {
        id: 1,
        lp_id: 1,
        wo_id: 1,
        quantity_reserved: 50.0,
        status: 'active',
        reserved_at: '2024-01-01T00:00:00Z'
      };

      const mockLicensePlate = {
        id: 1,
        lp_number: 'LP-001',
        product_id: 1,
        quantity: 100.0,
        qa_status: 'Passed'
      };

      mockSupabase.from().select().eq().single.mockReturnValue({
        data: mockLicensePlate,
        error: null
      });

      mockSupabase.rpc.mockReturnValue({
        data: 100.0, // Available quantity
        error: null
      });

      mockSupabase.from().insert().select().single.mockReturnValue({
        data: mockReservation,
        error: null
      });

      const result = await mockSupabase.from('lp_reservations')
        .insert({
          lp_id: 1,
          wo_id: 1,
          quantity_reserved: 50.0,
          status: 'active',
          reserved_by: 'user-id'
        })
        .select()
        .single();

      expect(result.data.id).toBe(1);
      expect(result.data.lp_id).toBe(1);
      expect(result.data.wo_id).toBe(1);
      expect(result.data.quantity_reserved).toBe(50.0);
    });

    it('should reject reservation with insufficient quantity', async () => {
      const mockLicensePlate = {
        id: 1,
        lp_number: 'LP-001',
        product_id: 1,
        quantity: 100.0,
        qa_status: 'Passed'
      };

      mockSupabase.from().select().eq().single.mockReturnValue({
        data: mockLicensePlate,
        error: null
      });

      mockSupabase.rpc.mockReturnValue({
        data: 25.0, // Available quantity less than requested
        error: null
      });

      const result = await mockSupabase.from('lp_reservations')
        .insert({
          lp_id: 1,
          wo_id: 1,
          quantity_reserved: 50.0,
          status: 'active',
          reserved_by: 'user-id'
        })
        .select()
        .single();

      expect(result.error).toBeDefined();
    });

    it('should reject reservation for LP with failed QA status', async () => {
      const mockLicensePlate = {
        id: 1,
        lp_number: 'LP-001',
        product_id: 1,
        quantity: 100.0,
        qa_status: 'Failed'
      };

      mockSupabase.from().select().eq().single.mockReturnValue({
        data: mockLicensePlate,
        error: null
      });

      const result = await mockSupabase.from('lp_reservations')
        .insert({
          lp_id: 1,
          wo_id: 1,
          quantity_reserved: 50.0,
          status: 'active',
          reserved_by: 'user-id'
        })
        .select()
        .single();

      expect(result.error).toBeDefined();
    });
  });

  describe('Get Reservations', () => {
    it('should fetch reservations with filters', async () => {
      const mockReservations = [
        {
          id: 1,
          lp_id: 1,
          wo_id: 1,
          quantity_reserved: 50.0,
          status: 'active',
          reserved_at: '2024-01-01T00:00:00Z',
          license_plate: {
            lp_number: 'LP-001',
            product: {
              part_number: 'BEEF-001',
              description: 'Beef'
            }
          },
          work_order: {
            wo_number: 'WO-001'
          }
        }
      ];

      mockSupabase.from().select().order.mockReturnValue({
        data: mockReservations,
        error: null
      });

      const result = await mockSupabase.from('lp_reservations')
        .select(`
          id,
          lp_id,
          wo_id,
          quantity_reserved,
          status,
          reserved_at,
          license_plate:license_plates(lp_number, product:products(part_number, description)),
          work_order:work_orders(wo_number)
        `)
        .order('reserved_at', { ascending: false });

      expect(result.data).toHaveLength(1);
      expect(result.data[0].id).toBe(1);
      expect(result.data[0].license_plate.lp_number).toBe('LP-001');
    });

    it('should filter reservations by LP ID', async () => {
      const mockReservations = [
        {
          id: 1,
          lp_id: 1,
          wo_id: 1,
          quantity_reserved: 50.0,
          status: 'active'
        }
      ];

      mockSupabase.from().select().order().eq.mockReturnValue({
        data: mockReservations,
        error: null
      });

      const result = await mockSupabase.from('lp_reservations')
        .select('*')
        .order('reserved_at', { ascending: false })
        .eq('lp_id', 1);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].lp_id).toBe(1);
    });

    it('should filter reservations by work order ID', async () => {
      const mockReservations = [
        {
          id: 1,
          lp_id: 1,
          wo_id: 1,
          quantity_reserved: 50.0,
          status: 'active'
        }
      ];

      mockSupabase.from().select().order().eq.mockReturnValue({
        data: mockReservations,
        error: null
      });

      const result = await mockSupabase.from('lp_reservations')
        .select('*')
        .order('reserved_at', { ascending: false })
        .eq('wo_id', 1);

      expect(result.data).toHaveLength(1);
      expect(result.data[0].wo_id).toBe(1);
    });

    it('should filter reservations by status', async () => {
      const mockReservations = [
        {
          id: 1,
          lp_id: 1,
          wo_id: 1,
          quantity_reserved: 50.0,
          status: 'active'
        }
      ];

      mockSupabase.from().select().order().eq.mockReturnValue({
        data: mockReservations,
        error: null
      });

      const result = await mockSupabase.from('lp_reservations')
        .select('*')
        .order('reserved_at', { ascending: false })
        .eq('status', 'active');

      expect(result.data).toHaveLength(1);
      expect(result.data[0].status).toBe('active');
    });
  });

  describe('Cancel Reservation', () => {
    it('should cancel active reservation', async () => {
      const mockReservation = {
        id: 1,
        lp_id: 1,
        status: 'active',
        license_plate: {
          lp_number: 'LP-001'
        }
      };

      mockSupabase.from().select().eq().single.mockReturnValue({
        data: mockReservation,
        error: null
      });

      mockSupabase.from().update().eq.mockReturnValue({
        data: null,
        error: null
      });

      const result = await mockSupabase.from('lp_reservations')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      expect(result.error).toBeNull();
    });

    it('should reject cancellation of non-active reservation', async () => {
      const mockReservation = {
        id: 1,
        lp_id: 1,
        status: 'consumed',
        license_plate: {
          lp_number: 'LP-001'
        }
      };

      mockSupabase.from().select().eq().single.mockReturnValue({
        data: mockReservation,
        error: null
      });

      const result = await mockSupabase.from('lp_reservations')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', 1);

      expect(result.error).toBeDefined();
    });

    it('should handle cancellation of non-existent reservation', async () => {
      mockSupabase.from().select().eq().single.mockReturnValue({
        data: null,
        error: new Error('Reservation not found')
      });

      const result = await mockSupabase.from('lp_reservations')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', 999);

      expect(result.error).toBeDefined();
    });
  });

  describe('Available Quantity Calculation', () => {
    it('should calculate available quantity correctly', async () => {
      const mockAvailableQty = 75.0;

      mockSupabase.rpc.mockReturnValue({
        data: mockAvailableQty,
        error: null
      });

      const result = await mockSupabase.rpc('get_available_quantity', { lp_id_param: 1 });

      expect(result.data).toBe(75.0);
    });

    it('should handle LP not found', async () => {
      mockSupabase.rpc.mockReturnValue({
        data: null,
        error: new Error('LP not found')
      });

      const result = await mockSupabase.rpc('get_available_quantity', { lp_id_param: 999 });

      expect(result.error).toBeDefined();
      expect(result.error.message).toBe('LP not found');
    });
  });
});

describe('Reservations API Endpoints', () => {
  describe('POST /api/scanner/reservations', () => {
    it('should create reservation', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/scanner/reservations', {
        method: 'POST',
        body: JSON.stringify({
          lp_id: 1,
          wo_id: 1,
          qty: 50.0,
          operation_id: 1,
          notes: 'Test reservation'
        })
      });

      const mockResponse = {
        success: true,
        reservation: {
          id: 1,
          lp_id: 1,
          lp_number: 'LP-001',
          wo_id: 1,
          quantity_reserved: 50.0,
          status: 'active'
        },
        available_quantity: 50.0
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.reservation.quantity_reserved).toBe(50.0);
    });
  });

  describe('GET /api/scanner/reservations', () => {
    it('should fetch reservations', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/scanner/reservations?lp_id=1&status=active');
      
      const mockResponse = {
        success: true,
        reservations: [
          {
            id: 1,
            lp_id: 1,
            wo_id: 1,
            quantity_reserved: 50.0,
            status: 'active'
          }
        ]
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.reservations).toHaveLength(1);
    });
  });

  describe('DELETE /api/scanner/reservations/:id', () => {
    it('should cancel reservation', async () => {
      const mockRequest = new NextRequest('http://localhost:3000/api/scanner/reservations/1', {
        method: 'DELETE'
      });

      const mockResponse = {
        success: true,
        reservation_id: 1,
        lp_number: 'LP-001',
        message: 'Reservation cancelled successfully'
      };

      expect(mockResponse.success).toBe(true);
      expect(mockResponse.reservation_id).toBe(1);
    });
  });
});

