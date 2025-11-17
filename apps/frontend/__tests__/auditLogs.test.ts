import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock Supabase client before importing AuditLogsAPI
vi.mock('../lib/supabase/client-browser', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          ilike: vi.fn(() => ({
            gte: vi.fn(() => ({
              lte: vi.fn(() => ({
                order: vi.fn(() => ({
                  range: vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 })),
                })),
              })),
            })),
          })),
        })),
      })),
    })),
    rpc: vi.fn(),
  },
}));

import { AuditLogsAPI, type AuditLogFilters, type PaginationParams } from '../lib/api/audit';
import { supabase } from '../lib/supabase/client-browser';

const mockFrom = supabase.from as any;
const mockRpc = supabase.rpc as any;

/**
 * Unit tests for Audit Logs API
 * Tests FDA 21 CFR Part 11 compliant audit trail functionality
 *
 * Story 1.1: Enable pgAudit Extension
 *
 * Test Coverage:
 * - getAll() with filtering and pagination
 * - getEntityAuditTrail() for specific entity history
 * - getStats() for performance monitoring
 * - exportToCSV() for regulatory compliance exports
 */

describe('AuditLogsAPI', () => {
  describe('getAll', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    afterEach(() => {
      vi.clearAllMocks();
    });

    it('should fetch audit logs with default pagination', async () => {
      // Arrange
      const mockLogs = [
        {
          id: 1,
          source: 'app',
          object_name: 'work_orders',
          command: 'INSERT',
          user_id: 'user-123',
          user_email: 'test@example.com',
          timestamp: '2025-11-16T10:00:00Z',
          before_data: null,
          after_data: { status: 'planned' },
        },
        {
          id: 2,
          source: 'db',
          object_name: 'products',
          command: 'UPDATE',
          user_id: 'user-456',
          user_email: 'admin@example.com',
          timestamp: '2025-11-16T11:00:00Z',
          statement: 'UPDATE products SET name = ...',
        },
      ];

      // Create mock query chain
      const mockRange = vi.fn(() => Promise.resolve({ data: mockLogs, error: null, count: 2 }));
      const mockOrder = vi.fn(() => ({ range: mockRange }));
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(function() { return this; }),
        ilike: vi.fn(function() { return this; }),
        gte: vi.fn(function() { return this; }),
        lte: vi.fn(function() { return this; }),
        order: mockOrder,
      }));

      mockFrom.mockReturnValue({ select: mockSelect });

      // Act
      const result = await AuditLogsAPI.getAll();

      // Assert
      expect(mockFrom).toHaveBeenCalledWith('audit_log_view');
      expect(mockSelect).toHaveBeenCalledWith('*', { count: 'exact' });
      expect(mockOrder).toHaveBeenCalledWith('timestamp', { ascending: false });
      expect(mockRange).toHaveBeenCalledWith(0, 99); // Default limit 100, offset 0
      expect(result.data).toEqual(mockLogs);
      expect(result.total).toBe(2);
      expect(result.limit).toBe(100);
      expect(result.offset).toBe(0);
    });

    it('should apply source filter correctly', async () => {
      // Arrange
      const mockEq = vi.fn(function() { return this; });
      const mockRange = vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }));
      const mockOrder = vi.fn(() => ({ range: mockRange }));
      const mockSelect = vi.fn(() => ({
        eq: mockEq,
        ilike: vi.fn(function() { return this; }),
        gte: vi.fn(function() { return this; }),
        lte: vi.fn(function() { return this; }),
        order: mockOrder,
      }));

      mockFrom.mockReturnValue({ select: mockSelect });

      const filters: AuditLogFilters = { source: 'app' };

      // Act
      await AuditLogsAPI.getAll(filters);

      // Assert
      expect(mockEq).toHaveBeenCalledWith('source', 'app');
    });

    it('should apply user filter with ILIKE', async () => {
      // Arrange
      const mockIlike = vi.fn(function() { return this; });
      const mockRange = vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }));
      const mockOrder = vi.fn(() => ({ range: mockRange }));
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(function() { return this; }),
        ilike: mockIlike,
        gte: vi.fn(function() { return this; }),
        lte: vi.fn(function() { return this; }),
        order: mockOrder,
      }));

      mockFrom.mockReturnValue({ select: mockSelect });

      const filters: AuditLogFilters = { user: 'admin' };

      // Act
      await AuditLogsAPI.getAll(filters);

      // Assert
      expect(mockIlike).toHaveBeenCalledWith('user_email', '%admin%');
    });

    it('should apply date range filter', async () => {
      // Arrange
      const mockGte = vi.fn(function() { return this; });
      const mockLte = vi.fn(function() { return this; });
      const mockRange = vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }));
      const mockOrder = vi.fn(() => ({ range: mockRange }));
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(function() { return this; }),
        ilike: vi.fn(function() { return this; }),
        gte: mockGte,
        lte: mockLte,
        order: mockOrder,
      }));

      mockFrom.mockReturnValue({ select: mockSelect });

      const fromDate = new Date('2025-11-01T00:00:00Z');
      const toDate = new Date('2025-11-16T23:59:59Z');
      const filters: AuditLogFilters = { dateRange: [fromDate, toDate] };

      // Act
      await AuditLogsAPI.getAll(filters);

      // Assert
      expect(mockGte).toHaveBeenCalledWith('timestamp', fromDate.toISOString());
      expect(mockLte).toHaveBeenCalledWith('timestamp', toDate.toISOString());
    });

    it('should apply table filter with ILIKE', async () => {
      // Arrange
      const mockIlike = vi.fn(function() { return this; });
      const mockRange = vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }));
      const mockOrder = vi.fn(() => ({ range: mockRange }));
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(function() { return this; }),
        ilike: mockIlike,
        gte: vi.fn(function() { return this; }),
        lte: vi.fn(function() { return this; }),
        order: mockOrder,
      }));

      mockFrom.mockReturnValue({ select: mockSelect });

      const filters: AuditLogFilters = { table: 'products' };

      // Act
      await AuditLogsAPI.getAll(filters);

      // Assert
      expect(mockIlike).toHaveBeenCalledWith('object_name', '%products%');
    });

    it('should apply operation filter with ILIKE', async () => {
      // Arrange
      const mockIlike = vi.fn(function() { return this; });
      const mockRange = vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }));
      const mockOrder = vi.fn(() => ({ range: mockRange }));
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(function() { return this; }),
        ilike: mockIlike,
        gte: vi.fn(function() { return this; }),
        lte: vi.fn(function() { return this; }),
        order: mockOrder,
      }));

      mockFrom.mockReturnValue({ select: mockSelect });

      const filters: AuditLogFilters = { operation: 'UPDATE' };

      // Act
      await AuditLogsAPI.getAll(filters);

      // Assert
      expect(mockIlike).toHaveBeenCalledWith('command', '%UPDATE%');
    });

    it('should apply custom pagination parameters', async () => {
      // Arrange
      const mockRange = vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }));
      const mockOrder = vi.fn(() => ({ range: mockRange }));
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(function() { return this; }),
        ilike: vi.fn(function() { return this; }),
        gte: vi.fn(function() { return this; }),
        lte: vi.fn(function() { return this; }),
        order: mockOrder,
      }));

      mockFrom.mockReturnValue({ select: mockSelect });

      const pagination: PaginationParams = { limit: 50, offset: 100 };

      // Act
      const result = await AuditLogsAPI.getAll(undefined, pagination);

      // Assert
      expect(mockRange).toHaveBeenCalledWith(100, 149); // offset 100, limit 50 → range(100, 149)
      expect(result.limit).toBe(50);
      expect(result.offset).toBe(100);
    });

    it('should cap limit at 1000 (max allowed)', async () => {
      // Arrange
      const mockRange = vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }));
      const mockOrder = vi.fn(() => ({ range: mockRange }));
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(function() { return this; }),
        ilike: vi.fn(function() { return this; }),
        gte: vi.fn(function() { return this; }),
        lte: vi.fn(function() { return this; }),
        order: mockOrder,
      }));

      mockFrom.mockReturnValue({ select: mockSelect });

      const pagination: PaginationParams = { limit: 5000, offset: 0 };

      // Act
      const result = await AuditLogsAPI.getAll(undefined, pagination);

      // Assert
      expect(mockRange).toHaveBeenCalledWith(0, 999); // Capped at 1000
      expect(result.limit).toBe(1000);
    });

    it('should throw error when Supabase query fails', async () => {
      // Arrange
      const mockError = { message: 'Database connection failed' };
      const mockRange = vi.fn(() => Promise.resolve({ data: null, error: mockError, count: 0 }));
      const mockOrder = vi.fn(() => ({ range: mockRange }));
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(function() { return this; }),
        ilike: vi.fn(function() { return this; }),
        gte: vi.fn(function() { return this; }),
        lte: vi.fn(function() { return this; }),
        order: mockOrder,
      }));

      mockFrom.mockReturnValue({ select: mockSelect });

      // Act & Assert
      await expect(AuditLogsAPI.getAll()).rejects.toThrow('Failed to fetch audit logs: Database connection failed');
    });
  });

  describe('getEntityAuditTrail', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should call RPC with entity name and ID', async () => {
      // Arrange
      const mockTrail = [
        {
          source: 'app',
          event_timestamp: '2025-11-16T10:00:00Z',
          user_email: 'test@example.com',
          command: 'INSERT',
          before_data: null,
          after_data: { status: 'planned' },
          statement: null,
        },
      ];

      mockRpc.mockResolvedValue({ data: mockTrail, error: null });

      // Act
      const result = await AuditLogsAPI.getEntityAuditTrail('work_orders', 123);

      // Assert
      expect(mockRpc).toHaveBeenCalledWith('get_entity_audit_trail', {
        p_entity_name: 'work_orders',
        p_entity_id: 123,
      });
      expect(result).toEqual(mockTrail);
    });

    it('should return empty array when no audit trail found', async () => {
      // Arrange
      mockRpc.mockResolvedValue({ data: null, error: null });

      // Act
      const result = await AuditLogsAPI.getEntityAuditTrail('products', 456);

      // Assert
      expect(result).toEqual([]);
    });

    it('should throw error when RPC fails', async () => {
      // Arrange
      const mockError = { message: 'RPC execution failed' };
      mockRpc.mockResolvedValue({ data: null, error: mockError });

      // Act & Assert
      await expect(AuditLogsAPI.getEntityAuditTrail('products', 789))
        .rejects
        .toThrow('Failed to fetch audit trail for products:789: RPC execution failed');
    });
  });

  describe('getStats', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should fetch pgAudit statistics', async () => {
      // Arrange
      const mockStats = [
        {
          total_logs: 1500,
          logs_last_24h: 120,
          logs_last_7d: 850,
          oldest_log: '2025-10-01T00:00:00Z',
          newest_log: '2025-11-16T12:00:00Z',
          avg_logs_per_day: 32.5,
        },
      ];

      mockRpc.mockResolvedValue({ data: mockStats, error: null });

      // Act
      const result = await AuditLogsAPI.getStats();

      // Assert
      expect(mockRpc).toHaveBeenCalledWith('get_pgaudit_stats');
      expect(result).toEqual(mockStats[0]);
    });

    it('should return default values when no stats found', async () => {
      // Arrange
      mockRpc.mockResolvedValue({ data: null, error: null });

      // Act
      const result = await AuditLogsAPI.getStats();

      // Assert
      expect(result).toEqual({
        total_logs: 0,
        logs_last_24h: 0,
        logs_last_7d: 0,
        oldest_log: null,
        newest_log: null,
        avg_logs_per_day: 0,
      });
    });

    it('should throw error when RPC fails', async () => {
      // Arrange
      const mockError = { message: 'Stats query failed' };
      mockRpc.mockResolvedValue({ data: null, error: mockError });

      // Act & Assert
      await expect(AuditLogsAPI.getStats())
        .rejects
        .toThrow('Failed to fetch audit stats: Stats query failed');
    });
  });

  describe('exportToCSV', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should export audit logs to CSV format', async () => {
      // Arrange
      const mockLogs = [
        {
          id: 1,
          source: 'app',
          object_name: 'work_orders',
          command: 'INSERT',
          user_id: 'user-123',
          user_email: 'test@example.com',
          timestamp: '2025-11-16T10:00:00Z',
          before_data: null,
          after_data: { status: 'planned' },
          statement: null,
        },
      ];

      let callCount = 0;
      const mockRange = vi.fn(() => {
        callCount++;
        // First call (count check) returns count: 1
        // Second call (data fetch) returns actual data
        if (callCount === 1) {
          return Promise.resolve({ data: mockLogs, error: null, count: 1 });
        } else {
          return Promise.resolve({ data: mockLogs, error: null, count: 1 });
        }
      });
      const mockOrder = vi.fn(() => ({ range: mockRange }));
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(function() { return this; }),
        ilike: vi.fn(function() { return this; }),
        gte: vi.fn(function() { return this; }),
        lte: vi.fn(function() { return this; }),
        order: mockOrder,
      }));

      mockFrom.mockReturnValue({ select: mockSelect });

      // Act
      const result = await AuditLogsAPI.exportToCSV();

      // Assert
      expect(mockRange).toHaveBeenCalledTimes(2); // Count check + data fetch
      expect(mockRange).toHaveBeenNthCalledWith(1, 0, 0); // First call: limit 1, offset 0 → range(0, 0)
      expect(mockRange).toHaveBeenNthCalledWith(2, 0, 999); // Second call: limit 5000 capped at 1000 → range(0, 999)
      expect(result).toContain('Timestamp,Source,User Email');
      expect(result).toContain('2025-11-16T10:00:00Z');
      expect(result).toContain('app');
      expect(result).toContain('test@example.com');
      expect(result).toContain('work_orders');
      expect(result).toContain('INSERT');
    });

    it('should return message when no logs found', async () => {
      // Arrange
      const mockRange = vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }));
      const mockOrder = vi.fn(() => ({ range: mockRange }));
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(function() { return this; }),
        ilike: vi.fn(function() { return this; }),
        gte: vi.fn(function() { return this; }),
        lte: vi.fn(function() { return this; }),
        order: mockOrder,
      }));

      mockFrom.mockReturnValue({ select: mockSelect });

      // Act
      const result = await AuditLogsAPI.exportToCSV();

      // Assert
      expect(result).toBe('No audit logs found for the specified filters.');
    });

    it('should apply filters when exporting', async () => {
      // Arrange
      const mockEq = vi.fn(function() { return this; });
      const mockRange = vi.fn(() => Promise.resolve({ data: [], error: null, count: 0 }));
      const mockOrder = vi.fn(() => ({ range: mockRange }));
      const mockSelect = vi.fn(() => ({
        eq: mockEq,
        ilike: vi.fn(function() { return this; }),
        gte: vi.fn(function() { return this; }),
        lte: vi.fn(function() { return this; }),
        order: mockOrder,
      }));

      mockFrom.mockReturnValue({ select: mockSelect });

      const filters: AuditLogFilters = { source: 'db' };

      // Act
      await AuditLogsAPI.exportToCSV(filters);

      // Assert
      expect(mockEq).toHaveBeenCalledWith('source', 'db');
    });

    it('should throw error when export limit exceeded (>5000 records)', async () => {
      // Arrange
      const mockRange = vi.fn(() => Promise.resolve({ data: [], error: null, count: 6000 }));
      const mockOrder = vi.fn(() => ({ range: mockRange }));
      const mockSelect = vi.fn(() => ({
        eq: vi.fn(function() { return this; }),
        ilike: vi.fn(function() { return this; }),
        gte: vi.fn(function() { return this; }),
        lte: vi.fn(function() { return this; }),
        order: mockOrder,
      }));

      mockFrom.mockReturnValue({ select: mockSelect });

      // Act & Assert
      await expect(AuditLogsAPI.exportToCSV())
        .rejects
        .toThrow('Export limit exceeded: 6000 records found, but maximum allowed is 5000');
    });
  });
});
