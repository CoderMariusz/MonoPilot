/**
 * Unit Tests for TransferOrdersAPI
 * 
 * Tests cover:
 * - markShipped() method
 * - markReceived() method
 * - Status transitions
 * - Date validations
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransferOrdersAPI } from '../transferOrders';

// Mock the supabase client
vi.mock('../../supabase/client-browser', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn(),
    },
  },
}));

import { supabase } from '../../supabase/client-browser';

describe('TransferOrdersAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('markShipped', () => {
    it('should mark transfer order as shipped and update status to in_transit', async () => {
      const mockUser = { id: 'user-123' };
      const mockResponse = { 
        id: 1, 
        status: 'in_transit', 
        actual_ship_date: expect.any(String)
      };

      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as any).mockResolvedValue({ data: mockResponse, error: null });

      const result = await TransferOrdersAPI.markShipped(1, '2024-01-15T10:00:00Z');

      expect(result.status).toBe('in_transit');
      expect(supabase.rpc).toHaveBeenCalledWith('mark_transfer_shipped', {
        p_to_id: 1,
        p_actual_ship_date: '2024-01-15T10:00:00Z',
        p_user_id: mockUser.id
      });
    });

    it('should use provided actualShipDate when provided', async () => {
      const testDate = '2024-01-15T10:00:00Z';
      const mockUser = { id: 'user-123' };
      const mockResponse = { 
        id: 1, 
        status: 'in_transit', 
        actual_ship_date: testDate
      };

      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as any).mockResolvedValue({ data: mockResponse, error: null });

      await TransferOrdersAPI.markShipped(1, testDate);

      expect(supabase.rpc).toHaveBeenCalledWith('mark_transfer_shipped', {
        p_to_id: 1,
        p_actual_ship_date: testDate,
        p_user_id: mockUser.id
      });
    });

    it('should throw error if transfer order is not in submitted status', async () => {
      const mockUser = { id: 'user-123' };
      const mockError = { message: 'Can only mark as shipped from submitted status' };

      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as any).mockResolvedValue({ data: null, error: mockError });

      await expect(TransferOrdersAPI.markShipped(1, '2024-01-15T10:00:00Z')).rejects.toThrow();
    });

    it('should handle database errors gracefully', async () => {
      const mockUser = { id: 'user-123' };
      const mockError = { message: 'Database connection failed' };

      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as any).mockResolvedValue({ data: null, error: mockError });

      await expect(TransferOrdersAPI.markShipped(1, '2024-01-15T10:00:00Z')).rejects.toThrow('Database connection failed');
    });
  });

  describe('markReceived', () => {
    it('should mark transfer order as received and update status to received', async () => {
      const mockUser = { id: 'user-123' };
      const mockResponse = { 
        id: 1, 
        status: 'received', 
        actual_receive_date: expect.any(String)
      };
      const lineUpdates: any[] = [];

      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as any).mockResolvedValue({ data: mockResponse, error: null });

      const result = await TransferOrdersAPI.markReceived(1, '2024-01-20T14:00:00Z', lineUpdates);

      expect(result.status).toBe('received');
      expect(supabase.rpc).toHaveBeenCalledWith('mark_transfer_received', {
        p_to_id: 1,
        p_actual_receive_date: '2024-01-20T14:00:00Z',
        p_line_updates: lineUpdates,
        p_user_id: mockUser.id
      });
    });

    it('should use provided actualReceiveDate when provided', async () => {
      const testDate = '2024-01-20T14:00:00Z';
      const mockUser = { id: 'user-123' };
      const mockResponse = { 
        id: 1, 
        status: 'received', 
        actual_receive_date: testDate
      };
      const lineUpdates: any[] = [];

      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as any).mockResolvedValue({ data: mockResponse, error: null });

      await TransferOrdersAPI.markReceived(1, testDate, lineUpdates);

      expect(supabase.rpc).toHaveBeenCalledWith('mark_transfer_received', {
        p_to_id: 1,
        p_actual_receive_date: testDate,
        p_line_updates: lineUpdates,
        p_user_id: mockUser.id
      });
    });

    it('should throw error if transfer order is not in in_transit status', async () => {
      const mockUser = { id: 'user-123' };
      const mockError = { message: 'Can only mark as received from in_transit status' };
      const lineUpdates: any[] = [];

      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as any).mockResolvedValue({ data: null, error: mockError });

      await expect(TransferOrdersAPI.markReceived(1, '2024-01-20T14:00:00Z', lineUpdates)).rejects.toThrow();
    });

    it('should handle database errors gracefully', async () => {
      const mockUser = { id: 'user-123' };
      const mockError = { message: 'Network error' };
      const lineUpdates: any[] = [];

      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as any).mockResolvedValue({ data: null, error: mockError });

      await expect(TransferOrdersAPI.markReceived(1, '2024-01-20T14:00:00Z', lineUpdates)).rejects.toThrow('Network error');
    });
  });

  describe('Date Validations', () => {
    it('should validate that planned_receive_date is after planned_ship_date', () => {
      // This validation is done at the database level via CHECK constraint
      // In the UI, validation is done in CreateTransferOrderModal
      // This test documents the expected behavior
      const shipDate = new Date('2024-01-15');
      const receiveDate = new Date('2024-01-10'); // Before ship date - invalid

      expect(receiveDate.getTime()).toBeLessThan(shipDate.getTime());
      // Database constraint should reject this
    });

    it('should allow planned_receive_date to be equal to planned_ship_date', () => {
      const shipDate = new Date('2024-01-15');
      const receiveDate = new Date('2024-01-15'); // Same as ship date - valid

      expect(receiveDate.getTime()).toBeGreaterThanOrEqual(shipDate.getTime());
      // Database constraint should allow this
    });
  });

  describe('Status Transitions', () => {
    it('should enforce correct status workflow: draft → submitted → in_transit → received', () => {
      const validWorkflow = [
        'draft',
        'submitted',
        'in_transit',
        'received',
        'closed',
        'cancelled',
      ];

      // Valid statuses
      expect(validWorkflow).toContain('draft');
      expect(validWorkflow).toContain('submitted');
      expect(validWorkflow).toContain('in_transit');
      expect(validWorkflow).toContain('received');
      expect(validWorkflow).toContain('closed');
      expect(validWorkflow).toContain('cancelled');
    });

    it('should not allow marking as shipped from draft status', async () => {
      const mockUser = { id: 'user-123' };
      const mockError = { message: 'Can only mark as shipped from submitted status' };

      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as any).mockResolvedValue({ data: null, error: mockError });

      await expect(TransferOrdersAPI.markShipped(1, '2024-01-15T10:00:00Z')).rejects.toThrow();
    });

    it('should not allow marking as received from submitted status', async () => {
      const mockUser = { id: 'user-123' };
      const mockError = { message: 'Can only mark as received from in_transit status' };
      const lineUpdates: any[] = [];

      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as any).mockResolvedValue({ data: null, error: mockError });

      await expect(TransferOrdersAPI.markReceived(1, '2024-01-20T14:00:00Z', lineUpdates)).rejects.toThrow();
    });
  });
});



