/**
 * Integration Tests: Warehouse Dashboard Inventory KPIs Endpoint
 * Story: Warehouse Inventory Module
 *
 * GET /api/warehouse/dashboard/inventory-kpis
 * Returns: {total_lps, total_value, expiring_soon, expired}
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../inventory-kpis/route';

const mockOrgId = '123e4567-e89b-12d3-a456-426614174000';
const mockUserId = '223e4567-e89b-12d3-a456-426614174000';

const mockSupabase = {
  auth: {
    getUser: vi.fn(),
  },
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn(() => Promise.resolve({
          data: { org_id: mockOrgId },
          error: null,
        })),
      })),
    })),
  })),
  rpc: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe('GET /api/warehouse/dashboard/inventory-kpis', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default authenticated user
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    });

    // Mock from().select().eq().single() chain
    // Need to return different responses based on which table is being queried
    mockSupabase.from.mockImplementation((table) => {
      if (table === 'warehouse_settings') {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: { expiry_warning_days: 30 },
                error: null,
              }),
            }),
          }),
        };
      }
      // For users table
      return {
        select: () => ({
          eq: () => ({
            single: () => Promise.resolve({
              data: { org_id: mockOrgId },
              error: null,
            }),
          }),
        }),
      };
    });

    // Mock RPC response with array (Supabase RETURNS TABLE returns array)
    mockSupabase.rpc.mockResolvedValue({
      data: [
        {
          total_lps: 100,
          total_value: 50000.00,
          expiring_soon: 5,
          expired: 2,
        },
      ],
      error: null,
    });
  });

  describe('Authentication', () => {
    it('should return 401 for unauthenticated requests', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'No user' },
      });

      const request = new NextRequest('http://localhost/api/warehouse/dashboard/inventory-kpis');
      const response = await GET(request);

      expect(response.status).toBe(401);
      const data = await response.json();
      expect(data.error).toBe('Unauthorized');
    });

    it('should return 404 for user without org profile', async () => {
      // Override the from mock to return null for users table
      mockSupabase.from.mockImplementationOnce(() => {
        return {
          select: () => ({
            eq: () => ({
              single: () => Promise.resolve({
                data: null,
                error: { message: 'No user profile' },
              }),
            }),
          }),
        };
      });

      const request = new NextRequest('http://localhost/api/warehouse/dashboard/inventory-kpis');
      const response = await GET(request);

      expect(response.status).toBe(404);
      const data = await response.json();
      expect(data.error).toBe('User profile not found');
    });
  });

  describe('Response Structure', () => {
    it('should return 200 with KPI numbers', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/inventory-kpis');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      
      expect(data).toHaveProperty('total_lps');
      expect(data).toHaveProperty('total_value');
      expect(data).toHaveProperty('expiring_soon');
      expect(data).toHaveProperty('expired');
    });

    it('should return all KPI fields as numbers', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/inventory-kpis');
      const response = await GET(request);

      const data = await response.json();
      expect(typeof data.total_lps).toBe('number');
      expect(typeof data.total_value).toBe('number');
      expect(typeof data.expiring_soon).toBe('number');
      expect(typeof data.expired).toBe('number');
    });

    it('should handle RPC array response correctly', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/inventory-kpis');
      const response = await GET(request);

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Values should be extracted from array[0]
      expect(data.total_lps).toBe(100);
      expect(data.total_value).toBe(50000);
      expect(data.expiring_soon).toBe(5);
      expect(data.expired).toBe(2);
    });

    it('should return defaults for empty RPC response', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const request = new NextRequest('http://localhost/api/warehouse/dashboard/inventory-kpis');
      const response = await GET(request);

      const data = await response.json();
      expect(data.total_lps).toBe(0);
      expect(data.total_value).toBe(0);
      expect(data.expiring_soon).toBe(0);
      expect(data.expired).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should return 500 on RPC error', async () => {
      mockSupabase.rpc.mockResolvedValueOnce({
        data: null,
        error: { message: 'RPC failed' },
      });

      const request = new NextRequest('http://localhost/api/warehouse/dashboard/inventory-kpis');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Failed to fetch inventory KPIs');
    });

    it('should handle unexpected errors', async () => {
      mockSupabase.auth.getUser.mockRejectedValueOnce(new Error('Database error'));

      const request = new NextRequest('http://localhost/api/warehouse/dashboard/inventory-kpis');
      const response = await GET(request);

      expect(response.status).toBe(500);
      const data = await response.json();
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('Cache Headers', () => {
    it('should set appropriate cache headers', async () => {
      const request = new NextRequest('http://localhost/api/warehouse/dashboard/inventory-kpis');
      const response = await GET(request);

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toContain('s-maxage=60');
    });
  });
});
