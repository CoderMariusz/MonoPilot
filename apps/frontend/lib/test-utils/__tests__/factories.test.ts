/**
 * Test Factories Unit Tests
 *
 * These tests verify that all factory functions:
 * 1. Return properly typed objects
 * 2. Accept and apply overrides correctly
 * 3. Produce objects that match expected interfaces
 *
 * RED PHASE: All tests should FAIL initially
 */

import { describe, it, expect } from 'vitest'
import {
  createMockGanttProduct,
  createMockGanttWO,
  createMockOrganization,
  createMockPOStatusHistory,
  createMockWOStatus,
  createMockWOPriority,
  createMockMaterialStatus,
  createMockGanttWOBatch,
} from '../factories'
import type {
  GanttWorkOrder,
  GanttProduct,
  WOStatus,
  MaterialStatus,
  Organization,
  POStatusHistory,
  WOPriority,
} from '../factories'

describe('Test Factories', () => {
  describe('createMockGanttProduct', () => {
    it('should create a default product with all required fields', () => {
      const product = createMockGanttProduct()

      expect(product.id).toBeDefined()
      expect(product.code).toBeDefined()
      expect(product.name).toBeDefined()
    })

    it('should apply overrides correctly', () => {
      const product = createMockGanttProduct({
        id: 'custom-id',
        name: 'Chocolate Bar',
      })

      expect(product.id).toBe('custom-id')
      expect(product.name).toBe('Chocolate Bar')
      expect(product.code).toBe('TEST-PROD') // Default unchanged
    })
  })

  describe('createMockGanttWO', () => {
    it('should create a default work order with all required fields', () => {
      const wo = createMockGanttWO()

      expect(wo.id).toBeDefined()
      expect(wo.wo_number).toBeDefined()
      expect(wo.product).toBeDefined()
      expect(wo.status).toBe('draft')
      expect(wo.material_status).toBe('ok')
      expect(wo.priority).toBe('normal')
      expect(wo.quantity).toBe(100)
      expect(wo.uom).toBe('kg')
      expect(wo.scheduled_date).toBeDefined()
      expect(wo.scheduled_start_time).toBeDefined()
      expect(wo.scheduled_end_time).toBeDefined()
      expect(wo.duration_hours).toBe(8)
      expect(wo.progress_percent).toBe(0)
      expect(wo.is_overdue).toBe(false)
      expect(wo.created_at).toBeDefined()
    })

    it('should apply status override correctly', () => {
      const wo = createMockGanttWO({ status: 'released' as WOStatus })

      expect(wo.status).toBe('released')
    })

    it('should apply material_status override correctly', () => {
      const wo = createMockGanttWO({ material_status: 'low' as MaterialStatus })

      expect(wo.material_status).toBe('low')
    })

    it('should apply nested product override correctly', () => {
      const wo = createMockGanttWO({
        product: { id: 'prod-custom', code: 'CUSTOM', name: 'Custom Product' },
      })

      expect(wo.product.id).toBe('prod-custom')
      expect(wo.product.code).toBe('CUSTOM')
      expect(wo.product.name).toBe('Custom Product')
    })

    it('should type status as WOStatus', () => {
      const wo = createMockGanttWO()
      // Type assertion should work without error
      const status: WOStatus = wo.status
      expect(['draft', 'planned', 'released', 'in_progress', 'on_hold', 'completed', 'closed']).toContain(status)
    })

    it('should type material_status as MaterialStatus', () => {
      const wo = createMockGanttWO()
      // Type assertion should work without error
      const matStatus: MaterialStatus = wo.material_status
      expect(['ok', 'low', 'insufficient']).toContain(matStatus)
    })
  })

  describe('createMockOrganization', () => {
    it('should create a default organization with all required fields', () => {
      const org = createMockOrganization()

      expect(org.id).toBeDefined()
      expect(org.name).toBeDefined()
      expect(org.slug).toBeDefined()
      expect(org.timezone).toBeDefined()
      expect(org.locale).toBeDefined()
      expect(org.currency).toBeDefined()
      expect(org.onboarding_step).toBeDefined()
      expect(org.onboarding_skipped).toBe(false)
      expect(org.is_active).toBe(true)
      expect(org.created_at).toBeDefined()
      expect(org.updated_at).toBeDefined()
    })

    it('should include onboarding_skipped field (previously missing in tests)', () => {
      const org = createMockOrganization()

      expect(org.onboarding_skipped).toBeDefined()
      expect(typeof org.onboarding_skipped).toBe('boolean')
    })

    it('should apply overrides correctly', () => {
      const org = createMockOrganization({
        name: 'Custom Org',
        onboarding_step: 3,
        onboarding_skipped: true,
      })

      expect(org.name).toBe('Custom Org')
      expect(org.onboarding_step).toBe(3)
      expect(org.onboarding_skipped).toBe(true)
    })
  })

  describe('createMockPOStatusHistory', () => {
    it('should create a default PO status history entry', () => {
      const history = createMockPOStatusHistory()

      expect(history.id).toBeDefined()
      expect(history.purchase_order_id).toBeDefined()
      expect(history.event_type).toBe('status_change')
      expect(history.event_date).toBeDefined()
      expect(history.user_id).toBeDefined()
      expect(history.user_name).toBeDefined()
      expect(history.details).toBeDefined()
    })

    it('should apply overrides correctly', () => {
      const history = createMockPOStatusHistory({
        event_type: 'po_approved',
        user_name: 'John Doe',
      })

      expect(history.event_type).toBe('po_approved')
      expect(history.user_name).toBe('John Doe')
    })
  })

  describe('Type Helper Functions', () => {
    it('createMockWOStatus should return properly typed WOStatus', () => {
      const status = createMockWOStatus('in_progress')
      const woStatus: WOStatus = status
      expect(woStatus).toBe('in_progress')
    })

    it('createMockWOPriority should return properly typed WOPriority', () => {
      const priority = createMockWOPriority('high')
      const woPriority: WOPriority = priority
      expect(woPriority).toBe('high')
    })

    it('createMockMaterialStatus should return properly typed MaterialStatus', () => {
      const status = createMockMaterialStatus('insufficient')
      const matStatus: MaterialStatus = status
      expect(matStatus).toBe('insufficient')
    })
  })

  describe('createMockGanttWOBatch', () => {
    it('should create the specified number of work orders', () => {
      const workOrders = createMockGanttWOBatch(5)

      expect(workOrders).toHaveLength(5)
    })

    it('should generate unique IDs for each work order', () => {
      const workOrders = createMockGanttWOBatch(3)

      const ids = workOrders.map((wo) => wo.id)
      const uniqueIds = new Set(ids)

      expect(uniqueIds.size).toBe(3)
    })

    it('should generate unique WO numbers for each work order', () => {
      const workOrders = createMockGanttWOBatch(3)

      const numbers = workOrders.map((wo) => wo.wo_number)
      const uniqueNumbers = new Set(numbers)

      expect(uniqueNumbers.size).toBe(3)
    })

    it('should apply base overrides to all work orders', () => {
      const workOrders = createMockGanttWOBatch(3, { status: 'planned' as WOStatus })

      workOrders.forEach((wo) => {
        expect(wo.status).toBe('planned')
      })
    })
  })
})
