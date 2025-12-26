/**
 * GS1 Validation Utilities Tests
 * Tests for GTIN-14 validation and decimal precision utilities
 */

import { describe, it, expect } from 'vitest'
import {
  calculateGtinCheckDigit,
  isValidGtin14,
  hasMaxDecimals,
  GTIN14_LENGTH,
} from '../gs1-validation'

describe('GS1 Validation Utilities', () => {
  describe('GTIN14_LENGTH constant', () => {
    it('should be 14', () => {
      expect(GTIN14_LENGTH).toBe(14)
    })
  })

  describe('calculateGtinCheckDigit', () => {
    it('should calculate correct check digit for valid GTIN-14', () => {
      // Example from GS1: 01234567890128 has check digit 8
      expect(calculateGtinCheckDigit('01234567890128')).toBe(8)
    })

    it('should calculate check digit 0 when sum is divisible by 10', () => {
      // 00000000000000 should have check digit 0
      expect(calculateGtinCheckDigit('00000000000000')).toBe(0)
    })

    it('should handle GTIN-14 starting with zeros', () => {
      expect(calculateGtinCheckDigit('00012345678905')).toBe(5)
    })
  })

  describe('isValidGtin14', () => {
    it('should return true for valid GTIN-14 with correct check digit', () => {
      expect(isValidGtin14('01234567890128')).toBe(true)
    })

    it('should return false for GTIN-14 with incorrect check digit', () => {
      expect(isValidGtin14('01234567890129')).toBe(false)
    })

    it('should return false for non-numeric characters', () => {
      expect(isValidGtin14('0123456789012a')).toBe(false)
    })

    it('should return false for incorrect length (too short)', () => {
      expect(isValidGtin14('012345678901')).toBe(false)
    })

    it('should return false for incorrect length (too long)', () => {
      expect(isValidGtin14('012345678901234')).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isValidGtin14('')).toBe(false)
    })

    it('should return false for string with spaces', () => {
      expect(isValidGtin14('0123 567890128')).toBe(false)
    })
  })

  describe('hasMaxDecimals', () => {
    it('should return true for integer values', () => {
      expect(hasMaxDecimals(100, 4)).toBe(true)
      expect(hasMaxDecimals(0, 4)).toBe(true)
      expect(hasMaxDecimals(-50, 4)).toBe(true)
    })

    it('should return true for values with fewer decimals than max', () => {
      expect(hasMaxDecimals(10.5, 4)).toBe(true)
      expect(hasMaxDecimals(10.12, 4)).toBe(true)
      expect(hasMaxDecimals(10.123, 4)).toBe(true)
    })

    it('should return true for values with exactly max decimals', () => {
      expect(hasMaxDecimals(10.1234, 4)).toBe(true)
    })

    it('should return false for values with more decimals than max', () => {
      expect(hasMaxDecimals(10.12345, 4)).toBe(false)
      expect(hasMaxDecimals(10.123456, 4)).toBe(false)
    })

    it('should work with different maxDecimals values', () => {
      expect(hasMaxDecimals(10.12, 2)).toBe(true)
      expect(hasMaxDecimals(10.123, 2)).toBe(false)
      expect(hasMaxDecimals(10.1, 0)).toBe(false)
      expect(hasMaxDecimals(10, 0)).toBe(true)
    })
  })
})
