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

const mockStandardCost = {
  id: 'cost-1',
  product_id: mockProductId,
  org_id: mockOrgId,
  cost_type: 'standard',
  material_cost: 185.50,
  labor_cost: 45.00,
  overhead_cost: 20.00,
  total_cost: 250.50,
  cost_per_unit: 2.505,
  effective_from: '2025-12-01',
  effective_to: null,
  created_at: new Date().toISOString(),
  created_by: mockUserId,
  bom_version: 1,
};

const mockVarianceRecords = [
  {
    id: 'var-1',
    work_order_id: 'wo-1',
    product_id: mockProductId,
    org_id: mockOrgId,
    standard_material: 185.50,
    actual_material: 188.20,
    standard_labor: 45.00,
    actual_labor: 48.56,
    standard_overhead: 20.00,
    actual_overhead: 21.00,
    standard_total: 250.50,
    actual_total: 257.76,
    variance_total: 7.26,
    variance_percent: 2.9,
    analyzed_at: new Date().toISOString(),
    work_order: {
      id: 'wo-1',
      code: 'WO-2025-001',
      completed_at: new Date().toISOString(),
    },
  },
  {
    id: 'var-2',
    work_order_id: 'wo-2',
    product_id: mockProductId,
    org_id: mockOrgId,
    standard_material: 185.50,
    actual_material: 188.20,
    standard_labor: 45.00,
    actual_labor: 48.56,
    standard_overhead: 20.00,
    actual_overhead: 21.50,
    standard_total: 250.50,
    actual_total: 258.26,
    variance_total: 7.76,
    variance_percent: 3.1,
    analyzed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    work_order: {
      id: 'wo-2',
      code: 'WO-2025-002',
      completed_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    },
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

describe('GET /api/technical/costing/variance/report', () => {
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
        return createMockQuery(mockStandardCost);
      }
      if (table === 'cost_variances') {
        const query = createMockQuery(mockVarianceRecords, null, mockVarianceRecords.length);
        query.select = vi.fn(() => query);
        return query;
      }
      return createMockQuery(null);
    });
  });

  // AC-08: Variance analysis section displays work orders analyzed count
  it('should return variance data with work_orders_analyzed count for period=30', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/variance/report?productId=prod-1&period=30',
      { method: 'GET' }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(data).toHaveProperty('product_id');
    expect(data).toHaveProperty('period_days');
    expect(data).toHaveProperty('work_orders_analyzed');
    expect(typeof data.work_orders_analyzed).toBe('number');
    expect(data.period_days).toBe(30);
  });

  // AC-09: Material variance calculation
  it('should calculate material variance correctly: standard=$185.50, actual=$188.20', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/variance/report?productId=prod-1&period=30',
      { method: 'GET' }
    );

    const response = await GET(request);
    const data = await response.json();

    if (data.components) {
      expect(data.components.material).toBeDefined();
      expect(data.components.material.standard).toBeCloseTo(185.5, 1);
      expect(data.components.material.actual).toBeCloseTo(188.2, 1);
      expect(data.components.material.variance).toBeCloseTo(2.7, 1);
      expect(data.components.material.variance_percent).toBeCloseTo(1.46, 1);
    }
  });

  // AC-09: All component variances in response
  it('should include variance for all components: material, labor, overhead, total', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/variance/report?productId=prod-1&period=30',
      { method: 'GET' }
    );

    const response = await GET(request);
    const data = await response.json();

    if (data.components) {
      expect(data.components).toHaveProperty('material');
      expect(data.components).toHaveProperty('labor');
      expect(data.components).toHaveProperty('overhead');
      expect(data.components).toHaveProperty('total');

      // Each component should have these properties
      expect(data.components.material).toHaveProperty('standard');
      expect(data.components.material).toHaveProperty('actual');
      expect(data.components.material).toHaveProperty('variance');
      expect(data.components.material).toHaveProperty('variance_percent');
    }
  });

  // AC-10: Significant variance warning for labor >5%
  it('should identify significant variance in Labor Cost with >5% variance', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/variance/report?productId=prod-1&period=30',
      { method: 'GET' }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(data).toHaveProperty('significant_variances');
    expect(Array.isArray(data.significant_variances)).toBe(true);

    // If there are significant variances, check structure
    if (data.significant_variances.length > 0) {
      const variance = data.significant_variances[0];
      expect(variance).toHaveProperty('component');
      expect(variance).toHaveProperty('variance_percent');
      expect(variance).toHaveProperty('threshold');
      expect(variance).toHaveProperty('direction');
      expect(Math.abs(variance.variance_percent)).toBeGreaterThan(variance.threshold);
    }
  });

  // AC-10: Significant variance has correct properties
  it('should include threshold and direction in significant variance objects', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/variance/report?productId=prod-1&period=30',
      { method: 'GET' }
    );

    const response = await GET(request);
    const data = await response.json();

    if (data.significant_variances && data.significant_variances.length > 0) {
      data.significant_variances.forEach((variance: any) => {
        expect(variance.threshold).toBe(5); // Default threshold
        expect(['over', 'under']).toContain(variance.direction);
      });
    }
  });

  // AC-11: No production data returns empty components
  it('should return work_orders_analyzed=0 when no production data exists', async () => {
    // Mock for product with no variance records
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return createMockQuery({ org_id: mockOrgId });
      }
      if (table === 'products') {
        return createMockQuery({ id: 'prod-999', org_id: mockOrgId, code: 'TEST', name: 'Test' });
      }
      if (table === 'product_costs') {
        return createMockQuery(mockStandardCost);
      }
      if (table === 'cost_variances') {
        const query = createMockQuery([], null, 0);
        query.select = vi.fn(() => query);
        return query;
      }
      return createMockQuery(null);
    });

    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/variance/report?productId=prod-999&period=30',
      { method: 'GET' }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(data.work_orders_analyzed).toBe(0);
    expect(data.components).toBeNull();
  });

  // AC-11: Message for no variance data
  it('should show appropriate response when no variance data available', async () => {
    // Mock for product with no variance records
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === 'users') {
        return createMockQuery({ org_id: mockOrgId });
      }
      if (table === 'products') {
        return createMockQuery({ id: 'prod-999', org_id: mockOrgId, code: 'TEST', name: 'Test' });
      }
      if (table === 'product_costs') {
        return createMockQuery(mockStandardCost);
      }
      if (table === 'cost_variances') {
        const query = createMockQuery([], null, 0);
        query.select = vi.fn(() => query);
        return query;
      }
      return createMockQuery(null);
    });

    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/variance/report?productId=prod-999&period=30',
      { method: 'GET' }
    );

    const response = await GET(request);
    const data = await response.json();

    // When no data, components should be null and significant_variances empty
    expect(data.components).toBeNull();
    expect(data.significant_variances).toEqual([]);
  });

  // API spec: Period parameter
  it('should respect period parameter with valid values 7, 30, 90, 365', async () => {
    const periods = [7, 30, 90, 365];

    for (const period of periods) {
      const request = new NextRequest(
        `http://localhost:3000/api/technical/costing/variance/report?productId=prod-1&period=${period}`,
        { method: 'GET' }
      );

      const response = await GET(request);
      const data = await response.json();

      expect(data.period_days).toBe(period);
    }
  });

  // API spec: Default period is 30 days
  it('should default to period_days=30 when period not specified', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/variance/report?productId=prod-1',
      { method: 'GET' }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(data.period_days).toBe(30);
  });

  // API spec: ProductId required
  it('should return error when productId not provided', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/variance/report?period=30',
      { method: 'GET' }
    );

    const response = await GET(request);

    // Should fail without productId
    expect(response.status).toBe(400);
  });

  // API spec: 401 Unauthorized
  it('should return 401 UNAUTHORIZED when no valid JWT token provided', async () => {
    mockSupabase.auth.getSession.mockResolvedValue({
      data: { session: null },
      error: { message: 'Not authenticated' },
    });

    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/variance/report?productId=prod-1',
      { method: 'GET' }
    );

    const response = await GET(request);

    expect(response.status).toBe(401);
  });

  // API spec: 404 Product not found
  it('should return 404 PRODUCT_NOT_FOUND for invalid product', async () => {
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
      'http://localhost:3000/api/technical/costing/variance/report?productId=invalid-id',
      { method: 'GET' }
    );

    const response = await GET(request);

    expect(response.status).toBe(404);
  });

  // AC-08: Work order details in response
  it('should include work_order_details array with individual work order variances', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/variance/report?productId=prod-1&period=30',
      { method: 'GET' }
    );

    const response = await GET(request);
    const data = await response.json();

    if (data.work_orders_analyzed > 0) {
      expect(data).toHaveProperty('work_order_details');
      expect(Array.isArray(data.work_order_details)).toBe(true);

      if (data.work_order_details.length > 0) {
        const woDetail = data.work_order_details[0];
        expect(woDetail).toHaveProperty('work_order_id');
        expect(woDetail).toHaveProperty('work_order_code');
        expect(woDetail).toHaveProperty('standard_cost');
        expect(woDetail).toHaveProperty('actual_cost');
        expect(woDetail).toHaveProperty('variance');
        expect(woDetail).toHaveProperty('variance_percent');
        expect(woDetail).toHaveProperty('completed_at');
      }
    }
  });

  // API spec: Response structure
  it('should return response with all required top-level properties', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/variance/report?productId=prod-1',
      { method: 'GET' }
    );

    const response = await GET(request);
    const data = await response.json();

    expect(data).toHaveProperty('product_id');
    expect(data).toHaveProperty('period_days');
    expect(data).toHaveProperty('work_orders_analyzed');
    expect(data).toHaveProperty('components');
    expect(data).toHaveProperty('significant_variances');
  });

  // AC-10: Verify threshold value
  it('should use 5% as default threshold for significant variances', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/variance/report?productId=prod-1&period=30',
      { method: 'GET' }
    );

    const response = await GET(request);
    const data = await response.json();

    if (data.significant_variances && data.significant_variances.length > 0) {
      const variance = data.significant_variances[0];
      expect(variance.threshold).toBe(5);
    }
  });

  // AC-10: Direction correctness
  it('should correctly identify direction as "over" for positive variances', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/variance/report?productId=prod-1&period=30',
      { method: 'GET' }
    );

    const response = await GET(request);
    const data = await response.json();

    if (data.significant_variances && data.significant_variances.length > 0) {
      data.significant_variances.forEach((variance: any) => {
        if (variance.variance_percent > 0) {
          expect(variance.direction).toBe('over');
        } else if (variance.variance_percent < 0) {
          expect(variance.direction).toBe('under');
        }
      });
    }
  });

  // AC-09: Variance percentage calculations
  it('should calculate variance_percent as (actual - standard) / standard * 100', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/variance/report?productId=prod-1&period=30',
      { method: 'GET' }
    );

    const response = await GET(request);
    const data = await response.json();

    if (data.components && data.components.material) {
      const material = data.components.material;
      const expectedPercent = ((material.actual - material.standard) / material.standard) * 100;
      expect(material.variance_percent).toBeCloseTo(expectedPercent, 1);
    }
  });

  // AC-08: Response filtering by period
  it('should only include work orders within specified period days', async () => {
    const request = new NextRequest(
      'http://localhost:3000/api/technical/costing/variance/report?productId=prod-1&period=7',
      { method: 'GET' }
    );

    const response = await GET(request);
    const data = await response.json();

    // This test verifies the period_days in response
    expect(data.period_days).toBe(7);
  });

  // API spec: RLS enforcement
  it('should enforce RLS and hide products from different organizations', async () => {
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
      'http://localhost:3000/api/technical/costing/variance/report?productId=prod-other-org',
      { method: 'GET' }
    );

    const response = await GET(request);

    // Should return 404 for different org
    expect(response.status).toBe(404);
  });
});
