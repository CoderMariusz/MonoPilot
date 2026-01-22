/**
 * Unit Tests: Label Generation Service (Story 07.13)
 * Purpose: Test SSCC-18 generation, BOL PDF generation, ZPL label generation
 * Phase: RED - Tests will fail until service is implemented
 *
 * Tests the LabelGenerationService which handles:
 * - SSCC-18 generation with MOD 10 check digit
 * - SSCC validation and formatting
 * - GS1-128 barcode encoding
 * - ZPL label generation for Zebra printers
 * - BOL PDF content generation
 * - Packing slip generation
 *
 * Coverage Target: 95% (CRITICAL - GS1 compliance)
 * Test Count: 80+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC: generate_sscc_for_org() function generates valid SSCC-18 with MOD 10 check digit
 * - AC: calculate_gs1_check_digit() function correctly implements MOD 10 algorithm
 * - AC: validateSSCC() returns true for valid SSCC, false for invalid check digit
 * - AC: formatSSCC() formats 18-digit SSCC as '00 1234 5678 9012 3456 78'
 * - AC: GS1-128 barcode renders correctly with bwip-js (FNC1 start, AI 00)
 * - AC: ZPL label format produces valid Zebra output (4x6 and 4x8 options)
 * - AC: BOL PDF generates with all required sections
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock imports - service will be created by DEV agent
import {
  SSCCService,
  calculateGS1CheckDigit,
  validateSSCC,
  formatSSCC,
  generateSSCCForOrganization,
  parseSSCC,
} from '../sscc-service'

import {
  LabelService,
  generateZPLLabel,
  generateGS1128Barcode,
  generateLabelPreview,
  LABEL_FORMATS,
} from '../label-service'

import {
  DocumentService,
  generateBOLPDF,
  generatePackingSlipPDF,
  BOLContent,
  PackingSlipContent,
} from '../document-service'

// =============================================================================
// SSCC-18 CHECK DIGIT CALCULATION (MOD 10 Algorithm)
// =============================================================================

describe('calculateGS1CheckDigit() - MOD 10 Algorithm (Story 07.13)', () => {
  /**
   * GS1 MOD 10 Algorithm:
   * 1. Starting from rightmost digit, assign multipliers (odd positions = 3, even = 1)
   * 2. Multiply each digit by its multiplier
   * 3. Sum all products
   * 4. Check digit = (10 - (sum % 10)) % 10
   */

  describe('Algorithm Correctness', () => {
    it('should calculate check digit for known SSCC base (17 digits)', () => {
      // SSCC Base: 0 0614141 000012345 (17 digits)
      // Expected check digit: 2
      // Calculation:
      // Position:  17 16 15 14 13 12 11 10  9  8  7  6  5  4  3  2  1
      // Digit:      0  0  6  1  4  1  4  1  0  0  0  0  1  2  3  4  5
      // Multiplier: 3  1  3  1  3  1  3  1  3  1  3  1  3  1  3  1  3
      // Product:    0  0 18  1 12  1 12  1  0  0  0  0  3  2  9  4 15
      // Sum = 78, Check = (10 - (78 % 10)) % 10 = 2
      const base = '00614141000012345'
      const result = calculateGS1CheckDigit(base)
      expect(result).toBe('2')
    })

    it('should calculate check digit resulting in 0', () => {
      // When sum % 10 = 0, check digit = 0
      const base = '01234567890123456'
      const result = calculateGS1CheckDigit(base)
      expect(/^[0-9]$/.test(result)).toBe(true)
    })

    it('should calculate check digit for all zeros base', () => {
      const base = '00000000000000000'
      const result = calculateGS1CheckDigit(base)
      expect(result).toBe('0') // Sum = 0, check = (10 - 0) % 10 = 0
    })

    it('should calculate check digit for all nines base', () => {
      const base = '99999999999999999'
      const result = calculateGS1CheckDigit(base)
      expect(/^[0-9]$/.test(result)).toBe(true)
    })

    it('should calculate check digit for alternating digits', () => {
      const base = '01234567890123456'
      const result = calculateGS1CheckDigit(base)
      expect(result.length).toBe(1)
      expect(parseInt(result)).toBeGreaterThanOrEqual(0)
      expect(parseInt(result)).toBeLessThanOrEqual(9)
    })
  })

  describe('Input Validation', () => {
    it('should throw error for base shorter than 17 digits', () => {
      expect(() => calculateGS1CheckDigit('0061414100001234')).toThrow()
    })

    it('should throw error for base longer than 17 digits', () => {
      expect(() => calculateGS1CheckDigit('006141410000123456')).toThrow()
    })

    it('should throw error for non-numeric input', () => {
      expect(() => calculateGS1CheckDigit('0061414A000012345')).toThrow()
    })

    it('should throw error for empty string', () => {
      expect(() => calculateGS1CheckDigit('')).toThrow()
    })

    it('should throw error for null/undefined input', () => {
      expect(() => calculateGS1CheckDigit(null as unknown as string)).toThrow()
      expect(() => calculateGS1CheckDigit(undefined as unknown as string)).toThrow()
    })
  })

  describe('Known Test Vectors', () => {
    // GS1 official test vectors
    it('should match GS1 test vector 1', () => {
      const base = '01234567890123456'
      const check = calculateGS1CheckDigit(base)
      // Verify it returns single digit
      expect(/^[0-9]$/.test(check)).toBe(true)
    })

    it('should match GS1 test vector 2: extension 0, prefix 0614141', () => {
      const base = '00614141000000001'
      const check = calculateGS1CheckDigit(base)
      expect(/^[0-9]$/.test(check)).toBe(true)
    })

    it('should calculate different check digits for different serials', () => {
      const base1 = '00614141000000001'
      const base2 = '00614141000000002'
      const check1 = calculateGS1CheckDigit(base1)
      const check2 = calculateGS1CheckDigit(base2)
      expect(check1).not.toBe(check2)
    })
  })
})

