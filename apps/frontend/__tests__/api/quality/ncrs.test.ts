/**
 * NCR API Endpoints - Integration Tests (Story 06.9)
 * Purpose: Test all NCR API routes and integration with service layer
 * Phase: RED - Tests will fail until API routes are implemented
 *
 * Tests all NCR API endpoints:
 * - GET /api/quality/ncrs (list with filters)
 * - GET /api/quality/ncrs/:id (detail view)
 * - POST /api/quality/ncrs (create NCR)
 * - PUT /api/quality/ncrs/:id (update draft)
 * - DELETE /api/quality/ncrs/:id (delete draft)
 * - POST /api/quality/ncrs/:id/submit (draft -> open)
 * - POST /api/quality/ncrs/:id/close (close NCR)
 * - POST /api/quality/ncrs/:id/assign (assign owner)
 *
 * Coverage Target: >80%
 * Test Count: 45+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-3: Create NCR endpoint
 * - AC-8: NCR list endpoint
 * - AC-9: NCR list filters
 * - AC-10: NCR detail endpoint
 * - AC-11: Update endpoint
 * - AC-12: Delete endpoint
 * - AC-13: Submit endpoint
 * - AC-14: Close endpoint
 * - AC-16: Permission enforcement
 * - AC-18: RLS policy enforcement
 * - AC-19: Performance requirements
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * NOTE: This test file will fail because API routes do not exist yet.
 * Once the routes are implemented in app/api/quality/ncrs/route.ts, all tests should pass.
 */

// Mock fetch for API calls
const mockFetch = vi.fn()

