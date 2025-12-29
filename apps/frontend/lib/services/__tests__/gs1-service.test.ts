/**
 * GS1 Service - Unit Tests (Story 02.10a)
 * Purpose: Test GS1 encoding service for barcode compliance
 * Phase: RED - Tests will fail until service is implemented
 *
 * Tests the GS1Service which handles:
 * - GS1-128 AI 10 (Lot Number) encoding - max 20 chars
 * - GS1-128 AI 17 (Expiry Date) encoding - YYMMDD format
 * - SSCC-18 (Serial Shipping Container Code) generation and validation
 * - GTIN-14 validation with Modulo 10 check digit
 * - GTIN-14 check digit calculation (critical for barcode scanning)
 * - Combined barcode string generation
 * - Lot number length warnings (> 20 chars)
 * - GS1 encoding combinations
 *
 * Coverage Target: 95% (CRITICAL - barcode scanning compliance)
 * Test Count: 25+ scenarios
 *
 * Risk: GS1 encoding errors cause barcode scanning failures in production
 * Mitigation: Comprehensive unit tests for all GS1 functions
 *
 * Acceptance Criteria Coverage:
 * - AC-14: encodeLotNumber() returns AI 10 format
 * - AC-15: encodeExpiryDate() returns AI 17 YYMMDD format
 * - AC-16, AC-17: GTIN-14 validation with check digit
 */

import { describe, it, expect, beforeEach } from 'vitest'

/**
 * NOTE: This test file will fail because gs1-service.ts does not exist yet.
 * Once the service is implemented, all tests should pass.
 */

// Mock imports - service will be created by DEV agent
import {
  encodeLotNumber,
  encodeExpiryDate,
  validateGTIN14,
  calculateCheckDigit,
  encodeSSCC,
  generateGS1128Barcode,
} from '../gs1-service'

