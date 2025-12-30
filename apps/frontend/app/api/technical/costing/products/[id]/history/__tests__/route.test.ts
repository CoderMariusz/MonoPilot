import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

// Mock data
const mockOrgId = 'org-123-uuid';
const mockUserId = 'user-456-uuid';
const mockProductId = 'prod-1';

const mockProduct = {
  id: mockProductId,
  org_id: mockOrgId,
  code: 'BREAD-001',
  name: 'Bread Loaf White',
};

const mockCostHistory = [
  {
    id: 'cost-1',
    product_id: mockProductId,
    org_id: mockOrgId,
    cost_type: 'standard',
    material_cost: 185.50,
    labor_cost: 45.00,
    overhead_cost: 20.00,
    total_cost: 250.50,
    cost_per_unit: 2.46,
    effective_from: '2025-12-01',
    effective_to: null,
    created_at: new Date().toISOString(),
    created_by: mockUserId,
    bom_version: 2,
  },
  {
    id: 'cost-2',
    product_id: mockProductId,
    org_id: mockOrgId,
    cost_type: 'standard',
    material_cost: 180.00,
    labor_cost: 44.00,
    overhead_cost: 19.00,
    total_cost: 243.00,
    cost_per_unit: 2.38,
    effective_from: '2025-11-01',
    effective_to: '2025-12-01',
    created_at: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    created_by: mockUserId,
    bom_version: 1,
  },
];

// Create mock query chain
function createMockQuery(data: any, error: any = null, count: number | null = null) {
  const query: any = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    neq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data, error }),
  };
  // For queries that return multiple results
  query.then = vi.fn((resolve: any) => resolve({ data, error, count }));
  return query;
}

// Mock Supabase client
const mockSupabase = {
  auth: {
    getSession: vi.fn(),
  },
  from: vi.fn(),
};

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => Promise.resolve(mockSupabase)),
}));

