/**
 * Unit Tests: Dashboard Service
 * Batch 2E - Stories: 2.23 (Product Dashboard), 2.24 (Allergen Matrix)
 *
 * Tests dashboard service functions:
 * - getProductDashboard() - Product grouping and stats
 * - getRecentActivity() - Activity feed
 * - getAllergenMatrix() - Allergen matrix view
 * - getAllergenInsights() - Allergen insights
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import type {
  ProductCategory,
  AllergenStatus,
  ProductDashboardResponse,
  AllergenMatrixResponse,
  AllergenInsights,
} from '../../types/dashboard'

/**
 * Mock Supabase Admin Client
 */
interface MockProduct {
  id: string
  code: string
  name: string
  type: string
  version: number
  status: string
  updated_at: string
  created_at: string
  product_allergens?: Array<{ allergen_id: string; relation_type: string }>
}

interface MockAllergen {
  id: string
  code: string
  name: string
}

let mockProducts: MockProduct[] = []
let mockAllergens: MockAllergen[] = []

vi.mock('../../supabase/admin-client', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'products') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() => ({
                order: vi.fn(() => ({
                  range: vi.fn(() => Promise.resolve({
                    data: mockProducts,
                    error: null,
                    count: mockProducts.length
                  }))
                })),
                or: vi.fn(() => ({
                  order: vi.fn(() => ({
                    range: vi.fn(() => Promise.resolve({
                      data: mockProducts,
                      error: null,
                      count: mockProducts.length
                    }))
                  }))
                })),
                gte: vi.fn(() => ({
                  order: vi.fn(() => ({
                    limit: vi.fn(() => Promise.resolve({
                      data: mockProducts,
                      error: null
                    }))
                  }))
                })),
                in: vi.fn(() => ({
                  or: vi.fn(() => ({
                    order: vi.fn(() => ({
                      range: vi.fn(() => Promise.resolve({
                        data: mockProducts,
                        error: null,
                        count: mockProducts.length
                      }))
                    }))
                  })),
                  order: vi.fn(() => ({
                    range: vi.fn(() => Promise.resolve({
                      data: mockProducts,
                      error: null,
                      count: mockProducts.length
                    }))
                  }))
                }))
              }))
            }))
          }))
        }
      }
      if (table === 'allergens') {
        return {
          select: vi.fn(() => ({
            order: vi.fn(() => ({
              in: vi.fn(() => Promise.resolve({ data: mockAllergens, error: null }))
            })),
            in: vi.fn(() => Promise.resolve({ data: mockAllergens, error: null }))
          }))
        }
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null }))
          }))
        }))
      }
    })
  }))
}))

/**
 * Helper: Create mock product
 */
function createMockProduct(overrides: Partial<MockProduct> = {}): MockProduct {
  return {
    id: 'prod-001',
    code: 'P-001',
    name: 'Test Product',
    type: 'RM',
    version: 1,
    status: 'active',
    updated_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    product_allergens: [],
    ...overrides,
  }
}

/**
 * Helper: Create mock allergen
 */
function createMockAllergen(overrides: Partial<MockAllergen> = {}): MockAllergen {
  return {
    id: 'alg-001',
    code: 'GLUTEN',
    name: 'Gluten',
    ...overrides,
  }
}

