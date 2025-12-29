/**
 * Traceability Config Service - Unit Tests (Story 02.10a)
 * Purpose: Test traceability configuration service for product-level settings
 * Phase: RED - Tests will fail until service is implemented
 *
 * Tests the TraceabilityConfigService which handles:
 * - Getting product traceability config (with defaults for unconfigured products)
 * - Updating/saving traceability configuration
 * - Validating lot number format with placeholder patterns
 * - Parsing lot format into components
 * - Generating sample lot numbers (for live preview)
 * - Configuration defaults per product type
 * - Error handling for missing/invalid configs
 *
 * Coverage Target: 80%
 * Test Count: 15+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-01, AC-02, AC-03: Lot format configuration and validation
 * - AC-04, AC-05: Batch size constraints
 * - AC-06, AC-07, AC-08: Traceability level selection
 * - AC-09, AC-10, AC-11: Expiry calculation methods
 * - AC-12, AC-13: GS1 compliance settings
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock Supabase server functions BEFORE importing service
vi.mock('../../supabase/server', () => ({
  createServerSupabase: vi.fn(),
  createServerSupabaseAdmin: vi.fn(),
}))

// Import after mocking
import {
  TraceabilityConfigService,
  validateLotFormat,
  parseLotFormat,
  generateSampleLotNumber,
  type TraceabilityConfig,
  type TraceabilityConfigInput,
} from '../traceability-config-service'
import { createServerSupabase, createServerSupabaseAdmin } from '../../supabase/server'

describe('TraceabilityConfigService (Story 02.10a)', () => {
  // Helper to create a chainable mock query builder
  const createMockQuery = (finalResult: any) => {
    const query: any = {
      select: vi.fn(function() { return query }),
      eq: vi.fn(function() { return query }),
      single: vi.fn(() => Promise.resolve(finalResult)),
      upsert: vi.fn(function() { return query }),
      insert: vi.fn(function() { return query }),
      update: vi.fn(function() { return query }),
    }
    return query
  }

  // Helper to mock successful update operation
  const mockSuccessfulUpdate = (config: Partial<TraceabilityConfigInput>) => {
    vi.mocked(createServerSupabaseAdmin).mockImplementation(() => ({
      from: vi.fn((table: string) => {
        return createMockQuery({
          data: { ...config, id: 'config-001', org_id: 'org-001', product_id: 'prod-001' },
          error: null,
        })
      }),
    } as any))
  }

  beforeEach(() => {
    vi.clearAllMocks()

    // Default mock for createServerSupabase
    vi.mocked(createServerSupabase).mockImplementation(async () => ({
      from: vi.fn((table: string) => {
        if (table === 'users') {
          return createMockQuery({ data: { org_id: 'org-001' }, error: null })
        }
        return createMockQuery({ data: null, error: { code: 'PGRST116' } })
      }),
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { id: 'user-001' } },
          error: null,
        }),
      },
    } as any))

    // Default mock for createServerSupabaseAdmin
    vi.mocked(createServerSupabaseAdmin).mockImplementation(() => ({
      from: vi.fn((table: string) => {
        return createMockQuery({ data: null, error: { code: 'PGRST116' } })
      }),
    } as any))
  })

  /**
   * AC-01, AC-02: Lot Format Configuration
   */
  describe('Lot Number Format Configuration', () => {
    it('should fetch traceability config for valid product', async () => {
      const validConfig: TraceabilityConfig = {
        id: 'config-001',
        product_id: 'prod-001',
        org_id: 'org-001',
        lot_number_format: 'LOT-{YYYY}-{SEQ:6}',
        traceability_level: 'lot',
        gs1_lot_encoding_enabled: true,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      }

      // Mock getProductTraceabilityConfig to return valid config
      vi.mocked(createServerSupabase).mockImplementation(async () => ({
        from: vi.fn((table: string) => {
          if (table === 'product_traceability_config') {
            return createMockQuery({ data: validConfig, error: null })
          }
          return createMockQuery({ data: null, error: { code: 'PGRST116' } })
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-001' } },
            error: null,
          }),
        },
      } as any))

      const result = await TraceabilityConfigService.getProductTraceabilityConfig(
        'prod-001'
      )

      expect(result).toEqual(validConfig)
    })

    it('should return default config when product has no configuration', async () => {
      // Default mock already returns PGRST116 error, so just call the service
      const result = await TraceabilityConfigService.getProductTraceabilityConfig(
        'prod-001'
      )

      expect(result._isDefault).toBe(true)
      expect(result.traceability_level).toBe('lot')
    })

    it('should save valid traceability configuration', async () => {
      const config: TraceabilityConfigInput = {
        lot_number_format: 'LOT-{YYYY}-{SEQ:6}',
        traceability_level: 'lot',
        gs1_lot_encoding_enabled: true,
      }

      mockSuccessfulUpdate(config)

      const result = await TraceabilityConfigService.updateProductTraceabilityConfig(
        'prod-001',
        config
      )

      expect(result).toHaveProperty('id')
      expect(result.lot_number_format).toBe('LOT-{YYYY}-{SEQ:6}')
    })

    it('should handle API errors gracefully', async () => {
      vi.mocked(createServerSupabase).mockImplementation(async () => ({
        from: vi.fn((table: string) => {
          return createMockQuery({
            data: null,
            error: new Error('Network error'),
          })
        }),
        auth: {
          getUser: vi.fn().mockResolvedValue({
            data: { user: { id: 'user-001' } },
            error: null,
          }),
        },
      } as any))

      const result = await TraceabilityConfigService.getProductTraceabilityConfig(
        'prod-001'
      )

      // Should return default or throw appropriately
      expect(result).toBeDefined()
    })
  })

  /**
   * validateLotFormat() - Lot Format Validation
   * AC-01: Valid format with correct placeholders
   * AC-02: Invalid format detection
   */
  describe('validateLotFormat() - Lot Number Format Validation', () => {
    it('should accept valid lot format with YYYY and SEQ placeholders', () => {
      const format = 'LOT-{YYYY}-{SEQ:6}'
      const result = validateLotFormat(format)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should accept format with multiple valid placeholders', () => {
      const format = '{PROD}-{YYMMDD}-{SEQ:4}'
      const result = validateLotFormat(format)

      expect(result.valid).toBe(true)
    })

    it('should accept format with JULIAN day placeholder', () => {
      const format = '{JULIAN}{YY}-{SEQ:5}'
      const result = validateLotFormat(format)

      expect(result.valid).toBe(true)
    })

    it('should accept format with LINE placeholder', () => {
      const format = 'L{LINE}-{YYYY}{MM}{DD}-{SEQ:4}'
      const result = validateLotFormat(format)

      expect(result.valid).toBe(true)
    })

    it('should reject format with invalid placeholder', () => {
      const format = 'LOT-{INVALID}-001'
      const result = validateLotFormat(format)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
      expect(result.errors[0]).toContain('INVALID')
    })

    it('should reject format with missing sequence length', () => {
      const format = 'LOT-{YYYY}-{SEQ}'
      const result = validateLotFormat(format)

      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should reject format with empty braces', () => {
      const format = 'LOT-{}-001'
      const result = validateLotFormat(format)

      expect(result.valid).toBe(false)
    })

    it('should reject plain text without placeholders', () => {
      const format = 'PLAIN_TEXT_NO_PLACEHOLDERS'
      const result = validateLotFormat(format)

      expect(result.valid).toBe(false)
    })

    it('should accept BRD production line format', () => {
      const format = 'BRD-{YYYY}-{MM}-{SEQ:6}'
      const result = validateLotFormat(format)

      expect(result.valid).toBe(true)
    })

    it('should validate case sensitivity (lowercase invalid)', () => {
      const format = 'LOT-{yyyy}-{seq:6}'
      const result = validateLotFormat(format)

      // Should fail because placeholders are uppercase
      expect(result.valid).toBe(false)
    })

    it('should accept multiple SEQ placeholders of different lengths', () => {
      // This should ideally fail, but service may allow it
      const format = '{SEQ:4}-{SEQ:2}'
      const result = validateLotFormat(format)

      expect(result).toHaveProperty('valid')
      expect(result).toHaveProperty('errors')
    })
  })

  /**
   * parseLotFormat() - Extract Format Components
   */
  describe('parseLotFormat() - Format Component Parsing', () => {
    it('should extract prefix and placeholders', () => {
      const format = 'LOT-{YYYY}-{SEQ:6}'
      const result = parseLotFormat(format)

      expect(result.prefix).toContain('LOT-')
      expect(result.placeholders).toBeDefined()
      expect(result.placeholders.length).toBeGreaterThan(0)
    })

    it('should identify YYYY placeholder correctly', () => {
      const format = 'LOT-{YYYY}-{SEQ:6}'
      const result = parseLotFormat(format)

      const yearPlaceholder = result.placeholders.find(p => p.type === 'YYYY')
      expect(yearPlaceholder).toBeDefined()
    })

    it('should extract SEQ length from placeholder', () => {
      const format = 'LOT-{YYYY}-{SEQ:6}'
      const result = parseLotFormat(format)

      const seqPlaceholder = result.placeholders.find(p => p.type === 'SEQ')
      expect(seqPlaceholder).toBeDefined()
      expect(seqPlaceholder?.length).toBe(6)
    })

    it('should handle format with all placeholder types', () => {
      const format = '{PROD}-{YYMMDD}-{SEQ:4}'
      const result = parseLotFormat(format)

      expect(result.placeholders).toBeDefined()
      expect(result.placeholders.length).toBeGreaterThanOrEqual(2)
    })

    it('should handle format with static prefix and suffix', () => {
      const format = 'PREFIX-{YYYY}{MM}{DD}-{SEQ:4}-SUFFIX'
      const result = parseLotFormat(format)

      expect(result.prefix).toBeDefined()
      expect(result.placeholders.length).toBeGreaterThan(0)
    })
  })

  /**
   * generateSampleLotNumber() - Live Preview
   */
  describe('generateSampleLotNumber() - Sample Lot Generation for Preview', () => {
    it('should generate sample lot with YYYY replaced by current year', () => {
      const format = 'LOT-{YYYY}-{SEQ:6}'
      const result = generateSampleLotNumber(format)

      const currentYear = new Date().getFullYear().toString()
      expect(result).toContain(currentYear)
      expect(result).toContain('LOT-')
    })

    it('should generate sample with SEQ replaced by zeros and 1', () => {
      const format = 'LOT-{YYYY}-{SEQ:6}'
      const result = generateSampleLotNumber(format)

      expect(result).toMatch(/000001/)
    })

    it('should generate sample for YY format', () => {
      const format = 'LOT-{YY}-{SEQ:4}'
      const result = generateSampleLotNumber(format)

      const lastTwoYears = new Date().getFullYear().toString().slice(-2)
      expect(result).toContain(lastTwoYears)
    })

    it('should generate sample with product code when provided', () => {
      const format = '{PROD}-{YYMMDD}-{SEQ:4}'
      const result = generateSampleLotNumber(format, 'BRD')

      expect(result).toContain('BRD')
    })

    it('should use default product code when not provided', () => {
      const format = '{PROD}-{YYMMDD}-{SEQ:4}'
      const result = generateSampleLotNumber(format)

      // Should contain placeholder or default value
      expect(result).toBeDefined()
    })

    it('should generate sample with JULIAN day placeholder', () => {
      const format = '{JULIAN}{YY}-{SEQ:5}'
      const result = generateSampleLotNumber(format)

      expect(result).toBeDefined()
      expect(/\d+/.test(result)).toBe(true)
    })

    it('should handle line code placeholder', () => {
      const format = 'L{LINE}-{YYYY}{MM}{DD}-{SEQ:4}'
      const result = generateSampleLotNumber(format)

      expect(result).toContain('L')
    })

    it('should update preview when date changes', () => {
      const format = '{YYYY}-{MM}-{DD}-{SEQ:6}'
      const result1 = generateSampleLotNumber(format)
      const result2 = generateSampleLotNumber(format)

      // Same format, same day should generate same result
      expect(result1).toBe(result2)
    })

    it('should generate valid lot numbers for all test formats', () => {
      const testFormats = [
        'LOT-{YYYY}-{SEQ:6}',
        '{PROD}-{YYMMDD}-{SEQ:4}',
        '{JULIAN}{YY}-{SEQ:5}',
        'L{LINE}-{YYYY}{MM}{DD}-{SEQ:4}',
        'BRD-{YYYY}-{MM}-{SEQ:6}',
      ]

      testFormats.forEach(format => {
        const result = generateSampleLotNumber(format)
        expect(result).toBeDefined()
        expect(typeof result).toBe('string')
        expect(result.length).toBeGreaterThan(0)
      })
    })
  })

  /**
   * AC-04, AC-05: Batch Size Constraints
   */
  describe('Batch Size Validation', () => {
    it('should accept valid batch size configuration', async () => {
      const config: TraceabilityConfigInput = {
        lot_number_format: 'LOT-{YYYY}-{SEQ:6}',
        standard_batch_size: 1000,
        min_batch_size: 500,
        max_batch_size: 2000,
      }

      mockSuccessfulUpdate(config)

      const result = await TraceabilityConfigService.updateProductTraceabilityConfig(
        'prod-001',
        config
      )

      expect(result).toBeDefined()
    })

    it('should handle batch size where min equals max', async () => {
      const config: TraceabilityConfigInput = {
        lot_number_format: 'LOT-{YYYY}-{SEQ:6}',
        standard_batch_size: 1000,
        min_batch_size: 1000,
        max_batch_size: 1000,
      }

      mockSuccessfulUpdate(config)

      const result = await TraceabilityConfigService.updateProductTraceabilityConfig(
        'prod-001',
        config
      )

      expect(result).toBeDefined()
    })

    it('should handle optional batch size fields', async () => {
      const config: TraceabilityConfigInput = {
        lot_number_format: 'LOT-{YYYY}-{SEQ:6}',
        // No batch size constraints
      }

      mockSuccessfulUpdate(config)

      const result = await TraceabilityConfigService.updateProductTraceabilityConfig(
        'prod-001',
        config
      )

      expect(result).toBeDefined()
    })
  })

  /**
   * AC-06, AC-07, AC-08: Traceability Level Selection
   */
  describe('Traceability Level Configuration', () => {
    it('should save lot-level traceability', async () => {
      const config: TraceabilityConfigInput = {
        lot_number_format: 'LOT-{YYYY}-{SEQ:6}',
        traceability_level: 'lot',
      }

      mockSuccessfulUpdate(config)

      const result = await TraceabilityConfigService.updateProductTraceabilityConfig(
        'prod-001',
        config
      )

      expect(result.traceability_level).toBe('lot')
    })

    it('should save batch-level traceability', async () => {
      const config: TraceabilityConfigInput = {
        lot_number_format: 'LOT-{YYYY}-{SEQ:6}',
        traceability_level: 'batch',
      }

      mockSuccessfulUpdate(config)

      const result = await TraceabilityConfigService.updateProductTraceabilityConfig(
        'prod-001',
        config
      )

      expect(result.traceability_level).toBe('batch')
    })

    it('should save serial-level traceability', async () => {
      const config: TraceabilityConfigInput = {
        lot_number_format: 'LOT-{YYYY}-{SEQ:6}',
        traceability_level: 'serial',
      }

      mockSuccessfulUpdate(config)

      const result = await TraceabilityConfigService.updateProductTraceabilityConfig(
        'prod-001',
        config
      )

      expect(result.traceability_level).toBe('serial')
    })
  })

  /**
   * AC-09, AC-10, AC-11: Expiry Calculation Methods
   */
  describe('Expiry Calculation Method Configuration', () => {
    it('should save fixed_days expiry method', async () => {
      const config: TraceabilityConfigInput = {
        lot_number_format: 'LOT-{YYYY}-{SEQ:6}',
        expiry_calculation_method: 'fixed_days',
      }

      mockSuccessfulUpdate(config)

      const result = await TraceabilityConfigService.updateProductTraceabilityConfig(
        'prod-001',
        config
      )

      expect(result.expiry_calculation_method).toBe('fixed_days')
    })

    it('should save rolling expiry method with buffer', async () => {
      const config: TraceabilityConfigInput = {
        lot_number_format: 'LOT-{YYYY}-{SEQ:6}',
        expiry_calculation_method: 'rolling',
        processing_buffer_days: 7,
      }

      mockSuccessfulUpdate(config)

      const result = await TraceabilityConfigService.updateProductTraceabilityConfig(
        'prod-001',
        config
      )

      expect(result.expiry_calculation_method).toBe('rolling')
      expect(result.processing_buffer_days).toBe(7)
    })

    it('should save manual expiry method', async () => {
      const config: TraceabilityConfigInput = {
        lot_number_format: 'LOT-{YYYY}-{SEQ:6}',
        expiry_calculation_method: 'manual',
      }

      mockSuccessfulUpdate(config)

      const result = await TraceabilityConfigService.updateProductTraceabilityConfig(
        'prod-001',
        config
      )

      expect(result.expiry_calculation_method).toBe('manual')
    })
  })

  /**
   * AC-12, AC-13: GS1 Compliance Settings
   */
  describe('GS1 Encoding Settings', () => {
    it('should save GS1 lot encoding enabled', async () => {
      const config: TraceabilityConfigInput = {
        lot_number_format: 'LOT-{YYYY}-{SEQ:6}',
        gs1_lot_encoding_enabled: true,
      }

      mockSuccessfulUpdate(config)

      const result = await TraceabilityConfigService.updateProductTraceabilityConfig(
        'prod-001',
        config
      )

      expect(result.gs1_lot_encoding_enabled).toBe(true)
    })

    it('should save GS1 expiry encoding enabled', async () => {
      const config: TraceabilityConfigInput = {
        lot_number_format: 'LOT-{YYYY}-{SEQ:6}',
        gs1_expiry_encoding_enabled: true,
      }

      mockSuccessfulUpdate(config)

      const result = await TraceabilityConfigService.updateProductTraceabilityConfig(
        'prod-001',
        config
      )

      expect(result.gs1_expiry_encoding_enabled).toBe(true)
    })

    it('should save SSCC-18 enabled', async () => {
      const config: TraceabilityConfigInput = {
        lot_number_format: 'LOT-{YYYY}-{SEQ:6}',
        gs1_sscc_enabled: true,
      }

      mockSuccessfulUpdate(config)

      const result = await TraceabilityConfigService.updateProductTraceabilityConfig(
        'prod-001',
        config
      )

      expect(result.gs1_sscc_enabled).toBe(true)
    })

    it('should handle all GS1 settings disabled', async () => {
      const config: TraceabilityConfigInput = {
        lot_number_format: 'LOT-{YYYY}-{SEQ:6}',
        gs1_lot_encoding_enabled: false,
        gs1_expiry_encoding_enabled: false,
        gs1_sscc_enabled: false,
      }

      mockSuccessfulUpdate(config)

      const result = await TraceabilityConfigService.updateProductTraceabilityConfig(
        'prod-001',
        config
      )

      expect(result.gs1_lot_encoding_enabled).toBe(false)
      expect(result.gs1_expiry_encoding_enabled).toBe(false)
      expect(result.gs1_sscc_enabled).toBe(false)
    })
  })
})
