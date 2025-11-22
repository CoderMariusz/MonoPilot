import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  generateLocationBarcode,
  validateBarcodeUniqueness,
  generateQRCode,
  generatePrintableQRCode,
} from '../barcode-generator-service'

/**
 * Unit Tests: Barcode Generator Service
 * Story: 1.6 Location Management
 * Task 12: Integration & Testing (AC-005.3, AC-005.6)
 *
 * Tests barcode generation, QR code generation, and validation
 */

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => ({
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          order: vi.fn(() => ({
            limit: vi.fn(() => ({
              maybeSingle: vi.fn(),
            })),
          })),
          single: vi.fn(),
        })),
      })),
    })),
  })),
}))

// Mock qrcode library
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn((text: string, options: any) => {
      // Return mock data URL
      return Promise.resolve(`data:image/png;base64,mock_qr_${text}_${options.width}`)
    }),
  },
}))

describe('generateLocationBarcode - Barcode Generation (AC-005.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Barcode Format', () => {
    it('should generate barcode with format LOC-{warehouse_code}-{sequence}', async () => {
      // Expected format: LOC-WH-01-001, LOC-WH-01-002, etc.
      const warehouseCode = 'WH-01'
      const orgId = 'org-123'

      // Mock: no existing locations (first location)
      const { createServerSupabase } = await import('@/lib/supabase/server')
      const mockSupabase = await createServerSupabase()
      ;(mockSupabase.from as any)().select().eq().order().limit().maybeSingle.mockResolvedValue({
        data: null, // No existing locations
        error: null,
      })

      const result = await generateLocationBarcode(warehouseCode, orgId)

      expect(result.success).toBe(true)
      expect(result.barcode).toBe('LOC-WH-01-001')
    })

    it('should increment sequence for existing locations', async () => {
      const warehouseCode = 'WH-01'
      const orgId = 'org-123'

      // Mock: highest existing barcode is LOC-WH-01-005
      const { createServerSupabase } = await import('@/lib/supabase/server')
      const mockSupabase = await createServerSupabase()
      ;(mockSupabase.from as any)().select().eq().order().limit().maybeSingle.mockResolvedValue({
        data: { barcode: 'LOC-WH-01-005' },
        error: null,
      })

      const result = await generateLocationBarcode(warehouseCode, orgId)

      expect(result.success).toBe(true)
      expect(result.barcode).toBe('LOC-WH-01-006')
    })

    it('should pad sequence with leading zeros (3 digits)', async () => {
      const warehouseCode = 'WH-TEST'
      const orgId = 'org-123'

      // Mock: no existing locations
      const { createServerSupabase } = await import('@/lib/supabase/server')
      const mockSupabase = await createServerSupabase()
      ;(mockSupabase.from as any)().select().eq().order().limit().maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await generateLocationBarcode(warehouseCode, orgId)

      expect(result.success).toBe(true)
      expect(result.barcode).toMatch(/^LOC-WH-TEST-\d{3}$/)
      expect(result.barcode).toBe('LOC-WH-TEST-001')
    })

    it('should handle sequences over 999', async () => {
      const warehouseCode = 'WH-01'
      const orgId = 'org-123'

      // Mock: highest existing is 1500
      const { createServerSupabase } = await import('@/lib/supabase/server')
      const mockSupabase = await createServerSupabase()
      ;(mockSupabase.from as any)().select().eq().order().limit().maybeSingle.mockResolvedValue({
        data: { barcode: 'LOC-WH-01-1500' },
        error: null,
      })

      const result = await generateLocationBarcode(warehouseCode, orgId)

      expect(result.success).toBe(true)
      expect(result.barcode).toBe('LOC-WH-01-1501')
    })

    it('should handle warehouse codes with hyphens and numbers', async () => {
      const warehouseCode = 'MAIN-WAREHOUSE-2024'
      const orgId = 'org-123'

      const { createServerSupabase } = await import('@/lib/supabase/server')
      const mockSupabase = await createServerSupabase()
      ;(mockSupabase.from as any)().select().eq().order().limit().maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      const result = await generateLocationBarcode(warehouseCode, orgId)

      expect(result.success).toBe(true)
      expect(result.barcode).toBe('LOC-MAIN-WAREHOUSE-2024-001')
    })
  })

  describe('Error Handling', () => {
    it('should handle database query errors', async () => {
      const warehouseCode = 'WH-01'
      const orgId = 'org-123'

      // Mock database error
      const { createServerSupabase } = await import('@/lib/supabase/server')
      const mockSupabase = await createServerSupabase()
      ;(mockSupabase.from as any)().select().eq().order().limit().maybeSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      })

      const result = await generateLocationBarcode(warehouseCode, orgId)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Failed to generate barcode')
    })

    it('should handle invalid warehouse code format', async () => {
      const warehouseCode = ''
      const orgId = 'org-123'

      const result = await generateLocationBarcode(warehouseCode, orgId)

      expect(result.success).toBe(false)
      expect(result.error).toBeDefined()
    })
  })

  describe('Multi-warehouse Isolation', () => {
    it('should generate independent sequences per warehouse', async () => {
      // Warehouse 1: LOC-WH-01-003
      // Warehouse 2: LOC-WH-02-001
      // Both in same org, but sequences are independent

      const orgId = 'org-123'
      const { createServerSupabase } = await import('@/lib/supabase/server')
      const mockSupabase = await createServerSupabase()

      // Warehouse 1 - has 3 locations
      ;(mockSupabase.from as any)().select().eq().order().limit().maybeSingle.mockResolvedValue({
        data: { barcode: 'LOC-WH-01-003' },
        error: null,
      })

      const result1 = await generateLocationBarcode('WH-01', orgId)
      expect(result1.barcode).toBe('LOC-WH-01-004')

      // Warehouse 2 - no locations yet
      ;(mockSupabase.from as any)().select().eq().order().limit().maybeSingle.mockResolvedValue({
        data: null,
        error: null,
      })

      const result2 = await generateLocationBarcode('WH-02', orgId)
      expect(result2.barcode).toBe('LOC-WH-02-001')
    })
  })
})

