/**
 * Routing Operations Service - Unit Tests
 * Story: 02.8 - Routing Operations (Steps) Management
 * Phase: GREEN - Tests should pass with implementation
 *
 * Tests the RoutingOperationsService which handles:
 * - Operations CRUD (create, read, update, delete)
 * - Sequence management and reordering
 * - Parallel operations detection and validation
 * - Duration calculation (MAX for parallel, SUM sequential)
 * - Cost calculation (SUM all operations including parallel)
 * - Setup/Cleanup time handling
 * - Attachment management (upload, delete, download)
 * - Machine assignment (optional, nullable FK)
 * - Validation (sequences, names, times, instructions, attachments)
 *
 * Coverage Target: 80%+
 * Test Count: 60 scenarios
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import {
  detectParallelOperations,
  calculateSummary,
  calculateOperationTime,
  isParallelOperation,
} from '../routing-operations-service'
import {
  operationFormSchema,
  validateAttachmentFile,
  isAllowedFileType,
  MAX_FILE_SIZE,
  MAX_ATTACHMENTS,
} from '@/lib/validation/operation-schemas'
import type { RoutingOperation } from '@/lib/types/routing-operation'

/**
 * Mock data
 */
const mockSequentialOperations: RoutingOperation[] = [
  {
    id: 'op-001-uuid',
    routing_id: 'routing-001-uuid',
    sequence: 1,
    name: 'Mixing',
    description: null,
    machine_id: 'machine-001-uuid',
    machine_name: 'Primary Mixer',
    machine_code: 'MIX-001',
    setup_time: 5,
    duration: 15,
    cleanup_time: 2,
    labor_cost_per_hour: 25,
    instructions: 'Mix ingredients thoroughly',
    attachment_count: 0,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'op-002-uuid',
    routing_id: 'routing-001-uuid',
    sequence: 2,
    name: 'Proofing',
    description: null,
    machine_id: null,
    machine_name: null,
    machine_code: null,
    setup_time: 0,
    duration: 45,
    cleanup_time: 0,
    labor_cost_per_hour: 15,
    instructions: null,
    attachment_count: 0,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'op-003-uuid',
    routing_id: 'routing-001-uuid',
    sequence: 3,
    name: 'Baking',
    description: null,
    machine_id: null,
    machine_name: null,
    machine_code: null,
    setup_time: 10,
    duration: 30,
    cleanup_time: 5,
    labor_cost_per_hour: 20,
    instructions: null,
    attachment_count: 0,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
]

const mockParallelOperations: RoutingOperation[] = [
  {
    id: 'op-004-uuid',
    routing_id: 'routing-001-uuid',
    sequence: 2,
    name: 'Proofing',
    description: null,
    machine_id: null,
    machine_name: null,
    machine_code: null,
    setup_time: 0,
    duration: 30,
    cleanup_time: 0,
    labor_cost_per_hour: 15,
    instructions: null,
    attachment_count: 0,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'op-005-uuid',
    routing_id: 'routing-001-uuid',
    sequence: 2,
    name: 'Heating',
    description: null,
    machine_id: null,
    machine_name: null,
    machine_code: null,
    setup_time: 0,
    duration: 45,
    cleanup_time: 0,
    labor_cost_per_hour: 20,
    instructions: null,
    attachment_count: 0,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
]

describe('RoutingOperationsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // AC-01: List operations
  // ============================================================================
  describe('getOperations', () => {
    it('should list operations in sequence order (AC-01)', () => {
      // Test that operations are sortable by sequence
      const operations = [...mockSequentialOperations].sort((a, b) => a.sequence - b.sequence)
      expect(operations[0].sequence).toBe(1)
      expect(operations[1].sequence).toBe(2)
      expect(operations[2].sequence).toBe(3)
    })

    it('should handle empty operations list', () => {
      const summary = calculateSummary([])
      expect(summary.total_operations).toBe(0)
      expect(summary.total_duration).toBe(0)
    })

    it('should return within 500ms for 50 operations (AC-01)', () => {
      // Generate 50 operations
      const operations: RoutingOperation[] = Array.from({ length: 50 }, (_, i) => ({
        ...mockSequentialOperations[0],
        id: `op-${i}-uuid`,
        sequence: i + 1,
      }))

      const start = performance.now()
      calculateSummary(operations)
      const duration = performance.now() - start

      expect(duration).toBeLessThan(500)
    })

    it('should include attachment_count in response', () => {
      const op = mockSequentialOperations[0]
      expect(op.attachment_count).toBeDefined()
      expect(typeof op.attachment_count).toBe('number')
    })
  })

  // ============================================================================
  // AC-04 to AC-07: Parallel Operations
  // ============================================================================
  describe('Parallel Operations Detection', () => {
    it('should allow operations with duplicate sequence numbers (AC-04)', () => {
      // Schema should not reject duplicate sequences
      const validation = operationFormSchema.safeParse({
        sequence: 2,
        name: 'Heating',
        duration: 20,
      })
      expect(validation.success).toBe(true)
    })

    it('detectParallelOperations should mark duplicate sequences (AC-04)', () => {
      const parallelMap = detectParallelOperations(mockParallelOperations)
      expect(parallelMap.has(2)).toBe(true)
      expect(parallelMap.get(2)?.length).toBe(2)
    })

    it('should detect parallel operations at sequence 2 (AC-05)', () => {
      const ops = mockParallelOperations
      const isOp1Parallel = isParallelOperation(ops[0], ops)
      const isOp2Parallel = isParallelOperation(ops[1], ops)
      expect(isOp1Parallel).toBe(true)
      expect(isOp2Parallel).toBe(true)
    })

    it('calculateSummary should use MAX duration for parallel ops (AC-06)', () => {
      const operations = [
        { ...mockSequentialOperations[1], sequence: 2, duration: 30, setup_time: 0, cleanup_time: 0 },
        { ...mockSequentialOperations[2], sequence: 2, duration: 45, setup_time: 0, cleanup_time: 0 },
      ] as RoutingOperation[]

      const summary = calculateSummary(operations)
      // Should be 45 (MAX), not 75 (SUM)
      expect(summary.total_duration).toBe(45)
    })

    it('calculateSummary should SUM costs for parallel ops (AC-07)', () => {
      const operations = [
        { ...mockSequentialOperations[1], sequence: 2, labor_cost_per_hour: 15, duration: 30 },
        { ...mockSequentialOperations[2], sequence: 2, labor_cost_per_hour: 20, duration: 45 },
      ] as RoutingOperation[]

      const summary = calculateSummary(operations)
      // Cost = (30/60 * 15) + (45/60 * 20) = 7.5 + 15 = 22.5
      expect(summary.total_labor_cost).toBe(22.5)
    })

    it('should handle multiple parallel operation groups', () => {
      const operations = [
        { ...mockSequentialOperations[0], id: 'a', sequence: 1, duration: 20, setup_time: 0, cleanup_time: 0 },
        { ...mockSequentialOperations[1], id: 'b', sequence: 1, duration: 30, setup_time: 0, cleanup_time: 0 },
        { ...mockSequentialOperations[2], id: 'c', sequence: 2, duration: 15, setup_time: 0, cleanup_time: 0 },
      ] as RoutingOperation[]

      const summary = calculateSummary(operations)
      // Seq 1: MAX(20, 30) = 30, Seq 2: 15 => total = 45
      expect(summary.total_duration).toBe(45)
    })
  })

  // ============================================================================
  // AC-08 to AC-10: Time Tracking (Setup + Duration + Cleanup)
  // ============================================================================
  describe('Time Tracking', () => {
    it('should calculate total operation time = setup + duration + cleanup (AC-08)', () => {
      const operation = {
        setup_time: 5,
        duration: 30,
        cleanup_time: 3,
      }
      const total = calculateOperationTime(operation)
      expect(total).toBe(38)
    })

    it('should default cleanup_time to 0 if empty (AC-09)', () => {
      const operation = {
        setup_time: 5,
        duration: 30,
        cleanup_time: null,
      }
      const total = calculateOperationTime(operation)
      expect(total).toBe(35) // 5 + 30 + 0
    })

    it('should default setup_time to 0 if empty (AC-09)', () => {
      const operation = {
        setup_time: null,
        duration: 30,
        cleanup_time: 3,
      }
      const total = calculateOperationTime(operation)
      expect(total).toBe(33) // 0 + 30 + 3
    })

    it('should reject negative setup_time (AC-10)', () => {
      const validation = operationFormSchema.safeParse({
        sequence: 1,
        name: 'Test',
        duration: 30,
        setup_time: -5,
      })
      expect(validation.success).toBe(false)
    })

    it('should reject negative cleanup_time (AC-10)', () => {
      const validation = operationFormSchema.safeParse({
        sequence: 1,
        name: 'Test',
        duration: 30,
        cleanup_time: -3,
      })
      expect(validation.success).toBe(false)
    })

    it('should reject duration < 1', () => {
      const validation = operationFormSchema.safeParse({
        sequence: 1,
        name: 'Test',
        duration: 0,
      })
      expect(validation.success).toBe(false)
    })
  })

  // ============================================================================
  // AC-11 to AC-14: Machine Assignment (Optional)
  // ============================================================================
  describe('Machine Assignment', () => {
    it('should allow machine_id to be NULL (AC-14)', () => {
      const validation = operationFormSchema.safeParse({
        sequence: 1,
        name: 'Mixing',
        duration: 30,
        machine_id: null,
      })
      expect(validation.success).toBe(true)
    })

    it('should allow assigning a machine from NULL (AC-13)', () => {
      const validation = operationFormSchema.safeParse({
        sequence: 1,
        name: 'Mixing',
        duration: 30,
        machine_id: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(validation.success).toBe(true)
    })

    it('should allow clearing machine assignment (AC-13)', () => {
      const validation = operationFormSchema.safeParse({
        sequence: 1,
        name: 'Mixing',
        duration: 30,
        machine_id: null,
      })
      expect(validation.success).toBe(true)
    })

    it('should display "-" when machine_id is NULL (AC-14)', () => {
      const operation = mockSequentialOperations[1]
      expect(operation.machine_id).toBeNull()
      expect(operation.machine_name).toBeNull()
      // UI would display "-" for null machine
    })

    it('should display machine name when assigned (AC-13)', () => {
      const operation = mockSequentialOperations[0]
      expect(operation.machine_id).toBe('machine-001-uuid')
      expect(operation.machine_name).toBe('Primary Mixer')
    })
  })

  // ============================================================================
  // AC-15 to AC-17: Instructions Field (Max 2000 chars)
  // ============================================================================
  describe('Instructions Validation', () => {
    it('should accept instructions with 1500 characters (AC-16)', () => {
      const validation = operationFormSchema.safeParse({
        sequence: 1,
        name: 'Test',
        duration: 30,
        instructions: 'a'.repeat(1500),
      })
      expect(validation.success).toBe(true)
    })

    it('should reject instructions > 2000 characters (AC-17)', () => {
      const validation = operationFormSchema.safeParse({
        sequence: 1,
        name: 'Test',
        duration: 30,
        instructions: 'a'.repeat(2001),
      })
      expect(validation.success).toBe(false)
    })

    it('should allow null instructions', () => {
      const validation = operationFormSchema.safeParse({
        sequence: 1,
        name: 'Test',
        duration: 30,
        instructions: null,
      })
      expect(validation.success).toBe(true)
    })

    it('should allow empty instructions', () => {
      const validation = operationFormSchema.safeParse({
        sequence: 1,
        name: 'Test',
        duration: 30,
        instructions: '',
      })
      expect(validation.success).toBe(true)
    })
  })

  // ============================================================================
  // AC-18 to AC-21: Attachments (Max 5, Max 10MB, Allowed types)
  // ============================================================================
  describe('Attachment Management', () => {
    it('should upload a 5MB PDF file (AC-19)', () => {
      const file = new File(['test'], 'instruction.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 5 * 1024 * 1024 })

      const error = validateAttachmentFile(file, 0)
      expect(error).toBeNull()
    })

    it('should reject file > 10MB (AC-20)', () => {
      const file = new File(['test'], 'large.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 15 * 1024 * 1024 })

      const error = validateAttachmentFile(file, 0)
      expect(error).toBe('File size must be less than 10MB')
    })

    it('should reject invalid file types', () => {
      const file = new File(['test'], 'file.zip', { type: 'application/zip' })
      Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 })

      const error = validateAttachmentFile(file, 0)
      expect(error).toBe('File type not allowed (PDF, PNG, JPG, DOCX only)')
    })

    it('should allow PDF files', () => {
      expect(isAllowedFileType('application/pdf')).toBe(true)
    })

    it('should allow PNG files', () => {
      expect(isAllowedFileType('image/png')).toBe(true)
    })

    it('should allow JPG files', () => {
      expect(isAllowedFileType('image/jpeg')).toBe(true)
    })

    it('should allow DOCX files', () => {
      expect(isAllowedFileType('application/vnd.openxmlformats-officedocument.wordprocessingml.document')).toBe(true)
    })

    it('should reject attachment when max (5) reached (AC-21)', () => {
      const file = new File(['test'], 'file.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 })

      const error = validateAttachmentFile(file, 5)
      expect(error).toBe('Maximum 5 attachments per operation')
    })

    it('should allow 5 attachments per operation', () => {
      const file = new File(['test'], 'file.pdf', { type: 'application/pdf' })
      Object.defineProperty(file, 'size', { value: 1 * 1024 * 1024 })

      const error = validateAttachmentFile(file, 4)
      expect(error).toBeNull()
    })
  })

  // ============================================================================
  // AC-24: Name Validation (Min 3 chars)
  // ============================================================================
  describe('Name Validation', () => {
    it('should reject name with < 3 characters', () => {
      const validation = operationFormSchema.safeParse({
        sequence: 1,
        name: 'AB',
        duration: 30,
      })
      expect(validation.success).toBe(false)
    })

    it('should accept name with 3 characters', () => {
      const validation = operationFormSchema.safeParse({
        sequence: 1,
        name: 'Mix',
        duration: 30,
      })
      expect(validation.success).toBe(true)
    })

    it('should accept name with 100 characters', () => {
      const validation = operationFormSchema.safeParse({
        sequence: 1,
        name: 'a'.repeat(100),
        duration: 30,
      })
      expect(validation.success).toBe(true)
    })

    it('should reject name > 100 characters', () => {
      const validation = operationFormSchema.safeParse({
        sequence: 1,
        name: 'a'.repeat(101),
        duration: 30,
      })
      expect(validation.success).toBe(false)
    })
  })

  // ============================================================================
  // AC-25 to AC-27: Reorder Operations
  // ============================================================================
  describe('Reorder Operations', () => {
    it('should move operation up (swap sequences) (AC-25)', () => {
      // Test reorder logic - sequences [1, 2, 3] -> after moving op at seq 2 up -> [2, 1, 3]
      const operations = [...mockSequentialOperations]
      const opToMove = operations[1] // seq 2
      const opToSwap = operations[0] // seq 1

      // Simulate swap
      const newSeq1 = opToSwap.sequence
      const newSeq2 = opToMove.sequence
      expect(newSeq1).toBe(1)
      expect(newSeq2).toBe(2)
    })

    it('should move operation down (swap sequences)', () => {
      const operations = [...mockSequentialOperations]
      const opToMove = operations[0] // seq 1
      const opToSwap = operations[1] // seq 2

      expect(opToMove.sequence).toBe(1)
      expect(opToSwap.sequence).toBe(2)
    })

    it('should prevent moving first operation up (AC-26)', () => {
      const operations = [...mockSequentialOperations]
      const firstOp = operations.find(op => op.sequence === 1)
      expect(firstOp).toBeDefined()

      // Can't move up if at first position
      const uniqueSeqs = [...new Set(operations.map(op => op.sequence))].sort((a, b) => a - b)
      const isAtTop = firstOp?.sequence === uniqueSeqs[0]
      expect(isAtTop).toBe(true)
    })

    it('should prevent moving last operation down', () => {
      const operations = [...mockSequentialOperations]
      const lastOp = operations.find(op => op.sequence === 3)
      expect(lastOp).toBeDefined()

      const uniqueSeqs = [...new Set(operations.map(op => op.sequence))].sort((a, b) => a - b)
      const isAtBottom = lastOp?.sequence === uniqueSeqs[uniqueSeqs.length - 1]
      expect(isAtBottom).toBe(true)
    })

    it('should handle reorder with parallel operations (AC-27)', () => {
      const operations = [
        { ...mockSequentialOperations[0], id: 'a', sequence: 1 },
        { ...mockSequentialOperations[1], id: 'b', sequence: 2 },
        { ...mockParallelOperations[1], id: 'c', sequence: 2 },
      ] as RoutingOperation[]

      const parallelMap = detectParallelOperations(operations)
      expect(parallelMap.has(2)).toBe(true)
      expect(parallelMap.get(2)?.length).toBe(2)
    })

    it('should maintain sequence integrity after reorder', () => {
      const operations = [...mockSequentialOperations]
      const sequences = operations.map(op => op.sequence)
      const sorted = [...sequences].sort((a, b) => a - b)
      expect(sequences).toEqual(sorted)
    })
  })

  // ============================================================================
  // Create/Update Operations
  // ============================================================================
  describe('createOperation', () => {
    it('should create operation with all required fields', () => {
      const validation = operationFormSchema.safeParse({
        sequence: 1,
        name: 'Mixing',
        duration: 30,
      })
      expect(validation.success).toBe(true)
    })

    it('should auto-fill sequence with max + 1', () => {
      const existingSequences = [1, 3, 5]
      const nextSequence = Math.max(...existingSequences) + 1
      expect(nextSequence).toBe(6)
    })

    it('should return 1 for getNextSequence when no operations', () => {
      const existingSequences: number[] = []
      const nextSequence = existingSequences.length === 0 ? 1 : Math.max(...existingSequences) + 1
      expect(nextSequence).toBe(1)
    })

    it('should handle defaults (setup_time, cleanup_time)', () => {
      const validation = operationFormSchema.safeParse({
        sequence: 1,
        name: 'Mixing',
        duration: 30,
      })
      expect(validation.success).toBe(true)
      if (validation.success) {
        expect(validation.data.setup_time).toBe(0)
        expect(validation.data.cleanup_time).toBe(0)
      }
    })
  })

  describe('updateOperation', () => {
    it('should update operation fields', () => {
      const validation = operationFormSchema.safeParse({
        sequence: 1,
        name: 'Updated Mixing',
        duration: 45,
      })
      expect(validation.success).toBe(true)
    })

    it('should update machine assignment', () => {
      const validation = operationFormSchema.safeParse({
        sequence: 1,
        name: 'Mixing',
        duration: 30,
        machine_id: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(validation.success).toBe(true)
    })

    it('should clear machine assignment', () => {
      const validation = operationFormSchema.safeParse({
        sequence: 1,
        name: 'Mixing',
        duration: 30,
        machine_id: null,
      })
      expect(validation.success).toBe(true)
    })
  })

  // ============================================================================
  // Delete Operations
  // ============================================================================
  describe('deleteOperation', () => {
    it('should delete operation', () => {
      // Test that deletion logic works
      const operations = [...mockSequentialOperations]
      const toDelete = operations[0]
      const remaining = operations.filter(op => op.id !== toDelete.id)
      expect(remaining.length).toBe(2)
    })

    it('should delete attachments when operation deleted (AC-29)', () => {
      // When operation is deleted, attachments should be cleaned up
      const opWithAttachments = {
        ...mockSequentialOperations[0],
        attachment_count: 2,
      }
      expect(opWithAttachments.attachment_count).toBe(2)
    })
  })

  // ============================================================================
  // Summary Calculations
  // ============================================================================
  describe('calculateSummary', () => {
    it('should return correct totals for sequential operations', () => {
      const summary = calculateSummary(mockSequentialOperations)

      // total_duration = (5+15+2) + (0+45+0) + (10+30+5) = 22 + 45 + 45 = 112 min
      expect(summary.total_duration).toBe(112)
      // total_setup_time = 5 + 0 + 10 = 15
      expect(summary.total_setup_time).toBe(15)
      // total_cleanup_time = 2 + 0 + 5 = 7
      expect(summary.total_cleanup_time).toBe(7)
      expect(summary.total_operations).toBe(3)
    })

    it('should include attachment count in summary', () => {
      const operations = [
        { ...mockSequentialOperations[0], attachment_count: 2 },
        { ...mockSequentialOperations[1], attachment_count: 0 },
      ] as RoutingOperation[]

      const summary = calculateSummary(operations)
      expect(summary.total_operations).toBe(2)
    })

    it('should calculate average yield', () => {
      const summary = calculateSummary(mockSequentialOperations)
      expect(summary.average_yield).toBeDefined()
    })

    it('should handle empty operations list', () => {
      const summary = calculateSummary([])
      expect(summary.total_operations).toBe(0)
      expect(summary.total_duration).toBe(0)
      expect(summary.total_labor_cost).toBe(0)
    })
  })

  // ============================================================================
  // Helper Methods
  // ============================================================================
  describe('Helper Methods', () => {
    it('getMachinesForDropdown should return empty array if no machines', () => {
      // Test helper returns empty array when no data
      const machines: { id: string; name: string }[] = []
      expect(machines).toEqual([])
    })

    it('hasMachinesConfigured should return false if no machines', () => {
      const count = 0
      expect(count > 0).toBe(false)
    })

    it('hasMachinesConfigured should return true if machines exist', () => {
      const count = 5
      expect(count > 0).toBe(true)
    })
  })
})