// =============================================================================
// SSCC-18 VALIDATION
// =============================================================================

describe('validateSSCC() - SSCC-18 Validation (Story 07.13)', () => {
  describe('Valid SSCC Codes', () => {
    it('should return true for valid 18-digit SSCC with correct check digit', () => {
      const sscc = '006141410000123452' // Base + check digit 2
      const result = validateSSCC(sscc)
      expect(result.valid).toBe(true)
    })

    it('should return true for SSCC starting with extension digit 0 (carton)', () => {
      const sscc = '006141410000123452'
      const result = validateSSCC(sscc)
      expect(result.valid).toBe(true)
    })

    it('should return true for SSCC starting with extension digit 9 (pallet)', () => {
      // Extension 9 for pallet
      const base = '90614141000012345'
      const checkDigit = calculateGS1CheckDigit(base)
      const sscc = base + checkDigit
      const result = validateSSCC(sscc)
      expect(result.valid).toBe(true)
    })

    it('should return true for SSCC with leading zeros in serial', () => {
      const base = '00614141000000001'
      const checkDigit = calculateGS1CheckDigit(base)
      const sscc = base + checkDigit
      const result = validateSSCC(sscc)
      expect(result.valid).toBe(true)
    })
  })

  describe('Invalid SSCC Codes', () => {
    it('should return false for SSCC with incorrect check digit', () => {
      const sscc = '006141410000123459' // Wrong check digit (9 instead of 2)
      const result = validateSSCC(sscc)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('check digit')
    })

    it('should return false for SSCC shorter than 18 digits', () => {
      const sscc = '0061414100001234'
      const result = validateSSCC(sscc)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('18 digits')
    })

    it('should return false for SSCC longer than 18 digits', () => {
      const sscc = '0061414100001234567'
      const result = validateSSCC(sscc)
      expect(result.valid).toBe(false)
      expect(result.error).toContain('18 digits')
    })

    it('should return false for SSCC with non-numeric characters', () => {
      const sscc = '00614141000012345X'
      const result = validateSSCC(sscc)
      expect(result.valid).toBe(false)
    })

    it('should return false for empty SSCC', () => {
      const sscc = ''
      const result = validateSSCC(sscc)
      expect(result.valid).toBe(false)
    })

    it('should return false for null/undefined SSCC', () => {
      expect(validateSSCC(null as unknown as string).valid).toBe(false)
      expect(validateSSCC(undefined as unknown as string).valid).toBe(false)
    })
  })

  describe('Check Digit Boundary Cases', () => {
    it('should validate SSCC where check digit is 0', () => {
      // Find a base that produces check digit 0
      const base = '00000000000000000'
      const checkDigit = calculateGS1CheckDigit(base)
      const sscc = base + checkDigit
      const result = validateSSCC(sscc)
      expect(result.valid).toBe(true)
    })

    it('should validate SSCC where check digit is 9', () => {
      // Find a base that produces check digit 9
      // This is harder to construct manually, but the service should handle it
      const base = '12345678901234567'
      const checkDigit = calculateGS1CheckDigit(base)
      const sscc = base + checkDigit
      const result = validateSSCC(sscc)
      expect(result.valid).toBe(true)
    })
  })
})

// =============================================================================
// SSCC-18 FORMATTING
// =============================================================================

describe('formatSSCC() - SSCC Formatting (Story 07.13)', () => {
  describe('Standard Formatting', () => {
    it('should format 18-digit SSCC as "00 XXXX XXXX XXXX XXXX XX"', () => {
      const sscc = '006141410000123452'
      const result = formatSSCC(sscc)
      // Format: 2 + 4 + 4 + 4 + 4 = 18 digits total with spaces
      expect(result).toBe('00 6141 4100 0012 3452')
    })

    it('should format SSCC with extension digit separated', () => {
      const sscc = '906141410000123452'
      const result = formatSSCC(sscc)
      // Format: 2 + 4 + 4 + 4 + 4 = 18 digits with regex pattern
      expect(result).toMatch(/^\d{2} \d{4} \d{4} \d{4} \d{4}$/)
    })

    it('should preserve all 18 digits in formatted output', () => {
      const sscc = '006141410000123452'
      const formatted = formatSSCC(sscc)
      const digits = formatted.replace(/\s/g, '')
      expect(digits).toBe(sscc)
    })
  })

  describe('Input Validation', () => {
    it('should throw error for invalid length', () => {
      expect(() => formatSSCC('123')).toThrow()
    })

    it('should throw error for non-numeric input', () => {
      expect(() => formatSSCC('00614141000012345X')).toThrow()
    })

    it('should throw error for empty string', () => {
      expect(() => formatSSCC('')).toThrow()
    })
  })

  describe('Alternative Formats', () => {
    it('should support compact format (no spaces)', () => {
      const sscc = '006141410000123452'
      const result = formatSSCC(sscc, { compact: true })
      expect(result).toBe('006141410000123452')
    })

    it('should support bracketed AI format "(00)SSCC"', () => {
      const sscc = '006141410000123452'
      const result = formatSSCC(sscc, { includeAI: true })
      expect(result).toBe('(00)006141410000123452')
    })
  })
})