describe('validateBarcodeUniqueness - Global Uniqueness (AC-005.3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return true when barcode is unique', async () => {
    const barcode = 'LOC-WH-01-999'

    // Mock: no existing location with this barcode
    const { createServerSupabase } = await import('@/lib/supabase/server')
    const mockSupabase = await createServerSupabase()
    ;(mockSupabase.from as any)().select().eq().single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' }, // Not found error
    })

    const result = await validateBarcodeUniqueness(barcode)

    expect(result).toBe(true)
  })

  it('should return false when barcode already exists', async () => {
    const barcode = 'LOC-WH-01-001'

    // Mock: barcode already exists
    const { createServerSupabase } = await import('@/lib/supabase/server')
    const mockSupabase = await createServerSupabase()
    ;(mockSupabase.from as any)().select().eq().single.mockResolvedValue({
      data: { id: 'loc-123', barcode: 'LOC-WH-01-001' },
      error: null,
    })

    const result = await validateBarcodeUniqueness(barcode)

    expect(result).toBe(false)
  })

  it('should handle database errors gracefully', async () => {
    const barcode = 'LOC-WH-01-001'

    // Mock database error
    const { createServerSupabase } = await import('@/lib/supabase/server')
    const mockSupabase = await createServerSupabase()
    ;(mockSupabase.from as any)().select().eq().single.mockResolvedValue({
      data: null,
      error: { message: 'Connection timeout' },
    })

    const result = await validateBarcodeUniqueness(barcode)

    // On error, assume not unique (safer)
    expect(result).toBe(false)
  })
})

describe('generateQRCode - QR Code Display (AC-005.6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate QR code as data URL with correct dimensions', async () => {
    const barcode = 'LOC-WH-01-001'

    const result = await generateQRCode(barcode)

    expect(result.success).toBe(true)
    expect(result.dataUrl).toContain('data:image/png;base64')
    expect(result.dataUrl).toContain('300') // Width in mock
  })

  it('should use Medium error correction level for display', async () => {
    const barcode = 'LOC-WH-01-001'
    const QRCode = (await import('qrcode')).default

    await generateQRCode(barcode)

    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      barcode,
      expect.objectContaining({
        errorCorrectionLevel: 'M', // Medium
        width: 300,
      })
    )
  })

  it('should handle QR code generation errors', async () => {
    const barcode = 'LOC-WH-01-001'

    // Mock error
    const QRCode = (await import('qrcode')).default
    ;(QRCode.toDataURL as any).mockRejectedValue(new Error('QR generation failed'))

    const result = await generateQRCode(barcode)

    expect(result.success).toBe(false)
    expect(result.error).toContain('Failed to generate QR code')
  })
})

describe('generatePrintableQRCode - QR Code Printing (AC-005.6)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should generate high-resolution QR code for printing', async () => {
    const barcode = 'LOC-WH-01-001'

    const result = await generatePrintableQRCode(barcode)

    expect(result.success).toBe(true)
    expect(result.dataUrl).toContain('600') // Higher resolution
  })

  it('should use High error correction level for printing', async () => {
    const barcode = 'LOC-WH-01-001'
    const QRCode = (await import('qrcode')).default

    await generatePrintableQRCode(barcode)

    expect(QRCode.toDataURL).toHaveBeenCalledWith(
      barcode,
      expect.objectContaining({
        errorCorrectionLevel: 'H', // High
        width: 600,
      })
    )
  })

  it('should handle empty barcode input', async () => {
    const barcode = ''

    const result = await generatePrintableQRCode(barcode)

    expect(result.success).toBe(false)
    expect(result.error).toBeDefined()
  })
})

/**
 * Test Coverage Summary:
 *
 * ✅ Barcode Generation (8 tests):
 *    - Format validation (LOC-{warehouse}-{seq})
 *    - Sequence incrementing
 *    - Leading zeros padding
 *    - Large sequence numbers (>999)
 *    - Warehouse code variations
 *    - Multi-warehouse isolation
 *    - Error handling
 *
 * ✅ Barcode Uniqueness (3 tests):
 *    - Global uniqueness check
 *    - Duplicate detection
 *    - Error handling
 *
 * ✅ QR Code Generation (3 tests):
 *    - Display QR (300x300, Medium EC)
 *    - Printable QR (600x600, High EC)
 *    - Error handling
 *
 * Total: 14 unit tests covering barcode generation service
 */
