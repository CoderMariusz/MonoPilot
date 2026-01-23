import { describe, it, expect } from 'vitest'
import { z } from 'zod'

/**
 * Unit Tests: Scanner QA Validation Schemas
 * Story: 06.8 Scanner QA Pass/Fail
 *
 * Tests Zod schemas for scanner API requests and offline queue
 */

// Define schemas inline for testing
const quickInspectionSchema = z.object({
  inspection_id: z.string().uuid('Invalid inspection ID'),
  result: z.enum(['pass', 'fail']),
  result_notes: z.string().max(2000).optional(),
  defects_found: z.number().int().min(0).max(1000).optional(),
  inspection_method: z.literal('scanner'),
  scanner_device_id: z.string().max(100).optional(),
  scanner_location: z.string().max(100).optional(),
})

const offlineActionSchema = z.object({
  id: z.string().uuid(),
  type: z.enum(['quick_inspection', 'test_result']),
  payload: z.record(z.any()),
  timestamp: z.string().datetime(),
})

const syncOfflineSchema = z.object({
  actions: z.array(offlineActionSchema).min(1).max(100),
})

describe('quickInspectionSchema - Pass/Fail Request Validation', () => {
  describe('Valid Payloads', () => {
    it('should validate quick pass payload', () => {
      const payload = {
        inspection_id: '123e4567-e89b-12d3-a456-426614174000',
        result: 'pass',
        inspection_method: 'scanner',
        scanner_device_id: 'device-001',
      }

      const result = quickInspectionSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('should validate quick fail payload with notes', () => {
      const payload = {
        inspection_id: '123e4567-e89b-12d3-a456-426614174000',
        result: 'fail',
        result_notes: 'Damaged packaging detected',
        defects_found: 3,
        inspection_method: 'scanner',
      }

      const result = quickInspectionSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('should validate minimal quick pass (only required fields)', () => {
      const payload = {
        inspection_id: '123e4567-e89b-12d3-a456-426614174000',
        result: 'pass',
        inspection_method: 'scanner',
      }

      const result = quickInspectionSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('should validate with scanner location (GPS coordinates)', () => {
      const payload = {
        inspection_id: '123e4567-e89b-12d3-a456-426614174000',
        result: 'pass',
        inspection_method: 'scanner',
        scanner_device_id: 'device-001',
        scanner_location: '40.7128,-74.0060', // NYC coordinates
      }

      const result = quickInspectionSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid Payloads - Missing Fields', () => {
    it('should reject if inspection_id is missing', () => {
      const payload = {
        result: 'pass',
        inspection_method: 'scanner',
      }

      const result = quickInspectionSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('should reject if result is missing', () => {
      const payload = {
        inspection_id: '123e4567-e89b-12d3-a456-426614174000',
        inspection_method: 'scanner',
      }

      const result = quickInspectionSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('should reject if inspection_method is missing', () => {
      const payload = {
        inspection_id: '123e4567-e89b-12d3-a456-426614174000',
        result: 'pass',
      }

      const result = quickInspectionSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })
  })

  describe('Invalid Payloads - Field Values', () => {
    it('should reject invalid inspection_id (not UUID)', () => {
      const payload = {
        inspection_id: 'not-a-uuid',
        result: 'pass',
        inspection_method: 'scanner',
      }

      const result = quickInspectionSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('should reject invalid result enum value', () => {
      const payload = {
        inspection_id: '123e4567-e89b-12d3-a456-426614174000',
        result: 'maybe', // Invalid - must be 'pass' or 'fail'
        inspection_method: 'scanner',
      }

      const result = quickInspectionSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('should reject invalid inspection_method', () => {
      const payload = {
        inspection_id: '123e4567-e89b-12d3-a456-426614174000',
        result: 'pass',
        inspection_method: 'desktop', // Must be 'scanner'
      }

      const result = quickInspectionSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('should reject defects_found with negative value', () => {
      const payload = {
        inspection_id: '123e4567-e89b-12d3-a456-426614174000',
        result: 'fail',
        defects_found: -1, // Invalid - must be >= 0
        inspection_method: 'scanner',
      }

      const result = quickInspectionSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('should reject defects_found > 1000', () => {
      const payload = {
        inspection_id: '123e4567-e89b-12d3-a456-426614174000',
        result: 'fail',
        defects_found: 1001, // Invalid - max is 1000
        inspection_method: 'scanner',
      }

      const result = quickInspectionSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('should reject result_notes exceeding 2000 characters', () => {
      const payload = {
        inspection_id: '123e4567-e89b-12d3-a456-426614174000',
        result: 'fail',
        result_notes: 'a'.repeat(2001),
        inspection_method: 'scanner',
      }

      const result = quickInspectionSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })

    it('should reject scanner_device_id exceeding 100 characters', () => {
      const payload = {
        inspection_id: '123e4567-e89b-12d3-a456-426614174000',
        result: 'pass',
        inspection_method: 'scanner',
        scanner_device_id: 'x'.repeat(101),
      }

      const result = quickInspectionSchema.safeParse(payload)
      expect(result.success).toBe(false)
    })
  })

  describe('Optional Fields', () => {
    it('should allow omitting result_notes', () => {
      const payload = {
        inspection_id: '123e4567-e89b-12d3-a456-426614174000',
        result: 'fail',
        inspection_method: 'scanner',
      }

      const result = quickInspectionSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('should allow omitting defects_found', () => {
      const payload = {
        inspection_id: '123e4567-e89b-12d3-a456-426614174000',
        result: 'fail',
        result_notes: 'Some notes',
        inspection_method: 'scanner',
      }

      const result = quickInspectionSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })

    it('should allow omitting scanner_device_id and scanner_location', () => {
      const payload = {
        inspection_id: '123e4567-e89b-12d3-a456-426614174000',
        result: 'pass',
        inspection_method: 'scanner',
      }

      const result = quickInspectionSchema.safeParse(payload)
      expect(result.success).toBe(true)
    })
  })
})

describe('offlineActionSchema - Offline Queue Action Validation', () => {
  describe('Valid Actions', () => {
    it('should validate quick_inspection offline action', () => {
      const action = {
        id: '223e4567-e89b-12d3-a456-426614174001',
        type: 'quick_inspection',
        payload: {
          inspection_id: '123e4567-e89b-12d3-a456-426614174000',
          result: 'pass',
          inspection_method: 'scanner',
        },
        timestamp: '2025-12-16T10:30:00Z',
      }

      const result = offlineActionSchema.safeParse(action)
      expect(result.success).toBe(true)
    })

    it('should validate test_result offline action', () => {
      const action = {
        id: '223e4567-e89b-12d3-a456-426614174002',
        type: 'test_result',
        payload: {
          test_id: '123e4567-e89b-12d3-a456-426614174000',
          result_value: 42.5,
          passed: true,
        },
        timestamp: '2025-12-16T10:35:00Z',
      }

      const result = offlineActionSchema.safeParse(action)
      expect(result.success).toBe(true)
    })

    it('should validate ISO 8601 datetime timestamp', () => {
      const action = {
        id: '223e4567-e89b-12d3-a456-426614174003',
        type: 'quick_inspection',
        payload: { inspection_id: '123e4567-e89b-12d3-a456-426614174000' },
        timestamp: '2025-12-16T10:30:00.123Z',
      }

      const result = offlineActionSchema.safeParse(action)
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid Actions', () => {
    it('should reject invalid id (not UUID)', () => {
      const action = {
        id: 'not-a-uuid',
        type: 'quick_inspection',
        payload: {},
        timestamp: '2025-12-16T10:30:00Z',
      }

      const result = offlineActionSchema.safeParse(action)
      expect(result.success).toBe(false)
    })

    it('should reject invalid type enum value', () => {
      const action = {
        id: '223e4567-e89b-12d3-a456-426614174001',
        type: 'unknown_action',
        payload: {},
        timestamp: '2025-12-16T10:30:00Z',
      }

      const result = offlineActionSchema.safeParse(action)
      expect(result.success).toBe(false)
    })

    it('should reject invalid timestamp (not ISO 8601)', () => {
      const action = {
        id: '223e4567-e89b-12d3-a456-426614174001',
        type: 'quick_inspection',
        payload: {},
        timestamp: '2025-12-16 10:30:00', // Invalid format
      }

      const result = offlineActionSchema.safeParse(action)
      expect(result.success).toBe(false)
    })

    it('should reject missing payload', () => {
      const action = {
        id: '223e4567-e89b-12d3-a456-426614174001',
        type: 'quick_inspection',
        timestamp: '2025-12-16T10:30:00Z',
      }

      const result = offlineActionSchema.safeParse(action)
      expect(result.success).toBe(false)
    })
  })
})

describe('syncOfflineSchema - Bulk Sync Request Validation', () => {
  describe('Valid Requests', () => {
    it('should validate single action in sync request', () => {
      const request = {
        actions: [
          {
            id: '223e4567-e89b-12d3-a456-426614174001',
            type: 'quick_inspection',
            payload: { inspection_id: '123e4567-e89b-12d3-a456-426614174000', result: 'pass' },
            timestamp: '2025-12-16T10:30:00Z',
          },
        ],
      }

      const result = syncOfflineSchema.safeParse(request)
      expect(result.success).toBe(true)
    })

    it('should validate 50 actions in sync request', () => {
      const actions = Array.from({ length: 50 }, (_, i) => ({
        id: `223e4567-e89b-12d3-a456-42661417${String(i).padStart(4, '0')}`,
        type: 'quick_inspection' as const,
        payload: { inspection_id: `123e4567-e89b-12d3-a456-42661417${String(i).padStart(4, '0')}`, result: 'pass' },
        timestamp: new Date(Date.now() + i * 1000).toISOString(),
      }))

      const request = {
        actions,
      }

      const result = syncOfflineSchema.safeParse(request)
      expect(result.success).toBe(true)
    })

    it('should validate max 100 actions in sync request', () => {
      const actions = Array.from({ length: 100 }, (_, i) => ({
        id: `223e4567-e89b-12d3-a456-42661417${String(i).padStart(4, '0')}`,
        type: 'quick_inspection' as const,
        payload: { inspection_id: `123e4567-e89b-12d3-a456-42661417${String(i).padStart(4, '0')}`, result: 'pass' },
        timestamp: new Date(Date.now() + i * 1000).toISOString(),
      }))

      const request = {
        actions,
      }

      const result = syncOfflineSchema.safeParse(request)
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid Requests', () => {
    it('should reject empty actions array', () => {
      const request = {
        actions: [],
      }

      const result = syncOfflineSchema.safeParse(request)
      expect(result.success).toBe(false)
    })

    it('should reject more than 100 actions', () => {
      const actions = Array.from({ length: 101 }, (_, i) => ({
        id: `223e4567-e89b-12d3-a456-42661417${String(i).padStart(4, '0')}`,
        type: 'quick_inspection' as const,
        payload: {},
        timestamp: new Date().toISOString(),
      }))

      const request = {
        actions,
      }

      const result = syncOfflineSchema.safeParse(request)
      expect(result.success).toBe(false)
    })

    it('should reject if actions array is missing', () => {
      const request = {}

      const result = syncOfflineSchema.safeParse(request)
      expect(result.success).toBe(false)
    })

    it('should reject if any action in array is invalid', () => {
      const request = {
        actions: [
          {
            id: '223e4567-e89b-12d3-a456-426614174001',
            type: 'quick_inspection',
            payload: {},
            timestamp: '2025-12-16T10:30:00Z',
          },
          {
            id: 'invalid-uuid', // Invalid ID
            type: 'quick_inspection',
            payload: {},
            timestamp: '2025-12-16T10:35:00Z',
          },
        ],
      }

      const result = syncOfflineSchema.safeParse(request)
      expect(result.success).toBe(false)
    })
  })
})

describe('Validation - Type Coercion & Parsing', () => {
  it('should parse valid UUID strings correctly', () => {
    const uuid = '123e4567-e89b-12d3-a456-426614174000'
    const schema = z.string().uuid()

    const result = schema.safeParse(uuid)
    expect(result.success).toBe(true)
  })

  it('should parse valid ISO 8601 datetime', () => {
    const timestamp = '2025-12-16T10:30:00Z'
    const schema = z.string().datetime()

    const result = schema.safeParse(timestamp)
    expect(result.success).toBe(true)
  })

  it('should parse enum values correctly', () => {
    const result = z.enum(['pass', 'fail']).safeParse('pass')
    expect(result.success).toBe(true)
  })

  it('should validate integer for defects_found', () => {
    const schema = z.number().int()

    expect(schema.safeParse(3).success).toBe(true)
    expect(schema.safeParse(3.5).success).toBe(false)
  })
})
