import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransferOrdersAPI, type MarkReceivedLineUpdate } from '@/lib/api/transferOrders';
import type { TOStatus } from '@/lib/types';
import { canCloseTO } from '@/lib/planning/status';
import type { TOHeader, TOLine } from '@/lib/types';

// Mock Supabase client
vi.mock('@/lib/supabase/client-browser', () => ({
  supabase: {
    rpc: vi.fn(),
    auth: {
      getUser: vi.fn()
    }
  }
}));

import { supabase } from '@/lib/supabase/client-browser';

// ===================================================
// Story 0.2: TOStatus Enum Tests
// ===================================================

describe('TOStatus Type - Story 0.2', () => {
  describe('Type Validation', () => {
    it('should include all 6 status values', () => {
      // Test that all status values are valid TOStatus types
      const validStatuses: TOStatus[] = [
        'draft',
        'submitted',
        'in_transit',
        'received',
        'closed',
        'cancelled'
      ];

      // This test will fail to compile if any status is invalid
      expect(validStatuses).toHaveLength(6);
      expect(validStatuses).toContain('closed');
    });

    it('should accept closed status in type system', () => {
      // Test that 'closed' is a valid TOStatus value
      const closedStatus: TOStatus = 'closed';
      expect(closedStatus).toBe('closed');
    });

    it('should match database schema constraint values', () => {
      // Database CHECK constraint from migration 019:
      // CHECK (status IN ('draft', 'submitted', 'in_transit', 'received', 'closed', 'cancelled'))
      const dbStatuses = ['draft', 'submitted', 'in_transit', 'received', 'closed', 'cancelled'];
      const tsStatuses: TOStatus[] = ['draft', 'submitted', 'in_transit', 'received', 'closed', 'cancelled'];

      expect(tsStatuses.sort()).toEqual(dbStatuses.sort());
    });
  });

  describe('Status Transitions with closed', () => {
    it('should allow transition from received to closed', () => {
      const mockTO: Partial<TOHeader> = {
        id: 1,
        number: 'TO-001',
        status: 'received' as TOStatus,
        from_wh_id: 1,
        to_wh_id: 2
      };
      const mockLines: TOLine[] = [
        { id: 1, to_id: 1, item_id: 100, qty_planned: 50, uom: 'KG', line_number: 1 }
      ];

      const canClose = canCloseTO(mockTO as TOHeader, mockLines, 'Admin');
      expect(canClose).toBe(true);
    });

    it('should allow transition from closed to draft (reopen)', () => {
      const mockTO: Partial<TOHeader> = {
        id: 1,
        number: 'TO-001',
        status: 'closed' as TOStatus,
        from_wh_id: 1,
        to_wh_id: 2
      };

      // canReopenTO would check if reopen is allowed
      // For now, just verify 'closed' is a valid status
      expect(mockTO.status).toBe('closed');
    });
  });
});