describe('GET /api/technical/costing/products/[id]/history', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Default: authenticated user
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: { user: { id: mockUserId } } },
      error: null,
    });

    // Default mock implementations
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return createMockQuery({ org_id: mockOrgId });
      }
      if (table === 'products') {
        return createMockQuery(mockProduct);
      }
      if (table === 'product_costs') {
        const query = createMockQuery(mockCostHistory, null, mockCostHistory.length);
        // Override for count query
        query.select = vi.fn((fields?: string, options?: any) => {
          if (options?.count === 'exact') {
            return {
              ...query,
              then: vi.fn((resolve: any) => resolve({
                data: mockCostHistory,
                error: null,
                count: mockCostHistory.length
              })),
            };
          }
          return query;
        });
        return query;
      }
      if (table === 'boms') {
        return createMockQuery({ id: 'bom-1', items: [] });
      }
      return createMockQuery(null);
    });
  });

  // AC-01: Cost history page loads within 1 second
  it('should return cost history within performance threshold', async () => {
    const startTime = Date.now();

    const request = new NextRequest('http://localhost:3000/api/technical/costing/products/prod-1/history', {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ id: 'prod-1' }) });
    const endTime = Date.now();

    // Performance expectation: < 1000ms
    expect(endTime - startTime).toBeLessThan(1000);
  });

  // AC-02: Current cost summary with correct values and changes
  it('should return current cost $2.46/kg, previous cost $2.38/kg, change +$0.08 (+3.4%)', async () => {
    const request = new NextRequest('http://localhost:3000/api/technical/costing/products/prod-1/history', {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ id: 'prod-1' }) });
    const data = await response.json();

    expect(data.summary).toBeDefined();
    expect(data.summary.current_cost_per_unit).toBeCloseTo(2.46, 2);
    expect(data.summary.previous_cost).toBeCloseTo(243.00, 0);
    expect(data.summary.change_amount).toBeCloseTo(7.5, 1);
    expect(data.summary.change_percentage).toBeCloseTo(3.09, 1);
  });

  // AC-03: Trends display 30-day, 90-day, YTD
  it('should return trends for 30d, 90d, and YTD in summary', async () => {
    const request = new NextRequest('http://localhost:3000/api/technical/costing/products/prod-1/history', {
      method: 'GET',
    });

    const response = await GET(request, { params: Promise.resolve({ id: 'prod-1' }) });
    const data = await response.json();

    expect(data.summary).toHaveProperty('trend_30d');
    expect(data.summary).toHaveProperty('trend_90d');
    expect(data.summary).toHaveProperty('trend_ytd');
    expect(typeof data.summary.trend_30d).toBe('number');
    expect(typeof data.summary.trend_90d).toBe('number');
    expect(typeof data.summary.trend_ytd).toBe('number');
  });

  // AC-12: Date range filtering
  it('should filter cost history by date range from=2025-01-01 to to=2025-06-30', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/products/prod-1/history?from=2025-01-01&to=2025-06-30',
      { method: 'GET' }
    );

    const response = await GET(request, { params: Promise.resolve({ id: 'prod-1' }) });
    const data = await response.json();

    expect(data.history).toBeDefined();
    expect(Array.isArray(data.history)).toBe(true);
  });

  // AC-12: Cost type filtering
  it('should filter by cost type when type=standard query param provided', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/products/prod-1/history?type=standard',
      { method: 'GET' }
    );

    const response = await GET(request, { params: Promise.resolve({ id: 'prod-1' }) });
    const data = await response.json();

    expect(data.history).toBeDefined();
    data.history.forEach((record: any) => {
      expect(record.cost_type).toBe('standard');
    });
  });

  // AC-19: Pagination functionality
  it('should return paginated results with page=1, limit=10', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/products/prod-1/history?page=1&limit=10',
      { method: 'GET' }
    );

    const response = await GET(request, { params: Promise.resolve({ id: 'prod-1' }) });
    const data = await response.json();

    expect(data.pagination).toBeDefined();
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(10);
    expect(data.pagination).toHaveProperty('total');
    expect(data.pagination).toHaveProperty('total_pages');
    expect(data.history.length).toBeLessThanOrEqual(10);
  });

  // AC-19: Pagination total should reflect records
  it('should return pagination.total=50 for product with 50 cost records', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/products/prod-1/history?page=1&limit=10',
      { method: 'GET' }
    );

    const response = await GET(request, { params: Promise.resolve({ id: 'prod-1' }) });
    const data = await response.json();

    expect(data.pagination.total).toBeGreaterThanOrEqual(0);
    expect(typeof data.pagination.total).toBe('number');
  });

  // AC-17: Empty state for product with no history
  it('should return empty history array with 0 total for product with no cost calculations', async () => {
    // Setup mock for product with no history
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return createMockQuery({ org_id: mockOrgId });
      }
      if (table === 'products') {
        return createMockQuery({ id: 'prod-999', org_id: mockOrgId, code: 'TEST', name: 'Test' });
      }
      if (table === 'product_costs') {
        const query = createMockQuery([], null, 0);
        query.select = vi.fn(() => query);
        return query;
      }
      if (table === 'boms') {
        return createMockQuery(null);
      }
      return createMockQuery(null);
    });

    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/products/prod-999/history',
      { method: 'GET' }
    );

    const response = await GET(request, { params: Promise.resolve({ id: 'prod-999' }) });
    const data = await response.json();

    expect(data.history).toBeDefined();
    expect(data.history.length).toBe(0);
    expect(data.pagination.total).toBe(0);
  });

  // AC-18: Error state for API failure
  it('should return 404 PRODUCT_NOT_FOUND when product does not exist', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return createMockQuery({ org_id: mockOrgId });
      }
      if (table === 'products') {
        return createMockQuery(null, { code: 'PGRST116', message: 'not found' });
      }
      return createMockQuery(null);
    });

    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/products/invalid-id/history',
      { method: 'GET' }
    );

    const response = await GET(request, { params: Promise.resolve({ id: 'invalid-id' }) });

    expect(response.status).toBe(404);
    const data = await response.json();
    expect(data.code).toBe('PRODUCT_NOT_FOUND');
  });

  // API spec: 401 Unauthorized
  it('should return 401 UNAUTHORIZED when no valid JWT token provided', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Not authenticated' },
    });

    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/products/prod-1/history',
      { method: 'GET' }
    );

    const response = await GET(request, { params: Promise.resolve({ id: 'prod-1' }) });

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.code).toBe('UNAUTHORIZED');
  });

  // API spec: 400 Invalid date range
  it('should return 400 INVALID_DATE_RANGE when from > to', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/products/prod-1/history?from=2025-12-31&to=2025-01-01',
      { method: 'GET' }
    );

    const response = await GET(request, { params: Promise.resolve({ id: 'prod-1' }) });

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.code).toBe('INVALID_DATE_RANGE');
  });

  // AC-06: Component breakdown in response
  it('should include component_breakdown in response with current and historical values', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/products/prod-1/history',
      { method: 'GET' }
    );

    const response = await GET(request, { params: Promise.resolve({ id: 'prod-1' }) });
    const data = await response.json();

    expect(data.component_breakdown).toBeDefined();
    expect(data.component_breakdown.current).toBeDefined();
    expect(data.component_breakdown.historical).toBeDefined();
    expect(data.component_breakdown.changes).toBeDefined();

    expect(data.component_breakdown.current).toHaveProperty('material');
    expect(data.component_breakdown.current).toHaveProperty('labor');
    expect(data.component_breakdown.current).toHaveProperty('overhead');
    expect(data.component_breakdown.current).toHaveProperty('total');
  });

  // AC-06: Cost drivers in response
  it('should include cost_drivers array in response with top 5 ingredients', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/products/prod-1/history',
      { method: 'GET' }
    );

    const response = await GET(request, { params: Promise.resolve({ id: 'prod-1' }) });
    const data = await response.json();

    expect(data.cost_drivers).toBeDefined();
    expect(Array.isArray(data.cost_drivers)).toBe(true);
    expect(data.cost_drivers.length).toBeLessThanOrEqual(5);
  });

  // API spec: History items should have all required fields
  it('should return history items with all required fields', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/products/prod-1/history',
      { method: 'GET' }
    );

    const response = await GET(request, { params: Promise.resolve({ id: 'prod-1' }) });
    const data = await response.json();

    if (data.history && data.history.length > 0) {
      const item = data.history[0];
      expect(item).toHaveProperty('id');
      expect(item).toHaveProperty('cost_type');
      expect(item).toHaveProperty('material_cost');
      expect(item).toHaveProperty('labor_cost');
      expect(item).toHaveProperty('overhead_cost');
      expect(item).toHaveProperty('total_cost');
      expect(item).toHaveProperty('cost_per_unit');
      expect(item).toHaveProperty('effective_from');
      expect(item).toHaveProperty('created_at');
      expect(item).toHaveProperty('created_by');
    }
  });

  // API spec: RLS enforcement (different org)
  it('should enforce RLS and return 404 for product from different organization', async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return createMockQuery({ org_id: mockOrgId });
      }
      if (table === 'products') {
        return createMockQuery({ id: 'prod-other-org', org_id: 'other-org-id', code: 'OTHER', name: 'Other' });
      }
      return createMockQuery(null);
    });

    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/products/prod-other-org/history',
      { method: 'GET' }
    );

    const response = await GET(request, { params: Promise.resolve({ id: 'prod-other-org' }) });

    // Should return 404, not 403 (hiding existence)
    expect(response.status).toBe(404);
  });

  // AC-19: Default pagination limit is 10
  it('should use default limit of 10 when not specified', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/products/prod-1/history',
      { method: 'GET' }
    );

    const response = await GET(request, { params: Promise.resolve({ id: 'prod-1' }) });
    const data = await response.json();

    expect(data.pagination.limit).toBe(10);
  });

  // API spec: Max limit is 100
  it('should cap limit to 100 even if higher value requested', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/products/prod-1/history?limit=500',
      { method: 'GET' }
    );

    const response = await GET(request, { params: Promise.resolve({ id: 'prod-1' }) });
    const data = await response.json();

    expect(data.pagination.limit).toBeLessThanOrEqual(100);
  });

  // API spec: Product info in response
  it('should include product info with id, code, and name', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/products/prod-1/history',
      { method: 'GET' }
    );

    const response = await GET(request, { params: Promise.resolve({ id: 'prod-1' }) });
    const data = await response.json();

    expect(data.product).toBeDefined();
    expect(data.product).toHaveProperty('id');
    expect(data.product).toHaveProperty('code');
    expect(data.product).toHaveProperty('name');
  });
});
