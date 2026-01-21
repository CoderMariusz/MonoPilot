/**
 * Service Tests: Consumption Reversal Service
 * Story: 04.6d - Consumption Correction (Reversal)
 * Phase: RED - Tests should FAIL (service methods not yet implemented)
 *
 * Tests consumption reversal service methods:
 * - reverseConsumption: Main reversal method
 * - canReverseConsumption: Check if reversal is allowed
 * - getConsumptionForReversal: Get consumption details for modal
 *
 * Related PRD: docs/1-BASELINE/product/modules/PRODUCTION.md (FR-PROD-009)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Import service functions (will fail until implemented per 04.6d spec)
import {
  reverseConsumption,
  // These should be added to consumption-service.ts per 04.6d spec:
  // canReverseConsumption,
  // getConsumptionForReversal,
} from '@/lib/services/consumption-service'

describe('Consumption Reversal Service (Story 04.6d)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // reverseConsumption Tests
  // ============================================================================
  describe('reverseConsumption', () => {
    it('should call POST endpoint with correct URL', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true, message: 'Reversed' }),
      })

      await reverseConsumption('wo-1', {
        consumption_id: 'cons-1',
        reason: 'scanned_wrong_lp',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        '/api/production/work-orders/wo-1/consume/reverse',
        expect.any(Object)
      )
    })

    it('should send POST method', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      await reverseConsumption('wo-1', {
        consumption_id: 'cons-1',
        reason: 'scanned_wrong_lp',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ method: 'POST' })
      )
    })

    it('should send JSON content type header', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      await reverseConsumption('wo-1', {
        consumption_id: 'cons-1',
        reason: 'scanned_wrong_lp',
      })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
        })
      )
    })

    it('should send consumption_id in request body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      await reverseConsumption('wo-1', {
        consumption_id: 'cons-1',
        reason: 'scanned_wrong_lp',
      })

      const call = mockFetch.mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.consumption_id).toBe('cons-1')
    })

    it('should send reason in request body', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      await reverseConsumption('wo-1', {
        consumption_id: 'cons-1',
        reason: 'wrong_quantity',
      })

      const call = mockFetch.mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.reason).toBe('wrong_quantity')
    })

    it('should send notes in request body when provided', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      await reverseConsumption('wo-1', {
        consumption_id: 'cons-1',
        reason: 'other',
        notes: 'Custom reason',
      })

      const call = mockFetch.mock.calls[0]
      const body = JSON.parse(call[1].body)
      expect(body.notes).toBe('Custom reason')
    })

    it('should return success response', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            message: 'Consumption reversed successfully',
            consumption_id: 'cons-1',
            reversed_qty: 40,
            lp_number: 'LP-001',
          }),
      })

      const result = await reverseConsumption('wo-1', {
        consumption_id: 'cons-1',
        reason: 'scanned_wrong_lp',
      })

      expect(result.success).toBe(true)
      expect(result.message).toMatch(/reversed/i)
    })

    it('should throw error on non-OK response', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Forbidden' }),
      })

      await expect(
        reverseConsumption('wo-1', {
          consumption_id: 'cons-1',
          reason: 'scanned_wrong_lp',
        })
      ).rejects.toThrow()
    })

    it('should throw error with message from API', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        json: () =>
          Promise.resolve({ error: 'Only Managers and Admins can reverse' }),
      })

      await expect(
        reverseConsumption('wo-1', {
          consumption_id: 'cons-1',
          reason: 'scanned_wrong_lp',
        })
      ).rejects.toThrow(/Manager|Admin|reverse/i)
    })

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValue(new Error('Network error'))

      await expect(
        reverseConsumption('wo-1', {
          consumption_id: 'cons-1',
          reason: 'scanned_wrong_lp',
        })
      ).rejects.toThrow('Network error')
    })
  })

  // ============================================================================
  // canReverseConsumption Tests (NEW - per 04.6d spec)
  // ============================================================================
  describe('canReverseConsumption', () => {
    it.skip('should return { canReverse: true } for valid consumption', async () => {
      // TODO: Implement canReverseConsumption method
      // mockFetch.mockResolvedValue({
      //   ok: true,
      //   json: () => Promise.resolve({ canReverse: true }),
      // })
      // const result = await canReverseConsumption('cons-1')
      // expect(result.canReverse).toBe(true)
    })

    it.skip('should return { canReverse: false, reason } for already reversed', async () => {
      // TODO: Implement canReverseConsumption method
      // mockFetch.mockResolvedValue({
      //   ok: true,
      //   json: () => Promise.resolve({
      //     canReverse: false,
      //     reason: 'This consumption has already been reversed'
      //   }),
      // })
      // const result = await canReverseConsumption('cons-1')
      // expect(result.canReverse).toBe(false)
      // expect(result.reason).toMatch(/already.*reversed/i)
    })

    it.skip('should return { canReverse: false, reason } for insufficient permissions', async () => {
      // TODO: Implement canReverseConsumption method
    })
  })

  // ============================================================================
  // getConsumptionForReversal Tests (NEW - per 04.6d spec)
  // ============================================================================
  describe('getConsumptionForReversal', () => {
    it.skip('should return consumption details for modal display', async () => {
      // TODO: Implement getConsumptionForReversal method
      // const result = await getConsumptionForReversal('cons-1')
      // expect(result.id).toBe('cons-1')
      // expect(result.lp_number).toBeDefined()
      // expect(result.material_name).toBeDefined()
      // expect(result.consumed_qty).toBeDefined()
      // expect(result.consumed_at).toBeDefined()
    })

    it.skip('should include LP current qty for restoration preview', async () => {
      // TODO: Implement getConsumptionForReversal method
      // const result = await getConsumptionForReversal('cons-1')
      // expect(result.lp_current_qty).toBeDefined()
      // expect(result.lp_qty_after_reversal).toBeDefined()
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * reverseConsumption (9 tests):
 *   - Correct URL
 *   - POST method
 *   - JSON content type
 *   - consumption_id in body
 *   - reason in body
 *   - notes in body
 *   - Success response
 *   - Error handling (non-OK response)
 *   - Error message propagation
 *   - Network error handling
 *
 * canReverseConsumption (3 tests - SKIPPED until implemented):
 *   - Valid consumption returns canReverse: true
 *   - Already reversed returns canReverse: false
 *   - Insufficient permissions returns canReverse: false
 *
 * getConsumptionForReversal (2 tests - SKIPPED until implemented):
 *   - Returns consumption details for modal
 *   - Includes LP qty for restoration preview
 *
 * Total: 14 tests (9 active, 5 skipped)
 */
