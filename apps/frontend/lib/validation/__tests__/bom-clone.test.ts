/**
 * BOM Clone Validation - Unit Tests (Story 02.6)
 * Purpose: Test Zod schemas for BOM clone request validation
 * Phase: GREEN - Tests implemented with actual assertions
 */

import { describe, it, expect } from 'vitest'
import { cloneBOMSchema } from '../bom-clone'

describe('cloneBOMSchema Validation (Story 02.6)', () => {
  const validUUID = '11111111-1111-1111-1111-111111111111'

  // Get today's date and future dates for testing
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]

  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const tomorrowStr = tomorrow.toISOString().split('T')[0]

  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  describe('target_product_id', () => {
    it('should reject when target_product_id is missing', () => {
      const result = cloneBOMSchema.safeParse({})
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.some(e => e.path.includes('target_product_id'))).toBe(true)
      }
    })

    it('should reject when target_product_id is not a UUID', () => {
      const result = cloneBOMSchema.safeParse({ target_product_id: 'not-a-uuid' })
      expect(result.success).toBe(false)
    })

    it('should reject when target_product_id is empty string', () => {
      const result = cloneBOMSchema.safeParse({ target_product_id: '' })
      expect(result.success).toBe(false)
    })

    it('should accept valid UUID for target_product_id', () => {
      const result = cloneBOMSchema.safeParse({ target_product_id: validUUID })
      expect(result.success).toBe(true)
    })
  })

  describe('effective_from', () => {
    it('should be optional', () => {
      const result = cloneBOMSchema.safeParse({ target_product_id: validUUID })
      expect(result.success).toBe(true)
    })

    it('should reject invalid date format', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        effective_from: 'not-a-date',
      })
      expect(result.success).toBe(false)
    })

    it('should reject date in the past', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        effective_from: yesterdayStr,
      })
      expect(result.success).toBe(false)
    })

    it('should accept today\'s date', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        effective_from: todayStr,
      })
      expect(result.success).toBe(true)
    })

    it('should accept future date', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        effective_from: tomorrowStr,
      })
      expect(result.success).toBe(true)
    })

    it('should handle ISO date format (YYYY-MM-DD)', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        effective_from: '2025-12-31',
      })
      expect(result.success).toBe(true)
    })

    it('should handle ISO datetime format', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        effective_from: '2025-12-31T12:00:00Z',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('effective_to', () => {
    it('should be optional', () => {
      const result = cloneBOMSchema.safeParse({ target_product_id: validUUID })
      expect(result.success).toBe(true)
    })

    it('should accept null', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        effective_to: null,
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid date format', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        effective_to: 'not-a-date',
      })
      expect(result.success).toBe(false)
    })

    it('should accept future date', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        effective_to: '2025-12-31',
      })
      expect(result.success).toBe(true)
    })

    it('should reject when effective_to is before effective_from', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        effective_from: '2024-06-01',
        effective_to: '2024-01-01',
      })
      expect(result.success).toBe(false)
    })

    it('should accept when effective_to equals effective_from', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        effective_from: tomorrowStr,
        effective_to: tomorrowStr,
      })
      expect(result.success).toBe(true)
    })

    it('should accept when effective_to is after effective_from', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        effective_from: '2025-06-01',
        effective_to: '2025-12-31',
      })
      expect(result.success).toBe(true)
    })
  })

  describe('status', () => {
    it('should default to draft when not provided', () => {
      const result = cloneBOMSchema.safeParse({ target_product_id: validUUID })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('draft')
      }
    })

    it('should accept draft status', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        status: 'draft',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('draft')
      }
    })

    it('should accept active status', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        status: 'active',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.status).toBe('active')
      }
    })

    it('should reject invalid status', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        status: 'invalid',
      })
      expect(result.success).toBe(false)
    })

    it('should reject empty status', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        status: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('notes', () => {
    it('should be optional', () => {
      const result = cloneBOMSchema.safeParse({ target_product_id: validUUID })
      expect(result.success).toBe(true)
    })

    it('should accept notes up to 2000 characters', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        notes: 'a'.repeat(2000),
      })
      expect(result.success).toBe(true)
    })

    it('should reject notes exceeding 2000 characters', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        notes: 'a'.repeat(2001),
      })
      expect(result.success).toBe(false)
    })

    it('should accept empty notes string', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        notes: '',
      })
      expect(result.success).toBe(true)
    })

    it('should accept notes with special characters', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        notes: "Cloned from v1 - includes: water, flour, salt & yeast!",
      })
      expect(result.success).toBe(true)
    })

    it('should accept notes with newlines', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        notes: "Line 1\nLine 2\nLine 3",
      })
      expect(result.success).toBe(true)
    })
  })

  describe('Integration - Date Range Validation', () => {
    it('should validate complete date range (from and to)', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        effective_from: '2025-06-01',
        effective_to: '2025-12-31',
      })
      expect(result.success).toBe(true)
    })

    it('should not validate date range if from is missing', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        effective_to: '2025-12-31',
      })
      // Should pass - from not required, no range validation
      expect(result.success).toBe(true)
    })

    it('should not validate date range if to is missing', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        effective_from: tomorrowStr,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('Full Request Validation', () => {
    it('should validate valid complete request', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
        effective_from: tomorrowStr,
        effective_to: '2025-12-31',
        status: 'draft',
        notes: 'Cloned from v1',
      })
      expect(result.success).toBe(true)
    })

    it('should validate minimal valid request', () => {
      const result = cloneBOMSchema.safeParse({
        target_product_id: validUUID,
      })
      expect(result.success).toBe(true)
    })

    it('should provide helpful error messages', () => {
      const result = cloneBOMSchema.safeParse({ target_product_id: 'invalid' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.errors.length).toBeGreaterThan(0)
      }
    })
  })
})
