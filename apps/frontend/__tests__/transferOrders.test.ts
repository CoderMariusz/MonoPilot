import { TransferOrdersAPI, type MarkReceivedLineUpdate } from '@/lib/api/transferOrders';
import { supabase } from '@/lib/supabase/client-browser';

// Mock Supabase client
jest.mock('@/lib/supabase/client-browser', () => ({
  supabase: {
    rpc: jest.fn(),
    auth: {
      getUser: jest.fn()
    }
  }
}));

describe('TransferOrdersAPI - Ship/Receive', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('markShipped', () => {
    test('should mark TO as shipped when status is submitted', async () => {
      // Arrange
      const toId = 1;
      const shipDate = '2025-11-10T10:00:00Z';
      const mockUser = { id: 'user-123' };
      const mockResponse = { 
        id: 1, 
        status: 'in_transit', 
        actual_ship_date: shipDate 
      };
      
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: mockResponse, error: null });

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

    test('should throw error when user is not authenticated', async () => {
      // Arrange
      const toId = 1;
      const shipDate = '2025-11-10T10:00:00Z';
      
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } });

      // Act & Assert
      await expect(TransferOrdersAPI.markShipped(toId, shipDate)).rejects.toThrow('User not authenticated');
    });

    test('should throw error when status is not submitted', async () => {
      // Arrange
      const toId = 1;
      const shipDate = '2025-11-10T10:00:00Z';
      const mockUser = { id: 'user-123' };
      const mockError = new Error('Can only mark as shipped from submitted status');
      
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: mockError });

      // Act & Assert
      await expect(TransferOrdersAPI.markShipped(toId, shipDate)).rejects.toThrow();
    });

    test('should throw error when no data is returned', async () => {
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
    test('should mark TO as received with line updates', async () => {
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
      
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: mockResponse, error: null });

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

    test('should throw error when user is not authenticated', async () => {
      // Arrange
      const toId = 1;
      const receiveDate = '2025-11-12T14:00:00Z';
      const lineUpdates: MarkReceivedLineUpdate[] = [];
      
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: null } });

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
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: null, error: mockError });

      // Act & Assert
      await expect(TransferOrdersAPI.markReceived(toId, receiveDate, lineUpdates)).rejects.toThrow();
    });

    test('should handle line updates with optional fields', async () => {
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
      
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({ data: { user: mockUser } });
      (supabase.rpc as jest.Mock).mockResolvedValue({ data: mockResponse, error: null });

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
    test('should pass when receive date >= ship date', () => {
      expect(() => {
        TransferOrdersAPI.validateDateOrder('2025-11-10', '2025-11-12');
      }).not.toThrow();
    });

    test('should pass when receive date equals ship date', () => {
      expect(() => {
        TransferOrdersAPI.validateDateOrder('2025-11-10', '2025-11-10');
      }).not.toThrow();
    });

    test('should throw error when receive date < ship date', () => {
      expect(() => {
        TransferOrdersAPI.validateDateOrder('2025-11-10', '2025-11-08');
      }).toThrow('Planned receive date must be >= planned ship date');
    });

    test('should pass when only ship date is provided', () => {
      expect(() => {
        TransferOrdersAPI.validateDateOrder('2025-11-10', undefined);
      }).not.toThrow();
    });

    test('should pass when only receive date is provided', () => {
      expect(() => {
        TransferOrdersAPI.validateDateOrder(undefined, '2025-11-12');
      }).not.toThrow();
    });

    test('should pass when both dates are missing', () => {
      expect(() => {
        TransferOrdersAPI.validateDateOrder(undefined, undefined);
      }).not.toThrow();
    });

    test('should handle different date formats', () => {
      expect(() => {
        TransferOrdersAPI.validateDateOrder('2025-11-10T08:00:00Z', '2025-11-12T14:00:00Z');
      }).not.toThrow();
    });

    test('should throw error with ISO timestamps when receive < ship', () => {
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
  
  test.skip('should complete full TO lifecycle: create → submit → ship → receive', async () => {
    // This test is skipped as it requires actual database/API integration
    // In a real test environment:
    // 1. Create TO (draft)
    // 2. Submit TO
    // 3. Mark as Shipped
    // 4. Mark as Received
    // Each step would verify the status transitions and data updates
  });

  test.skip('should respect RLS policies for Warehouse role', async () => {
    // This test is skipped as it requires actual RLS testing
    // In a real test environment, you'd:
    // 1. Mock different user roles
    // 2. Attempt operations as different users
    // 3. Verify that only authorized users can perform ship/receive operations
  });

  test.skip('should validate qty_moved does not exceed qty_planned', async () => {
    // This test is skipped as it requires actual database constraints
    // In a real test environment, you'd:
    // 1. Create a TO with qty_planned = 100
    // 2. Attempt to markReceived with qty_moved = 150
    // 3. Verify that the operation is rejected with an appropriate error
  });
});

