/**
 * Unit Tests: useScannerFlow Hook
 * Story: 04.6b - Material Consumption Scanner
 * Phase: TDD RED - All tests should FAIL (no implementation yet)
 *
 * Tests the scanner flow state machine for 6-step consumption process:
 * - scan_wo: Initial state, scan work order barcode
 * - scan_lp: Scan license plate barcode
 * - enter_qty: Enter consumption quantity (number pad)
 * - review: Review consumption details before confirm
 * - confirm: Processing/confirming consumption
 * - next: Success state, option for next material or done
 *
 * Coverage Target: 90%
 * Test Count: 18 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

describe('04.6b useScannerFlow Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Initial State', () => {
    it('should initialize with scan_wo state', async () => {
      const { useScannerFlow } = await import('@/lib/hooks/use-scanner-flow')
      const { result } = renderHook(() => useScannerFlow())

      expect(result.current.state).toBe('scan_wo')
      expect(result.current.step).toBe(1)
      expect(result.current.woData).toBeNull()
      expect(result.current.lpData).toBeNull()
      expect(result.current.consumeQty).toBeNull()
    })

    it('should have correct total steps (6)', async () => {
      const { useScannerFlow } = await import('@/lib/hooks/use-scanner-flow')
      const { result } = renderHook(() => useScannerFlow())

      expect(result.current.totalSteps).toBe(6)
    })
  })

  describe('WO Scan Transition (scan_wo -> scan_lp)', () => {
    // AC-04.6b-001: Valid WO barcode transitions to scan_lp
    it('should transition to scan_lp when valid WO scanned', async () => {
      const { useScannerFlow } = await import('@/lib/hooks/use-scanner-flow')
      const { result } = renderHook(() => useScannerFlow())

      const mockWO = {
        id: 'wo-123',
        wo_number: 'WO-2025-0156',
        product_name: 'Test Product',
        status: 'in_progress',
        materials: [
          { id: 'mat-1', material_name: 'Flour', required_qty: 100, consumed_qty: 0 },
        ],
      }

      await act(async () => {
        await result.current.handleWOScan(mockWO)
      })

      expect(result.current.state).toBe('scan_lp')
      expect(result.current.step).toBe(2)
      expect(result.current.woData).toEqual(mockWO)
    })

    it('should store WO data with materials list', async () => {
      const { useScannerFlow } = await import('@/lib/hooks/use-scanner-flow')
      const { result } = renderHook(() => useScannerFlow())

      const mockWO = {
        id: 'wo-456',
        wo_number: 'WO-2025-0200',
        product_name: 'Cookie Dough',
        status: 'started',
        materials: [
          { id: 'mat-1', material_name: 'Sugar', required_qty: 50, consumed_qty: 10 },
          { id: 'mat-2', material_name: 'Butter', required_qty: 25, consumed_qty: 0 },
        ],
      }

      await act(async () => {
        await result.current.handleWOScan(mockWO)
      })

      expect(result.current.woData?.materials).toHaveLength(2)
      expect(result.current.woData?.wo_number).toBe('WO-2025-0200')
    })

    // AC-04.6b-002: Error state for invalid WO
    it('should set error state for invalid WO', async () => {
      const { useScannerFlow } = await import('@/lib/hooks/use-scanner-flow')
      const { result } = renderHook(() => useScannerFlow())

      await act(async () => {
        await result.current.handleWOScanError('WO_NOT_FOUND', 'Invalid WO barcode')
      })

      expect(result.current.state).toBe('scan_wo') // Stay in same state
      expect(result.current.error).toEqual({
        code: 'WO_NOT_FOUND',
        message: 'Invalid WO barcode',
      })
    })
  })

  describe('LP Scan Transition (scan_lp -> enter_qty)', () => {
    // AC-04.6b-003: Valid LP barcode transitions to enter_qty
    it('should transition to enter_qty when valid LP scanned', async () => {
      const { useScannerFlow } = await import('@/lib/hooks/use-scanner-flow')
      const { result } = renderHook(() => useScannerFlow())

      // First, set up WO state
      const mockWO = {
        id: 'wo-123',
        wo_number: 'WO-2025-0156',
        product_name: 'Test Product',
        status: 'in_progress',
        materials: [{ id: 'mat-1', material_name: 'Flour', required_qty: 100, consumed_qty: 0 }],
      }

      await act(async () => {
        await result.current.handleWOScan(mockWO)
      })

      const mockLP = {
        id: 'lp-789',
        lp_number: 'LP-2025-01234',
        product_name: 'Flour',
        quantity: 500,
        uom: 'kg',
        batch_number: 'BATCH-001',
        expiry_date: '2025-12-31',
      }

      await act(async () => {
        await result.current.handleLPScan(mockLP)
      })

      expect(result.current.state).toBe('enter_qty')
      expect(result.current.step).toBe(3)
      expect(result.current.lpData).toEqual(mockLP)
    })

    // AC-04.6b-004: Product mismatch error
    it('should set error for product mismatch', async () => {
      const { useScannerFlow } = await import('@/lib/hooks/use-scanner-flow')
      const { result } = renderHook(() => useScannerFlow())

      // Setup WO state
      const mockWO = {
        id: 'wo-123',
        wo_number: 'WO-2025-0156',
        product_name: 'Test Product',
        status: 'in_progress',
        materials: [{ id: 'mat-1', material_name: 'Flour', required_qty: 100, consumed_qty: 0, product_id: 'prod-flour' }],
      }

      await act(async () => {
        await result.current.handleWOScan(mockWO)
      })

      await act(async () => {
        await result.current.handleLPScanError('PRODUCT_MISMATCH', 'Product mismatch: LP contains Sugar, material requires Flour')
      })

      expect(result.current.state).toBe('scan_lp') // Stay in same state
      expect(result.current.error?.code).toBe('PRODUCT_MISMATCH')
    })

    it('should clear LP data when scanning new LP', async () => {
      const { useScannerFlow } = await import('@/lib/hooks/use-scanner-flow')
      const { result } = renderHook(() => useScannerFlow())

      // Setup initial state with LP
      const mockWO = {
        id: 'wo-123',
        wo_number: 'WO-2025-0156',
        product_name: 'Test',
        status: 'in_progress',
        materials: [{ id: 'mat-1', material_name: 'Flour', required_qty: 100, consumed_qty: 0 }],
      }

      await act(async () => {
        await result.current.handleWOScan(mockWO)
        await result.current.handleLPScan({
          id: 'lp-1',
          lp_number: 'LP-001',
          product_name: 'Flour',
          quantity: 100,
          uom: 'kg',
        })
      })

      // Go back and scan different LP
      await act(async () => {
        result.current.goBack()
      })

      expect(result.current.state).toBe('scan_lp')
      expect(result.current.lpData).toBeNull()
    })
  })

  describe('Quantity Entry (enter_qty -> review)', () => {
    // AC-04.6b-005: Manual quantity entry
    it('should accept decimal quantity input', async () => {
      const { useScannerFlow } = await import('@/lib/hooks/use-scanner-flow')
      const { result } = renderHook(() => useScannerFlow())

      // Setup state
      await act(async () => {
        await result.current.handleWOScan({
          id: 'wo-1',
          wo_number: 'WO-001',
          product_name: 'Test',
          status: 'in_progress',
          materials: [{ id: 'mat-1', material_name: 'Flour', required_qty: 100, consumed_qty: 0 }],
        })
        await result.current.handleLPScan({
          id: 'lp-1',
          lp_number: 'LP-001',
          product_name: 'Flour',
          quantity: 500,
          uom: 'kg',
        })
      })

      await act(async () => {
        result.current.setConsumeQty(50.5)
      })

      expect(result.current.consumeQty).toBe(50.5)
    })

    it('should transition to review when quantity confirmed', async () => {
      const { useScannerFlow } = await import('@/lib/hooks/use-scanner-flow')
      const { result } = renderHook(() => useScannerFlow())

      // Setup state
      await act(async () => {
        await result.current.handleWOScan({
          id: 'wo-1',
          wo_number: 'WO-001',
          product_name: 'Test',
          status: 'in_progress',
          materials: [{ id: 'mat-1', material_name: 'Flour', required_qty: 100, consumed_qty: 0 }],
        })
        await result.current.handleLPScan({
          id: 'lp-1',
          lp_number: 'LP-001',
          product_name: 'Flour',
          quantity: 500,
          uom: 'kg',
        })
        result.current.setConsumeQty(250)
        result.current.proceedToReview()
      })

      expect(result.current.state).toBe('review')
      expect(result.current.step).toBe(4)
    })

    // AC-04.6b-006: Full Consumption quick action
    it('should skip to review when Full Consumption tapped', async () => {
      const { useScannerFlow } = await import('@/lib/hooks/use-scanner-flow')
      const { result } = renderHook(() => useScannerFlow())

      // Setup state with LP qty = 500
      await act(async () => {
        await result.current.handleWOScan({
          id: 'wo-1',
          wo_number: 'WO-001',
          product_name: 'Test',
          status: 'in_progress',
          materials: [{ id: 'mat-1', material_name: 'Flour', required_qty: 100, consumed_qty: 0 }],
        })
        await result.current.handleLPScan({
          id: 'lp-1',
          lp_number: 'LP-001',
          product_name: 'Flour',
          quantity: 500,
          uom: 'kg',
        })
      })

      await act(async () => {
        result.current.handleFullConsumption()
      })

      expect(result.current.state).toBe('review')
      expect(result.current.consumeQty).toBe(500) // LP quantity
      expect(result.current.isFullLP).toBe(true)
    })
  })

  describe('Confirmation Flow (review -> confirm -> next)', () => {
    // AC-04.6b-007: Successful consumption confirmation
    it('should transition to confirm state on submit', async () => {
      const { useScannerFlow } = await import('@/lib/hooks/use-scanner-flow')
      const { result } = renderHook(() => useScannerFlow())

      // Setup complete state
      await act(async () => {
        await result.current.handleWOScan({
          id: 'wo-1',
          wo_number: 'WO-001',
          product_name: 'Test',
          status: 'in_progress',
          materials: [{ id: 'mat-1', material_name: 'Flour', required_qty: 100, consumed_qty: 0 }],
        })
        await result.current.handleLPScan({
          id: 'lp-1',
          lp_number: 'LP-001',
          product_name: 'Flour',
          quantity: 500,
          uom: 'kg',
        })
        result.current.setConsumeQty(100)
        result.current.proceedToReview()
      })

      await act(async () => {
        result.current.submitConsumption()
      })

      expect(result.current.state).toBe('confirm')
      expect(result.current.step).toBe(5)
      expect(result.current.isSubmitting).toBe(true)
    })

    it('should transition to next state on API success', async () => {
      const { useScannerFlow } = await import('@/lib/hooks/use-scanner-flow')
      const { result } = renderHook(() => useScannerFlow())

      // Setup and submit
      await act(async () => {
        await result.current.handleWOScan({
          id: 'wo-1',
          wo_number: 'WO-001',
          product_name: 'Test',
          status: 'in_progress',
          materials: [{ id: 'mat-1', material_name: 'Flour', required_qty: 100, consumed_qty: 0 }],
        })
        await result.current.handleLPScan({
          id: 'lp-1',
          lp_number: 'LP-001',
          product_name: 'Flour',
          quantity: 500,
          uom: 'kg',
        })
        result.current.setConsumeQty(100)
        result.current.proceedToReview()
        result.current.submitConsumption()
      })

      // Simulate API success
      await act(async () => {
        await result.current.handleConsumptionSuccess()
      })

      expect(result.current.state).toBe('next')
      expect(result.current.step).toBe(6)
      expect(result.current.isSubmitting).toBe(false)
    })

    it('should return to review on API error', async () => {
      const { useScannerFlow } = await import('@/lib/hooks/use-scanner-flow')
      const { result } = renderHook(() => useScannerFlow())

      // Setup and submit
      await act(async () => {
        await result.current.handleWOScan({
          id: 'wo-1',
          wo_number: 'WO-001',
          product_name: 'Test',
          status: 'in_progress',
          materials: [{ id: 'mat-1', material_name: 'Flour', required_qty: 100, consumed_qty: 0 }],
        })
        await result.current.handleLPScan({
          id: 'lp-1',
          lp_number: 'LP-001',
          product_name: 'Flour',
          quantity: 500,
          uom: 'kg',
        })
        result.current.setConsumeQty(100)
        result.current.proceedToReview()
        result.current.submitConsumption()
      })

      // Simulate API error
      await act(async () => {
        await result.current.handleConsumptionError('CONSUME_FAILED', 'Consumption failed')
      })

      expect(result.current.state).toBe('review')
      expect(result.current.error?.code).toBe('CONSUME_FAILED')
      expect(result.current.isSubmitting).toBe(false)
    })
  })

  describe('Next Material Flow (next -> scan_lp)', () => {
    // AC-04.6b-008: Next Material action
    it('should return to scan_lp when Next Material tapped', async () => {
      const { useScannerFlow } = await import('@/lib/hooks/use-scanner-flow')
      const { result } = renderHook(() => useScannerFlow())

      // Setup complete flow to next state
      await act(async () => {
        await result.current.handleWOScan({
          id: 'wo-1',
          wo_number: 'WO-001',
          product_name: 'Test',
          status: 'in_progress',
          materials: [
            { id: 'mat-1', material_name: 'Flour', required_qty: 100, consumed_qty: 0 },
            { id: 'mat-2', material_name: 'Sugar', required_qty: 50, consumed_qty: 0 },
          ],
        })
        await result.current.handleLPScan({
          id: 'lp-1',
          lp_number: 'LP-001',
          product_name: 'Flour',
          quantity: 100,
          uom: 'kg',
        })
        result.current.handleFullConsumption()
        result.current.submitConsumption()
        await result.current.handleConsumptionSuccess()
      })

      await act(async () => {
        result.current.handleNextMaterial()
      })

      expect(result.current.state).toBe('scan_lp')
      expect(result.current.step).toBe(2)
      expect(result.current.lpData).toBeNull()
      expect(result.current.consumeQty).toBeNull()
      // WO data should be retained
      expect(result.current.woData).not.toBeNull()
    })

    it('should clear LP data but retain WO data', async () => {
      const { useScannerFlow } = await import('@/lib/hooks/use-scanner-flow')
      const { result } = renderHook(() => useScannerFlow())

      // Setup complete flow
      await act(async () => {
        await result.current.handleWOScan({
          id: 'wo-1',
          wo_number: 'WO-001',
          product_name: 'Test',
          status: 'in_progress',
          materials: [{ id: 'mat-1', material_name: 'Flour', required_qty: 100, consumed_qty: 0 }],
        })
        await result.current.handleLPScan({
          id: 'lp-1',
          lp_number: 'LP-001',
          product_name: 'Flour',
          quantity: 100,
          uom: 'kg',
        })
        result.current.handleFullConsumption()
        result.current.submitConsumption()
        await result.current.handleConsumptionSuccess()
        result.current.handleNextMaterial()
      })

      expect(result.current.woData?.wo_number).toBe('WO-001')
      expect(result.current.lpData).toBeNull()
    })
  })

  describe('Reset and Navigation', () => {
    it('should reset to initial state on Done', async () => {
      const { useScannerFlow } = await import('@/lib/hooks/use-scanner-flow')
      const { result } = renderHook(() => useScannerFlow())

      // Setup complete flow
      await act(async () => {
        await result.current.handleWOScan({
          id: 'wo-1',
          wo_number: 'WO-001',
          product_name: 'Test',
          status: 'in_progress',
          materials: [{ id: 'mat-1', material_name: 'Flour', required_qty: 100, consumed_qty: 0 }],
        })
        await result.current.handleLPScan({
          id: 'lp-1',
          lp_number: 'LP-001',
          product_name: 'Flour',
          quantity: 100,
          uom: 'kg',
        })
        result.current.handleFullConsumption()
        result.current.submitConsumption()
        await result.current.handleConsumptionSuccess()
      })

      await act(async () => {
        result.current.handleDone()
      })

      expect(result.current.state).toBe('scan_wo')
      expect(result.current.step).toBe(1)
      expect(result.current.woData).toBeNull()
      expect(result.current.lpData).toBeNull()
      expect(result.current.consumeQty).toBeNull()
    })

    it('should support goBack navigation', async () => {
      const { useScannerFlow } = await import('@/lib/hooks/use-scanner-flow')
      const { result } = renderHook(() => useScannerFlow())

      // Move to step 3
      await act(async () => {
        await result.current.handleWOScan({
          id: 'wo-1',
          wo_number: 'WO-001',
          product_name: 'Test',
          status: 'in_progress',
          materials: [{ id: 'mat-1', material_name: 'Flour', required_qty: 100, consumed_qty: 0 }],
        })
        await result.current.handleLPScan({
          id: 'lp-1',
          lp_number: 'LP-001',
          product_name: 'Flour',
          quantity: 100,
          uom: 'kg',
        })
      })

      expect(result.current.state).toBe('enter_qty')

      await act(async () => {
        result.current.goBack()
      })

      expect(result.current.state).toBe('scan_lp')
      expect(result.current.step).toBe(2)
    })
  })
})

/**
 * Test Summary for useScannerFlow Hook
 * =====================================
 *
 * Test Coverage:
 * - Initial State: 2 tests
 * - WO Scan Transition: 3 tests
 * - LP Scan Transition: 3 tests
 * - Quantity Entry: 3 tests
 * - Confirmation Flow: 3 tests
 * - Next Material Flow: 2 tests
 * - Reset and Navigation: 2 tests
 * - Total: 18 test cases
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * - useScannerFlow hook not implemented
 *
 * Next Steps for FRONTEND-DEV:
 * 1. Create lib/hooks/use-scanner-flow.ts
 * 2. Implement state machine with useReducer
 * 3. Define all state transitions
 * 4. Implement action handlers
 * 5. Run tests - should transition from RED to GREEN
 *
 * Files to Create:
 * - apps/frontend/lib/hooks/use-scanner-flow.ts
 *
 * Coverage Target: 90%
 */
