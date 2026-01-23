import '@testing-library/jest-dom'
import { afterEach, beforeEach } from 'vitest'
import { cleanup } from '@testing-library/react'
import { config } from 'dotenv'
import path from 'path'
import { statsCache } from './lib/services/settings-dashboard-service'
import { resetNCRStore, setUserRole } from './lib/services/ncr-service'

// Load .env.local from apps/frontend for integration tests
config({ path: path.resolve(__dirname, '.env.local') })

// Polyfill for Radix UI (JSDOM compatibility)
// See: https://github.com/radix-ui/primitives/issues/1822
if (typeof Element !== 'undefined') {
  if (!Element.prototype.hasPointerCapture) {
    Element.prototype.hasPointerCapture = function () {
      return false
    }
  }

  if (!Element.prototype.setPointerCapture) {
    Element.prototype.setPointerCapture = function () {
      // no-op
    }
  }

  if (!Element.prototype.releasePointerCapture) {
    Element.prototype.releasePointerCapture = function () {
      // no-op
    }
  }

  if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = function () {
      // no-op
    }
  }
}

// Polyfill for ResizeObserver (used by Radix Popover/Select)
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

// Store original fetch for integration tests
const originalFetch = global.fetch

// Mock global fetch for test environment
// Only mock specific test scenarios, not Supabase requests
global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const url = typeof input === 'string' ? input : input.toString()

  // Let Supabase requests through (for integration tests)
  if (url.includes('supabase.co') || url.includes('localhost:54321')) {
    return originalFetch(input, init)
  }

  // Mock successful responses for warehouse APIs (unit tests only)
  if (url.includes('/api/warehouse/license-plates/') && init?.method === 'PUT') {
    return {
      ok: true,
      status: 200,
      json: async () => ({ success: true, data: {} }),
    } as Response
  }

  // Mock NCR API responses for integration tests
  if (url.includes('/api/quality/ncrs')) {
    const method = init?.method || 'GET'
    const body = init?.body ? JSON.parse(init.body as string) : {}

    // POST /api/quality/ncrs - Create NCR
    if (method === 'POST' && !url.includes('/submit') && !url.includes('/close') && !url.includes('/assign')) {
      // Validate required fields
      if (!body.title) {
        return { ok: false, status: 400, json: async () => ({ error: 'Title is required' }) } as Response
      }
      if (body.title && body.title.length < 5) {
        return { ok: false, status: 400, json: async () => ({ error: 'Title must be at least 5 characters' }) } as Response
      }
      if (body.description && body.description.length < 20) {
        return { ok: false, status: 400, json: async () => ({ error: 'Description must be at least 20 characters' }) } as Response
      }
      if (body.severity && !['minor', 'major', 'critical'].includes(body.severity)) {
        return { ok: false, status: 400, json: async () => ({ error: 'Invalid severity' }) } as Response
      }
      if (body.detection_point && !['incoming', 'in_process', 'final', 'customer', 'internal_audit', 'supplier_audit', 'other'].includes(body.detection_point)) {
        return { ok: false, status: 400, json: async () => ({ error: 'Invalid detection point' }) } as Response
      }

      return {
        ok: true,
        status: 201,
        json: async () => ({
          ncr: {
            id: '850e8400-e29b-41d4-a716-446655440000',
            ncr_number: 'NCR-2025-00001',
            ...body,
            org_id: '550e8400-e29b-41d4-a716-446655440000',
            status: body.submit_immediately ? 'open' : 'draft',
            detected_date: new Date().toISOString(),
            detected_by: '650e8400-e29b-41d4-a716-446655440001',
          },
        }),
      } as Response
    }

    // GET /api/quality/ncrs - List NCRs
    if (method === 'GET' && !url.match(/ncrs\/[a-f0-9-]+/)) {
      const urlObj = new URL(url)
      const status = urlObj.searchParams.get('status')
      const severity = urlObj.searchParams.get('severity')
      const detectionPoint = urlObj.searchParams.get('detection_point')
      const page = parseInt(urlObj.searchParams.get('page') || '1', 10)
      const limit = parseInt(urlObj.searchParams.get('limit') || '20', 10)

      return {
        ok: true,
        status: 200,
        json: async () => ({
          ncrs: [{
            id: '850e8400-e29b-41d4-a716-446655440000',
            ncr_number: 'NCR-2025-00001',
            org_id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Temperature deviation during receiving',
            description: 'Refrigerated ingredients received at 8 degrees',
            severity: severity || 'major',
            status: status || 'draft',
            detection_point: detectionPoint || 'incoming',
            detected_date: new Date().toISOString(),
            detected_by: '650e8400-e29b-41d4-a716-446655440001',
          }],
          pagination: { total: 1, page, limit, pages: 1 },
          stats: { draft_count: 1, open_count: 0, closed_count: 0, critical_count: 0 },
        }),
      } as Response
    }

    // GET /api/quality/ncrs/:id - Get NCR Detail
    if (method === 'GET' && url.match(/ncrs\/[a-f0-9-]+/) && !url.includes('/submit') && !url.includes('/close') && !url.includes('/assign')) {
      const idMatch = url.match(/ncrs\/([a-f0-9-]+)/)
      const id = idMatch ? idMatch[1] : ''
      if (id === '999e8400-e29b-41d4-a716-446655440000') {
        return { ok: false, status: 404, json: async () => ({ error: 'NCR not found' }) } as Response
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ncr: {
            id,
            ncr_number: 'NCR-2025-00001',
            org_id: '550e8400-e29b-41d4-a716-446655440000',
            title: 'Temperature deviation during receiving',
            description: 'Refrigerated ingredients received at 8 degrees',
            severity: 'major',
            status: 'draft',
            detection_point: 'incoming',
            detected_date: new Date().toISOString(),
            detected_by: '650e8400-e29b-41d4-a716-446655440001',
            detected_by_name: 'John Inspector',
          },
          permissions: { can_edit: true, can_delete: true, can_close: false, can_assign: false },
        }),
      } as Response
    }

    // PUT /api/quality/ncrs/:id - Update NCR
    if (method === 'PUT') {
      // Check if title is too short
      if (body.title && body.title.length < 5) {
        return { ok: false, status: 400, json: async () => ({ error: 'Title must be at least 5 characters' }) } as Response
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ncr: {
            id: '850e8400-e29b-41d4-a716-446655440000',
            ncr_number: 'NCR-2025-00001',
            ...body,
            status: 'draft',
          },
        }),
      } as Response
    }

    // DELETE /api/quality/ncrs/:id - Delete NCR
    if (method === 'DELETE') {
      return { ok: true, status: 200, json: async () => ({}) } as Response
    }

    // POST /api/quality/ncrs/:id/submit
    if (url.includes('/submit')) {
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ncr: {
            id: '850e8400-e29b-41d4-a716-446655440000',
            ncr_number: 'NCR-2025-00001',
            status: 'open',
          },
        }),
      } as Response
    }

    // POST /api/quality/ncrs/:id/close
    if (url.includes('/close')) {
      if (!body.closure_notes || body.closure_notes === '') {
        return { ok: false, status: 400, json: async () => ({ error: 'Closure notes required' }) } as Response
      }
      if (body.closure_notes && body.closure_notes.length < 50) {
        return { ok: false, status: 400, json: async () => ({ error: 'Closure notes must be at least 50 characters' }) } as Response
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ncr: {
            id: '850e8400-e29b-41d4-a716-446655440000',
            ncr_number: 'NCR-2025-00001',
            status: 'closed',
            closure_notes: body.closure_notes,
            closed_by: '750e8400-e29b-41d4-a716-446655440002',
          },
        }),
      } as Response
    }

    // POST /api/quality/ncrs/:id/assign
    if (url.includes('/assign')) {
      if (!body.assigned_to || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(body.assigned_to)) {
        return { ok: false, status: 400, json: async () => ({ error: 'Invalid user ID' }) } as Response
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ncr: {
            id: '850e8400-e29b-41d4-a716-446655440000',
            ncr_number: 'NCR-2025-00001',
            status: 'open',
            assigned_to: body.assigned_to,
          },
        }),
      } as Response
    }
  }

  // Default successful response for non-Supabase requests
  return {
    ok: true,
    status: 200,
    json: async () => ({}),
  } as Response
}

// Reset NCR store before each test
beforeEach(() => {
  resetNCRStore()
  // Set default QA Manager role
  setUserRole('750e8400-e29b-41d4-a716-446655440002', 'qa_manager')
})

// Cleanup after each test
afterEach(() => {
  cleanup()

  // Clear Settings Dashboard Service cache
  if (statsCache && statsCache.clear) {
    statsCache.clear()
  }
})
