/**
 * Unit Tests: Label Service
 * Story 04.7b: Output Registration Scanner
 *
 * Tests ZPL label generation and printing:
 * - ZPL content generation with all fields
 * - Label barcode (Code128)
 * - Printer status checking
 * - Print execution (2s target)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() =>
    Promise.resolve({
      auth: {
        getUser: vi.fn(() =>
          Promise.resolve({
            data: { user: { id: 'user-1' } },
            error: null,
          })
        ),
      },
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
            maybeSingle: vi.fn(),
          })),
        })),
      })),
    })
  ),
}))

describe('LabelService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // generateZPL - ZPL Content Generation
  // ============================================================================
  describe('generateZPL', () => {
    it('should create valid ZPL with all required fields', async () => {
      // Arrange
      const lpId = 'lp-uuid-123'

      // Act
      const { generateZPL } = await import('../label-service')
      const result = await generateZPL(lpId)

      // Assert
      expect(result.success).toBe(true)
      expect(result.zpl_content).toBeDefined()
      expect(result.zpl_content).toContain('^XA') // ZPL start
      expect(result.zpl_content).toContain('^XZ') // ZPL end
    })

    it('should include LP barcode (Code128)', async () => {
      // Arrange
      const lpId = 'lp-uuid-123'

      // Act
      const { generateZPL } = await import('../label-service')
      const result = await generateZPL(lpId)

      // Assert
      expect(result.success).toBe(true)
      expect(result.label_fields).toBeDefined()
      expect(result.label_fields.barcode_type).toBe('Code128')
      expect(result.label_fields.lp_number).toBeDefined()
    })

    it('should include product name in label', async () => {
      // Arrange
      const lpId = 'lp-uuid-123'

      // Act
      const { generateZPL } = await import('../label-service')
      const result = await generateZPL(lpId)

      // Assert
      expect(result.label_fields.product_name).toBeDefined()
      expect(typeof result.label_fields.product_name).toBe('string')
    })

    it('should format qty with UoM correctly', async () => {
      // Arrange
      const lpId = 'lp-uuid-123'

      // Act
      const { generateZPL } = await import('../label-service')
      const result = await generateZPL(lpId)

      // Assert
      expect(result.label_fields.qty_with_uom).toMatch(/\d+(\.\d+)?\s*\w+/) // e.g., "250 kg"
    })

    it('should include batch number', async () => {
      // Arrange
      const lpId = 'lp-uuid-123'

      // Act
      const { generateZPL } = await import('../label-service')
      const result = await generateZPL(lpId)

      // Assert
      expect(result.label_fields.batch_number).toBeDefined()
    })

    it('should format expiry date correctly', async () => {
      // Arrange
      const lpId = 'lp-uuid-123'

      // Act
      const { generateZPL } = await import('../label-service')
      const result = await generateZPL(lpId)

      // Assert
      expect(result.label_fields.expiry_date).toBeDefined()
      // Should be in readable format (e.g., "2025-02-14" or "14 Feb 2025")
      expect(result.label_fields.expiry_date).toMatch(/\d{4}-\d{2}-\d{2}|\d{1,2}\s+\w+\s+\d{4}/)
    })

    it('should include QA status', async () => {
      // Arrange
      const lpId = 'lp-uuid-123'

      // Act
      const { generateZPL } = await import('../label-service')
      const result = await generateZPL(lpId)

      // Assert
      expect(result.label_fields.qa_status).toBeDefined()
      expect(['approved', 'pending', 'rejected']).toContain(result.label_fields.qa_status)
    })

    it('should accept optional templateId for custom labels', async () => {
      // Arrange
      const lpId = 'lp-uuid-123'
      const templateId = 'template-custom-123'

      // Act
      const { generateZPL } = await import('../label-service')
      const result = await generateZPL(lpId, templateId)

      // Assert
      expect(result.success).toBe(true)
    })

    it('should return error for non-existent LP', async () => {
      // Arrange
      const lpId = 'non-existent-lp'

      // Act
      const { generateZPL } = await import('../label-service')
      const result = await generateZPL(lpId)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  // ============================================================================
  // sendToPrinter - Print Execution (2s target)
  // ============================================================================
  describe('sendToPrinter', () => {
    it('should return success within 2 seconds', async () => {
      // Arrange
      const zpl = '^XA^FO50,50^BY3^BC,100,Y,N,N^FD123456^FS^XZ'
      const startTime = Date.now()

      // Act
      const { sendToPrinter } = await import('../label-service')
      const result = await sendToPrinter(zpl)

      // Assert
      const elapsed = Date.now() - startTime
      expect(elapsed).toBeLessThan(2000) // AC: 2s target
      expect(result.success).toBe(true)
      expect(result.printer_name).toBeDefined()
      expect(result.sent_at).toBeDefined()
    })

    it('should return 404 when no printer configured for location', async () => {
      // Arrange
      const zpl = '^XA^XZ'
      const printerId = undefined // No specific printer

      // Act
      const { sendToPrinter } = await import('../label-service')
      const result = await sendToPrinter(zpl, printerId)

      // Assert - Should fail with no printer configured
      expect(result.success).toBe(false)
      expect(result.error).toBe('No printer configured')
    })

    it('should return 503 when printer offline', async () => {
      // Arrange
      const zpl = '^XA^XZ'
      const printerId = 'printer-offline'

      // Act
      const { sendToPrinter } = await import('../label-service')
      const result = await sendToPrinter(zpl, printerId)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Printer not responding')
    })

    it('should return 504 on print timeout after 2s', async () => {
      // Arrange
      const zpl = '^XA^XZ'
      const printerId = 'printer-timeout'

      // Act
      const { sendToPrinter } = await import('../label-service')
      const result = await sendToPrinter(zpl, printerId)

      // Assert
      expect(result.success).toBe(false)
      expect(result.error).toBe('Print timeout')
    })

    it('should use specified printerId when provided', async () => {
      // Arrange
      const zpl = '^XA^XZ'
      const printerId = 'printer-specific-123'

      // Act
      const { sendToPrinter } = await import('../label-service')
      const result = await sendToPrinter(zpl, printerId)

      // Assert
      expect(result.printer_name).toBeDefined()
    })
  })

  // ============================================================================
  // getPrinterStatus - Printer Availability Check
  // ============================================================================
  describe('getPrinterStatus', () => {
    it('should return configured=true when printer exists for location', async () => {
      // Arrange
      const locationId = 'loc-with-printer'

      // Act
      const { getPrinterStatus } = await import('../label-service')
      const result = await getPrinterStatus(locationId)

      // Assert
      expect(result.configured).toBe(true)
      expect(result.printer).toBeDefined()
      expect(result.printer?.id).toBeDefined()
      expect(result.printer?.name).toBeDefined()
      expect(result.printer?.ip).toBeDefined()
    })

    it('should return configured=false when no printer for location', async () => {
      // Arrange
      const locationId = 'loc-no-printer'

      // Act
      const { getPrinterStatus } = await import('../label-service')
      const result = await getPrinterStatus(locationId)

      // Assert
      expect(result.configured).toBe(false)
      expect(result.printer).toBeUndefined()
      expect(result.error?.message).toBe('No printer configured')
    })

    it('should use default printer when locationId not specified', async () => {
      // Arrange
      const locationId = undefined

      // Act
      const { getPrinterStatus } = await import('../label-service')
      const result = await getPrinterStatus(locationId)

      // Assert
      // Should return default printer or error if none
      expect(result.configured).toBeDefined()
    })

    it('should return printer status (online/offline)', async () => {
      // Arrange
      const locationId = 'loc-with-printer'

      // Act
      const { getPrinterStatus } = await import('../label-service')
      const result = await getPrinterStatus(locationId)

      // Assert
      if (result.configured && result.printer) {
        expect(result.printer.status).toBeDefined()
        expect(['online', 'offline', 'unknown']).toContain(result.printer.status)
      }
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * generateZPL (9 tests):
 *   - Valid ZPL structure (^XA/^XZ)
 *   - Code128 barcode inclusion
 *   - Product name field
 *   - Qty with UoM formatting
 *   - Batch number field
 *   - Expiry date formatting
 *   - QA status field
 *   - Custom template support
 *   - Non-existent LP error
 *
 * sendToPrinter (5 tests):
 *   - 2s response time target
 *   - No printer configured error (404)
 *   - Printer offline error (503)
 *   - Print timeout error (504)
 *   - Specific printer selection
 *
 * getPrinterStatus (4 tests):
 *   - Configured printer for location
 *   - No printer for location
 *   - Default printer fallback
 *   - Online/offline status
 *
 * Total: 18 tests
 */
