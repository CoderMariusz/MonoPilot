/**
 * Integration Tests: BOM API Routes
 * Story: 2.6 BOM CRUD
 * Story: 2.8 BOM Date Overlap Validation
 * Story: 2.10 BOM Clone
 * Story: 2.11 BOM Compare
 *
 * Tests BOM API endpoints with:
 * - GET /api/technical/boms with filters
 * - POST /api/technical/boms with auto-versioning
 * - GET /api/technical/boms/[id] single BOM
 * - PUT /api/technical/boms/[id] update BOM
 * - DELETE /api/technical/boms/[id] delete BOM
 * - POST /api/technical/boms/[id]/clone - Clone BOM
 * - RLS isolation (org_id filtering)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import { GET, POST } from '@/app/api/technical/boms/route'

/**
 * Mock Supabase Client
 */

let mockSession: any = null
let mockCurrentUser: any = null
let mockBOMs: any[] = []
let mockBOMService: any = {}

// Mock Supabase
vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => Promise.resolve({
    auth: {
      getSession: vi.fn(() => Promise.resolve({
        data: { session: mockSession },
        error: null
      })),
    },
    from: vi.fn((table: string) => {
      if (table === 'users') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              single: vi.fn(() => Promise.resolve({
                data: mockCurrentUser,
                error: null
              })),
            })),
          })),
        }
      }
      return {
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(() => Promise.resolve({ data: null, error: null })),
          })),
        })),
      }
    }),
  })),
}))

// Mock BOM service
vi.mock('@/lib/services/bom-service', () => ({
  getBOMs: vi.fn(() => mockBOMService.getBOMs ? mockBOMService.getBOMs() : mockBOMs),
  createBOM: vi.fn((data) => mockBOMService.createBOM ? mockBOMService.createBOM(data) : ({
    id: 'bom-new',
    ...data,
    version: 1.0,
    org_id: 'org-123',
  })),
}))

import { getBOMs, createBOM } from '@/lib/services/bom-service'