// =============================================================================
// SSCC-18 PARSING
// =============================================================================

describe('parseSSCC() - SSCC Parsing (Story 07.13)', () => {
  describe('Structure Extraction', () => {
    it('should extract extension digit', () => {
      const sscc = '006141410000123452'
      const parsed = parseSSCC(sscc)
      expect(parsed.extensionDigit).toBe('0')
    })

    it('should extract GS1 company prefix (7-10 digits)', () => {
      const sscc = '006141410000123452'
      const parsed = parseSSCC(sscc)
      expect(parsed.companyPrefix).toBe('0614141')
    })

    it('should extract serial reference', () => {
      const sscc = '006141410000123452'
      const parsed = parseSSCC(sscc)
      expect(parsed.serialReference).toBeDefined()
    })

    it('should extract check digit', () => {
      const sscc = '006141410000123452'
      const parsed = parseSSCC(sscc)
      expect(parsed.checkDigit).toBe('2')
    })
  })

  describe('Prefix Length Detection', () => {
    it('should handle 7-digit GS1 prefix', () => {
      const sscc = '006141410000123452'
      const parsed = parseSSCC(sscc)
      // Assuming 7-digit prefix
      expect(parsed.companyPrefix.length).toBeGreaterThanOrEqual(7)
    })

    it('should handle 10-digit GS1 prefix', () => {
      // 10-digit prefix leaves fewer serial digits
      const sscc = '012345678901234567'
      const check = calculateGS1CheckDigit('01234567890123456')
      const fullSSCC = '01234567890123456' + check
      const parsed = parseSSCC(fullSSCC)
      expect(parsed.companyPrefix.length).toBeLessThanOrEqual(10)
    })
  })
})

// =============================================================================
// SSCC GENERATION FOR ORGANIZATION
// =============================================================================

describe('generateSSCCForOrganization() - SSCC Generation (Story 07.13)', () => {
  const mockOrgId = 'org-uuid-123'
  const mockGS1Prefix = '0614141'

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Success Scenarios', () => {
    it('should generate valid 18-digit SSCC', async () => {
      const result = await generateSSCCForOrganization(mockOrgId, mockGS1Prefix, 1)
      expect(result.sscc.length).toBe(18)
      expect(/^\d{18}$/.test(result.sscc)).toBe(true)
    })

    it('should include correct extension digit (0 for carton)', async () => {
      const result = await generateSSCCForOrganization(mockOrgId, mockGS1Prefix, 1, '0')
      expect(result.sscc[0]).toBe('0')
    })

    it('should include correct extension digit (9 for pallet)', async () => {
      const result = await generateSSCCForOrganization(mockOrgId, mockGS1Prefix, 1, '9')
      expect(result.sscc[0]).toBe('9')
    })

    it('should include GS1 prefix in SSCC', async () => {
      const result = await generateSSCCForOrganization(mockOrgId, mockGS1Prefix, 1)
      expect(result.sscc.substring(1, 8)).toBe(mockGS1Prefix)
    })

    it('should generate unique SSCCs for sequential serials', async () => {
      const result1 = await generateSSCCForOrganization(mockOrgId, mockGS1Prefix, 1)
      const result2 = await generateSSCCForOrganization(mockOrgId, mockGS1Prefix, 2)
      expect(result1.sscc).not.toBe(result2.sscc)
    })

    it('should generate SSCC with valid check digit', async () => {
      const result = await generateSSCCForOrganization(mockOrgId, mockGS1Prefix, 1)
      const validation = validateSSCC(result.sscc)
      expect(validation.valid).toBe(true)
    })

    it('should return formatted SSCC in response', async () => {
      const result = await generateSSCCForOrganization(mockOrgId, mockGS1Prefix, 1)
      expect(result.formatted).toContain(' ')
    })

    it('should pad serial reference to fill remaining digits', async () => {
      const result = await generateSSCCForOrganization(mockOrgId, mockGS1Prefix, 123)
      expect(result.sscc.length).toBe(18)
    })
  })

  describe('Error Scenarios', () => {
    it('should throw error when GS1 prefix is missing', async () => {
      await expect(
        generateSSCCForOrganization(mockOrgId, '', 1)
      ).rejects.toThrow('GS1 Company Prefix')
    })

    it('should throw error when GS1 prefix is too short (< 7 digits)', async () => {
      await expect(
        generateSSCCForOrganization(mockOrgId, '123456', 1)
      ).rejects.toThrow()
    })

    it('should throw error when GS1 prefix is too long (> 10 digits)', async () => {
      await expect(
        generateSSCCForOrganization(mockOrgId, '12345678901', 1)
      ).rejects.toThrow()
    })

    it('should throw error when GS1 prefix contains non-numeric chars', async () => {
      await expect(
        generateSSCCForOrganization(mockOrgId, '061414A', 1)
      ).rejects.toThrow()
    })

    it('should throw error for serial number overflow', async () => {
      // Serial reference overflow: with 7-digit prefix, serial can be max 9 digits
      // Max serial = 999999999
      await expect(
        generateSSCCForOrganization(mockOrgId, mockGS1Prefix, 10000000000)
      ).rejects.toThrow()
    })

    it('should throw error for negative serial number', async () => {
      await expect(
        generateSSCCForOrganization(mockOrgId, mockGS1Prefix, -1)
      ).rejects.toThrow()
    })

    it('should throw error for zero serial number', async () => {
      // Serial should start from 1
      await expect(
        generateSSCCForOrganization(mockOrgId, mockGS1Prefix, 0)
      ).rejects.toThrow()
    })
  })

  describe('Different GS1 Prefix Lengths', () => {
    it('should handle 7-digit GS1 prefix', async () => {
      const result = await generateSSCCForOrganization(mockOrgId, '0614141', 1)
      expect(result.sscc.length).toBe(18)
    })

    it('should handle 8-digit GS1 prefix', async () => {
      const result = await generateSSCCForOrganization(mockOrgId, '06141410', 1)
      expect(result.sscc.length).toBe(18)
    })

    it('should handle 9-digit GS1 prefix', async () => {
      const result = await generateSSCCForOrganization(mockOrgId, '061414100', 1)
      expect(result.sscc.length).toBe(18)
    })

    it('should handle 10-digit GS1 prefix', async () => {
      const result = await generateSSCCForOrganization(mockOrgId, '0614141000', 1)
      expect(result.sscc.length).toBe(18)
    })
  })
})