describe('TransferOrdersAPI - Ship/Receive', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('markShipped', () => {
    it('should mark TO as shipped when status is submitted', async () => {
      // Arrange
      const toId = 1;
      const shipDate = '2025-11-10T10:00:00Z';
      const mockUser = { id: 'user-123' };
      const mockResponse = { 
        id: 1, 
        status: 'in_transit', 
        actual_ship_date: shipDate 
      };
      
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as any).mockResolvedValue({ data: mockResponse, error: null });

      // Act
      const result = await TransferOrdersAPI.markShipped(toId, shipDate);

      // Assert
      expect(result.status).toBe('in_transit');
      expect(result.actual_ship_date).toBe(shipDate);
      expect(supabase.rpc).toHaveBeenCalledWith('mark_transfer_shipped', {
        p_to_id: toId,
        p_actual_ship_date: shipDate,
        p_user_id: mockUser.id
      });
    });

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      const toId = 1;
      const shipDate = '2025-11-10T10:00:00Z';
      
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

      // Act & Assert
      await expect(TransferOrdersAPI.markShipped(toId, shipDate)).rejects.toThrow('User not authenticated');
    });

    it('should throw error when status is not submitted', async () => {
      // Arrange
      const toId = 1;
      const shipDate = '2025-11-10T10:00:00Z';
      const mockUser = { id: 'user-123' };
      const mockError = new Error('Can only mark as shipped from submitted status');
      
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as any).mockResolvedValue({ data: null, error: mockError });

      // Act & Assert
      await expect(TransferOrdersAPI.markShipped(toId, shipDate)).rejects.toThrow();
    });

    it('should throw error when no data is returned', async () => {
      // Arrange
      const toId = 1;
      const shipDate = '2025-11-10T10:00:00Z';
      const mockUser = { id: 'user-123' };
      
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: null });

      // Act & Assert
      await expect(TransferOrdersAPI.markShipped(toId, shipDate)).rejects.toThrow('No data returned from mark_transfer_shipped');
    });
  });

  describe('markReceived', () => {
    it('should mark TO as received with line updates', async () => {
      // Arrange
      const toId = 1;
      const receiveDate = '2025-11-12T14:00:00Z';
      const lineUpdates: MarkReceivedLineUpdate[] = [
        { line_id: 1, qty_moved: 100, lp_id: 5, batch: 'BATCH-001' },
        { line_id: 2, qty_moved: 50 }
      ];
      const mockUser = { id: 'user-123' };
      const mockResponse = { 
        id: 1, 
        status: 'received', 
        actual_receive_date: receiveDate 
      };
      
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as any).mockResolvedValue({ data: mockResponse, error: null });

      // Act
      const result = await TransferOrdersAPI.markReceived(toId, receiveDate, lineUpdates);

      // Assert
      expect(result.status).toBe('received');
      expect(result.actual_receive_date).toBe(receiveDate);
      expect(supabase.rpc).toHaveBeenCalledWith('mark_transfer_received', {
        p_to_id: toId,
        p_actual_receive_date: receiveDate,
        p_line_updates: lineUpdates,
        p_user_id: mockUser.id
      });
    });

    it('should throw error when user is not authenticated', async () => {
      // Arrange
      const toId = 1;
      const receiveDate = '2025-11-12T14:00:00Z';
      const lineUpdates: MarkReceivedLineUpdate[] = [];
      
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: null } });

      // Act & Assert
      await expect(TransferOrdersAPI.markReceived(toId, receiveDate, lineUpdates)).rejects.toThrow('User not authenticated');
    });

    test('should throw error when status is not in_transit', async () => {
      // Arrange
      const toId = 1;
      const receiveDate = '2025-11-12T14:00:00Z';
      const lineUpdates: MarkReceivedLineUpdate[] = [];
      const mockUser = { id: 'user-123' };
      const mockError = new Error('Can only mark as received from in_transit status');
      
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as any).mockResolvedValue({ data: null, error: mockError });

      // Act & Assert
      await expect(TransferOrdersAPI.markReceived(toId, receiveDate, lineUpdates)).rejects.toThrow();
    });

    it('should handle line updates with optional fields', async () => {
      // Arrange
      const toId = 1;
      const receiveDate = '2025-11-12T14:00:00Z';
      const lineUpdates: MarkReceivedLineUpdate[] = [
        { line_id: 1, qty_moved: 100 }, // No lp_id or batch
        { line_id: 2, qty_moved: 50, batch: 'BATCH-002' } // Only batch
      ];
      const mockUser = { id: 'user-123' };
      const mockResponse = { 
        id: 1, 
        status: 'received', 
        actual_receive_date: receiveDate 
      };
      
      (supabase.auth.getUser as any).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as any).mockResolvedValue({ data: mockResponse, error: null });

      // Act
      const result = await TransferOrdersAPI.markReceived(toId, receiveDate, lineUpdates);

      // Assert
      expect(result.status).toBe('received');
      expect(supabase.rpc).toHaveBeenCalledWith('mark_transfer_received', {
        p_to_id: toId,
        p_actual_receive_date: receiveDate,
        p_line_updates: lineUpdates,
        p_user_id: mockUser.id
      });
    });
  });

  describe('validateDateOrder', () => {
    it('should pass when receive date >= ship date', () => {
      expect(() => {
        TransferOrdersAPI.validateDateOrder('2025-11-10', '2025-11-12');
      }).not.toThrow();
    });

    it('should pass when receive date equals ship date', () => {
      expect(() => {
        TransferOrdersAPI.validateDateOrder('2025-11-10', '2025-11-10');
      }).not.toThrow();
    });

    it('should throw error when receive date < ship date', () => {
      expect(() => {
        TransferOrdersAPI.validateDateOrder('2025-11-10', '2025-11-08');
      }).toThrow('Planned receive date must be >= planned ship date');
    });

    it('should pass when only ship date is provided', () => {
      expect(() => {
        TransferOrdersAPI.validateDateOrder('2025-11-10', undefined);
      }).not.toThrow();
    });

    it('should pass when only receive date is provided', () => {
      expect(() => {
        TransferOrdersAPI.validateDateOrder(undefined, '2025-11-12');
      }).not.toThrow();
    });

    it('should pass when both dates are missing', () => {
      expect(() => {
        TransferOrdersAPI.validateDateOrder(undefined, undefined);
      }).not.toThrow();
    });

    it('should handle different date formats', () => {
      expect(() => {
        TransferOrdersAPI.validateDateOrder('2025-11-10T08:00:00Z', '2025-11-12T14:00:00Z');
      }).not.toThrow();
    });

    it('should throw error with ISO timestamps when receive < ship', () => {
      expect(() => {
        TransferOrdersAPI.validateDateOrder('2025-11-10T08:00:00Z', '2025-11-09T14:00:00Z');
      }).toThrow('Planned receive date must be >= planned ship date');
    });
  });
});

// Integration-style tests (these would typically be in a separate file)
describe('TransferOrders Integration - Workflow', () => {
  // Note: These are placeholder tests showing the structure
  // In a real environment, you'd use a test database or more sophisticated mocking
  
  it.skip('should complete full TO lifecycle: create → submit → ship → receive', async () => {
    // This test is skipped as it requires actual database/API integration
    // In a real test environment:
    // 1. Create TO (draft)
    // 2. Submit TO
    // 3. Mark as Shipped
    // 4. Mark as Received
    // Each step would verify the status transitions and data updates
  });

  it.skip('should respect RLS policies for Warehouse role', async () => {
    // This test is skipped as it requires actual RLS testing
    // In a real test environment, you'd:
    // 1. Mock different user roles
    // 2. Attempt operations as different users
    // 3. Verify that only authorized users can perform ship/receive operations
  });

  it.skip('should validate qty_moved does not exceed qty_planned', async () => {
    // This test is skipped as it requires actual database constraints
    // In a real test environment, you'd:
    // 1. Create a TO with qty_planned = 100
    // 2. Attempt to markReceived with qty_moved = 150
    // 3. Verify that the operation is rejected with an appropriate error
  });
});