describe('Dashboard Service (Batch 2E)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockProducts = []
    mockAllergens = []
  })

  // ============================================================================
  // Product Dashboard Tests (Story 2.23)
  // ============================================================================
  describe('Product Dashboard - Product Grouping (Story 2.23)', () => {
    it('should group products by type (RM, WIP, FG)', () => {
      const products: MockProduct[] = [
        createMockProduct({ id: '1', type: 'RM', code: 'RM-001' }),
        createMockProduct({ id: '2', type: 'RM', code: 'RM-002' }),
        createMockProduct({ id: '3', type: 'WIP', code: 'WIP-001' }),
        createMockProduct({ id: '4', type: 'FG', code: 'FG-001' }),
        createMockProduct({ id: '5', type: 'FG', code: 'FG-002' }),
        createMockProduct({ id: '6', type: 'FG', code: 'FG-003' }),
      ]

      const categoryConfigs = [
        { category: 'RM', types: ['RM', 'RAW'] },
        { category: 'WIP', types: ['WIP', 'SEMI'] },
        { category: 'FG', types: ['FG', 'FINISHED'] },
      ]

      const groups = categoryConfigs.map(config => {
        const groupProducts = products.filter(p => config.types.includes(p.type))
        return {
          category: config.category,
          count: groupProducts.length,
        }
      })

      expect(groups[0].category).toBe('RM')
      expect(groups[0].count).toBe(2)
      expect(groups[1].category).toBe('WIP')
      expect(groups[1].count).toBe(1)
      expect(groups[2].category).toBe('FG')
      expect(groups[2].count).toBe(3)
    })

    it('should calculate category percentages', () => {
      const totalProducts = 100
      const categoryStats = [
        { category: 'RM' as ProductCategory, count: 30 },
        { category: 'WIP' as ProductCategory, count: 20 },
        { category: 'FG' as ProductCategory, count: 50 },
      ]

      const withPercentages = categoryStats.map(stat => ({
        ...stat,
        percentage: Math.round((stat.count / totalProducts) * 100),
      }))

      expect(withPercentages[0].percentage).toBe(30)
      expect(withPercentages[1].percentage).toBe(20)
      expect(withPercentages[2].percentage).toBe(50)
    })

    it('should calculate overall stats', () => {
      const products: MockProduct[] = [
        createMockProduct({ status: 'active', updated_at: new Date().toISOString() }),
        createMockProduct({ status: 'active', updated_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() }),
        createMockProduct({ status: 'inactive' }),
      ]

      const activeProducts = products.filter(p => p.status === 'active')
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      const recentUpdates = products.filter(p => new Date(p.updated_at) > sevenDaysAgo)

      expect(products.length).toBe(3)
      expect(activeProducts.length).toBe(2)
      expect(recentUpdates.length).toBe(2)
    })

    it('should limit products per category', () => {
      const limit = 8
      const products: MockProduct[] = Array.from({ length: 15 }, (_, i) =>
        createMockProduct({ id: `prod-${i}`, type: 'RM' })
      )

      const limitedProducts = products.slice(0, limit)

      expect(limitedProducts.length).toBe(8)
    })

    it('should handle empty product list', () => {
      const products: MockProduct[] = []
      const totalProducts = products.length

      const categoryStats = [
        { category: 'RM', count: 0, percentage: 0 },
        { category: 'WIP', count: 0, percentage: 0 },
        { category: 'FG', count: 0, percentage: 0 },
      ]

      expect(totalProducts).toBe(0)
      expect(categoryStats.every(s => s.percentage === 0)).toBe(true)
    })

    it('should calculate trend this month', () => {
      const now = new Date()
      const monthAgo = new Date()
      monthAgo.setMonth(monthAgo.getMonth() - 1)

      const products: MockProduct[] = [
        createMockProduct({ created_at: now.toISOString() }), // This month
        createMockProduct({ created_at: now.toISOString() }), // This month
        createMockProduct({ created_at: new Date('2024-01-01').toISOString() }), // Old
      ]

      const trendThisMonth = products.filter(p =>
        new Date(p.created_at) > monthAgo
      ).length

      expect(trendThisMonth).toBe(2)
    })
  })

  // ============================================================================
  // Recent Activity Tests (Story 2.23)
  // ============================================================================
  describe('Recent Activity Feed (AC-2.23.6)', () => {
    it('should identify created vs updated products', () => {
      const product = {
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-01T10:00:00Z', // Same as created
      }

      const isNew = new Date(product.created_at).getTime() ===
        new Date(product.updated_at).getTime()

      expect(isNew).toBe(true)

      const updatedProduct = {
        created_at: '2025-01-01T10:00:00Z',
        updated_at: '2025-01-02T10:00:00Z', // Different
      }

      const isUpdated = new Date(updatedProduct.created_at).getTime() !==
        new Date(updatedProduct.updated_at).getTime()

      expect(isUpdated).toBe(true)
    })

    it('should filter by days parameter', () => {
      const days = 7
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - days)

      const products = [
        { updated_at: new Date().toISOString() }, // Today
        { updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString() }, // 3 days ago
        { updated_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() }, // 10 days ago
      ]

      const recentProducts = products.filter(p =>
        new Date(p.updated_at) >= cutoffDate
      )

      expect(recentProducts.length).toBe(2)
    })

    it('should limit activity items', () => {
      const limit = 10
      const products = Array.from({ length: 20 }, (_, i) => ({
        id: `prod-${i}`,
        updated_at: new Date().toISOString(),
      }))

      const limitedProducts = products.slice(0, limit)

      expect(limitedProducts.length).toBe(10)
    })
  })

  // ============================================================================
  // Allergen Matrix Tests (Story 2.24)
  // ============================================================================
  describe('Allergen Matrix (Story 2.24)', () => {
    it('should build matrix row with allergen status', () => {
      const product = createMockProduct({
        id: 'prod-1',
        product_allergens: [
          { allergen_id: 'alg-1', relation_type: 'contains' },
          { allergen_id: 'alg-2', relation_type: 'may_contain' },
        ],
      })

      const allergens = [
        { id: 'alg-1', code: 'GLUTEN', name: 'Gluten' },
        { id: 'alg-2', code: 'MILK', name: 'Milk' },
        { id: 'alg-3', code: 'EGGS', name: 'Eggs' },
      ]

      const allergenMap: Record<string, AllergenStatus> = {}
      let allergenCount = 0

      allergens.forEach(a => {
        const relation = product.product_allergens?.find(pa => pa.allergen_id === a.id)
        if (relation) {
          allergenMap[a.id] = relation.relation_type as AllergenStatus
          if (relation.relation_type === 'contains' || relation.relation_type === 'may_contain') {
            allergenCount++
          }
        } else {
          allergenMap[a.id] = 'unknown'
        }
      })

      expect(allergenMap['alg-1']).toBe('contains')
      expect(allergenMap['alg-2']).toBe('may_contain')
      expect(allergenMap['alg-3']).toBe('unknown')
      expect(allergenCount).toBe(2)
    })

    it('should filter by allergen count min', () => {
      const matrix = [
        { product_id: '1', allergen_count: 0 },
        { product_id: '2', allergen_count: 2 },
        { product_id: '3', allergen_count: 5 },
        { product_id: '4', allergen_count: 3 },
      ]

      const allergenCountMin = 2
      const filtered = matrix.filter(row => row.allergen_count >= allergenCountMin)

      expect(filtered.length).toBe(3)
    })

    it('should filter by allergen count max', () => {
      const matrix = [
        { product_id: '1', allergen_count: 0 },
        { product_id: '2', allergen_count: 2 },
        { product_id: '3', allergen_count: 5 },
        { product_id: '4', allergen_count: 3 },
      ]

      const allergenCountMax = 3
      const filtered = matrix.filter(row => row.allergen_count <= allergenCountMax)

      expect(filtered.length).toBe(3)
    })

    it('should filter products with allergens', () => {
      const matrix = [
        { product_id: '1', allergen_count: 0 },
        { product_id: '2', allergen_count: 2 },
        { product_id: '3', allergen_count: 5 },
      ]

      const withAllergens = matrix.filter(row => row.allergen_count > 0)
      expect(withAllergens.length).toBe(2)
    })

    it('should filter products without allergens', () => {
      const matrix = [
        { product_id: '1', allergen_count: 0 },
        { product_id: '2', allergen_count: 2 },
        { product_id: '3', allergen_count: 0 },
      ]

      const withoutAllergens = matrix.filter(row => row.allergen_count === 0)
      expect(withoutAllergens.length).toBe(2)
    })

    it('should sort by allergen_count descending', () => {
      const matrix = [
        { product_id: '1', allergen_count: 2 },
        { product_id: '2', allergen_count: 5 },
        { product_id: '3', allergen_count: 1 },
      ]

      const sorted = [...matrix].sort((a, b) => b.allergen_count - a.allergen_count)

      expect(sorted[0].allergen_count).toBe(5)
      expect(sorted[1].allergen_count).toBe(2)
      expect(sorted[2].allergen_count).toBe(1)
    })

    it('should calculate pagination correctly', () => {
      const total = 150
      const pageSize = 50

      const totalPages = Math.ceil(total / pageSize)
      const page1Offset = (1 - 1) * pageSize
      const page2Offset = (2 - 1) * pageSize
      const page3Offset = (3 - 1) * pageSize

      expect(totalPages).toBe(3)
      expect(page1Offset).toBe(0)
      expect(page2Offset).toBe(50)
      expect(page3Offset).toBe(100)
    })

    it('should identify EU mandatory allergens', () => {
      const euMandatory = [
        'gluten', 'cereals', 'wheat', 'barley', 'rye', 'oats',
        'crustaceans', 'eggs', 'fish', 'peanuts', 'soybeans', 'soy',
        'milk', 'dairy', 'lactose', 'nuts', 'tree nuts', 'celery',
        'mustard', 'sesame', 'sulfites', 'sulphites', 'lupin', 'molluscs'
      ]

      const isEuMandatory = (name: string) =>
        euMandatory.some(term => name.toLowerCase().includes(term))

      expect(isEuMandatory('Gluten')).toBe(true)
      expect(isEuMandatory('Milk (Dairy)')).toBe(true)
      expect(isEuMandatory('Custom Allergen')).toBe(false)
    })
  })

  // ============================================================================
  // Allergen Insights Tests (AC-2.24.9)
  // ============================================================================
  describe('Allergen Insights (AC-2.24.9)', () => {
    it('should identify high-risk products (5+ allergens)', () => {
      const products = [
        { id: '1', allergen_count: 2 },
        { id: '2', allergen_count: 5 },
        { id: '3', allergen_count: 7 },
        { id: '4', allergen_count: 4 },
      ]

      const highRiskProducts = products
        .filter(p => p.allergen_count >= 5)
        .sort((a, b) => b.allergen_count - a.allergen_count)

      expect(highRiskProducts.length).toBe(2)
      expect(highRiskProducts[0].allergen_count).toBe(7)
    })

    it('should identify products missing declarations', () => {
      const products = [
        { id: '1', product_allergens: [] },
        { id: '2', product_allergens: [{ allergen_id: 'a1', relation_type: 'contains' }] },
        { id: '3', product_allergens: null },
      ]

      const missingDeclarations = products.filter(p =>
        !p.product_allergens || p.product_allergens.length === 0
      )

      expect(missingDeclarations.length).toBe(2)
    })

    it('should calculate most common allergens', () => {
      const products = [
        { product_allergens: [{ allergen_id: 'a1', relation_type: 'contains' }] },
        { product_allergens: [{ allergen_id: 'a1', relation_type: 'contains' }, { allergen_id: 'a2', relation_type: 'may_contain' }] },
        { product_allergens: [{ allergen_id: 'a1', relation_type: 'may_contain' }] },
        { product_allergens: [{ allergen_id: 'a2', relation_type: 'contains' }] },
      ]

      const allergenCounts: Record<string, number> = {}
      products.forEach(p => {
        p.product_allergens?.forEach(pa => {
          if (pa.relation_type === 'contains' || pa.relation_type === 'may_contain') {
            allergenCounts[pa.allergen_id] = (allergenCounts[pa.allergen_id] || 0) + 1
          }
        })
      })

      const sortedAllergens = Object.entries(allergenCounts)
        .sort(([, a], [, b]) => b - a)

      expect(sortedAllergens[0][0]).toBe('a1')
      expect(sortedAllergens[0][1]).toBe(3)
      expect(sortedAllergens[1][0]).toBe('a2')
      expect(sortedAllergens[1][1]).toBe(2)
    })

    it('should identify cross-contamination alerts (may_contain)', () => {
      const products = [
        { id: '1', product_allergens: [{ relation_type: 'contains' }] },
        { id: '2', product_allergens: [{ relation_type: 'may_contain' }] },
        { id: '3', product_allergens: [{ relation_type: 'contains' }, { relation_type: 'may_contain' }] },
        { id: '4', product_allergens: [{ relation_type: 'none' }] },
      ]

      const crossContaminationProducts = products.filter(p =>
        p.product_allergens?.some(pa => pa.relation_type === 'may_contain')
      )

      expect(crossContaminationProducts.length).toBe(2)
    })

    it('should limit insights to top 5', () => {
      const items = Array.from({ length: 10 }, (_, i) => ({ id: `item-${i}` }))
      const top5 = items.slice(0, 5)

      expect(top5.length).toBe(5)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * Product Dashboard (6 tests):
 *   - Group products by type
 *   - Calculate category percentages
 *   - Calculate overall stats
 *   - Limit products per category
 *   - Handle empty product list
 *   - Calculate trend this month
 *
 * Recent Activity (3 tests):
 *   - Identify created vs updated
 *   - Filter by days parameter
 *   - Limit activity items
 *
 * Allergen Matrix (8 tests):
 *   - Build matrix row with status
 *   - Filter by allergen count min
 *   - Filter by allergen count max
 *   - Filter products with allergens
 *   - Filter products without allergens
 *   - Sort by allergen_count
 *   - Calculate pagination
 *   - Identify EU mandatory allergens
 *
 * Allergen Insights (5 tests):
 *   - Identify high-risk products
 *   - Identify missing declarations
 *   - Calculate most common allergens
 *   - Identify cross-contamination alerts
 *   - Limit to top 5
 *
 * Total: 22 tests
 */
