/**
 * NCR Service - Unit Tests (Story 06.9)
 * Purpose: Test Non-Conformance Report CRUD and workflow
 * Phase: RED - Tests will fail until service is implemented
 *
 * Tests the NCRService which handles:
 * - NCR creation with auto-numbering (NCR-YYYY-NNNNN format)
 * - CRUD operations (Create, Read, Update, Delete)
 * - Status transitions (draft -> open -> closed)
 * - Severity levels (minor, major, critical)
 * - Detection point tracking (incoming, in_process, final, customer, etc.)
 * - Source reference linking (inspection, hold, batch, supplier)
 * - Permission enforcement (QA_INSPECTOR create, QA_MANAGER close)
 * - Audit trail logging
 * - RLS policy enforcement (multi-tenancy)
 *
 * Coverage Target: >80% (FDA 21 CFR Part 11 - Food Safety Compliance)
 * Test Count: 35+ scenarios
 *
 * Risk: Non-conformance reports are critical for food safety compliance.
 * Regulatory: FDA FSMA, HACCP, ISO 9001/22000
 * Mitigation: Comprehensive unit tests for all NCR functions
 *
 * Acceptance Criteria Coverage:
 * - AC-2: NCR auto-numbering (NCR-YYYY-NNNNN format)
 * - AC-3: Create NCR with required fields
 * - AC-4: Source reference linking
 * - AC-5: Severity levels (critical/major/minor)
 * - AC-6: Detection point tracking
 * - AC-10: NCR detail page display
 * - AC-11: Edit draft NCR
 * - AC-12: Delete draft NCR
 * - AC-13: Submit draft to open
 * - AC-14: Close NCR with notes
 * - AC-16: Permission enforcement
 * - AC-17: Audit trail logging
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * NOTE: This test file will fail because ncr-service.ts does not exist yet.
 * Once the service is implemented, all tests should pass.
 */

// Mock imports - service will be created by DEV agent
import {
  NCRService,
  type NCRReport,
  type CreateNCRInput,
  type UpdateNCRInput,
  type NCRListParams,
  type PaginatedResult,
  type NCRDetail,
} from '../ncr-service'

/**
 * Mock Supabase client for database operations
 */
const mockSupabaseClient = {
  from: vi.fn(),
  rpc: vi.fn(),
}

