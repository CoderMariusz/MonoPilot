/**
 * NCR Validation Schemas - Unit Tests (Story 06.9)
 * Purpose: Test Zod validation schemas for NCR data
 * Phase: RED - Tests will fail until schemas are implemented
 *
 * Tests validation schemas for:
 * - NCR creation (createNCRSchema)
 * - NCR updates (updateNCRSchema)
 * - NCR closure (closeNCRSchema)
 * - NCR assignment (assignNCRSchema)
 * - NCR list queries (ncrListQuerySchema)
 * - Enum definitions (severity, status, detection_point, category, source_type)
 *
 * Coverage Target: >80%
 * Test Count: 40+ validation scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-3: Create validation (title, description, severity, detection_point)
 * - AC-4: Source reference validation
 * - AC-11: Update validation
 * - AC-14: Closure notes validation
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'

/**
 * NOTE: This test file will fail because validation schemas do not exist yet.
 * Once the schemas are implemented in lib/validation/ncr-schemas.ts, all tests should pass.
 */

// Mock imports - schemas will be created by DEV agent
import {
  createNCRSchema,
  updateNCRSchema,
  closeNCRSchema,
  assignNCRSchema,
  ncrListQuerySchema,
  ncrSeverityEnum,
  ncrStatusEnum,
  ncrDetectionPointEnum,
  ncrCategoryEnum,
  ncrSourceTypeEnum,
} from '../ncr-schemas'

