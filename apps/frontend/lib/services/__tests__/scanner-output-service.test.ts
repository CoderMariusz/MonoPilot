/**
 * Unit Tests: Scanner Output Service
 * Story 04.7b: Output Registration Scanner
 *
 * Tests scanner-specific output registration service methods:
 * - WO barcode validation (500ms response)
 * - LP creation from scanner
 * - By-product retrieval
 * - By-product registration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: { id: 'user-1' } },
            error: null,
          })
        ),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
            order: vi.fn(() => ({
              limit: vi.fn(),
            })),
          })),
        })),
        insert: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
        update: vi.fn(() => ({
          eq: vi.fn(),
        })),
      })),
    })
  ),
}))

describe('ScannerOutputService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // validateWO - WO Barcode Validation (FR-PROD-012)
  // ============================================================================
  describe('validateWO', () => {
    it('should return WO data for valid barcode within 500ms', async () => {
      // Arrange
      const barcode = 'WO-2025-0156'
      const startTime = Date.now()

      // Act
      const { validateWO } = await import('../scanner-output-service')
      const result = await validateWO(barcode)

      // Assert - Response time
      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(500) // AC: 500ms response time

      // Assert - Data structure
      expect(result.valid).toBe(true)
      expect(result.wo).toBeDefined()
      expect(result.wo.id).toBeDefined()
      expect(result.wo.wo_number).toBe(barcode)
      expect(result.wo.status).toBe('in_progress')
      expect(result.wo.product_name).toBeDefined()
      expect(result.wo.planned_qty).toBeGreaterThan(0)
      expect(result.wo.registered_qty).toBeGreaterThanOrEqual(0)
      expect(result.wo.remaining_qty).toBeDefined()
      expect(result.wo.progress_percent).toBeDefined()
    })

    it('should reject invalid barcode format with error message', async () => {
      // Arrange
      const barcode = 'XYZ-123'

      // Act
      const { validateWO } = await import('../scanner-output-service')
      const result = await validateWO(barcode)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid barcode format')
    })

    it('should reject WO not in progress or paused status', async () => {
      // Arrange
      const barcode = 'WO-COMPLETED-001'

      // Act
      const { validateWO } = await import('../scanner-output-service')
      const result = await validateWO(barcode)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Work order is not in progress or paused')
    })

    it('should reject WO with draft or released status with start message', async () => {
      // Arrange
      const barcode = 'WO-DRAFT-001'

      // Act
      const { validateWO } = await import('../scanner-output-service')
      const result = await validateWO(barcode)

      // Assert
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Work order must be started first')
    })

    it('should return remaining qty calculation', async () => {
      // Arrange - WO with planned=1000, registered=800
      const barcode = 'WO-2025-0156'

      // Act
      const { validateWO } = await import('../scanner-output-service')
      const result = await validateWO(barcode)

      // Assert
      expect(result.valid).toBe(true)
      expect(result.wo.remaining_qty).toBe(result.wo.planned_qty - result.wo.registered_qty)
    })

    it('should return by-products array from BOM', async () => {
      // Arrange
      const barcode = 'WO-2025-0156'

      // Act
      const { validateWO } = await import('../scanner-output-service')
      const result = await validateWO(barcode)

      // Assert
      expect(result.by_products).toBeDefined()
      expect(Array.isArray(result.by_products)).toBe(true)
    })

    it('should include shelf_life_days for expiry calculation', async () => {
      // Arrange
      const barcode = 'WO-2025-0156'

      // Act
      const { validateWO } = await import('../scanner-output-service')
      const result = await validateWO(barcode)

      // Assert
      expect(result.wo.shelf_life_days).toBeDefined()
      expect(typeof result.wo.shelf_life_days).toBe('number')
    })
  })

  // ============================================================================
  // registerOutput - LP Creation from Scanner (FR-PROD-012)
  // ============================================================================
  describe('registerOutput', () => {
    it('should create LP with scanner input data', async () => {
      // Arrange
      const input = {
        wo_id: 'wo-uuid-123',
        quantity: 250,
        qa_status: 'approved' as const,
        batch_number: 'B-2025-0156',
        expiry_date: '2025-02-14T00:00:00Z',
        location_id: 'loc-uuid-123',
      }

      // Act
      const { registerOutput } = await import('../scanner-output-service')
      const result = await registerOutput(input)

      // Assert
      expect(result.lp).toBeDefined()
      expect(result.lp.id).toBeDefined()
      expect(result.lp.lp_number).toMatch(/^LP-\d{8}-\d{4}$/) // LP-YYYYMMDD-NNNN
      expect(result.lp.qty).toBe(250)
      expect(result.lp.qa_status).toBe('approved')
    })

    it('should update WO output_qty after registration', async () => {
      // Arrange
      const input = {
        wo_id: 'wo-uuid-123',
        quantity: 250,
        qa_status: 'pending' as const,
        batch_number: 'B-2025-0156',
        expiry_date: '2025-02-14T00:00:00Z',
        location_id: 'loc-uuid-123',
      }

      // Act
      const { registerOutput } = await import('../scanner-output-service')
      const result = await registerOutput(input)

      // Assert
      expect(result.wo_progress).toBeDefined()
      expect(result.wo_progress.output_qty).toBeGreaterThan(0)
      expect(result.wo_progress.progress_percent).toBeDefined()
    })

    it('should link genealogy records to parent LPs', async () => {
      // Arrange
      const input = {
        wo_id: 'wo-uuid-123',
        quantity: 250,
        qa_status: 'approved' as const,
        batch_number: 'B-2025-0156',
        expiry_date: '2025-02-14T00:00:00Z',
        location_id: 'loc-uuid-123',
      }

      // Act
      const { registerOutput } = await import('../scanner-output-service')
      const result = await registerOutput(input)

      // Assert
      expect(result.genealogy).toBeDefined()
      expect(result.genealogy.parent_count).toBeGreaterThanOrEqual(0)
      expect(result.genealogy.child_lp_id).toBeDefined()
    })

    it('should reject qty = 0', async () => {
      // Arrange
      const input = {
        wo_id: 'wo-uuid-123',
        quantity: 0,
        qa_status: 'approved' as const,
        batch_number: 'B-2025-0156',
        expiry_date: '2025-02-14T00:00:00Z',
        location_id: 'loc-uuid-123',
      }

      // Act & Assert
      const { registerOutput } = await import('../scanner-output-service')
      await expect(registerOutput(input)).rejects.toThrow('Quantity must be greater than 0')
    })

    it('should accept optional operator_badge for traceability', async () => {
      // Arrange
      const input = {
        wo_id: 'wo-uuid-123',
        quantity: 250,
        qa_status: 'approved' as const,
        batch_number: 'B-2025-0156',
        expiry_date: '2025-02-14T00:00:00Z',
        location_id: 'loc-uuid-123',
        operator_badge: 'OP-12345',
      }

      // Act
      const { registerOutput } = await import('../scanner-output-service')
      const result = await registerOutput(input)

      // Assert
      expect(result.lp).toBeDefined()
    })
  })

  // ============================================================================
  // getByProducts - By-Product Retrieval (FR-PROD-013)
  // ============================================================================
  describe('getByProducts', () => {
    it('should return by-products list for WO with BOM by-products', async () => {
      // Arrange
      const woId = 'wo-uuid-123'

      // Act
      const { getByProducts } = await import('../scanner-output-service')
      const result = await getByProducts(woId)

      // Assert
      expect(Array.isArray(result)).toBe(true)
      if (result.length > 0) {
        expect(result[0].id).toBeDefined()
        expect(result[0].name).toBeDefined()
        expect(result[0].yield_percent).toBeDefined()
        expect(result[0].expected_qty).toBeDefined()
      }
    })

    it('should calculate expected qty based on planned_qty and yield_percent', async () => {
      // Arrange - WO with planned_qty=1000, by-product yield_percent=5
      const woId = 'wo-uuid-123'

      // Act
      const { getByProducts } = await import('../scanner-output-service')
      const result = await getByProducts(woId)

      // Assert
      expect(result.length).toBeGreaterThan(0)
      // Expected: 1000 * 5% = 50
      expect(result[0].expected_qty).toBe(50)
    })

    it('should return empty array when BOM has no by-products', async () => {
      // Arrange
      const woId = 'wo-no-byproducts'

      // Act
      const { getByProducts } = await import('../scanner-output-service')
      const result = await getByProducts(woId)

      // Assert
      expect(result).toEqual([])
    })
  })

  // ============================================================================
  // registerByProduct - By-Product LP Creation (FR-PROD-013)
  // ============================================================================
  describe('registerByProduct', () => {
    it('should create LP for by-product with correct qty', async () => {
      // Arrange
      const input = {
        wo_id: 'wo-uuid-123',
        main_output_lp_id: 'lp-main-123',
        by_product_id: 'prod-byproduct-123',
        quantity: 45,
        qa_status: 'approved' as const,
        batch_number: 'B-2025-0156-BP1',
        expiry_date: '2025-02-14T00:00:00Z',
        location_id: 'loc-uuid-123',
      }

      // Act
      const { registerByProduct } = await import('../scanner-output-service')
      const result = await registerByProduct(input)

      // Assert
      expect(result.lp).toBeDefined()
      expect(result.lp.qty).toBe(45)
    })

    it('should allow qty = 0 when zero_qty_confirmed is true', async () => {
      // Arrange
      const input = {
        wo_id: 'wo-uuid-123',
        main_output_lp_id: 'lp-main-123',
        by_product_id: 'prod-byproduct-123',
        quantity: 0,
        qa_status: 'pending' as const,
        batch_number: 'B-2025-0156-BP1',
        expiry_date: '2025-02-14T00:00:00Z',
        location_id: 'loc-uuid-123',
        zero_qty_confirmed: true,
      }

      // Act
      const { registerByProduct } = await import('../scanner-output-service')
      const result = await registerByProduct(input)

      // Assert
      expect(result.lp).toBeDefined()
      expect(result.lp.qty).toBe(0)
    })

    it('should reject qty = 0 without zero_qty_confirmed', async () => {
      // Arrange
      const input = {
        wo_id: 'wo-uuid-123',
        main_output_lp_id: 'lp-main-123',
        by_product_id: 'prod-byproduct-123',
        quantity: 0,
        qa_status: 'pending' as const,
        batch_number: 'B-2025-0156-BP1',
        expiry_date: '2025-02-14T00:00:00Z',
        location_id: 'loc-uuid-123',
      }

      // Act & Assert
      const { registerByProduct } = await import('../scanner-output-service')
      await expect(registerByProduct(input)).rejects.toThrow(
        'Quantity is 0 and not confirmed'
      )
    })

    it('should link by-product LP to main output LP via genealogy', async () => {
      // Arrange
      const input = {
        wo_id: 'wo-uuid-123',
        main_output_lp_id: 'lp-main-123',
        by_product_id: 'prod-byproduct-123',
        quantity: 45,
        qa_status: 'approved' as const,
        batch_number: 'B-2025-0156-BP1',
        expiry_date: '2025-02-14T00:00:00Z',
        location_id: 'loc-uuid-123',
      }

      // Act
      const { registerByProduct } = await import('../scanner-output-service')
      const result = await registerByProduct(input)

      // Assert
      expect(result.genealogy).toBeDefined()
      expect(result.genealogy.main_lp_id).toBe('lp-main-123')
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * validateWO (7 tests):
 *   - 500ms response time validation
 *   - Invalid barcode format rejection
 *   - WO status validation (in_progress/paused)
 *   - Draft/released status rejection
 *   - Remaining qty calculation
 *   - By-products array retrieval
 *   - Shelf life days for expiry
 *
 * registerOutput (5 tests):
 *   - LP creation with scanner data
 *   - WO output_qty update
 *   - Genealogy linking
 *   - Zero qty rejection
 *   - Operator badge support
 *
 * getByProducts (3 tests):
 *   - By-products list retrieval
 *   - Expected qty calculation
 *   - Empty array for no by-products
 *
 * registerByProduct (4 tests):
 *   - By-product LP creation
 *   - Zero qty with confirmation
 *   - Zero qty without confirmation rejection
 *   - Genealogy linking to main LP
 *
 * Total: 19 tests
 */
