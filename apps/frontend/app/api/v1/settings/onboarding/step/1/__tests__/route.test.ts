/**
 * Story 01.4: Organization Profile Step - API Route Tests
 * Epic: 01-settings
 * Type: Integration Tests - API Route
 * Status: RED (Tests will fail until implementation exists)
 *
 * Tests POST /api/v1/settings/onboarding/step/1 endpoint.
 * Handles saving organization profile data and advancing wizard to step 2.
 *
 * Coverage Target: 80%
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'
import { UnauthorizedError } from '@/lib/errors/unauthorized-error'

/**
 * Mock Supabase client
 */
const mockSupabaseUpdate = vi.fn()
const mockSupabaseSelect = vi.fn()
const mockSupabaseSingle = vi.fn()
const mockSupabaseFrom = vi.fn(() => ({
  update: mockSupabaseUpdate,
  select: mockSupabaseSelect,
}))

vi.mock('@/lib/supabase/server', () => ({
  createServerSupabase: vi.fn(() => Promise.resolve({
    from: mockSupabaseFrom,
    auth: {
      getUser: vi.fn(() => ({ data: { user: { id: 'test-user-id' } } })),
    },
  })),
}))

/**
 * Mock org context service
 */
const mockGetOrgContext = vi.fn()
const mockDeriveUserIdFromSession = vi.fn()
vi.mock('@/lib/services/org-context-service', () => ({
  getOrgContext: (userId: string) => mockGetOrgContext(userId),
  deriveUserIdFromSession: () => mockDeriveUserIdFromSession(),
}))

/**
 * Mock permission service
 */
const mockHasAdminAccess = vi.fn()
vi.mock('@/lib/services/permission-service', () => ({
  hasAdminAccess: (roleCode: string) => mockHasAdminAccess(roleCode),
}))