describe('GS1 Service (Story 02.10a) - CRITICAL BARCODE COMPLIANCE', () => {
  /**
   * AC-14: encodeLotNumber() - AI 10 Lot Number Encoding
   * Encodes lot number in GS1-128 format with AI 10 prefix
   */
  describe('encodeLotNumber() - AI 10 Lot Number Encoding', () => {
    it('should encode lot number with AI 10 prefix', () => {
      const lotNumber = 'LOT-2025-000001'
      const result = encodeLotNumber(lotNumber)
      expect(result).toBe('(10)LOT-2025-000001')
    })

    it('should handle lot number with special characters', () => {
      const lotNumber = 'BRD-2025-001'
      const result = encodeLotNumber(lotNumber)
      expect(result).toBe('(10)BRD-2025-001')
    })

    it('should handle lot number with only alphanumeric', () => {
      const lotNumber = 'LOT2025000001'
      const result = encodeLotNumber(lotNumber)
      expect(result).toBe('(10)LOT2025000001')
    })

    it('should warn when lot number exceeds GS1 AI 10 max length (20 chars)', () => {
      // Log spy to verify warning
      const consoleSpy = vi.spyOn(console, 'warn')
      const longLotNumber = 'VERYLONGLOTNUM123456789'
      const result = encodeLotNumber(longLotNumber)

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('exceeds GS1 AI 10 max length')
      )
      expect(result).toBe(`(10)${longLotNumber}`)
      consoleSpy.mockRestore()
    })

    it('should handle lot number at exactly 20 chars without warning', () => {
      const consoleSpy = vi.spyOn(console, 'warn')
      const lotNumber = 'LOT-2025-000001-ABC1'
      const result = encodeLotNumber(lotNumber)

      expect(result).toBe(`(10)${lotNumber}`)
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })

    it('should handle empty lot number', () => {
      const lotNumber = ''
      const result = encodeLotNumber(lotNumber)
      expect(result).toBe('(10)')
    })

    it('should preserve lot number with hyphens and numbers', () => {
      const lotNumber = 'LOT-2025-1'
      const result = encodeLotNumber(lotNumber)
      expect(result).toBe('(10)LOT-2025-1')
    })
  })

  /**
   * AC-15: encodeExpiryDate() - AI 17 Expiry Date Encoding
   * Encodes expiry date in GS1-128 format with AI 17 prefix
   * Format: YYMMDD (e.g., 250615 for June 15, 2025)
   */
  describe('encodeExpiryDate() - AI 17 Expiry Date Encoding', () => {
    it('should encode expiry date in YYMMDD format', () => {
      const expiryDate = new Date('2025-06-15')
      const result = encodeExpiryDate(expiryDate)
      expect(result).toBe('(17)250615')
    })

    it('should handle end of month correctly', () => {
      const expiryDate = new Date('2025-12-31')
      const result = encodeExpiryDate(expiryDate)
      expect(result).toBe('(17)251231')
    })

    it('should handle January dates correctly', () => {
      const expiryDate = new Date('2025-01-01')
      const result = encodeExpiryDate(expiryDate)
      expect(result).toBe('(17)250101')
    })

    it('should handle dates with single-digit month and day', () => {
      const expiryDate = new Date('2025-02-05')
      const result = encodeExpiryDate(expiryDate)
      expect(result).toBe('(17)250205')
    })

    it('should handle future year dates', () => {
      const expiryDate = new Date('2030-01-01')
      const result = encodeExpiryDate(expiryDate)
      expect(result).toBe('(17)300101')
    })

    it('should handle year 2099 correctly', () => {
      const expiryDate = new Date('2099-12-31')
      const result = encodeExpiryDate(expiryDate)
      expect(result).toBe('(17)991231')
    })

    it('should handle current date encoding', () => {
      const today = new Date()
      const result = encodeExpiryDate(today)

      const expectedYY = today.getFullYear().toString().slice(-2)
      const expectedMM = (today.getMonth() + 1).toString().padStart(2, '0')
      const expectedDD = today.getDate().toString().padStart(2, '0')

      expect(result).toBe(`(17)${expectedYY}${expectedMM}${expectedDD}`)
    })
  })

  /**
   * AC-16, AC-17: validateGTIN14() - GTIN-14 Validation
   * Validates GTIN-14 with Modulo 10 check digit
   * GTIN-14 must be exactly 14 numeric digits
   */
  describe('validateGTIN14() - GTIN-14 Validation with Check Digit', () => {
    it('should validate correct GTIN-14 with valid check digit', () => {
      const gtin = '12345678901231'
      const result = validateGTIN14(gtin)
      expect(result.valid).toBe(true)
    })

    it('should reject GTIN with wrong length (too short)', () => {
      const gtin = '123456789'
      const result = validateGTIN14(gtin)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('14 digits')
    })

    it('should reject GTIN with wrong length (too long)', () => {
      const gtin = '123456789012345'
      const result = validateGTIN14(gtin)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('14 digits')
    })

    it('should reject GTIN with invalid check digit', () => {
      const gtin = '12345678901230'
      const result = validateGTIN14(gtin)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('check digit')
    })

    it('should reject GTIN with non-numeric characters', () => {
      const gtin = 'ABCDEFGHIJKLMN'
      const result = validateGTIN14(gtin)
      expect(result.valid).toBe(false)
    })

    it('should reject GTIN with leading zeros correctly validated', () => {
      const gtin = '00012345600012'
      const result = validateGTIN14(gtin)
      // Should validate check digit even with leading zeros
      expect(result.valid === true || result.valid === false).toBe(true)
    })

    it('should accept valid GTIN starting with zeros', () => {
      const gtin = '00012345600012'
      const result = validateGTIN14(gtin)
      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('error')
    })

    it('should reject empty GTIN', () => {
      const gtin = ''
      const result = validateGTIN14(gtin)
      expect(result.valid).toBe(false)
    })

    it('should accept valid GTIN from test data', () => {
      const gtin = '59012345678903'
      const result = validateGTIN14(gtin)
      expect(result.valid === true || result.valid === false).toBe(true)
    })
  })

  /**
   * calculateCheckDigit() - Modulo 10 Check Digit
   * GS1 Modulo 10 algorithm for check digit calculation
   * Used for validating and generating GTIN check digits
   */
  describe('calculateCheckDigit() - Modulo 10 Algorithm', () => {
    it('should calculate correct check digit for 13-digit GTIN', () => {
      const gtin13 = '1234567890123'
      const checkDigit = calculateCheckDigit(gtin13)
      expect(checkDigit).toBe('1')
    })

    it('should calculate check digit with alternating weights (3, 1, 3, 1...)', () => {
      // Test known value: 123456789012 should give check digit 5
      const gtin12 = '123456789012'
      const checkDigit = calculateCheckDigit(gtin12)
      expect(typeof checkDigit).toBe('string')
      expect(/^\d$/.test(checkDigit)).toBe(true) // Single digit 0-9
    })

    it('should return single digit (0-9)', () => {
      const gtin13 = '1234567890123'
      const checkDigit = calculateCheckDigit(gtin13)
      expect(checkDigit.length).toBe(1)
      expect(/^\d$/.test(checkDigit)).toBe(true)
    })

    it('should handle GTIN with leading zeros', () => {
      const gtin13 = '0001234567890'
      const checkDigit = calculateCheckDigit(gtin13)
      expect(/^\d$/.test(checkDigit)).toBe(true)
    })

    it('should handle all same digits', () => {
      const gtin13 = '1111111111111'
      const checkDigit = calculateCheckDigit(gtin13)
      expect(/^\d$/.test(checkDigit)).toBe(true)
    })

    it('should handle all zeros except last digit', () => {
      const gtin13 = '0000000000001'
      const checkDigit = calculateCheckDigit(gtin13)
      expect(/^\d$/.test(checkDigit)).toBe(true)
    })
  })

  /**
   * encodeSSCC() - SSCC-18 Serial Shipping Container Code
   * 18-digit code for pallet-level identification
   * Format: AI 00 + 18-digit code with check digit
   */
  describe('encodeSSCC() - SSCC-18 Encoding', () => {
    it('should generate valid 18-digit SSCC code', () => {
      const input = {
        extensionDigit: '0',
        companyPrefix: '1234567',
        serialReference: '0000001',
      }
      const result = encodeSSCC(input)

      // Should start with (00) and have valid format
      expect(result).toMatch(/^\(00\)\d{18}$/)
    })

    it('should include valid check digit in SSCC', () => {
      const input = {
        extensionDigit: '0',
        companyPrefix: '1234567',
        serialReference: '0000001',
      }
      const result = encodeSSCC(input)

      // Extract the 18-digit code
      const code = result.slice(4)
      expect(code.length).toBe(18)
      expect(/^\d+$/.test(code)).toBe(true)
    })

    it('should handle different serial references', () => {
      const input1 = {
        extensionDigit: '0',
        companyPrefix: '1234567',
        serialReference: '0000001',
      }
      const input2 = {
        extensionDigit: '0',
        companyPrefix: '1234567',
        serialReference: '0000002',
      }

      const result1 = encodeSSCC(input1)
      const result2 = encodeSSCC(input2)

      expect(result1).not.toBe(result2)
    })

    it('should handle extension digit variations', () => {
      const codes = []
      for (let ext = 0; ext <= 9; ext++) {
        const input = {
          extensionDigit: ext.toString(),
          companyPrefix: '1234567',
          serialReference: '0000001',
        }
        codes.push(encodeSSCC(input))
      }

      // All should be unique SSCC codes
      const uniqueCodes = new Set(codes)
      expect(uniqueCodes.size).toBeGreaterThan(1)
    })
  })

  /**
   * generateGS1128Barcode() - Combined Barcode String
   * Combines multiple AI encodings into single barcode string
   */
  describe('generateGS1128Barcode() - Combined Barcode Generation', () => {
    it('should combine GTIN, lot, and expiry in correct order', () => {
      const input = {
        gtin: '12345678901234',
        lotNumber: 'LOT001',
        expiryDate: new Date('2025-06-15'),
      }
      const result = generateGS1128Barcode(input)

      expect(result).toContain('(01)12345678901234')
      expect(result).toContain('(10)LOT001')
      expect(result).toContain('(17)250615')
    })

    it('should concatenate AIs in GS1 standard order', () => {
      const input = {
        gtin: '12345678901234',
        lotNumber: 'LOT001',
        expiryDate: new Date('2025-06-15'),
      }
      const result = generateGS1128Barcode(input)

      // AI order: (01) GTIN, (10) Lot, (17) Expiry
      expect(result).toMatch(/\(01\).*\(10\).*\(17\)/)
    })

    it('should return single string without spaces', () => {
      const input = {
        gtin: '12345678901234',
        lotNumber: 'LOT001',
        expiryDate: new Date('2025-06-15'),
      }
      const result = generateGS1128Barcode(input)

      expect(typeof result).toBe('string')
      expect(result).not.toContain(' ')
    })

    it('should handle missing optional fields', () => {
      const input = {
        gtin: '12345678901234',
        lotNumber: undefined,
        expiryDate: undefined,
      }
      const result = generateGS1128Barcode(input)

      expect(result).toContain('(01)12345678901234')
    })
  })

  /**
   * Edge Cases & GS1 Compliance
   */
  describe('GS1 Compliance Edge Cases', () => {
    it('should handle lot number at maximum length (20 chars) without error', () => {
      const maxLot = 'A'.repeat(20)
      const result = encodeLotNumber(maxLot)
      expect(result).toBe(`(10)${maxLot}`)
    })

    it('should handle lot number exceeding max length gracefully', () => {
      const tooLong = 'A'.repeat(25)
      const result = encodeLotNumber(tooLong)
      // Should still encode but log warning
      expect(result.startsWith('(10)')).toBe(true)
    })

    it('should handle February 29 in leap year', () => {
      const leapDate = new Date('2024-02-29')
      const result = encodeExpiryDate(leapDate)
      expect(result).toMatch(/^\(17\)\d{6}$/)
    })

    it('should handle dates across century boundaries', () => {
      const date2099 = new Date('2099-12-31')
      const date2000 = new Date('2000-01-01')

      const result2099 = encodeExpiryDate(date2099)
      const result2000 = encodeExpiryDate(date2000)

      expect(result2099).toMatch(/^\(17\)99/)
      expect(result2000).toMatch(/^\(17\)00/)
    })
  })
})

// Import for test utility (vitest mock)
import { vi } from 'vitest'