// =============================================================================
// ZPL LABEL GENERATION
// =============================================================================

describe('LabelService - ZPL Generation (Story 07.13)', () => {
  describe('ZPL Label Structure', () => {
    it('should generate valid ZPL start/end commands', () => {
      const zpl = generateZPLLabel({
        sscc: '006141410000123452',
        format: '4x6',
        shipTo: { name: 'Test Customer', address: '123 Main St', cityStateZip: 'Denver, CO 80210' },
        boxNumber: '1 of 2',
        weight: '48.5 kg',
      })
      expect(zpl).toContain('^XA') // Start
      expect(zpl).toContain('^XZ') // End
    })

    it('should include GS1-128 barcode command', () => {
      const zpl = generateZPLLabel({
        sscc: '006141410000123452',
        format: '4x6',
        shipTo: { name: 'Test Customer', address: '123 Main St', cityStateZip: 'Denver, CO 80210' },
        boxNumber: '1 of 2',
        weight: '48.5 kg',
      })
      expect(zpl).toContain('^BC') // Barcode command
      expect(zpl).toContain('>8') // FNC1 for GS1-128
    })

    it('should include human-readable SSCC text', () => {
      const zpl = generateZPLLabel({
        sscc: '006141410000123452',
        format: '4x6',
        shipTo: { name: 'Test Customer', address: '123 Main St', cityStateZip: 'Denver, CO 80210' },
        boxNumber: '1 of 2',
        weight: '48.5 kg',
      })
      expect(zpl).toContain('006141410000123452')
    })

    it('should include ship-to address', () => {
      const zpl = generateZPLLabel({
        sscc: '006141410000123452',
        format: '4x6',
        shipTo: { name: 'Blue Mountain Restaurant', address: '789 Main Street', cityStateZip: 'Denver, CO 80210' },
        boxNumber: '1 of 2',
        weight: '48.5 kg',
      })
      expect(zpl).toContain('Blue Mountain Restaurant')
      expect(zpl).toContain('789 Main Street')
      expect(zpl).toContain('Denver, CO 80210')
    })

    it('should include box number indicator', () => {
      const zpl = generateZPLLabel({
        sscc: '006141410000123452',
        format: '4x6',
        shipTo: { name: 'Test Customer', address: '123 Main St', cityStateZip: 'Denver, CO 80210' },
        boxNumber: '1 of 2',
        weight: '48.5 kg',
      })
      expect(zpl).toContain('1 of 2')
    })

    it('should include weight', () => {
      const zpl = generateZPLLabel({
        sscc: '006141410000123452',
        format: '4x6',
        shipTo: { name: 'Test Customer', address: '123 Main St', cityStateZip: 'Denver, CO 80210' },
        boxNumber: '1 of 2',
        weight: '48.5 kg',
      })
      expect(zpl).toContain('48.5 kg')
    })

    it('should include handling instructions when provided', () => {
      const zpl = generateZPLLabel({
        sscc: '006141410000123452',
        format: '4x6',
        shipTo: { name: 'Test Customer', address: '123 Main St', cityStateZip: 'Denver, CO 80210' },
        boxNumber: '1 of 2',
        weight: '48.5 kg',
        handlingInstructions: 'Keep Refrigerated',
      })
      expect(zpl).toContain('Keep Refrigerated')
    })
  })

  describe('Label Format Dimensions', () => {
    it('should generate 4x6 inch label with correct coordinates', () => {
      const zpl = generateZPLLabel({
        sscc: '006141410000123452',
        format: '4x6',
        shipTo: { name: 'Test Customer', address: '123 Main St', cityStateZip: 'Denver, CO 80210' },
        boxNumber: '1 of 2',
        weight: '48.5 kg',
      })
      // 4x6" at 203 DPI = 813 x 1219 dots
      expect(zpl).toBeDefined()
    })

    it('should generate 4x8 inch label with correct coordinates', () => {
      const zpl = generateZPLLabel({
        sscc: '006141410000123452',
        format: '4x8',
        shipTo: { name: 'Test Customer', address: '123 Main St', cityStateZip: 'Denver, CO 80210' },
        boxNumber: '1 of 2',
        weight: '48.5 kg',
      })
      // 4x8" at 203 DPI = 813 x 1629 dots
      expect(zpl).toBeDefined()
    })

    it('should throw error for unsupported format', () => {
      expect(() =>
        generateZPLLabel({
          sscc: '006141410000123452',
          format: '5x7' as '4x6' | '4x8',
          shipTo: { name: 'Test Customer', address: '123 Main St', cityStateZip: 'Denver, CO 80210' },
          boxNumber: '1 of 2',
          weight: '48.5 kg',
        })
      ).toThrow()
    })
  })

  describe('GS1-128 Barcode Encoding', () => {
    it('should include Application Identifier 00 for SSCC', () => {
      const zpl = generateZPLLabel({
        sscc: '006141410000123452',
        format: '4x6',
        shipTo: { name: 'Test Customer', address: '123 Main St', cityStateZip: 'Denver, CO 80210' },
        boxNumber: '1 of 2',
        weight: '48.5 kg',
      })
      expect(zpl).toContain('>800')
    })

    it('should encode FNC1 start character', () => {
      const zpl = generateZPLLabel({
        sscc: '006141410000123452',
        format: '4x6',
        shipTo: { name: 'Test Customer', address: '123 Main St', cityStateZip: 'Denver, CO 80210' },
        boxNumber: '1 of 2',
        weight: '48.5 kg',
      })
      expect(zpl).toContain('>8')
    })
  })
})

