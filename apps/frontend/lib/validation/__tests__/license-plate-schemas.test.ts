/**
 * License Plate Validation Schemas - Unit Tests (Story 05.1)
 * Purpose: Test Zod validation schemas for LP operations
 * Phase: RED - Tests will fail until schemas are implemented
 *
 * Tests validation schemas:
 * - createLPSchema
 * - updateLPSchema
 * - consumeLPSchema
 * - createOutputLPSchema
 * - lpQuerySchema
 * - updateQAStatusSchema
 * - blockLPSchema
 *
 * Coverage Target: 100% (all validation rules)
 */

import { describe, it, expect } from 'vitest'
import {
  createLPSchema,
  updateLPSchema,
  consumeLPSchema,
  createOutputLPSchema,
  lpQuerySchema,
  updateQAStatusSchema,
  blockLPSchema,
  lpStatusEnum,
  qaStatusEnum,
  lpSourceEnum,
} from '../license-plate-schemas'

describe('License Plate Validation Schemas (Story 05.1)', () => {
  // ==========================================================================
  // Enum Schemas
  // ==========================================================================
  describe('lpStatusEnum', () => {
    it('should accept valid status values', () => {
      expect(() => lpStatusEnum.parse('available')).not.toThrow()
      expect(() => lpStatusEnum.parse('reserved')).not.toThrow()
      expect(() => lpStatusEnum.parse('consumed')).not.toThrow()
      expect(() => lpStatusEnum.parse('blocked')).not.toThrow()
    })

    it('should reject invalid status values', () => {
      expect(() => lpStatusEnum.parse('invalid')).toThrow()
      expect(() => lpStatusEnum.parse('active')).toThrow()
      expect(() => lpStatusEnum.parse('')).toThrow()
    })
  })

  describe('qaStatusEnum', () => {
    it('should accept valid QA status values', () => {
      expect(() => qaStatusEnum.parse('pending')).not.toThrow()
      expect(() => qaStatusEnum.parse('passed')).not.toThrow()
      expect(() => qaStatusEnum.parse('failed')).not.toThrow()
      expect(() => qaStatusEnum.parse('quarantine')).not.toThrow()
    })

    it('should reject invalid QA status values', () => {
      expect(() => qaStatusEnum.parse('invalid')).toThrow()
      expect(() => qaStatusEnum.parse('approved')).toThrow()
    })
  })

  describe('lpSourceEnum', () => {
    it('should accept valid source values', () => {
      expect(() => lpSourceEnum.parse('manual')).not.toThrow()
      expect(() => lpSourceEnum.parse('receipt')).not.toThrow()
      expect(() => lpSourceEnum.parse('production')).not.toThrow()
      expect(() => lpSourceEnum.parse('return')).not.toThrow()
      expect(() => lpSourceEnum.parse('adjustment')).not.toThrow()
      expect(() => lpSourceEnum.parse('split')).not.toThrow()
    })

    it('should reject invalid source values', () => {
      expect(() => lpSourceEnum.parse('invalid')).toThrow()
      expect(() => lpSourceEnum.parse('purchase')).toThrow()
    })
  })

  // ==========================================================================
  // Create LP Schema
  // ==========================================================================
  describe('createLPSchema', () => {
    const validInput = {
      product_id: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 500,
      uom: 'KG',
      location_id: '123e4567-e89b-12d3-a456-426614174001',
      warehouse_id: '123e4567-e89b-12d3-a456-426614174002',
    }

    it('should accept valid create LP input', () => {
      const result = createLPSchema.parse(validInput)

      expect(result.product_id).toBe(validInput.product_id)
      expect(result.quantity).toBe(500)
      expect(result.uom).toBe('KG')
    })

    it('should accept optional lp_number', () => {
      const input = {
        ...validInput,
        lp_number: 'LP00000001',
      }

      const result = createLPSchema.parse(input)

      expect(result.lp_number).toBe('LP00000001')
    })

    it('should accept optional batch and expiry fields', () => {
      const input = {
        ...validInput,
        batch_number: 'BATCH-001',
        supplier_batch_number: 'SUP-BATCH-001',
        expiry_date: '2026-06-15',
        manufacture_date: '2025-12-15',
      }

      const result = createLPSchema.parse(input)

      expect(result.batch_number).toBe('BATCH-001')
      expect(result.expiry_date).toBe('2026-06-15')
    })

    it('should accept optional catch weight', () => {
      const input = {
        ...validInput,
        catch_weight_kg: 47.5,
      }

      const result = createLPSchema.parse(input)

      expect(result.catch_weight_kg).toBe(47.5)
    })

    it('should accept valid source', () => {
      const input = {
        ...validInput,
        source: 'receipt' as const,
      }

      const result = createLPSchema.parse(input)

      expect(result.source).toBe('receipt')
    })

    it('should set default source to manual', () => {
      const result = createLPSchema.parse(validInput)

      expect(result.source).toBe('manual')
    })

    it('should reject invalid product_id UUID', () => {
      const input = {
        ...validInput,
        product_id: 'invalid-uuid',
      }

      expect(() => createLPSchema.parse(input)).toThrow(/Invalid product ID/i)
    })

    it('should reject negative quantity', () => {
      const input = {
        ...validInput,
        quantity: -10,
      }

      expect(() => createLPSchema.parse(input)).toThrow(/positive/i)
    })

    it('should reject zero quantity', () => {
      const input = {
        ...validInput,
        quantity: 0,
      }

      expect(() => createLPSchema.parse(input)).toThrow(/positive/i)
    })

    it('should reject quantity too large', () => {
      const input = {
        ...validInput,
        quantity: 1000000000, // Over limit
      }

      expect(() => createLPSchema.parse(input)).toThrow(/too large/i)
    })

    it('should reject empty UoM', () => {
      const input = {
        ...validInput,
        uom: '',
      }

      expect(() => createLPSchema.parse(input)).toThrow(/required/i)
    })

    it('should reject UoM too long', () => {
      const input = {
        ...validInput,
        uom: 'A'.repeat(21), // Max 20 chars
      }

      expect(() => createLPSchema.parse(input)).toThrow(/max 20/i)
    })

    it('should reject invalid location_id UUID', () => {
      const input = {
        ...validInput,
        location_id: 'invalid',
      }

      expect(() => createLPSchema.parse(input)).toThrow(/Invalid location ID/i)
    })

    it('should reject invalid warehouse_id UUID', () => {
      const input = {
        ...validInput,
        warehouse_id: 'invalid',
      }

      expect(() => createLPSchema.parse(input)).toThrow(/Invalid warehouse ID/i)
    })

    it('should reject batch_number too long', () => {
      const input = {
        ...validInput,
        batch_number: 'B'.repeat(101), // Max 100
      }

      expect(() => createLPSchema.parse(input)).toThrow(/max.*100/i)
    })

    it('should reject invalid GTIN length', () => {
      const input = {
        ...validInput,
        gtin: '12345', // Must be 14 digits
      }

      expect(() => createLPSchema.parse(input)).toThrow(/14 digits/i)
    })

    it('should accept valid GTIN', () => {
      const input = {
        ...validInput,
        gtin: '12345678901234',
      }

      const result = createLPSchema.parse(input)

      expect(result.gtin).toBe('12345678901234')
    })
  })

  // ==========================================================================
  // Update LP Schema
  // ==========================================================================
  describe('updateLPSchema', () => {
    it('should accept valid update input', () => {
      const input = {
        quantity: 450,
      }

      const result = updateLPSchema.parse(input)

      expect(result.quantity).toBe(450)
    })

    it('should accept location_id update', () => {
      const input = {
        location_id: '123e4567-e89b-12d3-a456-426614174001',
      }

      const result = updateLPSchema.parse(input)

      expect(result.location_id).toBe(input.location_id)
    })

    it('should accept batch and expiry updates', () => {
      const input = {
        batch_number: 'NEW-BATCH',
        expiry_date: '2026-12-31',
      }

      const result = updateLPSchema.parse(input)

      expect(result.batch_number).toBe('NEW-BATCH')
      expect(result.expiry_date).toBe('2026-12-31')
    })

    it('should reject negative quantity', () => {
      const input = {
        quantity: -10,
      }

      expect(() => updateLPSchema.parse(input)).toThrow(/positive/i)
    })

    it('should accept catch weight update', () => {
      const input = {
        catch_weight_kg: 50.5,
      }

      const result = updateLPSchema.parse(input)

      expect(result.catch_weight_kg).toBe(50.5)
    })

    it('should accept empty object (optional updates)', () => {
      const result = updateLPSchema.parse({})

      expect(result).toEqual({})
    })
  })

  // ==========================================================================
  // Consume LP Schema (CRITICAL for Epic 04)
  // ==========================================================================
  describe('consumeLPSchema', () => {
    const validInput = {
      lp_id: '123e4567-e89b-12d3-a456-426614174000',
      consume_qty: 50,
      wo_id: '123e4567-e89b-12d3-a456-426614174001',
    }

    it('should accept valid consume input', () => {
      const result = consumeLPSchema.parse(validInput)

      expect(result.lp_id).toBe(validInput.lp_id)
      expect(result.consume_qty).toBe(50)
      expect(result.wo_id).toBe(validInput.wo_id)
    })

    it('should accept optional operation_id', () => {
      const input = {
        ...validInput,
        operation_id: '123e4567-e89b-12d3-a456-426614174002',
      }

      const result = consumeLPSchema.parse(input)

      expect(result.operation_id).toBe(input.operation_id)
    })

    it('should reject invalid lp_id UUID', () => {
      const input = {
        ...validInput,
        lp_id: 'invalid',
      }

      expect(() => consumeLPSchema.parse(input)).toThrow(/Invalid LP ID/i)
    })

    it('should reject negative consume_qty', () => {
      const input = {
        ...validInput,
        consume_qty: -10,
      }

      expect(() => consumeLPSchema.parse(input)).toThrow(/positive/i)
    })

    it('should reject zero consume_qty', () => {
      const input = {
        ...validInput,
        consume_qty: 0,
      }

      expect(() => consumeLPSchema.parse(input)).toThrow(/positive/i)
    })

    it('should reject invalid wo_id UUID', () => {
      const input = {
        ...validInput,
        wo_id: 'invalid',
      }

      expect(() => consumeLPSchema.parse(input)).toThrow(/Invalid WO ID/i)
    })
  })

  // ==========================================================================
  // Create Output LP Schema (CRITICAL for Epic 04)
  // ==========================================================================
  describe('createOutputLPSchema', () => {
    const validInput = {
      product_id: '123e4567-e89b-12d3-a456-426614174000',
      quantity: 500,
      uom: 'KG',
      location_id: '123e4567-e89b-12d3-a456-426614174001',
      warehouse_id: '123e4567-e89b-12d3-a456-426614174002',
      wo_id: '123e4567-e89b-12d3-a456-426614174003',
    }

    it('should accept valid output LP input', () => {
      const result = createOutputLPSchema.parse(validInput)

      expect(result.product_id).toBe(validInput.product_id)
      expect(result.wo_id).toBe(validInput.wo_id)
      expect(result.quantity).toBe(500)
    })

    it('should accept optional batch and dates', () => {
      const input = {
        ...validInput,
        batch_number: 'PROD-BATCH-001',
        expiry_date: '2026-06-01',
        manufacture_date: '2025-12-21',
      }

      const result = createOutputLPSchema.parse(input)

      expect(result.batch_number).toBe('PROD-BATCH-001')
      expect(result.expiry_date).toBe('2026-06-01')
      expect(result.manufacture_date).toBe('2025-12-21')
    })

    it('should set default qa_status to pending', () => {
      const result = createOutputLPSchema.parse(validInput)

      expect(result.qa_status).toBe('pending')
    })

    it('should accept custom qa_status', () => {
      const input = {
        ...validInput,
        qa_status: 'passed' as const,
      }

      const result = createOutputLPSchema.parse(input)

      expect(result.qa_status).toBe('passed')
    })

    it('should accept catch weight', () => {
      const input = {
        ...validInput,
        catch_weight_kg: 47.5,
      }

      const result = createOutputLPSchema.parse(input)

      expect(result.catch_weight_kg).toBe(47.5)
    })

    it('should reject invalid product_id', () => {
      const input = {
        ...validInput,
        product_id: 'invalid',
      }

      expect(() => createOutputLPSchema.parse(input)).toThrow(/Invalid product ID/i)
    })

    it('should reject negative quantity', () => {
      const input = {
        ...validInput,
        quantity: -10,
      }

      expect(() => createOutputLPSchema.parse(input)).toThrow(/positive/i)
    })

    it('should reject invalid wo_id', () => {
      const input = {
        ...validInput,
        wo_id: 'invalid',
      }

      expect(() => createOutputLPSchema.parse(input)).toThrow(/Invalid WO ID/i)
    })

    it('should reject batch_number too long', () => {
      const input = {
        ...validInput,
        batch_number: 'B'.repeat(101),
      }

      expect(() => createOutputLPSchema.parse(input)).toThrow(/max.*100/i)
    })
  })

  // ==========================================================================
  // LP Query Schema
  // ==========================================================================
  describe('lpQuerySchema', () => {
    it('should accept valid query params', () => {
      const input = {
        page: 1,
        limit: 50,
      }

      const result = lpQuerySchema.parse(input)

      expect(result.page).toBe(1)
      expect(result.limit).toBe(50)
    })

    it('should set default page to 1', () => {
      const result = lpQuerySchema.parse({})

      expect(result.page).toBe(1)
    })

    it('should set default limit to 50', () => {
      const result = lpQuerySchema.parse({})

      expect(result.limit).toBe(50)
    })

    it('should set default sort to created_at', () => {
      const result = lpQuerySchema.parse({})

      expect(result.sort).toBe('created_at')
    })

    it('should set default order to desc', () => {
      const result = lpQuerySchema.parse({})

      expect(result.order).toBe('desc')
    })

    it('should accept optional filters', () => {
      const input = {
        warehouse_id: '123e4567-e89b-12d3-a456-426614174000',
        location_id: '123e4567-e89b-12d3-a456-426614174001',
        product_id: '123e4567-e89b-12d3-a456-426614174002',
        status: 'available' as const,
        qa_status: 'passed' as const,
        batch_number: 'BATCH-001',
        search: 'LP0000',
      }

      const result = lpQuerySchema.parse(input)

      expect(result.warehouse_id).toBe(input.warehouse_id)
      expect(result.status).toBe('available')
      expect(result.qa_status).toBe('passed')
      expect(result.search).toBe('LP0000')
    })

    it('should accept valid sort fields', () => {
      const fields = ['lp_number', 'created_at', 'expiry_date', 'quantity'] as const

      fields.forEach(field => {
        const result = lpQuerySchema.parse({ sort: field })
        expect(result.sort).toBe(field)
      })
    })

    it('should accept valid order values', () => {
      const result1 = lpQuerySchema.parse({ order: 'asc' })
      const result2 = lpQuerySchema.parse({ order: 'desc' })

      expect(result1.order).toBe('asc')
      expect(result2.order).toBe('desc')
    })

    it('should reject invalid sort field', () => {
      expect(() => lpQuerySchema.parse({ sort: 'invalid' })).toThrow()
    })

    it('should reject page < 1', () => {
      expect(() => lpQuerySchema.parse({ page: 0 })).toThrow()
      expect(() => lpQuerySchema.parse({ page: -1 })).toThrow()
    })

    it('should reject limit < 1', () => {
      expect(() => lpQuerySchema.parse({ limit: 0 })).toThrow()
    })

    it('should reject limit > 100', () => {
      expect(() => lpQuerySchema.parse({ limit: 101 })).toThrow(/max.*100/i)
    })

    it('should coerce string page to number', () => {
      const result = lpQuerySchema.parse({ page: '2' })

      expect(result.page).toBe(2)
    })

    it('should coerce string limit to number', () => {
      const result = lpQuerySchema.parse({ limit: '25' })

      expect(result.limit).toBe(25)
    })

    it('should accept expiry date filters', () => {
      const input = {
        expiry_before: '2026-12-31',
        expiry_after: '2025-01-01',
      }

      const result = lpQuerySchema.parse(input)

      expect(result.expiry_before).toBe('2026-12-31')
      expect(result.expiry_after).toBe('2025-01-01')
    })
  })

  // ==========================================================================
  // Update QA Status Schema
  // ==========================================================================
  describe('updateQAStatusSchema', () => {
    it('should accept valid QA status', () => {
      const result1 = updateQAStatusSchema.parse({ qa_status: 'passed' })
      const result2 = updateQAStatusSchema.parse({ qa_status: 'failed' })
      const result3 = updateQAStatusSchema.parse({ qa_status: 'pending' })
      const result4 = updateQAStatusSchema.parse({ qa_status: 'quarantine' })

      expect(result1.qa_status).toBe('passed')
      expect(result2.qa_status).toBe('failed')
      expect(result3.qa_status).toBe('pending')
      expect(result4.qa_status).toBe('quarantine')
    })

    it('should reject invalid QA status', () => {
      expect(() => updateQAStatusSchema.parse({ qa_status: 'invalid' })).toThrow()
    })

    it('should require qa_status field', () => {
      expect(() => updateQAStatusSchema.parse({})).toThrow()
    })
  })

  // ==========================================================================
  // Block LP Schema
  // ==========================================================================
  describe('blockLPSchema', () => {
    it('should accept optional reason', () => {
      const input = {
        reason: 'Quality hold - foreign material suspected',
      }

      const result = blockLPSchema.parse(input)

      expect(result.reason).toBe(input.reason)
    })

    it('should accept empty object (no reason)', () => {
      const result = blockLPSchema.parse({})

      expect(result).toEqual({})
    })

    it('should reject reason too long', () => {
      const input = {
        reason: 'R'.repeat(501), // Max 500
      }

      expect(() => blockLPSchema.parse(input)).toThrow(/max.*500/i)
    })

    it('should accept null reason', () => {
      const result = blockLPSchema.parse({ reason: null })

      expect(result.reason).toBeNull()
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * Enum Schemas - 6 tests:
 *   - lpStatusEnum (2 tests)
 *   - qaStatusEnum (2 tests)
 *   - lpSourceEnum (2 tests)
 *
 * createLPSchema - 17 tests:
 *   - Valid input
 *   - Optional fields
 *   - Default source
 *   - UUID validation
 *   - Quantity validation
 *   - UoM validation
 *   - Batch validation
 *   - GTIN validation
 *
 * updateLPSchema - 6 tests:
 *   - Valid updates
 *   - Optional fields
 *   - Quantity validation
 *   - Empty object
 *
 * consumeLPSchema - 6 tests [EPIC 04 CRITICAL]:
 *   - Valid input
 *   - Optional operation_id
 *   - UUID validation
 *   - Quantity validation
 *
 * createOutputLPSchema - 9 tests [EPIC 04 CRITICAL]:
 *   - Valid input
 *   - Optional fields
 *   - Default QA status
 *   - Batch validation
 *   - UUID validation
 *
 * lpQuerySchema - 14 tests:
 *   - Valid params
 *   - Default values
 *   - Optional filters
 *   - Sort/order validation
 *   - Pagination validation
 *   - Coercion
 *
 * updateQAStatusSchema - 3 tests:
 *   - Valid QA status
 *   - Invalid status
 *   - Required field
 *
 * blockLPSchema - 4 tests:
 *   - Optional reason
 *   - Empty object
 *   - Max length
 *   - Null reason
 *
 * Total: 65 tests
 * Coverage: 100% (all validation rules tested)
 * Status: RED (schemas not implemented yet)
 */