describe('NCR Validation Schemas (Story 06.9)', () => {
  // ============================================================================
  // Enum Tests
  // ============================================================================

  describe('ncrSeverityEnum', () => {
    it('should accept minor', () => {
      const result = ncrSeverityEnum.safeParse('minor')
      expect(result.success).toBe(true)
    })

    it('should accept major', () => {
      const result = ncrSeverityEnum.safeParse('major')
      expect(result.success).toBe(true)
    })

    it('should accept critical', () => {
      const result = ncrSeverityEnum.safeParse('critical')
      expect(result.success).toBe(true)
    })

    it('should reject invalid severity', () => {
      const result = ncrSeverityEnum.safeParse('extreme')
      expect(result.success).toBe(false)
    })

    it('should reject empty string', () => {
      const result = ncrSeverityEnum.safeParse('')
      expect(result.success).toBe(false)
    })
  })

  describe('ncrStatusEnum', () => {
    it('should accept draft', () => {
      const result = ncrStatusEnum.safeParse('draft')
      expect(result.success).toBe(true)
    })

    it('should accept open', () => {
      const result = ncrStatusEnum.safeParse('open')
      expect(result.success).toBe(true)
    })

    it('should accept closed', () => {
      const result = ncrStatusEnum.safeParse('closed')
      expect(result.success).toBe(true)
    })

    it('should reject invalid status', () => {
      const result = ncrStatusEnum.safeParse('pending')
      expect(result.success).toBe(false)
    })
  })

  describe('ncrDetectionPointEnum', () => {
    const validPoints = [
      'incoming',
      'in_process',
      'final',
      'customer',
      'internal_audit',
      'supplier_audit',
      'other',
    ]

    validPoints.forEach(point => {
      it(`should accept detection point: ${point}`, () => {
        const result = ncrDetectionPointEnum.safeParse(point)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid detection point', () => {
      const result = ncrDetectionPointEnum.safeParse('warehouse')
      expect(result.success).toBe(false)
    })
  })

  describe('ncrCategoryEnum', () => {
    const validCategories = [
      'product_defect',
      'process_deviation',
      'documentation_error',
      'equipment_failure',
      'supplier_issue',
      'customer_complaint',
      'other',
    ]

    validCategories.forEach(category => {
      it(`should accept category: ${category}`, () => {
        const result = ncrCategoryEnum.safeParse(category)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid category', () => {
      const result = ncrCategoryEnum.safeParse('invalid_category')
      expect(result.success).toBe(false)
    })
  })

  describe('ncrSourceTypeEnum', () => {
    const validSourceTypes = [
      'inspection',
      'hold',
      'batch',
      'work_order',
      'supplier',
      'customer_complaint',
      'audit',
      'other',
    ]

    validSourceTypes.forEach(sourceType => {
      it(`should accept source type: ${sourceType}`, () => {
        const result = ncrSourceTypeEnum.safeParse(sourceType)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid source type', () => {
      const result = ncrSourceTypeEnum.safeParse('invalid_source')
      expect(result.success).toBe(false)
    })
  })

  // ============================================================================
  // createNCRSchema Tests
  // ============================================================================

  describe('createNCRSchema', () => {
    const validInput = {
      title: 'Temperature deviation during receiving',
      description: 'Refrigerated ingredients received at 8°C instead of required 0-4°C range',
      severity: 'major',
      detection_point: 'incoming',
      category: 'supplier_issue',
    }

    it('should accept valid NCR creation data', () => {
      const result = createNCRSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should accept valid data without optional fields', () => {
      const input = {
        title: validInput.title,
        description: validInput.description,
        severity: validInput.severity,
        detection_point: validInput.detection_point,
      }
      const result = createNCRSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    // Title validation
    describe('title validation', () => {
      it('should require title', () => {
        const input = { ...validInput }
        delete input.title
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should require minimum 5 characters for title', () => {
        const input = { ...validInput, title: 'Bad' }
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should allow exactly 5 character title', () => {
        const input = { ...validInput, title: 'Title' }
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should reject title exceeding 200 characters', () => {
        const input = {
          ...validInput,
          title: 'a'.repeat(201),
        }
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should allow exactly 200 character title', () => {
        const input = {
          ...validInput,
          title: 'a'.repeat(200),
        }
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should trim whitespace from title', () => {
        const input = { ...validInput, title: '  Title With Spaces  ' }
        const result = createNCRSchema.safeParse(input)
        if (result.success) {
          expect(result.data.title).toBe(result.data.title.trim())
        }
      })
    })

    // Description validation
    describe('description validation', () => {
      it('should require description', () => {
        const input = { ...validInput }
        delete input.description
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should require minimum 20 characters for description', () => {
        const input = { ...validInput, description: 'Too short description' }
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should allow exactly 20 character description', () => {
        const input = { ...validInput, description: 'a'.repeat(20) }
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should reject description exceeding 2000 characters', () => {
        const input = {
          ...validInput,
          description: 'a'.repeat(2001),
        }
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should allow exactly 2000 character description', () => {
        const input = {
          ...validInput,
          description: 'a'.repeat(2000),
        }
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(true)
      })
    })

    // Severity validation
    describe('severity validation', () => {
      it('should require severity', () => {
        const input = { ...validInput }
        delete input.severity
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject invalid severity', () => {
        const input = { ...validInput, severity: 'extreme' }
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(false)
      })
    })

    // Detection point validation
    describe('detection_point validation', () => {
      it('should require detection_point', () => {
        const input = { ...validInput }
        delete input.detection_point
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject invalid detection_point', () => {
        const input = { ...validInput, detection_point: 'warehouse' }
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(false)
      })
    })

    // Category validation (optional)
    describe('category validation (optional)', () => {
      it('should allow undefined category', () => {
        const input = { ...validInput }
        delete input.category
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should reject invalid category', () => {
        const input = { ...validInput, category: 'invalid' }
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(false)
      })
    })

    // Source reference validation (optional)
    describe('source reference validation (optional)', () => {
      it('should allow source_type with valid UUID source_id', () => {
        const input = {
          ...validInput,
          source_type: 'inspection',
          source_id: '550e8400-e29b-41d4-a716-446655440000',
          source_description: 'Inspection INS-INC-2025-00456',
        }
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should reject invalid UUID for source_id', () => {
        const input = {
          ...validInput,
          source_type: 'inspection',
          source_id: 'not-a-uuid',
        }
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should reject invalid source_type', () => {
        const input = {
          ...validInput,
          source_type: 'invalid_source',
          source_id: '550e8400-e29b-41d4-a716-446655440000',
        }
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(false)
      })

      it('should allow source_description with max 500 characters', () => {
        const input = {
          ...validInput,
          source_type: 'inspection',
          source_id: '550e8400-e29b-41d4-a716-446655440000',
          source_description: 'a'.repeat(500),
        }
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should reject source_description exceeding 500 characters', () => {
        const input = {
          ...validInput,
          source_type: 'inspection',
          source_id: '550e8400-e29b-41d4-a716-446655440000',
          source_description: 'a'.repeat(501),
        }
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(false)
      })
    })

    // submit_immediately flag
    describe('submit_immediately flag', () => {
      it('should accept submit_immediately=true', () => {
        const input = { ...validInput, submit_immediately: true }
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should accept submit_immediately=false', () => {
        const input = { ...validInput, submit_immediately: false }
        const result = createNCRSchema.safeParse(input)
        expect(result.success).toBe(true)
      })

      it('should default submit_immediately to false if not provided', () => {
        const input = { ...validInput }
        const result = createNCRSchema.safeParse(input)
        if (result.success) {
          expect(result.data.submit_immediately).toBe(false)
        }
      })
    })
  })

  // ============================================================================
  // updateNCRSchema Tests
  // ============================================================================

  describe('updateNCRSchema', () => {
    it('should accept partial update with title', () => {
      const input = { title: 'Updated Title With More Details' }
      const result = updateNCRSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should accept partial update with description', () => {
      const input = { description: 'a'.repeat(20) }
      const result = updateNCRSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should accept partial update with severity', () => {
      const input = { severity: 'critical' }
      const result = updateNCRSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should accept partial update with detection_point', () => {
      const input = { detection_point: 'final' }
      const result = updateNCRSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should accept empty update object', () => {
      const input = {}
      const result = updateNCRSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should accept combined updates', () => {
      const input = {
        title: 'Updated Title',
        severity: 'critical',
        category: 'equipment_failure',
      }
      const result = updateNCRSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should validate title constraints on update', () => {
      const input = { title: 'Bad' }
      const result = updateNCRSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should validate description constraints on update', () => {
      const input = { description: 'Too short' }
      const result = updateNCRSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject invalid severity on update', () => {
      const input = { severity: 'extreme' }
      const result = updateNCRSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  // ============================================================================
  // closeNCRSchema Tests
  // ============================================================================

  describe('closeNCRSchema', () => {
    const validInput = {
      closure_notes: 'Issue resolved. Supplier corrected receiving temperature controls.',
    }

    it('should accept valid closure notes', () => {
      const result = closeNCRSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should require closure_notes', () => {
      const input = {}
      const result = closeNCRSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should require minimum 50 characters for closure_notes', () => {
      const input = { closure_notes: 'a'.repeat(49) }
      const result = closeNCRSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should allow exactly 50 character closure_notes', () => {
      const input = { closure_notes: 'a'.repeat(50) }
      const result = closeNCRSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should allow closure_notes exceeding 50 characters', () => {
      const input = {
        closure_notes: 'Issue resolved. Supplier corrected receiving temperature controls and updated procedures.',
      }
      const result = closeNCRSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should reject closure_notes exceeding 2000 characters', () => {
      const input = { closure_notes: 'a'.repeat(2001) }
      const result = closeNCRSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should allow exactly 2000 character closure_notes', () => {
      const input = { closure_notes: 'a'.repeat(2000) }
      const result = closeNCRSchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should not allow empty closure_notes', () => {
      const input = { closure_notes: '' }
      const result = closeNCRSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  // ============================================================================
  // assignNCRSchema Tests
  // ============================================================================

  describe('assignNCRSchema', () => {
    const validInput = {
      assigned_to: '550e8400-e29b-41d4-a716-446655440000',
    }

    it('should accept valid user UUID', () => {
      const result = assignNCRSchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should require assigned_to', () => {
      const input = {}
      const result = assignNCRSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject invalid UUID', () => {
      const input = { assigned_to: 'not-a-uuid' }
      const result = assignNCRSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject empty string', () => {
      const input = { assigned_to: '' }
      const result = assignNCRSchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should validate UUID format strictly', () => {
      const input = { assigned_to: '550e8400e29b41d4a716446655440000' }
      const result = assignNCRSchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  // ============================================================================
  // ncrListQuerySchema Tests
  // ============================================================================

  describe('ncrListQuerySchema', () => {
    const validInput = {
      status: 'draft',
      severity: 'critical',
      detection_point: 'incoming',
      category: 'supplier_issue',
      detected_by: '550e8400-e29b-41d4-a716-446655440000',
      assigned_to: '550e8400-e29b-41d4-a716-446655440001',
      date_from: '2025-01-01',
      date_to: '2025-12-31',
      search: 'temperature',
      sort_by: 'detected_date',
      sort_order: 'desc',
      page: 1,
      limit: 20,
    }

    it('should accept valid query parameters', () => {
      const result = ncrListQuerySchema.safeParse(validInput)
      expect(result.success).toBe(true)
    })

    it('should accept empty query (all optional)', () => {
      const result = ncrListQuerySchema.safeParse({})
      expect(result.success).toBe(true)
    })

    // Status filter
    it('should accept status filter', () => {
      const input = { status: 'open' }
      const result = ncrListQuerySchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should reject invalid status filter', () => {
      const input = { status: 'pending' }
      const result = ncrListQuerySchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    // Severity filter
    it('should accept severity filter', () => {
      const input = { severity: 'major' }
      const result = ncrListQuerySchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    // Detection point filter
    it('should accept detection_point filter', () => {
      const input = { detection_point: 'final' }
      const result = ncrListQuerySchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    // Search
    it('should accept search parameter', () => {
      const input = { search: 'temperature' }
      const result = ncrListQuerySchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should reject empty search string', () => {
      const input = { search: '' }
      const result = ncrListQuerySchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    // Sorting
    it('should accept sort_by parameter', () => {
      const input = { sort_by: 'ncr_number' }
      const result = ncrListQuerySchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should default sort_by to detected_date', () => {
      const result = ncrListQuerySchema.safeParse({})
      if (result.success) {
        expect(result.data.sort_by).toBe('detected_date')
      }
    })

    it('should accept sort_order=asc', () => {
      const input = { sort_order: 'asc' }
      const result = ncrListQuerySchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should default sort_order to desc', () => {
      const result = ncrListQuerySchema.safeParse({})
      if (result.success) {
        expect(result.data.sort_order).toBe('desc')
      }
    })

    // Pagination
    it('should accept page number', () => {
      const input = { page: 2 }
      const result = ncrListQuerySchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should default page to 1', () => {
      const result = ncrListQuerySchema.safeParse({})
      if (result.success) {
        expect(result.data.page).toBe(1)
      }
    })

    it('should reject page less than 1', () => {
      const input = { page: 0 }
      const result = ncrListQuerySchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should accept limit parameter', () => {
      const input = { limit: 50 }
      const result = ncrListQuerySchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should default limit to 20', () => {
      const result = ncrListQuerySchema.safeParse({})
      if (result.success) {
        expect(result.data.limit).toBe(20)
      }
    })

    it('should reject limit less than 1', () => {
      const input = { limit: 0 }
      const result = ncrListQuerySchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should reject limit exceeding 100', () => {
      const input = { limit: 101 }
      const result = ncrListQuerySchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should allow limit of 100', () => {
      const input = { limit: 100 }
      const result = ncrListQuerySchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    // Date filters
    it('should accept date_from parameter', () => {
      const input = { date_from: '2025-01-01' }
      const result = ncrListQuerySchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should accept date_to parameter', () => {
      const input = { date_to: '2025-12-31' }
      const result = ncrListQuerySchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    // UUID filters
    it('should accept valid UUID for detected_by', () => {
      const input = { detected_by: '550e8400-e29b-41d4-a716-446655440000' }
      const result = ncrListQuerySchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID for detected_by', () => {
      const input = { detected_by: 'not-a-uuid' }
      const result = ncrListQuerySchema.safeParse(input)
      expect(result.success).toBe(false)
    })

    it('should accept valid UUID for assigned_to', () => {
      const input = { assigned_to: '550e8400-e29b-41d4-a716-446655440000' }
      const result = ncrListQuerySchema.safeParse(input)
      expect(result.success).toBe(true)
    })

    it('should reject invalid UUID for assigned_to', () => {
      const input = { assigned_to: 'not-a-uuid' }
      const result = ncrListQuerySchema.safeParse(input)
      expect(result.success).toBe(false)
    })
  })

  // ============================================================================
  // Edge Cases and Error Messages
  // ============================================================================

  describe('Error Message Clarity', () => {
    it('createNCRSchema should provide clear error for short title', () => {
      const result = createNCRSchema.safeParse({
        title: 'Bad',
        description: 'a'.repeat(20),
        severity: 'major',
        detection_point: 'incoming',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('title'))).toBe(
          true
        )
      }
    })

    it('closeNCRSchema should provide clear error for short closure notes', () => {
      const result = closeNCRSchema.safeParse({
        closure_notes: 'Short',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('closure_notes'))).toBe(
          true
        )
      }
    })
  })
})
