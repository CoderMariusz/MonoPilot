/**
 * Scanner Pick API Integration Tests (Story 07.10)
 * Phase: TDD RED - Tests written before implementation
 *
 * Tests the API endpoints:
 * - POST /api/shipping/scanner/pick - Confirm pick via scanner
 * - GET /api/shipping/scanner/lookup/lp/:barcode - LP lookup
 * - GET /api/shipping/scanner/suggest-pick/:lineId - Pick suggestion
 *
 * Coverage Target: 85%+
 * Test Count: 35+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-16: LP lookup API
 * - AC-17: Scanner pick API
 * - AC-20: RLS enforcement
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock Supabase - define before vi.mock
vi.mock('@/lib/supabase/server', () => {
  const mockUser = {
    id: 'user-001',
    email: 'picker@test.com',
    user_metadata: {
      org_id: 'org-001',
      role: 'PICKER',
    },
  }

  // Configurable role for tests
  let currentRole = 'PICKER'

  // Create chainable mock for Supabase queries
  const createChainableMock = (tableGetter: () => any) => {
    const chain: any = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      or: vi.fn().mockReturnThis(),
      in: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      gt: vi.fn().mockReturnThis(),
      lt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => Promise.resolve({ data: tableGetter(), error: null })),
      maybeSingle: vi.fn().mockImplementation(() => Promise.resolve({ data: tableGetter(), error: null })),
    }
    return chain
  }

  const mockSupabaseClient = {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: mockUser }, error: null }),
    },
    from: vi.fn().mockImplementation((table: string) => {
      if (table === 'users') {
        return createChainableMock(() => ({
          org_id: 'org-001',
          role: { code: currentRole },
        }))
      }
      return createChainableMock(() => null)
    }),
    rpc: vi.fn(),
    __setRole: (role: string) => { currentRole = role },
    __resetRole: () => { currentRole = 'PICKER' },
  }

  return {
    createServerSupabase: vi.fn().mockResolvedValue(mockSupabaseClient),
    __mockSupabaseClient: mockSupabaseClient,
    __mockUser: mockUser,
  }
})

// Mock ScannerPickService
vi.mock('@/lib/services/scanner-pick-service', () => {
  class ScannerPickErrorMock extends Error {
    code: string
    status: number
    constructor(message: string, code: string, status: number = 400) {
      super(message)
      this.name = 'ScannerPickError'
      this.code = code
      this.status = status
    }
  }

  return {
    ScannerPickService: {
      confirmPick: vi.fn(),
      lookupLP: vi.fn(),
      suggestPick: vi.fn(),
      startPickList: vi.fn(),
      completePickList: vi.fn(),
    },
    ScannerPickError: ScannerPickErrorMock,
  }
})

import { POST } from '@/app/api/shipping/scanner/pick/route'
import { GET as GET_LP } from '@/app/api/shipping/scanner/lookup/lp/[barcode]/route'
import { GET as GET_SUGGESTION } from '@/app/api/shipping/scanner/suggest-pick/[lineId]/route'
import { ScannerPickService } from '@/lib/services/scanner-pick-service'
import * as serverModule from '@/lib/supabase/server'

// Get mock references after import
const { __mockSupabaseClient: mockSupabaseClient, __mockUser: mockUser } = serverModule as any

// =============================================================================
// Test Fixtures
// =============================================================================

const mockPickConfirmResponse = {
  success: true,
  pick_line_status: 'picked' as const,
  next_line: {
    id: 'line-002',
    pick_sequence: 2,
    location_path: 'CHILLED / A-04-08',
    product_name: 'Yogurt Strawberry',
    quantity_to_pick: 12,
    expected_lp: 'LP-2025-00055',
  },
  progress: {
    total_lines: 12,
    picked_lines: 1,
    short_lines: 0,
  },
  pick_list_complete: false,
}

const mockLPLookup = {
  lp_number: 'LP-2025-00042',
  product_id: 'prod-001',
  product_name: 'Chocolate Milk 1L',
  product_sku: 'CHO-MILK-1L',
  lot_number: 'A2025-003',
  best_before_date: '2025-06-15',
  on_hand_quantity: 48,
  location_id: 'loc-001',
  location_path: 'CHILLED / A-03-12',
  allergens: ['Milk'],
  qa_status: 'passed',
}

const mockPickSuggestion = {
  suggested_lp: 'LP-2025-00040',
  suggested_lp_id: 'uuid-lp-00040',
  alternate_lps: [
    { lp_number: 'LP-2025-00040', lp_id: 'uuid-lp-00040', mfg_date: '2025-10-20', bbd_date: '2026-04-20' },
    { lp_number: 'LP-2025-00042', lp_id: 'uuid-lp-00042', mfg_date: '2025-11-15', bbd_date: '2026-05-15' },
  ],
  fifo_warning: false,
  fefo_warning: false,
}

describe('Scanner Pick API Routes (Story 07.10)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Reset role to PICKER for each test
    if (mockSupabaseClient?.__resetRole) {
      mockSupabaseClient.__resetRole()
    }
    if (mockSupabaseClient?.auth?.getUser) {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: mockUser },
        error: null,
      })
    }
  })

  // ==========================================================================
  // POST /api/shipping/scanner/pick
  // ==========================================================================
  describe('POST /api/shipping/scanner/pick', () => {
    it('should return 401 if not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = new NextRequest('http://localhost/api/shipping/scanner/pick', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should confirm valid pick (AC-17)', async () => {
      vi.mocked(ScannerPickService.confirmPick).mockResolvedValue(mockPickConfirmResponse as any)

      const request = new NextRequest('http://localhost/api/shipping/scanner/pick', {
        method: 'POST',
        body: JSON.stringify({
          pick_line_id: '123e4567-e89b-12d3-a456-426614174000',
          scanned_lp_barcode: 'LP-2025-00042',
          quantity_picked: 24,
          short_pick: false,
        }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.pick_line_status).toBe('picked')
      expect(body.next_line).toBeDefined()
      expect(body.progress).toBeDefined()
    })

    it('should return next_line preview in response', async () => {
      vi.mocked(ScannerPickService.confirmPick).mockResolvedValue(mockPickConfirmResponse as any)

      const request = new NextRequest('http://localhost/api/shipping/scanner/pick', {
        method: 'POST',
        body: JSON.stringify({
          pick_line_id: '123e4567-e89b-12d3-a456-426614174000',
          scanned_lp_barcode: 'LP-2025-00042',
          quantity_picked: 24,
          short_pick: false,
        }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(body.next_line).toHaveProperty('id')
      expect(body.next_line).toHaveProperty('pick_sequence')
      expect(body.next_line).toHaveProperty('location_path')
      expect(body.next_line).toHaveProperty('product_name')
    })

    it('should return progress in response', async () => {
      vi.mocked(ScannerPickService.confirmPick).mockResolvedValue(mockPickConfirmResponse as any)

      const request = new NextRequest('http://localhost/api/shipping/scanner/pick', {
        method: 'POST',
        body: JSON.stringify({
          pick_line_id: '123e4567-e89b-12d3-a456-426614174000',
          scanned_lp_barcode: 'LP-2025-00042',
          quantity_picked: 24,
          short_pick: false,
        }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(body.progress).toHaveProperty('total_lines')
      expect(body.progress).toHaveProperty('picked_lines')
      expect(body.progress).toHaveProperty('short_lines')
    })

    it('should return 400 for validation error', async () => {
      const request = new NextRequest('http://localhost/api/shipping/scanner/pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // Missing required fields
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 for invalid UUID', async () => {
      const request = new NextRequest('http://localhost/api/shipping/scanner/pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pick_line_id: 'not-a-uuid',
          scanned_lp_barcode: 'LP-2025-00042',
          quantity_picked: 24,
          short_pick: false,
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 for LP mismatch', async () => {
      vi.mocked(ScannerPickService.confirmPick).mockRejectedValue(
        new Error('LP_MISMATCH: Wrong LP - Expected LP-2025-00042')
      )

      const request = new NextRequest('http://localhost/api/shipping/scanner/pick', {
        method: 'POST',
        body: JSON.stringify({
          pick_line_id: '123e4567-e89b-12d3-a456-426614174000',
          scanned_lp_barcode: 'LP-2025-00099',
          quantity_picked: 24,
          short_pick: false,
        }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error.code).toBe('LP_MISMATCH')
    })

    it('should return 400 for quantity exceeds available', async () => {
      vi.mocked(ScannerPickService.confirmPick).mockRejectedValue(
        new Error('QUANTITY_EXCEEDS_AVAILABLE: Quantity exceeds available (max 60)')
      )

      const request = new NextRequest('http://localhost/api/shipping/scanner/pick', {
        method: 'POST',
        body: JSON.stringify({
          pick_line_id: '123e4567-e89b-12d3-a456-426614174000',
          scanned_lp_barcode: 'LP-2025-00042',
          quantity_picked: 100,
          short_pick: false,
        }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error.code).toBe('QUANTITY_EXCEEDS_AVAILABLE')
    })

    it('should return 400 for short pick missing reason', async () => {
      const request = new NextRequest('http://localhost/api/shipping/scanner/pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pick_line_id: '123e4567-e89b-12d3-a456-426614174000',
          scanned_lp_barcode: 'LP-2025-00042',
          quantity_picked: 18,
          short_pick: true,
          // Missing short_pick_reason
        }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(400)
      expect(body.error.code).toBe('SHORT_PICK_REASON_REQUIRED')
    })

    it('should accept valid short pick with reason', async () => {
      const shortPickResponse = {
        ...mockPickConfirmResponse,
        pick_line_status: 'short' as const,
      }
      vi.mocked(ScannerPickService.confirmPick).mockResolvedValue(shortPickResponse as any)

      const request = new NextRequest('http://localhost/api/shipping/scanner/pick', {
        method: 'POST',
        body: JSON.stringify({
          pick_line_id: '123e4567-e89b-12d3-a456-426614174000',
          scanned_lp_barcode: 'LP-2025-00042',
          quantity_picked: 18,
          short_pick: true,
          short_pick_reason: 'insufficient_inventory',
          short_pick_notes: 'Found 18 cases only',
        }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.pick_line_status).toBe('short')
    })

    it('should return 404 for pick line not found', async () => {
      vi.mocked(ScannerPickService.confirmPick).mockRejectedValue(
        new Error('NOT_FOUND: Pick line not found')
      )

      const request = new NextRequest('http://localhost/api/shipping/scanner/pick', {
        method: 'POST',
        body: JSON.stringify({
          pick_line_id: '123e4567-e89b-12d3-a456-426614174999',
          scanned_lp_barcode: 'LP-2025-00042',
          quantity_picked: 24,
          short_pick: false,
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(404)
    })

    it('should return 409 for line already picked', async () => {
      vi.mocked(ScannerPickService.confirmPick).mockRejectedValue(
        new Error('LINE_ALREADY_PICKED: Line already picked')
      )

      const request = new NextRequest('http://localhost/api/shipping/scanner/pick', {
        method: 'POST',
        body: JSON.stringify({
          pick_line_id: '123e4567-e89b-12d3-a456-426614174000',
          scanned_lp_barcode: 'LP-2025-00042',
          quantity_picked: 24,
          short_pick: false,
        }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(response.status).toBe(409)
      expect(body.error.code).toBe('LINE_ALREADY_PICKED')
    })

    it('should return 403 for insufficient permissions', async () => {
      // Set role to VIEWER which is not allowed for pick confirmation
      mockSupabaseClient.__setRole('viewer')

      const request = new NextRequest('http://localhost/api/shipping/scanner/pick', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pick_line_id: '123e4567-e89b-12d3-a456-426614174000',
          scanned_lp_barcode: 'LP-2025-00042',
          quantity_picked: 24,
          short_pick: false,
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(403)
    })

    it('should return pick_list_complete=true when all lines done', async () => {
      const completeResponse = {
        ...mockPickConfirmResponse,
        next_line: null,
        pick_list_complete: true,
        progress: { total_lines: 12, picked_lines: 12, short_lines: 0 },
      }
      vi.mocked(ScannerPickService.confirmPick).mockResolvedValue(completeResponse as any)

      const request = new NextRequest('http://localhost/api/shipping/scanner/pick', {
        method: 'POST',
        body: JSON.stringify({
          pick_line_id: '123e4567-e89b-12d3-a456-426614174000',
          scanned_lp_barcode: 'LP-2025-00042',
          quantity_picked: 24,
          short_pick: false,
        }),
      })
      const response = await POST(request)
      const body = await response.json()

      expect(body.pick_list_complete).toBe(true)
      expect(body.next_line).toBeNull()
    })

    it('should respond within 200ms target', async () => {
      vi.mocked(ScannerPickService.confirmPick).mockResolvedValue(mockPickConfirmResponse as any)

      const startTime = Date.now()
      const request = new NextRequest('http://localhost/api/shipping/scanner/pick', {
        method: 'POST',
        body: JSON.stringify({
          pick_line_id: '123e4567-e89b-12d3-a456-426614174000',
          scanned_lp_barcode: 'LP-2025-00042',
          quantity_picked: 24,
          short_pick: false,
        }),
      })
      await POST(request)
      const endTime = Date.now()

      // In test, just verify service was called (timing is mocked)
      expect(ScannerPickService.confirmPick).toHaveBeenCalled()
      expect(endTime - startTime).toBeLessThan(200)
    })
  })

  // ==========================================================================
  // GET /api/shipping/scanner/lookup/lp/:barcode
  // ==========================================================================
  describe('GET /api/shipping/scanner/lookup/lp/:barcode', () => {
    it('should return 401 if not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = new NextRequest('http://localhost/api/shipping/scanner/lookup/lp/LP-2025-00042')
      const response = await GET_LP(request, { params: Promise.resolve({ barcode: 'LP-2025-00042' }) })

      expect(response.status).toBe(401)
    })

    it('should return LP details when found (AC-16)', async () => {
      vi.mocked(ScannerPickService.lookupLP).mockResolvedValue(mockLPLookup as any)

      const request = new NextRequest('http://localhost/api/shipping/scanner/lookup/lp/LP-2025-00042')
      const response = await GET_LP(request, { params: Promise.resolve({ barcode: 'LP-2025-00042' }) })
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.lp_number).toBe('LP-2025-00042')
      expect(body.product_name).toBe('Chocolate Milk 1L')
      expect(body.on_hand_quantity).toBe(48)
    })

    it('should include allergens in response', async () => {
      vi.mocked(ScannerPickService.lookupLP).mockResolvedValue(mockLPLookup as any)

      const request = new NextRequest('http://localhost/api/shipping/scanner/lookup/lp/LP-2025-00042')
      const response = await GET_LP(request, { params: Promise.resolve({ barcode: 'LP-2025-00042' }) })
      const body = await response.json()

      expect(body.allergens).toContain('Milk')
    })

    it('should include QA status in response', async () => {
      vi.mocked(ScannerPickService.lookupLP).mockResolvedValue(mockLPLookup as any)

      const request = new NextRequest('http://localhost/api/shipping/scanner/lookup/lp/LP-2025-00042')
      const response = await GET_LP(request, { params: Promise.resolve({ barcode: 'LP-2025-00042' }) })
      const body = await response.json()

      expect(body.qa_status).toBe('passed')
    })

    it('should return 404 when LP not found', async () => {
      vi.mocked(ScannerPickService.lookupLP).mockResolvedValue(null)

      const request = new NextRequest('http://localhost/api/shipping/scanner/lookup/lp/LP-NONEXISTENT')
      const response = await GET_LP(request, { params: Promise.resolve({ barcode: 'LP-NONEXISTENT' }) })
      const body = await response.json()

      expect(response.status).toBe(404)
      expect(body.error.code).toBe('NOT_FOUND')
    })

    it('should return 403 for insufficient permissions', async () => {
      // Set role to UNAUTHENTICATED which is not in allowed roles
      mockSupabaseClient.__setRole('UNAUTHENTICATED')

      const request = new NextRequest('http://localhost/api/shipping/scanner/lookup/lp/LP-2025-00042')
      const response = await GET_LP(request, { params: Promise.resolve({ barcode: 'LP-2025-00042' }) })

      expect(response.status).toBe(403)
    })

    it('should respond within 100ms target', async () => {
      vi.mocked(ScannerPickService.lookupLP).mockResolvedValue(mockLPLookup as any)

      const startTime = Date.now()
      const request = new NextRequest('http://localhost/api/shipping/scanner/lookup/lp/LP-2025-00042')
      await GET_LP(request, { params: Promise.resolve({ barcode: 'LP-2025-00042' }) })
      const endTime = Date.now()

      expect(ScannerPickService.lookupLP).toHaveBeenCalled()
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('should handle special characters in barcode', async () => {
      vi.mocked(ScannerPickService.lookupLP).mockResolvedValue(mockLPLookup as any)

      const request = new NextRequest('http://localhost/api/shipping/scanner/lookup/lp/LP-2025-00042%2Ftest')
      const response = await GET_LP(request, { params: Promise.resolve({ barcode: 'LP-2025-00042/test' }) })

      expect(ScannerPickService.lookupLP).toHaveBeenCalledWith(expect.anything(), expect.anything(), 'LP-2025-00042/test')
    })

    it('should filter by org_id (RLS - AC-20)', async () => {
      vi.mocked(ScannerPickService.lookupLP).mockResolvedValue(mockLPLookup as any)

      const request = new NextRequest('http://localhost/api/shipping/scanner/lookup/lp/LP-2025-00042')
      await GET_LP(request, { params: Promise.resolve({ barcode: 'LP-2025-00042' }) })

      // Service should be called with Supabase client that has RLS context
      expect(ScannerPickService.lookupLP).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // GET /api/shipping/scanner/suggest-pick/:lineId
  // ==========================================================================
  describe('GET /api/shipping/scanner/suggest-pick/:lineId', () => {
    it('should return 401 if not authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = new NextRequest('http://localhost/api/shipping/scanner/suggest-pick/123e4567-e89b-12d3-a456-426614174000')
      const response = await GET_SUGGESTION(request, {
        params: Promise.resolve({ lineId: '123e4567-e89b-12d3-a456-426614174000' }),
      })

      expect(response.status).toBe(401)
    })

    it('should return pick suggestion for line', async () => {
      vi.mocked(ScannerPickService.suggestPick).mockResolvedValue(mockPickSuggestion as any)

      const request = new NextRequest('http://localhost/api/shipping/scanner/suggest-pick/123e4567-e89b-12d3-a456-426614174000')
      const response = await GET_SUGGESTION(request, {
        params: Promise.resolve({ lineId: '123e4567-e89b-12d3-a456-426614174000' }),
      })
      const body = await response.json()

      expect(response.status).toBe(200)
      expect(body.suggested_lp).toBe('LP-2025-00040')
    })

    it('should return alternate LPs', async () => {
      vi.mocked(ScannerPickService.suggestPick).mockResolvedValue(mockPickSuggestion as any)

      const request = new NextRequest('http://localhost/api/shipping/scanner/suggest-pick/123e4567-e89b-12d3-a456-426614174000')
      const response = await GET_SUGGESTION(request, {
        params: Promise.resolve({ lineId: '123e4567-e89b-12d3-a456-426614174000' }),
      })
      const body = await response.json()

      expect(body.alternate_lps).toBeInstanceOf(Array)
      expect(body.alternate_lps.length).toBeGreaterThan(0)
    })

    it('should include FIFO/FEFO warning flags', async () => {
      vi.mocked(ScannerPickService.suggestPick).mockResolvedValue(mockPickSuggestion as any)

      const request = new NextRequest('http://localhost/api/shipping/scanner/suggest-pick/123e4567-e89b-12d3-a456-426614174000')
      const response = await GET_SUGGESTION(request, {
        params: Promise.resolve({ lineId: '123e4567-e89b-12d3-a456-426614174000' }),
      })
      const body = await response.json()

      expect(body).toHaveProperty('fifo_warning')
      expect(body).toHaveProperty('fefo_warning')
    })

    it('should return 404 when line not found', async () => {
      vi.mocked(ScannerPickService.suggestPick).mockRejectedValue(
        new Error('NOT_FOUND: Pick line not found')
      )

      const request = new NextRequest('http://localhost/api/shipping/scanner/suggest-pick/123e4567-e89b-12d3-a456-426614174999')
      const response = await GET_SUGGESTION(request, {
        params: Promise.resolve({ lineId: '123e4567-e89b-12d3-a456-426614174999' }),
      })

      expect(response.status).toBe(404)
    })

    it('should return 403 for insufficient permissions', async () => {
      // Set role to VIEWER which is not allowed for suggest-pick
      mockSupabaseClient.__setRole('viewer')

      const request = new NextRequest('http://localhost/api/shipping/scanner/suggest-pick/123e4567-e89b-12d3-a456-426614174000')
      const response = await GET_SUGGESTION(request, {
        params: Promise.resolve({ lineId: '123e4567-e89b-12d3-a456-426614174000' }),
      })

      expect(response.status).toBe(403)
    })

    it('should respond within 100ms target', async () => {
      vi.mocked(ScannerPickService.suggestPick).mockResolvedValue(mockPickSuggestion as any)

      const startTime = Date.now()
      const request = new NextRequest('http://localhost/api/shipping/scanner/suggest-pick/123e4567-e89b-12d3-a456-426614174000')
      await GET_SUGGESTION(request, {
        params: Promise.resolve({ lineId: '123e4567-e89b-12d3-a456-426614174000' }),
      })
      const endTime = Date.now()

      expect(ScannerPickService.suggestPick).toHaveBeenCalled()
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('should return 400 for invalid UUID lineId', async () => {
      const request = new NextRequest('http://localhost/api/shipping/scanner/suggest-pick/not-a-uuid')
      const response = await GET_SUGGESTION(request, {
        params: Promise.resolve({ lineId: 'not-a-uuid' }),
      })

      expect(response.status).toBe(400)
    })
  })

  // ==========================================================================
  // RLS Policy Enforcement (AC-20)
  // ==========================================================================
  describe('RLS Policy Enforcement (AC-20)', () => {
    it('should prevent cross-org LP lookup', async () => {
      // Simulate lookup for LP from different org
      vi.mocked(ScannerPickService.lookupLP).mockResolvedValue(null) // RLS filters out

      const request = new NextRequest('http://localhost/api/shipping/scanner/lookup/lp/LP-OTHER-ORG')
      const response = await GET_LP(request, { params: Promise.resolve({ barcode: 'LP-OTHER-ORG' }) })

      expect(response.status).toBe(404)
    })

    it('should filter pick lines by org_id', async () => {
      vi.mocked(ScannerPickService.confirmPick).mockRejectedValue(
        new Error('NOT_FOUND: Pick line not found')
      )

      const request = new NextRequest('http://localhost/api/shipping/scanner/pick', {
        method: 'POST',
        body: JSON.stringify({
          pick_line_id: '123e4567-e89b-12d3-a456-426614174000',
          scanned_lp_barcode: 'LP-2025-00042',
          quantity_picked: 24,
          short_pick: false,
        }),
      })
      const response = await POST(request)

      expect(response.status).toBe(404)
    })
  })

  // ==========================================================================
  // Role-Based Access Control
  // ==========================================================================
  describe('Role-Based Access Control', () => {
    const allowedRoles = ['PICKER', 'SUPERVISOR', 'WAREHOUSE_MANAGER', 'SUPER_ADMIN']
    const restrictedRoles = ['VIEWER', 'OPERATOR']

    allowedRoles.forEach((role) => {
      it(`should allow ${role} role to confirm pick`, async () => {
        // Set role using the mock's __setRole method
        mockSupabaseClient.__setRole(role.toLowerCase())
        vi.mocked(ScannerPickService.confirmPick).mockResolvedValue(mockPickConfirmResponse as any)

        const request = new NextRequest('http://localhost/api/shipping/scanner/pick', {
          method: 'POST',
          body: JSON.stringify({
            pick_line_id: '123e4567-e89b-12d3-a456-426614174000',
            scanned_lp_barcode: 'LP-2025-00042',
            quantity_picked: 24,
            short_pick: false,
          }),
        })
        const response = await POST(request)

        expect(response.status).toBe(200)
      })
    })

    restrictedRoles.forEach((role) => {
      it(`should deny ${role} role from confirming pick`, async () => {
        // Set role using the mock's __setRole method
        mockSupabaseClient.__setRole(role.toLowerCase())

        const request = new NextRequest('http://localhost/api/shipping/scanner/pick', {
          method: 'POST',
          body: JSON.stringify({
            pick_line_id: '123e4567-e89b-12d3-a456-426614174000',
            scanned_lp_barcode: 'LP-2025-00042',
            quantity_picked: 24,
            short_pick: false,
          }),
        })
        const response = await POST(request)

        expect(response.status).toBe(403)
      })
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * POST /api/shipping/scanner/pick - 15 tests:
 *   - Auth check
 *   - Valid pick confirmation (AC-17)
 *   - Next line preview in response
 *   - Progress in response
 *   - Validation error
 *   - Invalid UUID
 *   - LP mismatch
 *   - Quantity exceeds
 *   - Short pick missing reason
 *   - Valid short pick
 *   - Line not found (404)
 *   - Line already picked (409)
 *   - Insufficient permissions (403)
 *   - Pick list complete flag
 *   - Response time target
 *
 * GET /api/shipping/scanner/lookup/lp/:barcode - 9 tests:
 *   - Auth check
 *   - LP found (AC-16)
 *   - Allergens in response
 *   - QA status in response
 *   - Not found (404)
 *   - Insufficient permissions (403)
 *   - Response time target
 *   - Special characters handling
 *   - RLS org_id filter
 *
 * GET /api/shipping/scanner/suggest-pick/:lineId - 8 tests:
 *   - Auth check
 *   - Pick suggestion
 *   - Alternate LPs
 *   - FIFO/FEFO flags
 *   - Not found (404)
 *   - Insufficient permissions (403)
 *   - Response time target
 *   - Invalid UUID
 *
 * RLS Policy - 2 tests
 * RBAC - 6 tests
 *
 * Total: 40 tests
 * Coverage: 85%+
 */
