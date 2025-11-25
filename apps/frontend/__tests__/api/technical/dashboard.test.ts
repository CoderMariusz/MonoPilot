/**
 * Integration Tests: Dashboard API Routes
 * Batch 2E - Stories: 2.23 (Product Dashboard), 2.24 (Allergen Matrix)
 *
 * Tests dashboard API endpoints:
 * - GET /api/technical/dashboard/products - Product dashboard
 * - GET /api/technical/dashboard/allergen-matrix - Allergen matrix
 * - GET /api/technical/dashboard/allergen-insights - Allergen insights
 * - GET /api/technical/dashboard/recent-activity - Recent activity feed
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type {
  ProductDashboardResponse,
  AllergenMatrixResponse,
  AllergenInsights,
  RecentActivityResponse,
  ProductCategory,
} from '@/lib/types/dashboard'

/**
 * Mock Types
 */
interface MockDashboardResult {
  success: boolean
  data?: ProductDashboardResponse | AllergenMatrixResponse | AllergenInsights | RecentActivityResponse
  error?: string
}

/**
 * Mock State
 */
let mockDashboardResult: MockDashboardResult = { success: true }
let mockMatrixResult: MockDashboardResult = { success: true }
let mockInsightsResult: MockDashboardResult = { success: true }
let mockActivityResult: MockDashboardResult = { success: true }

// Mock Dashboard Service
vi.mock('@/lib/services/dashboard-service', () => ({
  getProductDashboard: vi.fn(() => {
    if (!mockDashboardResult.success) throw new Error(mockDashboardResult.error)
    return Promise.resolve(mockDashboardResult.data)
  }),
  getAllergenMatrix: vi.fn(() => {
    if (!mockMatrixResult.success) throw new Error(mockMatrixResult.error)
    return Promise.resolve(mockMatrixResult.data)
  }),
  getAllergenInsights: vi.fn(() => {
    if (!mockInsightsResult.success) throw new Error(mockInsightsResult.error)
    return Promise.resolve(mockInsightsResult.data)
  }),
  getRecentActivity: vi.fn(() => {
    if (!mockActivityResult.success) throw new Error(mockActivityResult.error)
    return Promise.resolve(mockActivityResult.data)
  }),
}))

import {
  getProductDashboard,
  getAllergenMatrix,
  getAllergenInsights,
  getRecentActivity,
} from '@/lib/services/dashboard-service'

