/**
 * ASN Receive API Route Integration Tests (Story 05.9)
 * Endpoints:
 * - GET /api/warehouse/asns/:id/receive (preview)
 * - POST /api/warehouse/asns/:id/receive (execute)
 *
 * Phase: RED - Tests will fail until implementation exists
 *
 * Coverage Target: 90%+
 * Test Count: 25+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-1: ASN Receive Preview
 * - AC-2: Initiate ASN Receive
 * - AC-3: Variance Calculation
 * - AC-4: Partial ASN Receipt
 * - AC-5: Full ASN Receipt
 * - AC-6: Variance Reason Tracking
 * - AC-11: Required Fields Enforcement
 * - Cross-tenant protection (RLS)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { GET, POST } from '../route'
import { NextRequest } from 'next/server'

// Mock Next.js cookies
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => ({
    getAll: vi.fn(() => []),
    set: vi.fn(),
  })),
}))

// Mock Supabase server client
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(),
}))

// Mock the service layer
vi.mock('@/lib/services/asn-receive-service', () => ({
  ASNReceiveService: {
    getASNReceivePreview: vi.fn(),
    receiveFromASN: vi.fn(),
  },
}))

// Import mocked functions
import { createServerSupabase } from '@/lib/supabase/server'
import { ASNReceiveService } from '@/lib/services/asn-receive-service'

describe('ASN Receive API Routes (Story 05.9)', () => {
  let mockSupabase: any
  let mockUser: any
  let mockContext: any

  beforeEach(() => {
    vi.clearAllMocks()

    mockUser = {
      id: 'user-001',
      app_metadata: { org_id: 'org-123' },
    }

    mockSupabase = {
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: mockUser },
          error: null,
        }),
      },
    }

    mockContext = {
      params: Promise.resolve({ id: 'asn-001' }),
    }

    ;(createServerSupabase as any).mockReturnValue(mockSupabase)
  })

  /**
   * AC-1: GET /api/warehouse/asns/:id/receive - Preview
   */
  describe('GET /api/warehouse/asns/:id/receive', () => {
    it('should return ASN receive preview for valid ASN', async () => {
      const mockPreview = {
        asn: {
          id: 'asn-001',
          asn_number: 'ASN-2025-00001',
          status: 'pending',
          expected_date: '2025-12-20',
          po_number: 'PO-2025-0001',
          supplier_name: 'Supplier A',
        },
        items: [
          {
            id: 'item-001',
            product_id: 'prod-001',
            product_name: 'Product A',
            product_sku: 'PROD-A',
            expected_qty: 100,
            received_qty: 0,
            remaining_qty: 100,
            uom: 'units',
            supplier_batch_number: 'SB-001',
            gtin: '01234567890128',
            expiry_date: '2026-12-31',
          },
          {
            id: 'item-002',
            product_name: 'Product B',
            expected_qty: 50,
            received_qty: 30,
            remaining_qty: 20,
            uom: 'units',
          },
        ],
      }

      ;(ASNReceiveService.getASNReceivePreview as any).mockResolvedValue(mockPreview)

      const request = new NextRequest('http://localhost/api/warehouse/asns/asn-001/receive')
      const response = await GET(request, mockContext)

      expect(response.status).toBe(200)

      const data = await response.json()
      expect(data.asn.asn_number).toBe('ASN-2025-00001')
      expect(data.items).toHaveLength(2)
      expect(data.items[0].remaining_qty).toBe(100)
      expect(data.items[1].remaining_qty).toBe(20)

      expect(ASNReceiveService.getASNReceivePreview).toHaveBeenCalledWith(
        'asn-001',
        'org-123',
        mockSupabase
      )
    })

    it('should return 404 for non-existent ASN', async () => {
      ;(ASNReceiveService.getASNReceivePreview as any).mockRejectedValue(
        new Error('ASN not found')
      )

      const request = new NextRequest('http://localhost/api/warehouse/asns/invalid-uuid/receive')
      const response = await GET(request, { params: Promise.resolve({ id: 'invalid-uuid' }) })

      expect(response.status).toBe(404)

      const data = await response.json()
      expect(data.error).toBe('ASN not found')
    })

    it('should return 400 for already received ASN', async () => {
      ;(ASNReceiveService.getASNReceivePreview as any).mockRejectedValue(
        new Error('ASN already completed or cancelled')
      )

      const request = new NextRequest('http://localhost/api/warehouse/asns/asn-001/receive')
      const response = await GET(request, mockContext)

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('ASN already completed or cancelled')
    })

    it('should return 401 for unauthenticated request', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const request = new NextRequest('http://localhost/api/warehouse/asns/asn-001/receive')
      const response = await GET(request, mockContext)

      expect(response.status).toBe(401)
    })

    it('should enforce RLS (cross-tenant access returns 404)', async () => {
      ;(ASNReceiveService.getASNReceivePreview as any).mockRejectedValue(
        new Error('ASN not found')
      )

      const request = new NextRequest('http://localhost/api/warehouse/asns/asn-from-org-B/receive')
      const response = await GET(request, { params: Promise.resolve({ id: 'asn-from-org-B' }) })

      expect(response.status).toBe(404)
    })

    it('should return preview in < 300ms', async () => {
      const mockPreview = {
        asn: { id: 'asn-001', asn_number: 'ASN-001' },
        items: Array.from({ length: 50 }, (_, i) => ({
          id: `item-${i}`,
          expected_qty: 100,
          received_qty: 0,
          remaining_qty: 100,
        })),
      }

      ;(ASNReceiveService.getASNReceivePreview as any).mockResolvedValue(mockPreview)

      const request = new NextRequest('http://localhost/api/warehouse/asns/asn-001/receive')

      const startTime = Date.now()
      const response = await GET(request, mockContext)
      const duration = Date.now() - startTime

      expect(response.status).toBe(200)
      expect(duration).toBeLessThan(300)
    })
  })

  /**
   * AC-2, AC-4, AC-5: POST /api/warehouse/asns/:id/receive - Execute
   */
  describe('POST /api/warehouse/asns/:id/receive', () => {
    it('should create GRN and LPs for full receive', async () => {
      const requestBody = {
        warehouse_id: 'wh-001',
        location_id: 'loc-001',
        items: [
          {
            asn_item_id: 'item-001',
            received_qty: 100,
            batch_number: 'BATCH-001',
            expiry_date: '2026-12-31',
          },
          {
            asn_item_id: 'item-002',
            received_qty: 50,
            batch_number: 'BATCH-002',
          },
        ],
      }

      const mockResult = {
        grn_id: 'grn-001',
        grn_number: 'GRN-2025-00001',
        status: 'completed',
        lps_created: 2,
        asn_status: 'received',
        variances: [
          {
            product_name: 'Product A',
            expected_qty: 100,
            received_qty: 100,
            variance: 0,
            variance_percent: 0,
            variance_indicator: 'exact',
          },
          {
            product_name: 'Product B',
            expected_qty: 50,
            received_qty: 50,
            variance: 0,
            variance_percent: 0,
            variance_indicator: 'exact',
          },
        ],
      }

      ;(ASNReceiveService.receiveFromASN as any).mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost/api/warehouse/asns/asn-001/receive', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request, mockContext)

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.grn_number).toBe('GRN-2025-00001')
      expect(data.lps_created).toBe(2)
      expect(data.asn_status).toBe('received')
      expect(data.variances).toHaveLength(2)

      expect(ASNReceiveService.receiveFromASN).toHaveBeenCalledWith(
        'asn-001',
        requestBody,
        'org-123',
        'user-001',
        mockSupabase
      )
    })

    it('should handle partial receive and set ASN status to partial', async () => {
      const requestBody = {
        warehouse_id: 'wh-001',
        location_id: 'loc-001',
        items: [
          {
            asn_item_id: 'item-001',
            received_qty: 100, // full
          },
          {
            asn_item_id: 'item-002',
            received_qty: 30, // partial (expected 50)
          },
          // item-003 not received
        ],
      }

      const mockResult = {
        grn_id: 'grn-002',
        grn_number: 'GRN-2025-00002',
        status: 'completed',
        lps_created: 2,
        asn_status: 'partial',
        variances: [],
      }

      ;(ASNReceiveService.receiveFromASN as any).mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost/api/warehouse/asns/asn-001/receive', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request, mockContext)

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.asn_status).toBe('partial')
    })

    it('should track variance with reason and notes', async () => {
      const requestBody = {
        warehouse_id: 'wh-001',
        location_id: 'loc-001',
        items: [
          {
            asn_item_id: 'item-001',
            received_qty: 95, // under-received
            batch_number: 'BATCH-001',
            variance_reason: 'damaged',
            variance_notes: '5 units damaged in transit',
          },
        ],
      }

      const mockResult = {
        grn_id: 'grn-003',
        grn_number: 'GRN-2025-00003',
        status: 'completed',
        lps_created: 1,
        asn_status: 'partial',
        variances: [
          {
            product_name: 'Product A',
            expected_qty: 100,
            received_qty: 95,
            variance: -5,
            variance_percent: -5.0,
            variance_indicator: 'under',
          },
        ],
      }

      ;(ASNReceiveService.receiveFromASN as any).mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost/api/warehouse/asns/asn-001/receive', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request, mockContext)

      expect(response.status).toBe(201)

      const data = await response.json()
      expect(data.variances[0].variance_indicator).toBe('under')
      expect(data.variances[0].variance).toBe(-5)
    })

    it('should return 400 for over-receipt exceeding tolerance', async () => {
      const requestBody = {
        warehouse_id: 'wh-001',
        location_id: 'loc-001',
        items: [
          {
            asn_item_id: 'item-001',
            received_qty: 120, // 20% over (tolerance = 10%)
          },
        ],
      }

      ;(ASNReceiveService.receiveFromASN as any).mockRejectedValue(
        new Error('Over-receipt exceeds tolerance (max: 110 units)')
      )

      const request = new NextRequest('http://localhost/api/warehouse/asns/asn-001/receive', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request, mockContext)

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('Over-receipt exceeds tolerance')
    })

    it('should return 400 if batch_number missing when required', async () => {
      const requestBody = {
        warehouse_id: 'wh-001',
        location_id: 'loc-001',
        items: [
          {
            asn_item_id: 'item-001',
            received_qty: 100,
            // batch_number missing
          },
        ],
      }

      ;(ASNReceiveService.receiveFromASN as any).mockRejectedValue(
        new Error('Batch number required')
      )

      const request = new NextRequest('http://localhost/api/warehouse/asns/asn-001/receive', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request, mockContext)

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Batch number required')
    })

    it('should return 400 if expiry_date missing when required', async () => {
      const requestBody = {
        warehouse_id: 'wh-001',
        location_id: 'loc-001',
        items: [
          {
            asn_item_id: 'item-001',
            received_qty: 100,
            batch_number: 'BATCH-001',
            // expiry_date missing
          },
        ],
      }

      ;(ASNReceiveService.receiveFromASN as any).mockRejectedValue(
        new Error('Expiry date required')
      )

      const request = new NextRequest('http://localhost/api/warehouse/asns/asn-001/receive', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request, mockContext)

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toBe('Expiry date required')
    })

    it('should validate request body with Zod schema', async () => {
      const invalidBody = {
        // Missing warehouse_id and location_id
        items: [
          {
            asn_item_id: 'item-001',
            received_qty: -5, // Invalid: negative
          },
        ],
      }

      const request = new NextRequest('http://localhost/api/warehouse/asns/asn-001/receive', {
        method: 'POST',
        body: JSON.stringify(invalidBody),
      })

      const response = await POST(request, mockContext)

      expect(response.status).toBe(400)

      const data = await response.json()
      expect(data.error).toContain('validation')
    })

    it('should return 401 for unauthenticated request', async () => {
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: new Error('Not authenticated'),
      })

      const request = new NextRequest('http://localhost/api/warehouse/asns/asn-001/receive', {
        method: 'POST',
        body: JSON.stringify({
          warehouse_id: 'wh-001',
          location_id: 'loc-001',
          items: [],
        }),
      })

      const response = await POST(request, mockContext)

      expect(response.status).toBe(401)
    })

    it('should enforce RLS (cross-tenant access blocked)', async () => {
      ;(ASNReceiveService.receiveFromASN as any).mockRejectedValue(
        new Error('ASN not found')
      )

      const requestBody = {
        warehouse_id: 'wh-001',
        location_id: 'loc-001',
        items: [{ asn_item_id: 'item-001', received_qty: 100 }],
      }

      const request = new NextRequest('http://localhost/api/warehouse/asns/asn-from-org-B/receive', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const response = await POST(request, { params: Promise.resolve({ id: 'asn-from-org-B' }) })

      expect(response.status).toBe(404)
    })

    it('should complete receive in < 500ms for small ASN', async () => {
      const requestBody = {
        warehouse_id: 'wh-001',
        location_id: 'loc-001',
        items: [
          { asn_item_id: 'item-001', received_qty: 100 },
          { asn_item_id: 'item-002', received_qty: 50 },
        ],
      }

      const mockResult = {
        grn_id: 'grn-001',
        grn_number: 'GRN-001',
        status: 'completed',
        lps_created: 2,
        asn_status: 'received',
        variances: [],
      }

      ;(ASNReceiveService.receiveFromASN as any).mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost/api/warehouse/asns/asn-001/receive', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const startTime = Date.now()
      const response = await POST(request, mockContext)
      const duration = Date.now() - startTime

      expect(response.status).toBe(201)
      expect(duration).toBeLessThan(500)
    })

    it('should handle large ASN (50 items) in < 2 seconds', async () => {
      const requestBody = {
        warehouse_id: 'wh-001',
        location_id: 'loc-001',
        items: Array.from({ length: 50 }, (_, i) => ({
          asn_item_id: `item-${i}`,
          received_qty: 100,
        })),
      }

      const mockResult = {
        grn_id: 'grn-001',
        grn_number: 'GRN-001',
        status: 'completed',
        lps_created: 50,
        asn_status: 'received',
        variances: [],
      }

      ;(ASNReceiveService.receiveFromASN as any).mockResolvedValue(mockResult)

      const request = new NextRequest('http://localhost/api/warehouse/asns/asn-001/receive', {
        method: 'POST',
        body: JSON.stringify(requestBody),
      })

      const startTime = Date.now()
      const response = await POST(request, mockContext)
      const duration = Date.now() - startTime

      expect(response.status).toBe(201)
      expect(duration).toBeLessThan(2000)
    })
  })
})