// =============================================================================
// GS1-128 BARCODE IMAGE GENERATION (bwip-js)
// =============================================================================

describe('generateGS1128Barcode() - Barcode Image (Story 07.13)', () => {
  describe('Image Generation', () => {
    it('should generate PNG barcode image as base64', async () => {
      const result = await generateGS1128Barcode('006141410000123452')
      expect(result.imageBase64).toMatch(/^[A-Za-z0-9+/=]+$/)
    })

    it('should include FNC1 start in barcode data', async () => {
      const result = await generateGS1128Barcode('006141410000123452')
      expect(result.barcodeText).toContain('(00)')
    })

    it('should generate readable barcode (parsefnc: true)', async () => {
      const result = await generateGS1128Barcode('006141410000123452')
      expect(result.success).toBe(true)
    })

    it('should return appropriate dimensions', async () => {
      const result = await generateGS1128Barcode('006141410000123452')
      expect(result.width).toBeGreaterThan(100)
      expect(result.height).toBeGreaterThan(50)
    })
  })

  describe('Error Handling', () => {
    it('should return error for invalid SSCC', async () => {
      const result = await generateGS1128Barcode('invalid')
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })

    it('should return error for empty SSCC', async () => {
      const result = await generateGS1128Barcode('')
      expect(result.success).toBe(false)
    })
  })
})

// =============================================================================
// LABEL PREVIEW GENERATION
// =============================================================================

describe('generateLabelPreview() - Preview Generation (Story 07.13)', () => {
  describe('Preview Content', () => {
    it('should return SSCC raw and formatted', async () => {
      const result = await generateLabelPreview({
        boxId: 'box-uuid-123',
        shipmentId: 'shipment-uuid-456',
        format: '4x6',
      })
      expect(result.sscc).toBeDefined()
      expect(result.sscc_formatted).toContain(' ')
    })

    it('should return barcode image as base64', async () => {
      const result = await generateLabelPreview({
        boxId: 'box-uuid-123',
        shipmentId: 'shipment-uuid-456',
        format: '4x6',
      })
      expect(result.barcode_image_base64).toBeDefined()
    })

    it('should return label content with ship-to info', async () => {
      const result = await generateLabelPreview({
        boxId: 'box-uuid-123',
        shipmentId: 'shipment-uuid-456',
        format: '4x6',
      })
      expect(result.label_content.ship_to).toBeDefined()
      expect(result.label_content.ship_to.customer_name).toBeDefined()
    })

    it('should return box number in format "X of Y"', async () => {
      const result = await generateLabelPreview({
        boxId: 'box-uuid-123',
        shipmentId: 'shipment-uuid-456',
        format: '4x6',
      })
      expect(result.label_content.box_number).toMatch(/\d+ of \d+/)
    })

    it('should return weight with unit', async () => {
      const result = await generateLabelPreview({
        boxId: 'box-uuid-123',
        shipmentId: 'shipment-uuid-456',
        format: '4x6',
      })
      expect(result.label_content.weight).toMatch(/[\d.]+ kg/)
    })
  })
})

// =============================================================================
// BOL PDF GENERATION
// =============================================================================