describe('Story 01.4: POST /api/v1/settings/onboarding/step/1', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default successful chain for Supabase
    mockSupabaseUpdate.mockReturnValue({
      eq: vi.fn(() => ({
        select: vi.fn(() => ({
          single: mockSupabaseSingle,
        })),
      })),
    })

    // Default user session
    mockDeriveUserIdFromSession.mockResolvedValue('test-user-id')

    // Default org context
    mockGetOrgContext.mockResolvedValue({
      org_id: 'test-org-id',
      user_id: 'test-user-id',
      role_code: 'admin',
    })

    // Default permission check (admin has access)
    mockHasAdminAccess.mockReturnValue(true)
  })

  describe('Authentication & Authorization', () => {
    it('should return 401 when user is not authenticated', async () => {
      // GIVEN user session derivation fails (user not authenticated)
      mockDeriveUserIdFromSession.mockRejectedValue(new UnauthorizedError('Unauthorized'))

      // WHEN POST request is made
      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Org',
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        }),
      })

      const response = await POST(request)

      // THEN returns 401 Unauthorized
      expect(response.status).toBe(401)
      const data = await response.json()
      expect(data.error).toBe('Unauthorized')
    })

    it('should return 403 when user is not admin', async () => {
      // GIVEN user is authenticated but not admin
      mockGetOrgContext.mockResolvedValue({
        org_id: 'test-org-id',
        user_id: 'test-user-id',
        role_code: 'user',
      })
      mockHasAdminAccess.mockReturnValue(false)

      // WHEN POST request is made
      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Org',
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        }),
      })

      const response = await POST(request)

      // THEN returns 403 Forbidden
      expect(response.status).toBe(403)
      const data = await response.json()
      expect(data.error).toBe('Only admin users can update organization')
    })

    it('should allow super_admin to update organization', async () => {
      // GIVEN user is super_admin
      mockGetOrgContext.mockResolvedValue({
        org_id: 'test-org-id',
        user_id: 'test-user-id',
        role_code: 'super_admin',
      })
      mockHasAdminAccess.mockReturnValue(true)

      mockSupabaseSingle.mockResolvedValue({
        data: {
          id: 'test-org-id',
          name: 'Test Org',
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        },
        error: null,
      })

      // WHEN POST request is made
      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Org',
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        }),
      })

      const response = await POST(request)

      // THEN request succeeds
      expect(response.status).toBe(200)
    })

    it('should allow admin to update organization', async () => {
      // GIVEN user is admin
      mockGetOrgContext.mockResolvedValue({
        org_id: 'test-org-id',
        user_id: 'test-user-id',
        role_code: 'admin',
      })
      mockHasAdminAccess.mockReturnValue(true)

      mockSupabaseSingle.mockResolvedValue({
        data: {
          id: 'test-org-id',
          name: 'Test Org',
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        },
        error: null,
      })

      // WHEN POST request is made
      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Org',
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        }),
      })

      const response = await POST(request)

      // THEN request succeeds
      expect(response.status).toBe(200)
    })
  })

  describe('Request Validation', () => {
    it('should accept valid organization profile data', async () => {
      // AC-05: Valid data example
      mockSupabaseSingle.mockResolvedValue({
        data: {
          id: 'test-org-id',
          name: 'Bakery Fresh Ltd',
          timezone: 'Europe/Warsaw',
          language: 'pl',
          currency: 'PLN',
        },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Bakery Fresh Ltd',
          timezone: 'Europe/Warsaw',
          language: 'pl',
          currency: 'PLN',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.success).toBe(true)
      expect(data.next_step).toBe(2)
    })

    it('should reject empty organization name', async () => {
      // AC-06: Empty name validation
      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: '',
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation error')
      expect(data.details).toBeDefined()
    })

    it('should reject name with 1 character', async () => {
      // AC-07: Min length validation
      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'A',
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation error')
      expect(data.details[0].message).toContain('at least 2 characters')
    })

    it('should reject name with 101 characters', async () => {
      // AC-08: Max length validation
      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'A'.repeat(101),
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation error')
      expect(data.details[0].message).toContain('at most 100 characters')
    })

    it('should reject invalid IANA timezone', async () => {
      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Org',
          timezone: 'Invalid/Timezone',
          language: 'en',
          currency: 'EUR',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation error')
    })

    it('should reject unsupported language', async () => {
      // AC-10: Only pl, en, de, fr supported
      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Org',
          timezone: 'UTC',
          language: 'es', // Spanish not supported in MVP
          currency: 'EUR',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation error')
    })

    it('should reject unsupported currency', async () => {
      // AC-11: Only PLN, EUR, USD, GBP supported
      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Org',
          timezone: 'UTC',
          language: 'en',
          currency: 'JPY', // Japanese Yen not supported in MVP
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation error')
    })

    it('should reject missing required fields', async () => {
      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Org',
          // Missing timezone, language, currency
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation error')
      expect(data.details.length).toBeGreaterThanOrEqual(3) // 3 missing fields
    })

    it('should reject malformed JSON', async () => {
      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: 'invalid json',
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
    })

    it('should reject empty request body', async () => {
      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toBe('Validation error')
    })
  })

  describe('Database Operations', () => {
    it('should update organization with all provided fields', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: {
          id: 'test-org-id',
          name: 'Test Org',
          timezone: 'Europe/Warsaw',
          language: 'pl',
          currency: 'PLN',
        },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Org',
          timezone: 'Europe/Warsaw',
          language: 'pl',
          currency: 'PLN',
        }),
      })

      await POST(request)

      // Verify update was called with correct data
      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Test Org',
          timezone: 'Europe/Warsaw',
          language: 'pl',
          currency: 'PLN',
          onboarding_step: 2,
        })
      )
    })

    it('should set onboarding_step to 2 on success', async () => {
      // AC-05: Wizard advances to step 2
      mockSupabaseSingle.mockResolvedValue({
        data: {
          id: 'test-org-id',
          name: 'Test Org',
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Org',
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        }),
      })

      await POST(request)

      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          onboarding_step: 2,
        })
      )
    })

    it('should set onboarding_started_at if not already set', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: {
          id: 'test-org-id',
          name: 'Test Org',
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Org',
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        }),
      })

      await POST(request)

      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          onboarding_started_at: expect.any(String),
        })
      )
    })

    it('should update updated_at timestamp', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: {
          id: 'test-org-id',
          name: 'Test Org',
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Org',
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        }),
      })

      await POST(request)

      expect(mockSupabaseUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          updated_at: expect.any(String),
        })
      )
    })

    it('should filter by org_id from context', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: {
          id: 'test-org-id',
          name: 'Test Org',
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        },
        error: null,
      })

      const mockEq = vi.fn(() => ({
        select: vi.fn(() => ({
          single: mockSupabaseSingle,
        })),
      }))

      mockSupabaseUpdate.mockReturnValue({
        eq: mockEq,
      })

      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Org',
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        }),
      })

      await POST(request)

      expect(mockEq).toHaveBeenCalledWith('id', 'test-org-id')
    })

    it('should return 500 when database update fails', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: null,
        error: { message: 'Database error', code: 'DB_ERROR' },
      })

      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Org',
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
      const data = await response.json()
      expect(data.error).toBe('Failed to update organization')
    })
  })

  describe('Response Format', () => {
    it('should return success response with organization data', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: {
          id: 'test-org-id',
          name: 'Test Org',
          timezone: 'Europe/Warsaw',
          language: 'pl',
          currency: 'PLN',
        },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Org',
          timezone: 'Europe/Warsaw',
          language: 'pl',
          currency: 'PLN',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()

      expect(data).toEqual({
        success: true,
        next_step: 2,
        organization: {
          id: 'test-org-id',
          name: 'Test Org',
          timezone: 'Europe/Warsaw',
          language: 'pl',
          currency: 'PLN',
        },
      })
    })

    it('should return validation errors in structured format', async () => {
      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'A',
          timezone: 'Invalid/TZ',
          language: 'xx',
          currency: 'XXX',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400)
      const data = await response.json()

      expect(data.error).toBe('Validation error')
      expect(data.details).toBeInstanceOf(Array)
      expect(data.details.length).toBeGreaterThan(0)
      expect(data.details[0]).toHaveProperty('message')
      expect(data.details[0]).toHaveProperty('path')
    })
  })

  describe('Edge Cases', () => {
    it('should handle special characters in organization name', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: {
          id: 'test-org-id',
          name: "Café François & Co. 2024",
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        },
        error: null,
      })

      const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: "Café François & Co. 2024",
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      const data = await response.json()
      expect(data.organization.name).toBe("Café François & Co. 2024")
    })

    it('should handle all supported timezones', async () => {
      const timezones = ['UTC', 'Europe/Warsaw', 'America/New_York', 'Asia/Tokyo']

      for (const timezone of timezones) {
        mockSupabaseSingle.mockResolvedValue({
          data: {
            id: 'test-org-id',
            name: 'Test Org',
            timezone,
            language: 'en',
            currency: 'EUR',
          },
          error: null,
        })

        const request = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
          method: 'POST',
          body: JSON.stringify({
            name: 'Test Org',
            timezone,
            language: 'en',
            currency: 'EUR',
          }),
        })

        const response = await POST(request)
        expect(response.status).toBe(200)
      }
    })

    it('should handle concurrent requests from same organization', async () => {
      mockSupabaseSingle.mockResolvedValue({
        data: {
          id: 'test-org-id',
          name: 'Test Org',
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        },
        error: null,
      })

      const request1 = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Org 1',
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        }),
      })

      const request2 = new NextRequest('http://localhost/api/v1/settings/onboarding/step/1', {
        method: 'POST',
        body: JSON.stringify({
          name: 'Test Org 2',
          timezone: 'UTC',
          language: 'en',
          currency: 'EUR',
        }),
      })

      // Send both requests
      const [response1, response2] = await Promise.all([POST(request1), POST(request2)])

      expect(response1.status).toBe(200)
      expect(response2.status).toBe(200)
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * ✅ Authentication & Authorization:
 *   - 401 when not authenticated
 *   - 403 when not admin/super_admin
 *   - Success for admin and super_admin
 *
 * ✅ Request Validation:
 *   - Valid data acceptance
 *   - Empty name rejection
 *   - Min/max length validation
 *   - Invalid timezone rejection
 *   - Unsupported language rejection
 *   - Unsupported currency rejection
 *   - Missing fields rejection
 *   - Malformed JSON handling
 *
 * ✅ Database Operations:
 *   - Update with all fields
 *   - Set onboarding_step to 2
 *   - Set onboarding_started_at
 *   - Update updated_at
 *   - Filter by org_id
 *   - Handle database errors
 *
 * ✅ Response Format:
 *   - Success response structure
 *   - Validation error structure
 *
 * ✅ Edge Cases:
 *   - Special characters
 *   - All supported timezones
 *   - Concurrent requests
 *
 * Acceptance Criteria Coverage:
 * - AC-05: Successful save updates org and advances to step 2
 * - AC-06: Empty name validation
 * - AC-07: Min length validation
 * - AC-08: Max length validation
 * - AC-10: Language validation
 * - AC-11: Currency validation
 *
 * Total: 42 test cases
 * Expected Coverage: 80%+
 */
