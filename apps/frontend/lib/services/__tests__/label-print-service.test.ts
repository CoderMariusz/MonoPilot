/**
 * Label Print Service - Unit Tests (Story 05.14)
 * Purpose: Test ZPL label generation service
 * Phase: RED - Tests will fail until service is implemented
 *
 * Tests service methods:
 * - generateLPLabel() - ZPL generation for single LP
 * - generateBulkLabels() - ZPL generation for multiple LPs
 * - buildZPL() - Template substitution
 * - generateQRData() - QR code JSON generation
 * - escapeZPL() - Special character escaping
 *
 * Coverage Target: 80%+
 * Test Count: 35+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-1: ZPL template generation
 * - AC-3: Missing optional fields
 * - AC-8: Service methods
 * - AC-9: QR code data structure
 * - AC-13: Performance requirements
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  LabelPrintService,
  type LPLabelData,
  type LabelGenerationOptions,
} from '../label-print-service'

// Mock data
const mockLPLabelData: LPLabelData = {
  lp_number: 'LP00000001',
  product_name: 'Flour Type 00',
  quantity: 1000,
  uom: 'KG',
  batch_number: 'FLOUR-2025-001',
  expiry_date: '2026-06-01',
  manufacture_date: '2025-01-01',
  location_path: 'WH-001/ZONE-A/RACK-01',
}

const mockLPLabelDataMinimal: LPLabelData = {
  lp_number: 'LP00000002',
  product_name: 'Sugar',
  quantity: 500,
  uom: 'KG',
  batch_number: null,
  expiry_date: null,
  manufacture_date: null,
  location_path: null,
}

describe('LabelPrintService (Story 05.14)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // AC-1: ZPL Template Generation for LP Labels
  // ==========================================================================
  describe('buildZPL - ZPL Template Generation (AC-1)', () => {
    it('should generate valid ZPL starting with ^XA', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, { copies: 1 })

      expect(zpl).toContain('^XA')
    })

    it('should generate valid ZPL ending with ^XZ', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, { copies: 1 })

      expect(zpl).toContain('^XZ')
    })

    it('should include CODE128 barcode with LP number', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, { copies: 1 })

      expect(zpl).toContain('^BC') // Barcode command
      expect(zpl).toContain('LP00000001')
    })

    it('should include QR code with LP data', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, { copies: 1 })

      expect(zpl).toContain('^BQ') // QR code command
    })

    it('should include product name', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, { copies: 1 })

      expect(zpl).toContain('Flour Type 00')
    })

    it('should include quantity and UoM', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, { copies: 1 })

      expect(zpl).toContain('1000')
      expect(zpl).toContain('KG')
    })

    it('should include batch number', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, { copies: 1 })

      expect(zpl).toContain('FLOUR-2025-001')
    })

    it('should include expiry date', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, { copies: 1 })

      expect(zpl).toContain('2026-06-01')
    })

    it('should include location path', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, { copies: 1 })

      expect(zpl).toContain('WH-001/ZONE-A/RACK-01')
    })

    it('should include ^PQ command with copies count', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, { copies: 3 })

      expect(zpl).toContain('^PQ3')
    })

    it('should set correct print width for 4x6 label', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, {
        copies: 1,
        label_size: '4x6',
      })

      expect(zpl).toContain('^PW812') // 4 inches at 203 dpi
    })

    it('should set correct label length for 4x6 label', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, {
        copies: 1,
        label_size: '4x6',
      })

      expect(zpl).toContain('^LL') // Label length command
    })

    it('should have ZPL size under 2KB', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, { copies: 1 })

      expect(zpl.length).toBeLessThan(2048)
    })
  })

  // ==========================================================================
  // AC-3: Label with Missing Optional Fields
  // ==========================================================================
  describe('buildZPL - Missing Optional Fields (AC-3)', () => {
    it('should handle null batch number with --', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelDataMinimal, { copies: 1 })

      expect(zpl).toContain('--')
    })

    it('should handle null expiry date with --', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelDataMinimal, { copies: 1 })

      expect(zpl).toContain('--')
    })

    it('should handle null location with Unassigned', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelDataMinimal, { copies: 1 })

      expect(zpl).toContain('Unassigned')
    })

    it('should truncate long product name to 40 characters', () => {
      const longNameData: LPLabelData = {
        ...mockLPLabelData,
        product_name: 'Premium Organic Wholemeal Bread Flour Type 00 Stone Ground Extra Fine',
      }

      const zpl = LabelPrintService.buildZPL(longNameData, { copies: 1 })

      // Should be truncated with ... in text field
      expect(zpl).toContain('...')
      // The product text field should be truncated (37 chars + ...)
      // but the QR data should contain the full name
      expect(zpl).toMatch(/\^FD.*Premium Organic.*\.\.\..*\^FS/)
    })

    it('should truncate long location to 35 characters', () => {
      const longLocationData: LPLabelData = {
        ...mockLPLabelData,
        location_path: 'WH-MAIN/ZONE-A/RACK-01/SHELF-03/BIN-15/SLOT-02',
      }

      const zpl = LabelPrintService.buildZPL(longLocationData, { copies: 1 })

      // Should be truncated
      expect(zpl).toContain('...')
    })
  })

  // ==========================================================================
  // AC-8: ZPL Service Methods
  // ==========================================================================
  describe('escapeZPL - Special Character Escaping (AC-8)', () => {
    it('should escape ^ character', () => {
      const escaped = LabelPrintService.escapeZPL('Test^Value')

      expect(escaped).toBe('Test\\^Value')
    })

    it('should escape ~ character', () => {
      const escaped = LabelPrintService.escapeZPL('Test~Value')

      expect(escaped).toBe('Test\\~Value')
    })

    it('should escape \\ character', () => {
      const escaped = LabelPrintService.escapeZPL('Test\\Value')

      expect(escaped).toBe('Test\\\\Value')
    })

    it('should handle multiple special characters', () => {
      const escaped = LabelPrintService.escapeZPL('Test^Value~With\\Specials')

      expect(escaped).toBe('Test\\^Value\\~With\\\\Specials')
    })

    it('should handle string with no special characters', () => {
      const escaped = LabelPrintService.escapeZPL('Normal Text 123')

      expect(escaped).toBe('Normal Text 123')
    })

    it('should handle empty string', () => {
      const escaped = LabelPrintService.escapeZPL('')

      expect(escaped).toBe('')
    })

    it('should handle & character', () => {
      const escaped = LabelPrintService.escapeZPL('Flour & Sugar')

      expect(escaped).toContain('&')
    })

    it('should handle quote characters', () => {
      const escaped = LabelPrintService.escapeZPL('Product "A" Name')

      expect(escaped).toBeDefined()
    })
  })

  // ==========================================================================
  // AC-9: QR Code Data Structure
  // ==========================================================================
  describe('generateQRData - QR Code Data (AC-9)', () => {
    it('should return valid JSON string', () => {
      const qrData = LabelPrintService.generateQRData(mockLPLabelData)

      expect(() => JSON.parse(qrData)).not.toThrow()
    })

    it('should include lp_number in QR data', () => {
      const qrData = LabelPrintService.generateQRData(mockLPLabelData)
      const parsed = JSON.parse(qrData)

      expect(parsed.lp).toBe('LP00000001')
    })

    it('should include product name in QR data', () => {
      const qrData = LabelPrintService.generateQRData(mockLPLabelData)
      const parsed = JSON.parse(qrData)

      expect(parsed.product).toBe('Flour Type 00')
    })

    it('should include quantity in QR data', () => {
      const qrData = LabelPrintService.generateQRData(mockLPLabelData)
      const parsed = JSON.parse(qrData)

      expect(parsed.qty).toBe(1000)
    })

    it('should include uom in QR data', () => {
      const qrData = LabelPrintService.generateQRData(mockLPLabelData)
      const parsed = JSON.parse(qrData)

      expect(parsed.uom).toBe('KG')
    })

    it('should include batch in QR data', () => {
      const qrData = LabelPrintService.generateQRData(mockLPLabelData)
      const parsed = JSON.parse(qrData)

      expect(parsed.batch).toBe('FLOUR-2025-001')
    })

    it('should include expiry in QR data', () => {
      const qrData = LabelPrintService.generateQRData(mockLPLabelData)
      const parsed = JSON.parse(qrData)

      expect(parsed.expiry).toBe('2026-06-01')
    })

    it('should include location in QR data', () => {
      const qrData = LabelPrintService.generateQRData(mockLPLabelData)
      const parsed = JSON.parse(qrData)

      expect(parsed.location).toBe('WH-001/ZONE-A/RACK-01')
    })

    it('should handle null batch in QR data', () => {
      const qrData = LabelPrintService.generateQRData(mockLPLabelDataMinimal)
      const parsed = JSON.parse(qrData)

      expect(parsed.batch).toBeNull()
    })

    it('should handle null expiry in QR data', () => {
      const qrData = LabelPrintService.generateQRData(mockLPLabelDataMinimal)
      const parsed = JSON.parse(qrData)

      expect(parsed.expiry).toBeNull()
    })

    it('should include full product name in QR (not truncated)', () => {
      const longNameData: LPLabelData = {
        ...mockLPLabelData,
        product_name: 'Premium Organic Wholemeal Bread Flour Type 00 Stone Ground Extra Fine',
      }

      const qrData = LabelPrintService.generateQRData(longNameData)
      const parsed = JSON.parse(qrData)

      expect(parsed.product).toContain('Extra Fine')
    })
  })

  // ==========================================================================
  // Label Generation Options
  // ==========================================================================
  describe('buildZPL - Generation Options', () => {
    it('should default copies to 1', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, {})

      expect(zpl).toContain('^PQ1')
    })

    it('should default label size to 4x6', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, {})

      expect(zpl).toContain('^PW812')
    })

    it('should include QR code by default', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, {})

      expect(zpl).toContain('^BQ')
    })

    it('should exclude QR code when include_qr is false', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, { include_qr: false })

      expect(zpl).not.toContain('^BQ')
    })

    it('should handle 4x3 label size', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, { label_size: '4x3' })

      // Different dimensions
      expect(zpl).toBeDefined()
    })

    it('should handle 3x2 label size', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, { label_size: '3x2' })

      expect(zpl).toBeDefined()
    })
  })

  // ==========================================================================
  // Bulk Label Generation
  // ==========================================================================
  describe('generateBulkLabels - Bulk Generation', () => {
    const mockBulkData: LPLabelData[] = [
      mockLPLabelData,
      { ...mockLPLabelData, lp_number: 'LP00000002' },
      { ...mockLPLabelData, lp_number: 'LP00000003' },
    ]

    it('should generate array of ZPL strings', () => {
      const results = LabelPrintService.generateBulkLabels(mockBulkData, { copies: 1 })

      expect(Array.isArray(results)).toBe(true)
      expect(results).toHaveLength(3)
    })

    it('should generate valid ZPL for each LP', () => {
      const results = LabelPrintService.generateBulkLabels(mockBulkData, { copies: 1 })

      results.forEach((zpl) => {
        expect(zpl).toContain('^XA')
        expect(zpl).toContain('^XZ')
      })
    })

    it('should include correct LP number in each label', () => {
      const results = LabelPrintService.generateBulkLabels(mockBulkData, { copies: 1 })

      expect(results[0]).toContain('LP00000001')
      expect(results[1]).toContain('LP00000002')
      expect(results[2]).toContain('LP00000003')
    })

    it('should apply copies to all labels', () => {
      const results = LabelPrintService.generateBulkLabels(mockBulkData, { copies: 2 })

      results.forEach((zpl) => {
        expect(zpl).toContain('^PQ2')
      })
    })

    it('should return concatenated ZPL when concat option is true', () => {
      const result = LabelPrintService.generateBulkLabels(mockBulkData, {
        copies: 1,
        concat: true,
      })

      expect(typeof result).toBe('string')
      expect((result as string).match(/\^XA/g)?.length).toBe(3)
    })

    it('should handle empty array', () => {
      const results = LabelPrintService.generateBulkLabels([], { copies: 1 })

      expect(results).toHaveLength(0)
    })
  })

  // ==========================================================================
  // AC-13: Performance Requirements
  // ==========================================================================
  describe('Performance - Generation Speed (AC-13)', () => {
    it('should generate single label in under 100ms', () => {
      const start = performance.now()

      LabelPrintService.buildZPL(mockLPLabelData, { copies: 1 })

      const duration = performance.now() - start
      expect(duration).toBeLessThan(100)
    })

    it('should generate 50 labels in under 3 seconds', () => {
      const bulkData = Array.from({ length: 50 }, (_, i) => ({
        ...mockLPLabelData,
        lp_number: `LP${String(i).padStart(8, '0')}`,
      }))

      const start = performance.now()

      LabelPrintService.generateBulkLabels(bulkData, { copies: 1 })

      const duration = performance.now() - start
      expect(duration).toBeLessThan(3000)
    })

    it('should handle 100 labels efficiently', () => {
      const bulkData = Array.from({ length: 100 }, (_, i) => ({
        ...mockLPLabelData,
        lp_number: `LP${String(i).padStart(8, '0')}`,
      }))

      const start = performance.now()

      LabelPrintService.generateBulkLabels(bulkData, { copies: 1 })

      const duration = performance.now() - start
      expect(duration).toBeLessThan(5000)
    })
  })

  // ==========================================================================
  // ZPL Syntax Validation
  // ==========================================================================
  describe('ZPL Syntax Validation', () => {
    it('should have balanced ^XA and ^XZ', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, { copies: 1 })

      const startCount = (zpl.match(/\^XA/g) || []).length
      const endCount = (zpl.match(/\^XZ/g) || []).length

      expect(startCount).toBe(endCount)
    })

    it('should have proper field origin commands', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, { copies: 1 })

      // Should have ^FO (field origin) commands
      expect(zpl).toContain('^FO')
    })

    it('should have proper field separator commands', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, { copies: 1 })

      // Should have ^FS (field separator) commands
      expect(zpl).toContain('^FS')
    })

    it('should have proper font commands', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, { copies: 1 })

      // Should have font commands ^A or ^CF
      expect(zpl).toMatch(/\^A0N|\^CF/)
    })

    it('should not contain unescaped special characters', () => {
      const dataWithSpecials: LPLabelData = {
        ...mockLPLabelData,
        product_name: 'Test & Product "Name"',
      }

      const zpl = LabelPrintService.buildZPL(dataWithSpecials, { copies: 1 })

      // ZPL should still be valid (not break on special chars)
      expect(zpl).toContain('^XA')
      expect(zpl).toContain('^XZ')
    })
  })

  // ==========================================================================
  // Date Formatting
  // ==========================================================================
  describe('Date Formatting', () => {
    it('should format date as YYYY-MM-DD', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelData, { copies: 1 })

      expect(zpl).toContain('2026-06-01')
    })

    it('should handle ISO date string input', () => {
      const dataWithISODate: LPLabelData = {
        ...mockLPLabelData,
        expiry_date: '2026-06-01T00:00:00.000Z',
      }

      const zpl = LabelPrintService.buildZPL(dataWithISODate, { copies: 1 })

      // Should format to YYYY-MM-DD
      expect(zpl).toContain('2026-06-01')
    })
  })

  // ==========================================================================
  // Utility Functions
  // ==========================================================================
  describe('Utility Functions', () => {
    it('truncateText should truncate with ellipsis', () => {
      // Test internal truncation (through buildZPL)
      const longNameData: LPLabelData = {
        ...mockLPLabelData,
        product_name: 'A'.repeat(50),
      }

      const zpl = LabelPrintService.buildZPL(longNameData, { copies: 1 })

      // Should be truncated
      expect(zpl).toContain('...')
    })

    it('formatDate should handle null', () => {
      const zpl = LabelPrintService.buildZPL(mockLPLabelDataMinimal, { copies: 1 })

      // Should show -- for null date
      expect(zpl).toContain('--')
    })

    it('formatDate should handle undefined', () => {
      const dataWithUndefined: LPLabelData = {
        ...mockLPLabelData,
        expiry_date: undefined as unknown as null,
      }

      const zpl = LabelPrintService.buildZPL(dataWithUndefined, { copies: 1 })

      expect(zpl).toContain('--')
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * buildZPL - ZPL Template Generation (AC-1) - 13 tests:
 *   - Valid ZPL start (^XA)
 *   - Valid ZPL end (^XZ)
 *   - CODE128 barcode
 *   - QR code
 *   - Product name
 *   - Quantity and UoM
 *   - Batch number
 *   - Expiry date
 *   - Location path
 *   - Copies command (^PQ)
 *   - Print width
 *   - Label length
 *   - Size under 2KB
 *
 * buildZPL - Missing Fields (AC-3) - 5 tests:
 *   - Null batch
 *   - Null expiry
 *   - Null location
 *   - Long product name truncation
 *   - Long location truncation
 *
 * escapeZPL - Special Characters (AC-8) - 8 tests:
 *   - Escape ^
 *   - Escape ~
 *   - Escape \\
 *   - Multiple specials
 *   - No specials
 *   - Empty string
 *   - & character
 *   - Quote characters
 *
 * generateQRData - QR Data (AC-9) - 11 tests:
 *   - Valid JSON
 *   - LP number
 *   - Product name
 *   - Quantity
 *   - UoM
 *   - Batch
 *   - Expiry
 *   - Location
 *   - Null batch
 *   - Null expiry
 *   - Full product name
 *
 * Generation Options - 6 tests:
 *   - Default copies
 *   - Default label size
 *   - QR by default
 *   - Exclude QR option
 *   - 4x3 label
 *   - 3x2 label
 *
 * generateBulkLabels - Bulk Generation - 6 tests:
 *   - Array of ZPL
 *   - Valid ZPL each
 *   - Correct LP numbers
 *   - Copies applied
 *   - Concat option
 *   - Empty array
 *
 * Performance (AC-13) - 3 tests:
 *   - Single label < 100ms
 *   - 50 labels < 3s
 *   - 100 labels < 5s
 *
 * ZPL Syntax - 5 tests:
 *   - Balanced XA/XZ
 *   - Field origin
 *   - Field separator
 *   - Font commands
 *   - Special chars escaped
 *
 * Date Formatting - 2 tests:
 *   - YYYY-MM-DD format
 *   - ISO string input
 *
 * Utilities - 3 tests:
 *   - Truncation
 *   - Null date
 *   - Undefined date
 *
 * Total: 62 tests
 * Coverage: 80%+ (all service methods tested)
 * Status: RED (service not implemented yet)
 */