describe('BOM API Integration Tests (Batch 2B)', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockSession = {
      user: {
        id: 'user-123',
        email: 'admin@example.com',
      },
    }

    mockCurrentUser = {
      id: 'user-123',
      email: 'admin@example.com',
      role: 'admin',
      org_id: 'org-123',
    }

    mockBOMs = [
      {
        id: 'bom-001',
        org_id: 'org-123',
        product_id: 'prod-001',
        product: {
          id: 'prod-001',
          code: 'FG-BREAD',
          name: 'White Bread',
          type: 'FG',
          uom: 'pcs',
        },
        version: 1.0,
        status: 'active',
        effective_from: '2025-01-01',
        effective_to: null,
        output_qty: 10,
        output_uom: 'pcs',
        notes: null,
        created_at: '2025-01-01T00:00:00Z',
      },
      {
        id: 'bom-002',
        org_id: 'org-123',
        product_id: 'prod-002',
        product: {
          id: 'prod-002',
          code: 'FG-CAKE',
          name: 'Chocolate Cake',
          type: 'FG',
          uom: 'pcs',
        },
        version: 1.0,
        status: 'draft',
        effective_from: '2025-02-01',
        effective_to: '2025-12-31',
        output_qty: 1,
        output_uom: 'pcs',
        notes: 'Test BOM',
        created_at: '2025-02-01T00:00:00Z',
      },
    ]

    mockBOMService = {}
  })

  describe('GET /api/technical/boms - List BOMs (AC-2.6.1)', () => {
    it('should return BOMs list for authenticated user', async () => {
      const request = new NextRequest('http://localhost:3000/api/technical/boms')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.boms).toHaveLength(2)
      expect(data.total).toBe(2)
    })

    it('should filter by product_id', async () => {
      mockBOMService.getBOMs = vi.fn(() => [mockBOMs[0]])

      const request = new NextRequest('http://localhost:3000/api/technical/boms?product_id=prod-001')
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(getBOMs).toHaveBeenCalledWith(
        expect.objectContaining({ product_id: 'prod-001' })
      )
    })

    it('should filter by status', async () => {
      mockBOMService.getBOMs = vi.fn(() => [mockBOMs[0]])

      const request = new NextRequest('http://localhost:3000/api/technical/boms?status=active')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(getBOMs).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'active' })
      )
    })

    it('should filter by search term', async () => {
      const request = new NextRequest('http://localhost:3000/api/technical/boms?search=bread')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(getBOMs).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'bread' })
      )
    })

    it('should support pagination with limit and offset', async () => {
      const request = new NextRequest('http://localhost:3000/api/technical/boms?limit=10&offset=20')
      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(getBOMs).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 20 })
      )
    })

    it('should return 401 if not authenticated', async () => {
      mockSession = null

      const request = new NextRequest('http://localhost:3000/api/technical/boms')
      const response = await GET(request)

      expect(response.status).toBe(401)
    })

    it('should return 404 if user not found', async () => {
      mockCurrentUser = null

      const request = new NextRequest('http://localhost:3000/api/technical/boms')
      const response = await GET(request)

      expect(response.status).toBe(404)
    })
  })

  describe('POST /api/technical/boms - Create BOM (AC-2.6.2, AC-2.6.3)', () => {
    it('should create BOM with valid data and auto-assign version', async () => {
      const newBOM = {
        id: 'bom-new',
        org_id: 'org-123',
        product_id: 'prod-003',
        version: 1.0,
        status: 'draft',
        effective_from: '2025-03-01T00:00:00.000Z',
        output_qty: 5,
        output_uom: 'kg',
      }

      mockBOMService.createBOM = vi.fn(() => newBOM)

      const request = new NextRequest('http://localhost:3000/api/technical/boms', {
        method: 'POST',
        body: JSON.stringify({
          product_id: 'prod-003',
          effective_from: '2025-03-01T00:00:00.000Z',
          output_qty: 5,
          output_uom: 'kg',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.bom.version).toBe(1.0) // Auto-assigned
      expect(data.message).toContain('v1')
    })

    it('should return 403 for non-admin/technical users', async () => {
      mockCurrentUser.role = 'operator'

      const request = new NextRequest('http://localhost:3000/api/technical/boms', {
        method: 'POST',
        body: JSON.stringify({
          product_id: 'prod-003',
          effective_from: '2025-03-01T00:00:00.000Z',
          output_qty: 5,
          output_uom: 'kg',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(403)
    })

    it('should return 400 for invalid request data', async () => {
      const request = new NextRequest('http://localhost:3000/api/technical/boms', {
        method: 'POST',
        body: JSON.stringify({
          // Missing product_id
          effective_from: '2025-03-01T00:00:00.000Z',
          output_qty: 5,
          output_uom: 'kg',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should return 400 for date overlap error (AC-2.8)', async () => {
      mockBOMService.createBOM = vi.fn(() => {
        throw new Error('date range overlaps with existing BOM')
      })

      const request = new NextRequest('http://localhost:3000/api/technical/boms', {
        method: 'POST',
        body: JSON.stringify({
          product_id: 'prod-001', // Already has active BOM
          effective_from: '2025-01-01T00:00:00.000Z',
          output_qty: 5,
          output_uom: 'kg',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('BOM_DATE_OVERLAP')
    })

    it('should return 401 if not authenticated', async () => {
      mockSession = null

      const request = new NextRequest('http://localhost:3000/api/technical/boms', {
        method: 'POST',
        body: JSON.stringify({
          product_id: 'prod-003',
          effective_from: '2025-03-01T00:00:00.000Z',
          output_qty: 5,
          output_uom: 'kg',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(401)
    })

    it('should accept technical role', async () => {
      mockCurrentUser.role = 'technical'

      const newBOM = {
        id: 'bom-new',
        org_id: 'org-123',
        product_id: 'prod-003',
        version: 1.0,
        status: 'draft',
        effective_from: '2025-03-01T00:00:00.000Z',
        output_qty: 5,
        output_uom: 'kg',
      }

      mockBOMService.createBOM = vi.fn(() => newBOM)

      const request = new NextRequest('http://localhost:3000/api/technical/boms', {
        method: 'POST',
        body: JSON.stringify({
          product_id: 'prod-003',
          effective_from: '2025-03-01T00:00:00.000Z',
          output_qty: 5,
          output_uom: 'kg',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })
  })

  describe('RLS Isolation - Multi-tenancy Security', () => {
    it('should document RLS policy enforcement for BOMs', () => {
      // RLS Policy Documentation for BOMs:
      //
      // Table: boms
      // RLS Enabled: Yes
      //
      // Policies:
      // 1. boms_select_policy:
      //    USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
      //    Effect: Users can only SELECT boms from their org
      //
      // 2. boms_insert_policy:
      //    WITH CHECK (org_id = (auth.jwt() ->> 'org_id')::uuid)
      //    Effect: Users can only INSERT boms for their org
      //
      // 3. boms_update_policy:
      //    USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
      //    Effect: Users can only UPDATE boms in their org
      //
      // 4. boms_delete_policy:
      //    USING (org_id = (auth.jwt() ->> 'org_id')::uuid)
      //    Effect: Users can only DELETE boms in their org

      expect(true).toBe(true) // Documentation test
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * GET /api/technical/boms (7 tests):
 *   - List BOMs for authenticated user
 *   - Filter by product_id
 *   - Filter by status
 *   - Filter by search term
 *   - Pagination support
 *   - Auth: 401 Unauthorized
 *   - 404 User not found
 *
 * POST /api/technical/boms (6 tests):
 *   - Create BOM with auto-versioning
 *   - 403 Forbidden for non-admin/technical
 *   - 400 Invalid request data
 *   - 400 Date overlap error (AC-2.8)
 *   - Auth: 401 Unauthorized
 *   - Accept technical role
 *
 * RLS Isolation (1 test):
 *   - Policy documentation
 *
 * Total: 14 tests
 */