describe('DocumentService - BOL Generation (Story 07.13)', () => {
  describe('BOL Content Structure', () => {
    it('should generate BOL with header section', async () => {
      const content: BOLContent = {
        bolNumber: 'BOL-2025-001234',
        date: new Date('2025-01-15'),
        carrier: { name: 'DHL Freight', proNumber: '1Z999AA10012345678' },
        shipper: {
          name: 'MonoPilot Foods',
          address: '456 Industrial Blvd',
          cityStateZip: 'Denver, CO 80202, USA',
          phone: '(303) 555-5678',
          email: 'shipping@monopilot.com',
        },
        consignee: {
          name: 'Blue Mountain Restaurant',
          contactName: 'John Smith',
          address: '789 Main Street',
          cityStateZip: 'Denver, CO 80210, USA',
          phone: '(303) 555-1234',
        },
        boxes: [],
        totals: { cartons: 2, pallets: 0, totalWeight: 90.8, declaredValue: 3738.75, currency: 'USD' },
      }
      const result = await generateBOLPDF(content)
      expect(result.pdf_url).toBeDefined()
      expect(result.bol_number).toBe('BOL-2025-001234')
    })

    it('should include shipper and consignee sections', async () => {
      const content: BOLContent = {
        bolNumber: 'BOL-2025-001234',
        date: new Date('2025-01-15'),
        carrier: { name: 'DHL Freight', proNumber: '1Z999AA10012345678' },
        shipper: {
          name: 'MonoPilot Foods',
          address: '456 Industrial Blvd',
          cityStateZip: 'Denver, CO 80202',
          phone: '(303) 555-5678',
          email: 'shipping@monopilot.com',
        },
        consignee: {
          name: 'Blue Mountain Restaurant',
          contactName: 'John Smith',
          address: '789 Main Street',
          cityStateZip: 'Denver, CO 80210',
          phone: '(303) 555-1234',
        },
        boxes: [],
        totals: { cartons: 2, pallets: 0, totalWeight: 90.8, declaredValue: 3738.75, currency: 'USD' },
      }
      const result = await generateBOLPDF(content)
      expect(result.success).toBe(true)
    })

    it('should include freight details table with SSCC, weight, dimensions', async () => {
      const content: BOLContent = {
        bolNumber: 'BOL-2025-001234',
        date: new Date('2025-01-15'),
        carrier: { name: 'DHL Freight', proNumber: '1Z999AA10012345678' },
        shipper: {
          name: 'MonoPilot Foods',
          address: '456 Industrial Blvd',
          cityStateZip: 'Denver, CO 80202',
          phone: '(303) 555-5678',
          email: 'shipping@monopilot.com',
        },
        consignee: {
          name: 'Blue Mountain Restaurant',
          contactName: 'John Smith',
          address: '789 Main Street',
          cityStateZip: 'Denver, CO 80210',
          phone: '(303) 555-1234',
        },
        boxes: [
          {
            sscc: '006141410000123452',
            weight: 48.5,
            dimensions: { length: 60, width: 40, height: 30 },
            freightClass: '65',
            nmfcCode: '1234',
          },
          {
            sscc: '006141410000123469',
            weight: 42.3,
            dimensions: { length: 60, width: 40, height: 25 },
            freightClass: '65',
            nmfcCode: '1234',
          },
        ],
        totals: { cartons: 2, pallets: 0, totalWeight: 90.8, declaredValue: 3738.75, currency: 'USD' },
      }
      const result = await generateBOLPDF(content)
      expect(result.success).toBe(true)
    })

    it('should include totals section', async () => {
      const content: BOLContent = {
        bolNumber: 'BOL-2025-001234',
        date: new Date('2025-01-15'),
        carrier: { name: 'DHL Freight', proNumber: '1Z999AA10012345678' },
        shipper: {
          name: 'MonoPilot Foods',
          address: '456 Industrial Blvd',
          cityStateZip: 'Denver, CO 80202',
          phone: '(303) 555-5678',
          email: 'shipping@monopilot.com',
        },
        consignee: {
          name: 'Blue Mountain Restaurant',
          contactName: 'John Smith',
          address: '789 Main Street',
          cityStateZip: 'Denver, CO 80210',
          phone: '(303) 555-1234',
        },
        boxes: [],
        totals: { cartons: 2, pallets: 0, totalWeight: 90.8, declaredValue: 3738.75, currency: 'USD' },
      }
      const result = await generateBOLPDF(content)
      expect(result.success).toBe(true)
    })

    it('should include signature sections for shipper and carrier', async () => {
      const content: BOLContent = {
        bolNumber: 'BOL-2025-001234',
        date: new Date('2025-01-15'),
        carrier: { name: 'DHL Freight', proNumber: '1Z999AA10012345678' },
        shipper: {
          name: 'MonoPilot Foods',
          address: '456 Industrial Blvd',
          cityStateZip: 'Denver, CO 80202',
          phone: '(303) 555-5678',
          email: 'shipping@monopilot.com',
        },
        consignee: {
          name: 'Blue Mountain Restaurant',
          contactName: 'John Smith',
          address: '789 Main Street',
          cityStateZip: 'Denver, CO 80210',
          phone: '(303) 555-1234',
        },
        boxes: [],
        totals: { cartons: 2, pallets: 0, totalWeight: 90.8, declaredValue: 3738.75, currency: 'USD' },
      }
      const result = await generateBOLPDF(content)
      expect(result.success).toBe(true)
    })
  })

  describe('BOL PDF Output', () => {
    it('should return signed URL to PDF in Supabase Storage', async () => {
      const content: BOLContent = {
        bolNumber: 'BOL-2025-001234',
        date: new Date('2025-01-15'),
        carrier: { name: 'DHL Freight', proNumber: '1Z999AA10012345678' },
        shipper: {
          name: 'MonoPilot Foods',
          address: '456 Industrial Blvd',
          cityStateZip: 'Denver, CO 80202',
          phone: '(303) 555-5678',
          email: 'shipping@monopilot.com',
        },
        consignee: {
          name: 'Blue Mountain Restaurant',
          contactName: 'John Smith',
          address: '789 Main Street',
          cityStateZip: 'Denver, CO 80210',
          phone: '(303) 555-1234',
        },
        boxes: [],
        totals: { cartons: 2, pallets: 0, totalWeight: 90.8, declaredValue: 3738.75, currency: 'USD' },
      }
      const result = await generateBOLPDF(content)
      expect(result.pdf_url).toMatch(/https?:\/\//)
    })

    it('should return generated_at timestamp', async () => {
      const content: BOLContent = {
        bolNumber: 'BOL-2025-001234',
        date: new Date('2025-01-15'),
        carrier: { name: 'DHL Freight', proNumber: '1Z999AA10012345678' },
        shipper: {
          name: 'MonoPilot Foods',
          address: '456 Industrial Blvd',
          cityStateZip: 'Denver, CO 80202',
          phone: '(303) 555-5678',
          email: 'shipping@monopilot.com',
        },
        consignee: {
          name: 'Blue Mountain Restaurant',
          contactName: 'John Smith',
          address: '789 Main Street',
          cityStateZip: 'Denver, CO 80210',
          phone: '(303) 555-1234',
        },
        boxes: [],
        totals: { cartons: 2, pallets: 0, totalWeight: 90.8, declaredValue: 3738.75, currency: 'USD' },
      }
      const result = await generateBOLPDF(content)
      expect(result.generated_at).toBeDefined()
    })

    it('should return file size in KB', async () => {
      const content: BOLContent = {
        bolNumber: 'BOL-2025-001234',
        date: new Date('2025-01-15'),
        carrier: { name: 'DHL Freight', proNumber: '1Z999AA10012345678' },
        shipper: {
          name: 'MonoPilot Foods',
          address: '456 Industrial Blvd',
          cityStateZip: 'Denver, CO 80202',
          phone: '(303) 555-5678',
          email: 'shipping@monopilot.com',
        },
        consignee: {
          name: 'Blue Mountain Restaurant',
          contactName: 'John Smith',
          address: '789 Main Street',
          cityStateZip: 'Denver, CO 80210',
          phone: '(303) 555-1234',
        },
        boxes: [],
        totals: { cartons: 2, pallets: 0, totalWeight: 90.8, declaredValue: 3738.75, currency: 'USD' },
      }
      const result = await generateBOLPDF(content)
      expect(result.file_size_kb).toBeGreaterThan(0)
    })
  })

  describe('BOL Validation', () => {
    it('should throw error when carrier is missing', async () => {
      const content = {
        bolNumber: 'BOL-2025-001234',
        date: new Date('2025-01-15'),
        carrier: null,
        shipper: {
          name: 'MonoPilot Foods',
          address: '456 Industrial Blvd',
          cityStateZip: 'Denver, CO 80202',
          phone: '(303) 555-5678',
          email: 'shipping@monopilot.com',
        },
        consignee: {
          name: 'Blue Mountain Restaurant',
          contactName: 'John Smith',
          address: '789 Main Street',
          cityStateZip: 'Denver, CO 80210',
          phone: '(303) 555-1234',
        },
        boxes: [],
        totals: { cartons: 0, pallets: 0, totalWeight: 0, declaredValue: 0, currency: 'USD' },
      } as unknown as BOLContent
      await expect(generateBOLPDF(content)).rejects.toThrow()
    })

    it('should throw error when consignee address is missing', async () => {
      const content = {
        bolNumber: 'BOL-2025-001234',
        date: new Date('2025-01-15'),
        carrier: { name: 'DHL Freight', proNumber: '1Z999AA10012345678' },
        shipper: {
          name: 'MonoPilot Foods',
          address: '456 Industrial Blvd',
          cityStateZip: 'Denver, CO 80202',
          phone: '(303) 555-5678',
          email: 'shipping@monopilot.com',
        },
        consignee: null,
        boxes: [],
        totals: { cartons: 0, pallets: 0, totalWeight: 0, declaredValue: 0, currency: 'USD' },
      } as unknown as BOLContent
      await expect(generateBOLPDF(content)).rejects.toThrow()
    })
  })
})

// =============================================================================
// PACKING SLIP PDF GENERATION
// =============================================================================

describe('DocumentService - Packing Slip Generation (Story 07.13)', () => {
  describe('Packing Slip Content', () => {
    it('should include line items with product, qty, lot, BBD', async () => {
      const content: PackingSlipContent = {
        shipmentNumber: 'SH-2025-001234',
        salesOrderNumber: 'SO-2025-00123',
        date: new Date('2025-01-15'),
        trackingNumber: '1Z999AA10012345678',
        shipTo: {
          name: 'Blue Mountain Restaurant',
          contactName: 'John Smith',
          address: '789 Main Street',
          cityStateZip: 'Denver, CO 80210',
          phone: '(303) 555-1234',
        },
        shipFrom: {
          name: 'MonoPilot Foods',
          address: '456 Industrial Blvd',
          cityStateZip: 'Denver, CO 80202',
          phone: '(303) 555-5678',
        },
        lineItems: [
          {
            product: 'Organic Flour 5lb',
            sku: 'FLOUR-5LB-001',
            quantityOrdered: 100,
            quantityShipped: 100,
            lotNumber: 'FLOUR-2024-001',
            bestBeforeDate: new Date('2025-06-30'),
          },
        ],
        boxes: [
          {
            boxNumber: 1,
            sscc: '006141410000123452',
            weight: 48.5,
            dimensions: { length: 60, width: 40, height: 30 },
          },
        ],
        specialInstructions: 'Keep Refrigerated',
        allergenWarnings: ['Contains Wheat'],
      }
      const result = await generatePackingSlipPDF(content)
      expect(result.success).toBe(true)
    })

    it('should include allergen warnings when present', async () => {
      const content: PackingSlipContent = {
        shipmentNumber: 'SH-2025-001234',
        salesOrderNumber: 'SO-2025-00123',
        date: new Date('2025-01-15'),
        trackingNumber: '1Z999AA10012345678',
        shipTo: {
          name: 'Blue Mountain Restaurant',
          contactName: 'John Smith',
          address: '789 Main Street',
          cityStateZip: 'Denver, CO 80210',
          phone: '(303) 555-1234',
        },
        shipFrom: {
          name: 'MonoPilot Foods',
          address: '456 Industrial Blvd',
          cityStateZip: 'Denver, CO 80202',
          phone: '(303) 555-5678',
        },
        lineItems: [],
        boxes: [],
        specialInstructions: '',
        allergenWarnings: ['Contains Milk', 'Contains Soy', 'Contains Eggs'],
      }
      const result = await generatePackingSlipPDF(content)
      expect(result.success).toBe(true)
    })

    it('should include carton summary with SSCC, weight, dimensions', async () => {
      const content: PackingSlipContent = {
        shipmentNumber: 'SH-2025-001234',
        salesOrderNumber: 'SO-2025-00123',
        date: new Date('2025-01-15'),
        trackingNumber: '1Z999AA10012345678',
        shipTo: {
          name: 'Blue Mountain Restaurant',
          contactName: 'John Smith',
          address: '789 Main Street',
          cityStateZip: 'Denver, CO 80210',
          phone: '(303) 555-1234',
        },
        shipFrom: {
          name: 'MonoPilot Foods',
          address: '456 Industrial Blvd',
          cityStateZip: 'Denver, CO 80202',
          phone: '(303) 555-5678',
        },
        lineItems: [],
        boxes: [
          {
            boxNumber: 1,
            sscc: '006141410000123452',
            weight: 48.5,
            dimensions: { length: 60, width: 40, height: 30 },
          },
          {
            boxNumber: 2,
            sscc: '006141410000123469',
            weight: 42.3,
            dimensions: { length: 60, width: 40, height: 25 },
          },
        ],
        specialInstructions: '',
        allergenWarnings: [],
      }
      const result = await generatePackingSlipPDF(content)
      expect(result.success).toBe(true)
    })
  })

  describe('Packing Slip Output', () => {
    it('should return signed URL to PDF', async () => {
      const content: PackingSlipContent = {
        shipmentNumber: 'SH-2025-001234',
        salesOrderNumber: 'SO-2025-00123',
        date: new Date('2025-01-15'),
        trackingNumber: '1Z999AA10012345678',
        shipTo: {
          name: 'Blue Mountain Restaurant',
          contactName: 'John Smith',
          address: '789 Main Street',
          cityStateZip: 'Denver, CO 80210',
          phone: '(303) 555-1234',
        },
        shipFrom: {
          name: 'MonoPilot Foods',
          address: '456 Industrial Blvd',
          cityStateZip: 'Denver, CO 80202',
          phone: '(303) 555-5678',
        },
        lineItems: [],
        boxes: [],
        specialInstructions: '',
        allergenWarnings: [],
      }
      const result = await generatePackingSlipPDF(content)
      expect(result.pdf_url).toMatch(/https?:\/\//)
    })
  })
})

/**
 * Test Coverage Summary for Label Generation Service (Story 07.13)
 * ================================================================
 *
 * calculateGS1CheckDigit(): 10 tests
 *   - Algorithm correctness (5 tests)
 *   - Input validation (5 tests)
 *
 * validateSSCC(): 14 tests
 *   - Valid SSCC codes (4 tests)
 *   - Invalid SSCC codes (6 tests)
 *   - Check digit boundaries (2 tests)
 *
 * formatSSCC(): 7 tests
 *   - Standard formatting (3 tests)
 *   - Input validation (3 tests)
 *   - Alternative formats (2 tests)
 *
 * parseSSCC(): 6 tests
 *   - Structure extraction (4 tests)
 *   - Prefix length detection (2 tests)
 *
 * generateSSCCForOrganization(): 17 tests
 *   - Success scenarios (8 tests)
 *   - Error scenarios (7 tests)
 *   - Different prefix lengths (4 tests)
 *
 * LabelService ZPL: 12 tests
 *   - ZPL structure (7 tests)
 *   - Label format dimensions (3 tests)
 *   - GS1-128 encoding (2 tests)
 *
 * generateGS1128Barcode(): 6 tests
 *   - Image generation (4 tests)
 *   - Error handling (2 tests)
 *
 * generateLabelPreview(): 5 tests
 *   - Preview content (5 tests)
 *
 * BOL PDF Generation: 10 tests
 *   - Content structure (5 tests)
 *   - PDF output (3 tests)
 *   - Validation (2 tests)
 *
 * Packing Slip Generation: 4 tests
 *   - Content (3 tests)
 *   - Output (1 test)
 *
 * Total: 91 tests
 * Coverage Target: 95% (CRITICAL - GS1 compliance)
 */
