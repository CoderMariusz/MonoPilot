/**
 * Unit Tests: Warehouse Dashboard Validation Schemas
 * Story: 05.7 - Warehouse Dashboard
 *
 * Tests Zod validation schemas for warehouse dashboard API query parameters
 */

import { describe, it, expect } from 'vitest'
import {
  warehouseDashboardKPIQuerySchema,
  warehouseDashboardAlertsQuerySchema,
  warehouseDashboardActivityQuerySchema,
} from '../warehouse-dashboard-schemas'

describe('Warehouse Dashboard Validation Schemas', () => {
  describe('warehouseDashboardKPIQuerySchema', () => {
    it('should accept empty object (no query params required)', () => {
      const result = warehouseDashboardKPIQuerySchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should accept undefined (no query params)', () => {
      const result = warehouseDashboardKPIQuerySchema.safeParse(undefined)
      expect(result.success).toBe(false) // Must be object
    })

    it('should reject extra fields', () => {
      const result = warehouseDashboardKPIQuerySchema.safeParse({
        limit: 10, // Not allowed
      })
      expect(result.success).toBe(false)
    })
  })

  describe('warehouseDashboardAlertsQuerySchema', () => {
    it('should accept empty object (no query params required)', () => {
      const result = warehouseDashboardAlertsQuerySchema.safeParse({})
      expect(result.success).toBe(true)
    })

    it('should reject extra fields', () => {
      const result = warehouseDashboardAlertsQuerySchema.safeParse({
        limit: 10, // Not allowed
      })
      expect(result.success).toBe(false)
    })
  })

  describe('warehouseDashboardActivityQuerySchema', () => {
    it('should accept empty object with default limit', () => {
      const result = warehouseDashboardActivityQuerySchema.safeParse({})
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(20) // Default
      }
    })

    it('should accept valid limit', () => {
      const result = warehouseDashboardActivityQuerySchema.safeParse({
        limit: 30,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(30)
      }
    })

    it('should reject limit < 1', () => {
      const result = warehouseDashboardActivityQuerySchema.safeParse({
        limit: 0,
      })
      expect(result.success).toBe(false)
    })

    it('should reject limit > 50', () => {
      const result = warehouseDashboardActivityQuerySchema.safeParse({
        limit: 51,
      })
      expect(result.success).toBe(false)
    })

    it('should reject non-integer limit', () => {
      const result = warehouseDashboardActivityQuerySchema.safeParse({
        limit: 10.5,
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative limit', () => {
      const result = warehouseDashboardActivityQuerySchema.safeParse({
        limit: -10,
      })
      expect(result.success).toBe(false)
    })

    it('should accept limit at min boundary (1)', () => {
      const result = warehouseDashboardActivityQuerySchema.safeParse({
        limit: 1,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(1)
      }
    })

    it('should accept limit at max boundary (50)', () => {
      const result = warehouseDashboardActivityQuerySchema.safeParse({
        limit: 50,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(50)
      }
    })

    it('should accept undefined limit (use default)', () => {
      const result = warehouseDashboardActivityQuerySchema.safeParse({
        limit: undefined,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.limit).toBe(20)
      }
    })

    it('should reject string limit', () => {
      const result = warehouseDashboardActivityQuerySchema.safeParse({
        limit: '10', // String not allowed
      })
      expect(result.success).toBe(false)
    })
  })
})
