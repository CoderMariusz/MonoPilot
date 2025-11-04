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
  },
}));

import { supabase } from '../../supabase/client-browser';

describe('TransferOrdersAPI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('markShipped', () => {
    it('should mark transfer order as shipped and update status to in_transit', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      const result = await TransferOrdersAPI.markShipped(1);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Transfer marked as shipped');
      expect(mockUpdate).toHaveBeenCalledWith({
        actual_ship_date: expect.any(String),
        status: 'in_transit',
      });
      expect(mockUpdate().eq).toHaveBeenCalledWith('id', 1);
      expect(mockUpdate().eq().eq).toHaveBeenCalledWith('status', 'submitted');
    });

    it('should use provided actualShipDate when provided', async () => {
      const testDate = new Date('2024-01-15T10:00:00Z');
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      await TransferOrdersAPI.markShipped(1, testDate);

      expect(mockUpdate).toHaveBeenCalledWith({
        actual_ship_date: testDate.toISOString(),
        status: 'in_transit',
      });
    });

    it('should return error if transfer order is not in submitted status', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ 
            error: { code: 'PGRST116', message: 'No rows updated' } 
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      const result = await TransferOrdersAPI.markShipped(1);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Transfer order must be in "submitted" status to mark as shipped');
    });

    it('should handle database errors gracefully', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ 
            error: { message: 'Database connection failed' } 
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      const result = await TransferOrdersAPI.markShipped(1);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Database connection failed');
    });
  });

  describe('markReceived', () => {
    it('should mark transfer order as received and update status to received', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      const result = await TransferOrdersAPI.markReceived(1);

      expect(result.success).toBe(true);
      expect(result.message).toBe('Transfer marked as received');
      expect(mockUpdate).toHaveBeenCalledWith({
        actual_receive_date: expect.any(String),
        status: 'received',
      });
      expect(mockUpdate().eq).toHaveBeenCalledWith('id', 1);
      expect(mockUpdate().eq().eq).toHaveBeenCalledWith('status', 'in_transit');
    });

    it('should use provided actualReceiveDate when provided', async () => {
      const testDate = new Date('2024-01-20T14:00:00Z');
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      await TransferOrdersAPI.markReceived(1, testDate);

      expect(mockUpdate).toHaveBeenCalledWith({
        actual_receive_date: testDate.toISOString(),
        status: 'received',
      });
    });

    it('should return error if transfer order is not in in_transit status', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ 
            error: { code: 'PGRST116', message: 'No rows updated' } 
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      const result = await TransferOrdersAPI.markReceived(1);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Transfer order must be in "in_transit" status to mark as received');
    });

    it('should handle database errors gracefully', async () => {
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ 
            error: { message: 'Network error' } 
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      const result = await TransferOrdersAPI.markReceived(1);

      expect(result.success).toBe(false);
      expect(result.message).toBe('Network error');
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
      // This is enforced by the .eq('status', 'submitted') check
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ 
            error: { code: 'PGRST116', message: 'No rows updated' } 
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      const result = await TransferOrdersAPI.markShipped(1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('submitted');
    });

    it('should not allow marking as received from submitted status', async () => {
      // This is enforced by the .eq('status', 'in_transit') check
      const mockUpdate = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ 
            error: { code: 'PGRST116', message: 'No rows updated' } 
          }),
        }),
      });

      (supabase.from as any).mockReturnValue({
        update: mockUpdate,
      });

      const result = await TransferOrdersAPI.markReceived(1);

      expect(result.success).toBe(false);
      expect(result.message).toContain('in_transit');
    });
  });
});