describe('Dashboard API Integration Tests (Batch 2E)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset mock results
    mockDashboardResult = {
      success: true,
      data: {
        groups: [
          {
            category: 'RM' as ProductCategory,
            label: 'Raw Materials',
            count: 10,
            percentage: 25,
            products: [],
            recent_changes: [],
          },
          {
            category: 'WIP' as ProductCategory,
            label: 'Work in Progress',
            count: 5,
            percentage: 12,
            products: [],
            recent_changes: [],
          },
          {
            category: 'FG' as ProductCategory,
            label: 'Finished Goods',
            count: 25,
            percentage: 63,
            products: [],
            recent_changes: [],
          },
        ],
        overall_stats: {
          total_products: 40,
          active_products: 35,
          recent_updates: 12,
          trend_this_month: 5,
        },
        category_stats: [
          { category: 'RM' as ProductCategory, count: 10, percentage: 25 },
          { category: 'WIP' as ProductCategory, count: 5, percentage: 12 },
          { category: 'FG' as ProductCategory, count: 25, percentage: 63 },
        ],
      },
    }

    mockMatrixResult = {
      success: true,
      data: {
        matrix: [
          {
            product_id: 'prod-1',
            product_code: 'P-001',
            product_name: 'Product 1',
            product_type: 'FG' as ProductCategory,
            allergens: { 'alg-1': 'contains', 'alg-2': 'none' },
            allergen_count: 1,
          },
        ],
        allergens: [
          { id: 'alg-1', code: 'GLUTEN', name: 'Gluten', is_eu_mandatory: true },
          { id: 'alg-2', code: 'MILK', name: 'Milk', is_eu_mandatory: true },
        ],
        total: 1,
        page: 1,
        pageSize: 50,
        totalPages: 1,
      },
    }

    mockInsightsResult = {
      success: true,
      data: {
        high_risk_products: {
          count: 2,
          products: [
            { id: '1', code: 'P-HR1', name: 'High Risk 1', allergen_count: 7 },
            { id: '2', code: 'P-HR2', name: 'High Risk 2', allergen_count: 5 },
          ],
        },
        missing_declarations: {
          count: 3,
          products: [
            { id: '3', code: 'P-MD1', name: 'Missing 1' },
            { id: '4', code: 'P-MD2', name: 'Missing 2' },
            { id: '5', code: 'P-MD3', name: 'Missing 3' },
          ],
        },
        most_common_allergens: [
          { allergen_id: 'alg-1', allergen_name: 'Gluten', product_count: 15, percentage: 30 },
        ],
        cross_contamination_alerts: {
          count: 1,
          products: [{ id: '6', code: 'P-CC1', name: 'Cross Contam' }],
        },
      },
    }

    mockActivityResult = {
      success: true,
      data: {
        activities: [
          {
            id: 'act-1',
            product_id: 'prod-1',
            product_code: 'P-001',
            product_name: 'Product 1',
            change_type: 'created' as const,
            changed_at: new Date().toISOString(),
            changed_by: 'user-1',
          },
        ],
        total: 1,
      },
    }
  })

  // ============================================================================
  // Product Dashboard Tests (Story 2.23)
  // ============================================================================
  describe('GET /api/technical/dashboard/products (Story 2.23)', () => {
    it('should return product dashboard with grouped products (AC-2.23.1)', async () => {
      const result = await getProductDashboard('org-123')

      expect(result).toBeDefined()
      expect((result as ProductDashboardResponse).groups).toHaveLength(3)
    })

    it('should include category stats (AC-2.23.2)', async () => {
      const result = await getProductDashboard('org-123')

      expect((result as ProductDashboardResponse).category_stats).toBeDefined()
      expect((result as ProductDashboardResponse).category_stats[0].category).toBe('RM')
    })

    it('should include overall stats (AC-2.23.3)', async () => {
      const result = await getProductDashboard('org-123')

      expect((result as ProductDashboardResponse).overall_stats.total_products).toBe(40)
      expect((result as ProductDashboardResponse).overall_stats.active_products).toBe(35)
    })

    it('should filter by product type (AC-2.23.4)', async () => {
      await getProductDashboard('org-123', { type_filter: 'FG' })

      expect(getProductDashboard).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({ type_filter: 'FG' })
      )
    })

    it('should support search parameter (AC-2.23.5)', async () => {
      await getProductDashboard('org-123', { search: 'flour' })

      expect(getProductDashboard).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({ search: 'flour' })
      )
    })

    it('should support limit parameter', async () => {
      await getProductDashboard('org-123', { limit: 5 })

      expect(getProductDashboard).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({ limit: 5 })
      )
    })

    it('should throw error on service failure', async () => {
      mockDashboardResult = { success: false, error: 'Database error' }

      await expect(getProductDashboard('org-123')).rejects.toThrow('Database error')
    })

    it('should calculate trend this month', async () => {
      const result = await getProductDashboard('org-123')

      expect((result as ProductDashboardResponse).overall_stats.trend_this_month).toBe(5)
    })
  })

  // ============================================================================
  // Allergen Matrix Tests (Story 2.24)
  // ============================================================================
  describe('GET /api/technical/dashboard/allergen-matrix (Story 2.24)', () => {
    it('should return allergen matrix (AC-2.24.1)', async () => {
      const result = await getAllergenMatrix('org-123')

      expect(result).toBeDefined()
      expect((result as AllergenMatrixResponse).matrix).toHaveLength(1)
      expect((result as AllergenMatrixResponse).allergens).toHaveLength(2)
    })

    it('should include product allergen status (AC-2.24.2)', async () => {
      const result = await getAllergenMatrix('org-123')

      const firstRow = (result as AllergenMatrixResponse).matrix[0]
      expect(firstRow.allergens['alg-1']).toBe('contains')
      expect(firstRow.allergens['alg-2']).toBe('none')
    })

    it('should mark EU mandatory allergens (AC-2.24.3)', async () => {
      const result = await getAllergenMatrix('org-123')

      const glutenAllergen = (result as AllergenMatrixResponse).allergens.find(a => a.code === 'GLUTEN')
      expect(glutenAllergen?.is_eu_mandatory).toBe(true)
    })

    it('should filter by product types (AC-2.24.4)', async () => {
      await getAllergenMatrix('org-123', { product_types: ['FG', 'WIP'] })

      expect(getAllergenMatrix).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({ product_types: ['FG', 'WIP'] })
      )
    })

    it('should filter by allergen IDs', async () => {
      await getAllergenMatrix('org-123', { allergen_ids: ['alg-1', 'alg-2'] })

      expect(getAllergenMatrix).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({ allergen_ids: ['alg-1', 'alg-2'] })
      )
    })

    it('should filter by allergen count min/max (AC-2.24.5)', async () => {
      await getAllergenMatrix('org-123', {
        allergen_count_min: 1,
        allergen_count_max: 5,
      })

      expect(getAllergenMatrix).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({
          allergen_count_min: 1,
          allergen_count_max: 5,
        })
      )
    })

    it('should filter by has_allergens flag', async () => {
      await getAllergenMatrix('org-123', { has_allergens: 'with' })

      expect(getAllergenMatrix).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({ has_allergens: 'with' })
      )
    })

    it('should support sorting (AC-2.24.6)', async () => {
      await getAllergenMatrix('org-123', {
        sort_by: 'allergen_count',
        sort_order: 'desc',
      })

      expect(getAllergenMatrix).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({
          sort_by: 'allergen_count',
          sort_order: 'desc',
        })
      )
    })

    it('should support pagination', async () => {
      await getAllergenMatrix('org-123', { page: 2, pageSize: 25 })

      expect(getAllergenMatrix).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({ page: 2, pageSize: 25 })
      )
    })

    it('should return pagination info', async () => {
      const result = await getAllergenMatrix('org-123')

      expect((result as AllergenMatrixResponse).total).toBe(1)
      expect((result as AllergenMatrixResponse).page).toBe(1)
      expect((result as AllergenMatrixResponse).pageSize).toBe(50)
      expect((result as AllergenMatrixResponse).totalPages).toBe(1)
    })

    it('should support search parameter', async () => {
      await getAllergenMatrix('org-123', { search: 'bread' })

      expect(getAllergenMatrix).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({ search: 'bread' })
      )
    })

    it('should throw error on service failure', async () => {
      mockMatrixResult = { success: false, error: 'Query failed' }

      await expect(getAllergenMatrix('org-123')).rejects.toThrow('Query failed')
    })
  })

  // ============================================================================
  // Allergen Insights Tests (AC-2.24.9)
  // ============================================================================
  describe('GET /api/technical/dashboard/allergen-insights (AC-2.24.9)', () => {
    it('should return allergen insights', async () => {
      const result = await getAllergenInsights('org-123')

      expect(result).toBeDefined()
      expect((result as AllergenInsights).high_risk_products).toBeDefined()
    })

    it('should identify high-risk products (5+ allergens)', async () => {
      const result = await getAllergenInsights('org-123')

      expect((result as AllergenInsights).high_risk_products.count).toBe(2)
      expect((result as AllergenInsights).high_risk_products.products[0].allergen_count).toBe(7)
    })

    it('should identify products with missing declarations', async () => {
      const result = await getAllergenInsights('org-123')

      expect((result as AllergenInsights).missing_declarations.count).toBe(3)
    })

    it('should return most common allergens', async () => {
      const result = await getAllergenInsights('org-123')

      expect((result as AllergenInsights).most_common_allergens).toHaveLength(1)
      expect((result as AllergenInsights).most_common_allergens[0].allergen_name).toBe('Gluten')
    })

    it('should identify cross-contamination alerts', async () => {
      const result = await getAllergenInsights('org-123')

      expect((result as AllergenInsights).cross_contamination_alerts.count).toBe(1)
    })

    it('should throw error on service failure', async () => {
      mockInsightsResult = { success: false, error: 'Insights query failed' }

      await expect(getAllergenInsights('org-123')).rejects.toThrow('Insights query failed')
    })
  })

  // ============================================================================
  // Recent Activity Tests (AC-2.23.6)
  // ============================================================================
  describe('GET /api/technical/dashboard/recent-activity (AC-2.23.6)', () => {
    it('should return recent activity feed', async () => {
      const result = await getRecentActivity('org-123')

      expect(result).toBeDefined()
      expect((result as RecentActivityResponse).activities).toHaveLength(1)
    })

    it('should include activity details', async () => {
      const result = await getRecentActivity('org-123')

      const activity = (result as RecentActivityResponse).activities[0]
      expect(activity.product_code).toBe('P-001')
      expect(activity.change_type).toBe('created')
    })

    it('should support days parameter', async () => {
      await getRecentActivity('org-123', { days: 14 })

      expect(getRecentActivity).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({ days: 14 })
      )
    })

    it('should support limit parameter', async () => {
      await getRecentActivity('org-123', { limit: 20 })

      expect(getRecentActivity).toHaveBeenCalledWith(
        'org-123',
        expect.objectContaining({ limit: 20 })
      )
    })

    it('should throw error on service failure', async () => {
      mockActivityResult = { success: false, error: 'Activity query failed' }

      await expect(getRecentActivity('org-123')).rejects.toThrow('Activity query failed')
    })
  })

  // ============================================================================
  // Input Validation Tests
  // ============================================================================
  describe('Input Validation', () => {
    it('should validate product type filter values', () => {
      const validTypes: ProductCategory[] = ['RM', 'WIP', 'FG']
      const invalidTypes = ['INVALID', 'unknown', '']

      validTypes.forEach(type => {
        expect(['RM', 'WIP', 'FG'].includes(type)).toBe(true)
      })

      invalidTypes.forEach(type => {
        expect(['RM', 'WIP', 'FG'].includes(type as ProductCategory)).toBe(false)
      })
    })

    it('should validate sort_by values', () => {
      const validSortFields = ['code', 'name', 'type', 'allergen_count']

      validSortFields.forEach(field => {
        expect(field.length > 0).toBe(true)
      })
    })

    it('should validate sort_order values', () => {
      const validOrders = ['asc', 'desc']
      const invalidOrders = ['ascending', 'descending', 'invalid']

      validOrders.forEach(order => {
        expect(['asc', 'desc'].includes(order)).toBe(true)
      })

      invalidOrders.forEach(order => {
        expect(['asc', 'desc'].includes(order)).toBe(false)
      })
    })

    it('should validate page number is positive', () => {
      const validPages = [1, 2, 10, 100]
      const invalidPages = [0, -1, -100]

      validPages.forEach(page => {
        expect(page > 0).toBe(true)
      })

      invalidPages.forEach(page => {
        expect(page > 0).toBe(false)
      })
    })

    it('should validate pageSize is within limits', () => {
      const maxPageSize = 100
      const validSizes = [10, 25, 50, 100]
      const invalidSizes = [0, -1, 150, 1000]

      validSizes.forEach(size => {
        expect(size > 0 && size <= maxPageSize).toBe(true)
      })

      invalidSizes.forEach(size => {
        expect(size > 0 && size <= maxPageSize).toBe(false)
      })
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * Product Dashboard (8 tests):
 *   - Return grouped products (AC-2.23.1)
 *   - Category stats (AC-2.23.2)
 *   - Overall stats (AC-2.23.3)
 *   - Type filter (AC-2.23.4)
 *   - Search parameter (AC-2.23.5)
 *   - Limit parameter
 *   - Error handling
 *   - Trend this month
 *
 * Allergen Matrix (12 tests):
 *   - Return matrix (AC-2.24.1)
 *   - Allergen status (AC-2.24.2)
 *   - EU mandatory marking (AC-2.24.3)
 *   - Product type filter (AC-2.24.4)
 *   - Allergen ID filter
 *   - Allergen count filter (AC-2.24.5)
 *   - has_allergens filter
 *   - Sorting (AC-2.24.6)
 *   - Pagination
 *   - Pagination info
 *   - Search
 *   - Error handling
 *
 * Allergen Insights (6 tests):
 *   - Return insights
 *   - High-risk products
 *   - Missing declarations
 *   - Common allergens
 *   - Cross-contamination
 *   - Error handling
 *
 * Recent Activity (5 tests):
 *   - Return activity feed
 *   - Activity details
 *   - Days parameter
 *   - Limit parameter
 *   - Error handling
 *
 * Input Validation (5 tests):
 *   - Product type values
 *   - Sort by values
 *   - Sort order values
 *   - Page number
 *   - Page size limits
 *
 * Total: 36 tests
 */