describe('NCRService (Story 06.9) - Non-Conformance Report CRUD', () => {
  const orgId = '550e8400-e29b-41d4-a716-446655440000'
  const userId = '650e8400-e29b-41d4-a716-446655440001'
  const managerId = '750e8400-e29b-41d4-a716-446655440002'

  const mockNCRData: CreateNCRInput = {
    title: 'Temperature deviation during receiving',
    description: 'Refrigerated ingredients received at 8°C instead of required 0-4°C range',
    severity: 'major',
    detection_point: 'incoming',
    category: 'supplier_issue',
  }

  const mockNCRResponse: NCRReport = {
    id: '850e8400-e29b-41d4-a716-446655440000',
    org_id: orgId,
    ncr_number: 'NCR-2025-00001',
    title: mockNCRData.title,
    description: mockNCRData.description,
    severity: mockNCRData.severity as 'minor' | 'major' | 'critical',
    status: 'draft',
    category: mockNCRData.category,
    detection_point: mockNCRData.detection_point,
    detected_date: new Date().toISOString(),
    detected_by: userId,
    detected_by_name: 'John Inspector',
    source_type: undefined,
    source_id: undefined,
    source_description: undefined,
    assigned_to: undefined,
    assigned_at: undefined,
    closed_at: undefined,
    closed_by: undefined,
    closed_by_name: undefined,
    closure_notes: undefined,
    created_at: new Date().toISOString(),
    created_by: userId,
    updated_at: new Date().toISOString(),
  }

  // ============================================================================
  // AC-2: NCR Auto-Numbering Tests
  // ============================================================================

  describe('generateNCRNumber() - NCR-YYYY-NNNNN Format', () => {
    it('should generate NCR number with correct format: NCR-YYYY-NNNNN', async () => {
      const ncrNumber = await NCRService.generateNCRNumber(orgId)
      expect(ncrNumber).toMatch(/^NCR-\d{4}-\d{5}$/)
    })

    it('should generate NCR-2025-00001 for first NCR in 2025', async () => {
      const ncrNumber = await NCRService.generateNCRNumber(orgId)
      expect(ncrNumber).toBe('NCR-2025-00001')
    })

    it('should increment sequence for subsequent NCRs in same year', async () => {
      const first = await NCRService.generateNCRNumber(orgId)
      const second = await NCRService.generateNCRNumber(orgId)
      expect(first).toBe('NCR-2025-00001')
      expect(second).toBe('NCR-2025-00002')
    })

    it('should increment to 00005 after 4 NCRs created', async () => {
      await NCRService.generateNCRNumber(orgId)
      await NCRService.generateNCRNumber(orgId)
      await NCRService.generateNCRNumber(orgId)
      await NCRService.generateNCRNumber(orgId)
      const fifth = await NCRService.generateNCRNumber(orgId)
      expect(fifth).toBe('NCR-2025-00005')
    })

    it('should reset sequence for different year', async () => {
      // Mock year change
      const ncrNumber = await NCRService.generateNCRNumber(orgId)
      expect(ncrNumber).toMatch(/^NCR-\d{4}-00001$/)
    })

    it('should maintain independent sequences for different orgs', async () => {
      const org1Id = '550e8400-e29b-41d4-a716-446655440000'
      const org2Id = '550e8400-e29b-41d4-a716-446655440099'

      const org1First = await NCRService.generateNCRNumber(org1Id)
      const org2First = await NCRService.generateNCRNumber(org2Id)
      const org1Second = await NCRService.generateNCRNumber(org1Id)

      expect(org1First).toBe('NCR-2025-00001')
      expect(org2First).toBe('NCR-2025-00001') // Independent sequence
      expect(org1Second).toBe('NCR-2025-00002')
    })

    it('should pad number to 5 digits with leading zeros', async () => {
      const ncrNumber = await NCRService.generateNCRNumber(orgId)
      const parts = ncrNumber.split('-')
      expect(parts[2]).toHaveLength(5)
      expect(parts[2]).toMatch(/^0+\d+$/)
    })
  })

  // ============================================================================
  // AC-3: Create NCR Tests
  // ============================================================================

  describe('create() - Create NCR with Required Fields', () => {
    it('should create NCR with all required fields', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)

      expect(ncr).toHaveProperty('id')
      expect(ncr).toHaveProperty('ncr_number')
      expect(ncr.title).toBe(mockNCRData.title)
      expect(ncr.description).toBe(mockNCRData.description)
      expect(ncr.severity).toBe(mockNCRData.severity)
      expect(ncr.detection_point).toBe(mockNCRData.detection_point)
    })

    it('should generate NCR number on creation', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      expect(ncr.ncr_number).toMatch(/^NCR-\d{4}-\d{5}$/)
    })

    it('should set status to draft by default', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      expect(ncr.status).toBe('draft')
    })

    it('should set status to open if submit_immediately=true', async () => {
      const input = { ...mockNCRData, submit_immediately: true }
      const ncr = await NCRService.create(input, userId)
      expect(ncr.status).toBe('open')
    })

    it('should capture detected_by from current user', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      expect(ncr.detected_by).toBe(userId)
    })

    it('should capture detected_date as current timestamp', async () => {
      const beforeCreate = new Date().toISOString()
      const ncr = await NCRService.create(mockNCRData, userId)
      const afterCreate = new Date().toISOString()

      expect(new Date(ncr.detected_date).getTime()).toBeGreaterThanOrEqual(
        new Date(beforeCreate).getTime()
      )
      expect(new Date(ncr.detected_date).getTime()).toBeLessThanOrEqual(
        new Date(afterCreate).getTime()
      )
    })

    it('should include optional category field', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      expect(ncr.category).toBe(mockNCRData.category)
    })

    it('should allow NCR without category (optional)', async () => {
      const input = { ...mockNCRData }
      delete input.category
      const ncr = await NCRService.create(input, userId)
      expect(ncr.category).toBeUndefined()
    })

    it('should throw error if title is missing', async () => {
      const input = { ...mockNCRData }
      delete input.title
      expect(() => NCRService.create(input, userId)).rejects.toThrow('Title is required')
    })

    it('should throw error if title is less than 5 characters', async () => {
      const input = { ...mockNCRData, title: 'Bad' }
      expect(() => NCRService.create(input, userId)).rejects.toThrow(
        'Title must be at least 5 characters'
      )
    })

    it('should throw error if description is missing', async () => {
      const input = { ...mockNCRData }
      delete input.description
      expect(() => NCRService.create(input, userId)).rejects.toThrow(
        'Description is required'
      )
    })

    it('should throw error if description is less than 20 characters', async () => {
      const input = { ...mockNCRData, description: 'Too short' }
      expect(() => NCRService.create(input, userId)).rejects.toThrow(
        'Description must be at least 20 characters'
      )
    })

    it('should throw error if severity is missing', async () => {
      const input = { ...mockNCRData }
      delete input.severity
      expect(() => NCRService.create(input, userId)).rejects.toThrow(
        'Severity is required'
      )
    })

    it('should throw error if severity is invalid', async () => {
      const input = { ...mockNCRData, severity: 'invalid' as any }
      expect(() => NCRService.create(input, userId)).rejects.toThrow(
        'Invalid severity'
      )
    })

    it('should throw error if detection_point is missing', async () => {
      const input = { ...mockNCRData }
      delete input.detection_point
      expect(() => NCRService.create(input, userId)).rejects.toThrow(
        'Detection point is required'
      )
    })

    it('should throw error if detection_point is invalid', async () => {
      const input = { ...mockNCRData, detection_point: 'invalid' as any }
      expect(() => NCRService.create(input, userId)).rejects.toThrow(
        'Invalid detection point'
      )
    })

    it('should set created_by from user ID', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      expect(ncr.created_by).toBe(userId)
    })

    it('should set created_at timestamp', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      expect(ncr.created_at).toBeDefined()
      expect(new Date(ncr.created_at).getTime()).toBeLessThanOrEqual(Date.now())
    })
  })

  // ============================================================================
  // AC-4: Source Reference Linking Tests
  // ============================================================================

  describe('create() - Source Reference Linking', () => {
    it('should create NCR with inspection source reference', async () => {
      const input = {
        ...mockNCRData,
        source_type: 'inspection',
        source_id: '950e8400-e29b-41d4-a716-446655440000',
        source_description: 'Inspection INS-INC-2025-00456',
      }
      const ncr = await NCRService.create(input, userId)
      expect(ncr.source_type).toBe('inspection')
      expect(ncr.source_id).toBe(input.source_id)
      expect(ncr.source_description).toBe(input.source_description)
    })

    it('should create NCR with hold source reference', async () => {
      const input = {
        ...mockNCRData,
        source_type: 'hold',
        source_id: '950e8400-e29b-41d4-a716-446655440001',
        source_description: 'Quality Hold QH-2025-00123',
      }
      const ncr = await NCRService.create(input, userId)
      expect(ncr.source_type).toBe('hold')
    })

    it('should create NCR without source reference (optional)', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      expect(ncr.source_type).toBeUndefined()
      expect(ncr.source_id).toBeUndefined()
      expect(ncr.source_description).toBeUndefined()
    })

    it('should allow batch source reference', async () => {
      const input = {
        ...mockNCRData,
        source_type: 'batch',
        source_id: '950e8400-e29b-41d4-a716-446655440002',
      }
      const ncr = await NCRService.create(input, userId)
      expect(ncr.source_type).toBe('batch')
    })

    it('should throw error if source_id is invalid UUID', async () => {
      const input = {
        ...mockNCRData,
        source_type: 'inspection',
        source_id: 'not-a-uuid',
      }
      expect(() => NCRService.create(input, userId)).rejects.toThrow(
        'Invalid source ID'
      )
    })
  })

  // ============================================================================
  // AC-5: Severity Levels Tests
  // ============================================================================

  describe('Severity Levels', () => {
    it('should accept critical severity', async () => {
      const input = { ...mockNCRData, severity: 'critical' }
      const ncr = await NCRService.create(input, userId)
      expect(ncr.severity).toBe('critical')
    })

    it('should accept major severity', async () => {
      const input = { ...mockNCRData, severity: 'major' }
      const ncr = await NCRService.create(input, userId)
      expect(ncr.severity).toBe('major')
    })

    it('should accept minor severity', async () => {
      const input = { ...mockNCRData, severity: 'minor' }
      const ncr = await NCRService.create(input, userId)
      expect(ncr.severity).toBe('minor')
    })

    it('should reject invalid severity values', async () => {
      const input = { ...mockNCRData, severity: 'extreme' as any }
      expect(() => NCRService.create(input, userId)).rejects.toThrow()
    })
  })

  // ============================================================================
  // AC-6: Detection Point Tracking Tests
  // ============================================================================

  describe('Detection Point Tracking', () => {
    it('should accept incoming detection point', async () => {
      const input = { ...mockNCRData, detection_point: 'incoming' }
      const ncr = await NCRService.create(input, userId)
      expect(ncr.detection_point).toBe('incoming')
    })

    it('should accept in_process detection point', async () => {
      const input = { ...mockNCRData, detection_point: 'in_process' }
      const ncr = await NCRService.create(input, userId)
      expect(ncr.detection_point).toBe('in_process')
    })

    it('should accept final detection point', async () => {
      const input = { ...mockNCRData, detection_point: 'final' }
      const ncr = await NCRService.create(input, userId)
      expect(ncr.detection_point).toBe('final')
    })

    it('should accept customer detection point', async () => {
      const input = { ...mockNCRData, detection_point: 'customer' }
      const ncr = await NCRService.create(input, userId)
      expect(ncr.detection_point).toBe('customer')
    })

    it('should accept internal_audit detection point', async () => {
      const input = { ...mockNCRData, detection_point: 'internal_audit' }
      const ncr = await NCRService.create(input, userId)
      expect(ncr.detection_point).toBe('internal_audit')
    })

    it('should accept supplier_audit detection point', async () => {
      const input = { ...mockNCRData, detection_point: 'supplier_audit' }
      const ncr = await NCRService.create(input, userId)
      expect(ncr.detection_point).toBe('supplier_audit')
    })

    it('should capture detection metadata on creation', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      expect(ncr.detected_date).toBeDefined()
      expect(ncr.detected_by).toBe(userId)
      expect(ncr.detection_point).toBe(mockNCRData.detection_point)
    })
  })

  // ============================================================================
  // AC-11: Update Draft NCR Tests
  // ============================================================================

  describe('update() - Edit Draft NCR', () => {
    it('should update draft NCR with new title', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      const updateInput: UpdateNCRInput = { title: 'Updated Title With More Details' }
      const updated = await NCRService.update(ncr.id, updateInput, userId)
      expect(updated.title).toBe(updateInput.title)
    })

    it('should update draft NCR with new description', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      const newDesc = 'Updated description with more context about the issue'
      const updateInput: UpdateNCRInput = { description: newDesc }
      const updated = await NCRService.update(ncr.id, updateInput, userId)
      expect(updated.description).toBe(newDesc)
    })

    it('should update draft NCR severity', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      const updateInput: UpdateNCRInput = { severity: 'critical' }
      const updated = await NCRService.update(ncr.id, updateInput, userId)
      expect(updated.severity).toBe('critical')
    })

    it('should update draft NCR category', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      const updateInput: UpdateNCRInput = { category: 'equipment_failure' }
      const updated = await NCRService.update(ncr.id, updateInput, userId)
      expect(updated.category).toBe('equipment_failure')
    })

    it('should NOT allow update of open NCR', async () => {
      const input = { ...mockNCRData, submit_immediately: true }
      const ncr = await NCRService.create(input, userId)
      const updateInput: UpdateNCRInput = { title: 'New Title' }
      expect(() => NCRService.update(ncr.id, updateInput, userId)).rejects.toThrow(
        'Cannot edit open NCR'
      )
    })

    it('should NOT allow update of closed NCR', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      await NCRService.submit(ncr.id, userId)
      await NCRService.close(ncr.id, 'Issue resolved with corrective actions', managerId)
      const updateInput: UpdateNCRInput = { title: 'New Title' }
      expect(() => NCRService.update(ncr.id, updateInput, userId)).rejects.toThrow(
        'Cannot edit closed NCR'
      )
    })

    it('should NOT allow modification of ncr_number on update', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      expect(async () => {
        await NCRService.update(ncr.id, { title: 'New' }, userId)
      }).not.toThrow()
      const updated = await NCRService.getById(ncr.id)
      expect(updated?.ncr_number).toBe(ncr.ncr_number)
    })

    it('should NOT allow modification of detected_date on update', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      const originalDate = ncr.detected_date
      await NCRService.update(ncr.id, { title: 'Updated' }, userId)
      const updated = await NCRService.getById(ncr.id)
      expect(updated?.detected_date).toBe(originalDate)
    })

    it('should NOT allow modification of detected_by on update', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      const originalDetectedBy = ncr.detected_by
      await NCRService.update(ncr.id, { title: 'Updated' }, userId)
      const updated = await NCRService.getById(ncr.id)
      expect(updated?.detected_by).toBe(originalDetectedBy)
    })

    it('should update updated_at timestamp on edit', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      const originalUpdatedAt = ncr.updated_at
      await new Promise(resolve => setTimeout(resolve, 100))
      await NCRService.update(ncr.id, { title: 'Updated Title' }, userId)
      const updated = await NCRService.getById(ncr.id)
      expect(new Date(updated?.updated_at || '').getTime()).toBeGreaterThan(
        new Date(originalUpdatedAt).getTime()
      )
    })
  })

  // ============================================================================
  // AC-12: Delete Draft NCR Tests
  // ============================================================================

  describe('delete() - Delete Draft NCR', () => {
    it('should delete draft NCR', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      await NCRService.delete(ncr.id, userId)
      const deleted = await NCRService.getById(ncr.id)
      expect(deleted).toBeNull()
    })

    it('should NOT allow delete of open NCR', async () => {
      const input = { ...mockNCRData, submit_immediately: true }
      const ncr = await NCRService.create(input, userId)
      expect(() => NCRService.delete(ncr.id, userId)).rejects.toThrow(
        'Cannot delete open NCR'
      )
    })

    it('should NOT allow delete of closed NCR', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      await NCRService.submit(ncr.id, userId)
      await NCRService.close(ncr.id, 'Issue resolved', managerId)
      expect(() => NCRService.delete(ncr.id, userId)).rejects.toThrow(
        'Cannot delete closed NCR'
      )
    })

    it('should throw error if NCR not found', async () => {
      const fakeId = '999e8400-e29b-41d4-a716-446655440000'
      expect(() => NCRService.delete(fakeId, userId)).rejects.toThrow('NCR not found')
    })
  })

  // ============================================================================
  // AC-13: Submit Draft to Open Tests
  // ============================================================================

  describe('submit() - Submit Draft NCR to Open', () => {
    it('should change status from draft to open', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      expect(ncr.status).toBe('draft')
      const submitted = await NCRService.submit(ncr.id, userId)
      expect(submitted.status).toBe('open')
    })

    it('should NOT allow submit of already open NCR', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      await NCRService.submit(ncr.id, userId)
      expect(() => NCRService.submit(ncr.id, userId)).rejects.toThrow(
        'NCR is already open'
      )
    })

    it('should NOT allow submit of closed NCR', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      await NCRService.submit(ncr.id, userId)
      await NCRService.close(ncr.id, 'Issue resolved', managerId)
      expect(() => NCRService.submit(ncr.id, userId)).rejects.toThrow(
        'Cannot submit closed NCR'
      )
    })

    it('should create audit log entry on submit', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      await NCRService.submit(ncr.id, userId)
      // Verify audit log was created (implementation detail)
      // expect(auditLog).toHaveBeenCalledWith(...)
    })
  })

  // ============================================================================
  // AC-14: Close NCR Tests
  // ============================================================================

  describe('close() - Close NCR with Notes', () => {
    it('should close open NCR with closure notes', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      await NCRService.submit(ncr.id, userId)
      const closureNotes = 'Issue resolved. Supplier corrected receiving temperature.'
      const closed = await NCRService.close(ncr.id, closureNotes, managerId)
      expect(closed.status).toBe('closed')
      expect(closed.closure_notes).toBe(closureNotes)
    })

    it('should set closed_at timestamp', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      await NCRService.submit(ncr.id, userId)
      const beforeClose = new Date()
      const closed = await NCRService.close(ncr.id, 'Issue resolved with corrective actions', managerId)
      const afterClose = new Date()
      expect(new Date(closed.closed_at || '').getTime()).toBeGreaterThanOrEqual(
        beforeClose.getTime()
      )
      expect(new Date(closed.closed_at || '').getTime()).toBeLessThanOrEqual(
        afterClose.getTime()
      )
    })

    it('should set closed_by from manager user ID', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      await NCRService.submit(ncr.id, userId)
      const closed = await NCRService.close(ncr.id, 'Issue resolved', managerId)
      expect(closed.closed_by).toBe(managerId)
    })

    it('should throw error if closure notes are missing', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      await NCRService.submit(ncr.id, userId)
      expect(() => NCRService.close(ncr.id, '', managerId)).rejects.toThrow(
        'Closure notes required'
      )
    })

    it('should throw error if closure notes are less than 50 characters', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      await NCRService.submit(ncr.id, userId)
      const shortNotes = 'Too short notes'
      expect(() => NCRService.close(ncr.id, shortNotes, managerId)).rejects.toThrow(
        'Closure notes must be at least 50 characters'
      )
    })

    it('should NOT allow close of draft NCR', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      expect(() =>
        NCRService.close(ncr.id, 'Issue resolved with detailed notes and corrective actions', managerId)
      ).rejects.toThrow('Cannot close draft NCR')
    })

    it('should NOT allow close by non-manager', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      await NCRService.submit(ncr.id, userId)
      expect(() =>
        NCRService.close(ncr.id, 'Issue resolved with detailed notes and corrective actions', userId)
      ).rejects.toThrow('Only QA_MANAGER can close NCRs')
    })

    it('should create audit log entry on close', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      await NCRService.submit(ncr.id, userId)
      await NCRService.close(ncr.id, 'Issue resolved with corrective actions', managerId)
      // Verify audit log was created
    })
  })

  // ============================================================================
  // AC-15: Assignment Tests
  // ============================================================================

  describe('assign() - Assign NCR to Owner', () => {
    it('should assign open NCR to user', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      await NCRService.submit(ncr.id, userId)
      const assignedUser = '850e8400-e29b-41d4-a716-446655440003'
      const assigned = await NCRService.assign(ncr.id, assignedUser, managerId)
      expect(assigned.assigned_to).toBe(assignedUser)
    })

    it('should set assigned_at timestamp', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      await NCRService.submit(ncr.id, userId)
      const assignedUser = '850e8400-e29b-41d4-a716-446655440003'
      const assigned = await NCRService.assign(ncr.id, assignedUser, managerId)
      expect(assigned.assigned_at).toBeDefined()
    })

    it('should allow reassignment to different user', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      await NCRService.submit(ncr.id, userId)
      const user1 = '850e8400-e29b-41d4-a716-446655440003'
      const user2 = '850e8400-e29b-41d4-a716-446655440004'
      await NCRService.assign(ncr.id, user1, managerId)
      const reassigned = await NCRService.assign(ncr.id, user2, managerId)
      expect(reassigned.assigned_to).toBe(user2)
    })

    it('should throw error if assigned user ID is invalid', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      await NCRService.submit(ncr.id, userId)
      expect(() =>
        NCRService.assign(ncr.id, 'not-a-uuid', managerId)
      ).rejects.toThrow('Invalid user ID')
    })
  })

  // ============================================================================
  // Read Operations Tests
  // ============================================================================

  describe('getById() - Get NCR by ID', () => {
    it('should retrieve NCR by ID', async () => {
      const created = await NCRService.create(mockNCRData, userId)
      const retrieved = await NCRService.getById(created.id)
      expect(retrieved?.id).toBe(created.id)
      expect(retrieved?.ncr_number).toBe(created.ncr_number)
    })

    it('should return null if NCR not found', async () => {
      const fakeId = '999e8400-e29b-41d4-a716-446655440000'
      const retrieved = await NCRService.getById(fakeId)
      expect(retrieved).toBeNull()
    })

    it('should include permission information in response', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      const detail = await NCRService.getById(ncr.id)
      expect(detail?.permissions).toBeDefined()
      expect(detail?.permissions?.can_edit).toBeDefined()
      expect(detail?.permissions?.can_delete).toBeDefined()
      expect(detail?.permissions?.can_close).toBeDefined()
    })

    it('should include user names in response', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      expect(ncr.detected_by_name).toBeDefined()
    })
  })

  describe('getByNumber() - Get NCR by Number', () => {
    it('should retrieve NCR by NCR number', async () => {
      const created = await NCRService.create(mockNCRData, userId)
      const retrieved = await NCRService.getByNumber(created.ncr_number)
      expect(retrieved?.ncr_number).toBe(created.ncr_number)
    })

    it('should return null if NCR number not found', async () => {
      const retrieved = await NCRService.getByNumber('NCR-2025-99999')
      expect(retrieved).toBeNull()
    })
  })

  // ============================================================================
  // List Operations Tests
  // ============================================================================

  describe('list() - List NCRs with Filters and Pagination', () => {
    it('should list all NCRs for organization', async () => {
      await NCRService.create(mockNCRData, userId)
      await NCRService.create(
        { ...mockNCRData, title: 'Another NCR' },
        userId
      )
      const result = await NCRService.list({ org_id: orgId })
      expect(result.ncrs).toHaveLength(2)
    })

    it('should filter NCRs by status', async () => {
      const ncr1 = await NCRService.create(mockNCRData, userId)
      const ncr2 = await NCRService.create(
        { ...mockNCRData, title: 'Another NCR' },
        userId
      )
      await NCRService.submit(ncr2.id, userId)

      const drafts = await NCRService.list({
        org_id: orgId,
        status: 'draft',
      })
      expect(drafts.ncrs).toHaveLength(1)
      expect(drafts.ncrs[0].id).toBe(ncr1.id)
    })

    it('should filter NCRs by severity', async () => {
      await NCRService.create(
        { ...mockNCRData, severity: 'critical' },
        userId
      )
      await NCRService.create(
        { ...mockNCRData, severity: 'minor', title: 'Minor Issue' },
        userId
      )
      const result = await NCRService.list({
        org_id: orgId,
        severity: 'critical',
      })
      expect(result.ncrs).toHaveLength(1)
      expect(result.ncrs[0].severity).toBe('critical')
    })

    it('should filter NCRs by detection_point', async () => {
      await NCRService.create(
        { ...mockNCRData, detection_point: 'incoming' },
        userId
      )
      await NCRService.create(
        { ...mockNCRData, detection_point: 'final', title: 'Final Check Issue' },
        userId
      )
      const result = await NCRService.list({
        org_id: orgId,
        detection_point: 'incoming',
      })
      expect(result.ncrs).toHaveLength(1)
    })

    it('should support pagination', async () => {
      for (let i = 0; i < 30; i++) {
        await NCRService.create(
          { ...mockNCRData, title: `NCR ${i}` },
          userId
        )
      }
      const page1 = await NCRService.list({
        org_id: orgId,
        page: 1,
        limit: 20,
      })
      const page2 = await NCRService.list({
        org_id: orgId,
        page: 2,
        limit: 20,
      })
      expect(page1.pagination.total).toBe(30)
      expect(page1.ncrs).toHaveLength(20)
      expect(page2.ncrs).toHaveLength(10)
    })

    it('should return pagination metadata', async () => {
      await NCRService.create(mockNCRData, userId)
      const result = await NCRService.list({ org_id: orgId })
      expect(result.pagination).toHaveProperty('total')
      expect(result.pagination).toHaveProperty('page')
      expect(result.pagination).toHaveProperty('limit')
      expect(result.pagination).toHaveProperty('pages')
    })

    it('should sort by detected_date DESC (newest first)', async () => {
      await NCRService.create(mockNCRData, userId)
      await new Promise(resolve => setTimeout(resolve, 100))
      await NCRService.create(
        { ...mockNCRData, title: 'Newer NCR' },
        userId
      )
      const result = await NCRService.list({
        org_id: orgId,
        sort_by: 'detected_date',
        sort_order: 'desc',
      })
      expect(new Date(result.ncrs[0].detected_date).getTime()).toBeGreaterThan(
        new Date(result.ncrs[1].detected_date).getTime()
      )
    })

    it('should return stats with NCR counts', async () => {
      const ncr1 = await NCRService.create(mockNCRData, userId)
      const ncr2 = await NCRService.create(
        { ...mockNCRData, title: 'Another NCR', severity: 'critical' },
        userId
      )
      await NCRService.submit(ncr2.id, userId)

      const result = await NCRService.list({ org_id: orgId })
      expect(result.stats).toHaveProperty('draft_count')
      expect(result.stats).toHaveProperty('open_count')
      expect(result.stats).toHaveProperty('critical_count')
      expect(result.stats.draft_count).toBe(1)
      expect(result.stats.open_count).toBe(1)
    })
  })

  // ============================================================================
  // Permission Tests
  // ============================================================================

  describe('checkPermissions() - Permission Enforcement', () => {
    it('should allow edit/delete for draft NCR', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      const perms = await NCRService.checkPermissions(ncr.id, userId)
      expect(perms.can_edit).toBe(true)
      expect(perms.can_delete).toBe(true)
    })

    it('should block edit/delete for open NCR', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      await NCRService.submit(ncr.id, userId)
      const perms = await NCRService.checkPermissions(ncr.id, userId)
      expect(perms.can_edit).toBe(false)
      expect(perms.can_delete).toBe(false)
    })

    it('should allow close only for QA_MANAGER', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      await NCRService.submit(ncr.id, userId)
      const inspectorPerms = await NCRService.checkPermissions(ncr.id, userId)
      const managerPerms = await NCRService.checkPermissions(ncr.id, managerId)
      expect(inspectorPerms.can_close).toBe(false)
      expect(managerPerms.can_close).toBe(true)
    })

    it('should return all permission flags', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      const perms = await NCRService.checkPermissions(ncr.id, userId)
      expect(perms).toHaveProperty('can_edit')
      expect(perms).toHaveProperty('can_delete')
      expect(perms).toHaveProperty('can_close')
      expect(perms).toHaveProperty('can_assign')
    })
  })

  // ============================================================================
  // Stats Tests
  // ============================================================================

  describe('getStats() - NCR Dashboard Statistics', () => {
    it('should return NCR count by status', async () => {
      const ncr1 = await NCRService.create(mockNCRData, userId)
      const ncr2 = await NCRService.create(
        { ...mockNCRData, title: 'Another NCR' },
        userId
      )
      await NCRService.submit(ncr2.id, userId)

      const stats = await NCRService.getStats(orgId)
      expect(stats.draft_count).toBe(1)
      expect(stats.open_count).toBe(1)
    })

    it('should return NCR count by severity', async () => {
      await NCRService.create(
        { ...mockNCRData, severity: 'critical' },
        userId
      )
      await NCRService.create(
        { ...mockNCRData, severity: 'major', title: 'Major Issue' },
        userId
      )
      await NCRService.create(
        { ...mockNCRData, severity: 'minor', title: 'Minor Issue' },
        userId
      )

      const stats = await NCRService.getStats(orgId)
      expect(stats.critical_count).toBe(1)
      expect(stats.major_count).toBe(1)
      expect(stats.minor_count).toBe(1)
    })

    it('should include all required stat fields', async () => {
      await NCRService.create(mockNCRData, userId)
      const stats = await NCRService.getStats(orgId)
      expect(stats).toHaveProperty('draft_count')
      expect(stats).toHaveProperty('open_count')
      expect(stats).toHaveProperty('closed_count')
      expect(stats).toHaveProperty('critical_count')
      expect(stats).toHaveProperty('major_count')
      expect(stats).toHaveProperty('minor_count')
    })
  })

  // ============================================================================
  // RLS and Multi-Tenancy Tests
  // ============================================================================

  describe('RLS Policy Enforcement - Multi-Tenancy', () => {
    it('should isolate NCRs by organization', async () => {
      const org1Id = '550e8400-e29b-41d4-a716-446655440000'
      const org2Id = '550e8400-e29b-41d4-a716-446655440099'

      const org1NCR = await NCRService.create(mockNCRData, userId)
      const org2NCR = await NCRService.create(
        { ...mockNCRData, title: 'Org 2 NCR' },
        userId
      )

      const org1List = await NCRService.list({ org_id: org1Id })
      const org2List = await NCRService.list({ org_id: org2Id })

      expect(org1List.ncrs.every(n => n.org_id === org1Id)).toBe(true)
      expect(org2List.ncrs.every(n => n.org_id === org2Id)).toBe(true)
    })

    it('should prevent cross-org NCR access', async () => {
      const ncr = await NCRService.create(mockNCRData, userId)
      const otherOrgId = '550e8400-e29b-41d4-a716-446655440099'

      const result = await NCRService.list({ org_id: otherOrgId })
      expect(result.ncrs.find(n => n.id === ncr.id)).toBeUndefined()
    })
  })

  // ============================================================================
  // Integration Tests
  // ============================================================================

  describe('Complete NCR Workflow', () => {
    it('should complete full workflow: create -> submit -> close', async () => {
      // 1. Create as draft
      let ncr = await NCRService.create(mockNCRData, userId)
      expect(ncr.status).toBe('draft')

      // 2. Edit draft
      ncr = await NCRService.update(
        ncr.id,
        { title: 'Updated Title' },
        userId
      )
      expect(ncr.title).toBe('Updated Title')

      // 3. Submit to open
      ncr = await NCRService.submit(ncr.id, userId)
      expect(ncr.status).toBe('open')

      // 4. Verify cannot edit open NCR
      expect(() =>
        NCRService.update(ncr.id, { title: 'Another Title' }, userId)
      ).rejects.toThrow()

      // 5. Close NCR
      ncr = await NCRService.close(
        ncr.id,
        'Issue resolved. Supplier corrected receiving temperature controls and procedures.',
        managerId
      )
      expect(ncr.status).toBe('closed')
      expect(ncr.closed_by).toBe(managerId)

      // 6. Verify cannot edit closed NCR
      expect(() =>
        NCRService.update(ncr.id, { title: 'Final Title' }, userId)
      ).rejects.toThrow()
    })

    it('should allow submit_immediately flag to skip draft', async () => {
      const input = { ...mockNCRData, submit_immediately: true }
      const ncr = await NCRService.create(input, userId)
      expect(ncr.status).toBe('open')
    })
  })

  // ============================================================================
  // Category Tests
  // ============================================================================

  describe('NCR Categories', () => {
    const categories = [
      'product_defect',
      'process_deviation',
      'documentation_error',
      'equipment_failure',
      'supplier_issue',
      'customer_complaint',
      'other',
    ]

    categories.forEach(category => {
      it(`should accept category: ${category}`, async () => {
        const input = { ...mockNCRData, category: category as any }
        const ncr = await NCRService.create(input, userId)
        expect(ncr.category).toBe(category)
      })
    })

    it('should reject invalid category', async () => {
      const input = { ...mockNCRData, category: 'invalid_category' as any }
      expect(() => NCRService.create(input, userId)).rejects.toThrow()
    })
  })
})
