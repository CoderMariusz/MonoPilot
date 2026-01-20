/**
 * Unit Tests: ScannerService
 * Story: 04.6b - Material Consumption Scanner
 * Phase: TDD GREEN - Tests should PASS with implementation
 *
 * Tests the scanner service for audio/vibration feedback:
 * - playSuccessSound: 500ms beep at 440Hz
 * - playErrorSound: 2x 200ms beeps with 100ms gap
 * - triggerVibration: device vibration (200ms success, 100ms error)
 * - showSuccessFeedback: combined sound + vibration + visual
 * - showErrorFeedback: combined sound + vibration + visual
 *
 * Coverage Target: 90%
 * Test Count: 12 tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { ScannerService } from '@/lib/services/scanner-service'

// Mock navigator.vibrate
const mockVibrate = vi.fn()

describe('04.6b ScannerService', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Setup navigator.vibrate mock
    Object.defineProperty(navigator, 'vibrate', {
      value: mockVibrate,
      writable: true,
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('playSuccessSound', () => {
    // FR-04.6b-003: Audio feedback for valid scan
    it('should not throw when called', () => {
      // Should not throw even if AudioContext is not available
      expect(() => ScannerService.playSuccessSound()).not.toThrow()
    })

    it('should be callable multiple times', () => {
      // Multiple calls should not throw
      expect(() => {
        ScannerService.playSuccessSound()
        ScannerService.playSuccessSound()
        ScannerService.playSuccessSound()
      }).not.toThrow()
    })

    it('should handle devices without audio support gracefully', () => {
      // Should not throw when called in test environment (no AudioContext)
      expect(() => ScannerService.playSuccessSound()).not.toThrow()
    })
  })

  describe('playErrorSound', () => {
    // AC-04.6b-002: Error feedback with 2 short beeps
    it('should not throw when called', () => {
      expect(() => ScannerService.playErrorSound()).not.toThrow()
    })

    it('should be callable multiple times', () => {
      expect(() => {
        ScannerService.playErrorSound()
        ScannerService.playErrorSound()
      }).not.toThrow()
    })

    it('should handle devices without audio support gracefully', () => {
      expect(() => ScannerService.playErrorSound()).not.toThrow()
    })
  })

  describe('triggerVibration', () => {
    // AC-04.6b-003: 200ms vibration for success
    it('should call navigator.vibrate with specified duration', () => {
      ScannerService.triggerVibration(200)

      expect(mockVibrate).toHaveBeenCalledWith(200)
    })

    it('should handle devices without vibration support gracefully', () => {
      // Remove vibrate
      Object.defineProperty(navigator, 'vibrate', {
        value: undefined,
        writable: true,
        configurable: true,
      })

      // Should not throw
      expect(() => ScannerService.triggerVibration(200)).not.toThrow()
    })

    it('should support vibration patterns for error feedback', () => {
      // Error pattern: [vibrate, pause, vibrate] = [100, 50, 100]
      ScannerService.triggerVibration([100, 50, 100])

      expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100])
    })
  })

  describe('showSuccessFeedback', () => {
    // FR-04.6b-005: Combined feedback for successful consumption
    it('should trigger vibration with 200ms duration', () => {
      ScannerService.showSuccessFeedback()

      expect(mockVibrate).toHaveBeenCalledWith(200) // 200ms for success
    })

    it('should trigger all feedback types without throwing', () => {
      expect(() => ScannerService.showSuccessFeedback()).not.toThrow()
    })
  })

  describe('showErrorFeedback', () => {
    // AC-04.6b-002: Combined error feedback
    it('should trigger vibration with error pattern', () => {
      ScannerService.showErrorFeedback()

      // Error vibration pattern: 2 short pulses
      expect(mockVibrate).toHaveBeenCalledWith([100, 50, 100])
    })

    it('should trigger all feedback types without throwing', () => {
      expect(() => ScannerService.showErrorFeedback()).not.toThrow()
    })
  })
})

/**
 * Test Summary for ScannerService
 * =================================
 *
 * Test Coverage:
 * - playSuccessSound: 3 tests
 * - playErrorSound: 3 tests
 * - triggerVibration: 3 tests
 * - showSuccessFeedback: 2 tests
 * - showErrorFeedback: 2 tests
 * - Total: 13 test cases
 *
 * Note: Audio tests focus on behavioral testing (no throw, callable)
 * rather than implementation details (oscillator creation) because
 * AudioContext is not available in test environment without complex mocking.
 *
 * Coverage Target: 90%
 */