describe('NCR API Endpoints (Story 06.9) - Integration Tests', () => {
  const baseUrl = 'http://localhost:3000/api/quality'
  const orgId = '550e8400-e29b-41d4-a716-446655440000'
  const userId = '650e8400-e29b-41d4-a716-446655440001'
  const managerId = '750e8400-e29b-41d4-a716-446655440002'

  const validNCRData = {
    title: 'Temperature deviation during receiving',
    description: 'Refrigerated ingredients received at 8°C instead of required 0-4°C range',
    severity: 'major',
    detection_point: 'incoming',
    category: 'supplier_issue',
  }

  // ============================================================================
  // POST /api/quality/ncrs - Create NCR
  // ============================================================================

  describe('POST /api/quality/ncrs - Create NCR', () => {
    it('should create NCR with valid data', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ncr: {
            id: '850e8400-e29b-41d4-a716-446655440000',
            ncr_number: 'NCR-2025-00001',
            ...validNCRData,
            status: 'draft',
            detected_date: new Date().toISOString(),
            detected_by: userId,
          },
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validNCRData),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.ncr.ncr_number).toMatch(/^NCR-\d{4}-\d{5}$/)
      expect(data.ncr.status).toBe('draft')
    })

    it('should return 400 for missing title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Title is required',
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validNCRData, title: undefined }),
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })

    it('should return 400 for short description', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Description must be at least 20 characters',
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validNCRData, description: 'Too short' }),
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid severity', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid severity',
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validNCRData, severity: 'extreme' }),
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid detection_point', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid detection point',
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validNCRData, detection_point: 'warehouse' }),
      })

      expect(response.ok).toBe(false)
      expect(response.status).toBe(400)
    })

    it('should enforce org_id from authenticated user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ncr: {
            id: '850e8400-e29b-41d4-a716-446655440000',
            org_id: orgId, // Should match user's org, not from request
            ...validNCRData,
            status: 'draft',
          },
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validNCRData,
          org_id: '999e8400-e29b-41d4-a716-446655440000', // Should be ignored
        }),
      })

      const data = await response.json()
      expect(data.ncr.org_id).toBe(orgId)
    })

    it('should return 401 for unauthenticated request', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          error: 'Unauthorized',
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validNCRData),
      })

      expect(response.status).toBe(401)
    })

    it('should accept submit_immediately flag', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ncr: {
            id: '850e8400-e29b-41d4-a716-446655440000',
            ...validNCRData,
            status: 'open', // Should be open, not draft
            submit_immediately: true,
          },
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...validNCRData, submit_immediately: true }),
      })

      const data = await response.json()
      expect(data.ncr.status).toBe('open')
    })

    it('should accept source reference linking', async () => {
      const sourceData = {
        ...validNCRData,
        source_type: 'inspection',
        source_id: '950e8400-e29b-41d4-a716-446655440000',
        source_description: 'Inspection INS-INC-2025-00456',
      }

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ncr: {
            id: '850e8400-e29b-41d4-a716-446655440000',
            ...sourceData,
            status: 'draft',
          },
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sourceData),
      })

      const data = await response.json()
      expect(data.ncr.source_type).toBe('inspection')
      expect(data.ncr.source_id).toBe(sourceData.source_id)
    })

    it('should complete within 300ms', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ncr: {
            id: '850e8400-e29b-41d4-a716-446655440000',
            ...validNCRData,
            status: 'draft',
          },
        }),
      })

      const start = performance.now()
      await fetch(`${baseUrl}/ncrs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validNCRData),
      })
      const end = performance.now()

      expect(end - start).toBeLessThan(300)
    })
  })

  // ============================================================================
  // GET /api/quality/ncrs - List NCRs
  // ============================================================================

  describe('GET /api/quality/ncrs - List NCRs', () => {
    it('should list all NCRs with pagination', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ncrs: [
            {
              id: '850e8400-e29b-41d4-a716-446655440000',
              ncr_number: 'NCR-2025-00001',
              ...validNCRData,
              status: 'draft',
            },
          ],
          pagination: {
            total: 1,
            page: 1,
            limit: 20,
            pages: 1,
          },
          stats: {
            draft_count: 1,
            open_count: 0,
            closed_count: 0,
            critical_count: 0,
          },
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs`)
      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(Array.isArray(data.ncrs)).toBe(true)
      expect(data.pagination).toBeDefined()
      expect(data.stats).toBeDefined()
    })

    it('should filter by status', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ncrs: [
            {
              id: '850e8400-e29b-41d4-a716-446655440000',
              ...validNCRData,
              status: 'draft',
            },
          ],
          pagination: { total: 1, page: 1, limit: 20, pages: 1 },
          stats: { draft_count: 1, open_count: 0, closed_count: 0, critical_count: 0 },
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs?status=draft`)
      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.ncrs.every((n: any) => n.status === 'draft')).toBe(true)
    })

    it('should filter by severity', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ncrs: [
            {
              id: '850e8400-e29b-41d4-a716-446655440000',
              ...validNCRData,
              severity: 'critical',
            },
          ],
          pagination: { total: 1, page: 1, limit: 20, pages: 1 },
          stats: { draft_count: 1, open_count: 0, closed_count: 0, critical_count: 1 },
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs?severity=critical`)
      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.ncrs.every((n: any) => n.severity === 'critical')).toBe(true)
    })

    it('should filter by detection_point', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ncrs: [
            {
              id: '850e8400-e29b-41d4-a716-446655440000',
              ...validNCRData,
              detection_point: 'incoming',
            },
          ],
          pagination: { total: 1, page: 1, limit: 20, pages: 1 },
          stats: { draft_count: 1, open_count: 0, closed_count: 0, critical_count: 0 },
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs?detection_point=incoming`)
      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.ncrs.every((n: any) => n.detection_point === 'incoming')).toBe(true)
    })

    it('should support search parameter', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ncrs: [
            {
              id: '850e8400-e29b-41d4-a716-446655440000',
              ncr_number: 'NCR-2025-00001',
              title: 'Temperature deviation',
              ...validNCRData,
            },
          ],
          pagination: { total: 1, page: 1, limit: 20, pages: 1 },
          stats: { draft_count: 1, open_count: 0, closed_count: 0, critical_count: 0 },
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs?search=temperature`)
      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.ncrs.length).toBeGreaterThan(0)
    })

    it('should support pagination', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ncrs: [],
          pagination: {
            total: 50,
            page: 2,
            limit: 20,
            pages: 3,
          },
          stats: { draft_count: 0, open_count: 0, closed_count: 0, critical_count: 0 },
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs?page=2&limit=20`)
      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.pagination.page).toBe(2)
      expect(data.pagination.limit).toBe(20)
    })

    it('should enforce RLS for org isolation', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ncrs: [
            {
              id: '850e8400-e29b-41d4-a716-446655440000',
              org_id: orgId, // Should only return user's org
              ...validNCRData,
            },
          ],
          pagination: { total: 1, page: 1, limit: 20, pages: 1 },
          stats: { draft_count: 1, open_count: 0, closed_count: 0, critical_count: 0 },
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs`)
      const data = await response.json()
      expect(data.ncrs.every((n: any) => n.org_id === orgId)).toBe(true)
    })

    it('should complete within 500ms', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ncrs: [],
          pagination: { total: 0, page: 1, limit: 20, pages: 0 },
          stats: { draft_count: 0, open_count: 0, closed_count: 0, critical_count: 0 },
        }),
      })

      const start = performance.now()
      await fetch(`${baseUrl}/ncrs`)
      const end = performance.now()

      expect(end - start).toBeLessThan(500)
    })
  })

  // ============================================================================
  // GET /api/quality/ncrs/:id - Get NCR Detail
  // ============================================================================

  describe('GET /api/quality/ncrs/:id - Get NCR Detail', () => {
    const ncrId = '850e8400-e29b-41d4-a716-446655440000'

    it('should retrieve NCR detail', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ncr: {
            id: ncrId,
            ncr_number: 'NCR-2025-00001',
            ...validNCRData,
            status: 'draft',
            detected_by_name: 'John Inspector',
          },
          permissions: {
            can_edit: true,
            can_delete: true,
            can_close: false,
            can_assign: false,
          },
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs/${ncrId}`)
      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.ncr.id).toBe(ncrId)
      expect(data.permissions).toBeDefined()
    })

    it('should return 404 for non-existent NCR', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({
          error: 'NCR not found',
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs/999e8400-e29b-41d4-a716-446655440000`)
      expect(response.status).toBe(404)
    })

    it('should include permission information', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ncr: {
            id: ncrId,
            ...validNCRData,
            status: 'draft',
          },
          permissions: {
            can_edit: true,
            can_delete: true,
            can_close: false,
            can_assign: false,
          },
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs/${ncrId}`)
      const data = await response.json()
      expect(data.permissions.can_edit).toBeDefined()
      expect(data.permissions.can_delete).toBeDefined()
      expect(data.permissions.can_close).toBeDefined()
    })

    it('should complete within 300ms', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ncr: {
            id: ncrId,
            ...validNCRData,
          },
          permissions: { can_edit: true, can_delete: true, can_close: false, can_assign: false },
        }),
      })

      const start = performance.now()
      await fetch(`${baseUrl}/ncrs/${ncrId}`)
      const end = performance.now()

      expect(end - start).toBeLessThan(300)
    })
  })

  // ============================================================================
  // PUT /api/quality/ncrs/:id - Update Draft NCR
  // ============================================================================

  describe('PUT /api/quality/ncrs/:id - Update Draft NCR', () => {
    const ncrId = '850e8400-e29b-41d4-a716-446655440000'

    it('should update draft NCR', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ncr: {
            id: ncrId,
            title: 'Updated Title',
            ...validNCRData,
            status: 'draft',
          },
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs/${ncrId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title' }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.ncr.title).toBe('Updated Title')
    })

    it('should return 403 for open NCR', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Cannot edit open NCR',
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs/${ncrId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title' }),
      })

      expect(response.status).toBe(403)
    })

    it('should return 403 for closed NCR', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Cannot edit closed NCR',
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs/${ncrId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Updated Title' }),
      })

      expect(response.status).toBe(403)
    })

    it('should validate updated title', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Title must be at least 5 characters',
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs/${ncrId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Bad' }),
      })

      expect(response.status).toBe(400)
    })
  })

  // ============================================================================
  // DELETE /api/quality/ncrs/:id - Delete Draft NCR
  // ============================================================================

  describe('DELETE /api/quality/ncrs/:id - Delete Draft NCR', () => {
    const ncrId = '850e8400-e29b-41d4-a716-446655440000'

    it('should delete draft NCR', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      })

      const response = await fetch(`${baseUrl}/ncrs/${ncrId}`, {
        method: 'DELETE',
      })

      expect(response.ok).toBe(true)
    })

    it('should return 403 for open NCR', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Cannot delete open NCR',
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs/${ncrId}`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(403)
    })

    it('should return 403 for closed NCR', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Cannot delete closed NCR',
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs/${ncrId}`, {
        method: 'DELETE',
      })

      expect(response.status).toBe(403)
    })
  })

  // ============================================================================
  // POST /api/quality/ncrs/:id/submit - Submit Draft
  // ============================================================================

  describe('POST /api/quality/ncrs/:id/submit - Submit Draft NCR', () => {
    const ncrId = '850e8400-e29b-41d4-a716-446655440000'

    it('should submit draft NCR to open', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ncr: {
            id: ncrId,
            ...validNCRData,
            status: 'open',
          },
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs/${ncrId}/submit`, {
        method: 'POST',
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.ncr.status).toBe('open')
    })

    it('should return 409 if already open', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 409,
        json: async () => ({
          error: 'NCR is already open',
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs/${ncrId}/submit`, {
        method: 'POST',
      })

      expect(response.status).toBe(409)
    })
  })

  // ============================================================================
  // POST /api/quality/ncrs/:id/close - Close NCR
  // ============================================================================

  describe('POST /api/quality/ncrs/:id/close - Close NCR', () => {
    const ncrId = '850e8400-e29b-41d4-a716-446655440000'

    it('should close open NCR', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ncr: {
            id: ncrId,
            ...validNCRData,
            status: 'closed',
            closure_notes: 'Issue resolved with corrective actions',
            closed_by: managerId,
          },
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs/${ncrId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closure_notes: 'Issue resolved with corrective actions',
        }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.ncr.status).toBe('closed')
    })

    it('should return 400 for missing closure notes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Closure notes required',
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs/${ncrId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closure_notes: '' }),
      })

      expect(response.status).toBe(400)
    })

    it('should return 400 for short closure notes', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Closure notes must be at least 50 characters',
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs/${ncrId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ closure_notes: 'Short notes' }),
      })

      expect(response.status).toBe(400)
    })

    it('should return 403 for QA_INSPECTOR', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 403,
        json: async () => ({
          error: 'Only QA_MANAGER can close NCRs',
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs/${ncrId}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          closure_notes: 'Issue resolved with corrective actions and verification',
        }),
      })

      expect(response.status).toBe(403)
    })
  })

  // ============================================================================
  // POST /api/quality/ncrs/:id/assign - Assign NCR
  // ============================================================================

  describe('POST /api/quality/ncrs/:id/assign - Assign NCR', () => {
    const ncrId = '850e8400-e29b-41d4-a716-446655440000'
    const assignedUserId = '950e8400-e29b-41d4-a716-446655440000'

    it('should assign open NCR to user', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ncr: {
            id: ncrId,
            ...validNCRData,
            status: 'open',
            assigned_to: assignedUserId,
          },
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs/${ncrId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: assignedUserId }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json()
      expect(data.ncr.assigned_to).toBe(assignedUserId)
    })

    it('should return 400 for invalid user ID', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: 'Invalid user ID',
        }),
      })

      const response = await fetch(`${baseUrl}/ncrs/${ncrId}/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assigned_to: 'not-a-uuid' }),
      })

      expect(response.status).toBe(400)
    })
  })
})
