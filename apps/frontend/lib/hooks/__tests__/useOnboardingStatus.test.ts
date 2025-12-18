/**
 * Unit Tests: useOnboardingStatus Hook
 * Story: 01.3 - Onboarding Wizard Launcher
 * Phase: RED - All tests should FAIL (no implementation yet)
 *
 * Tests the onboarding status hook that manages wizard state:
 * - Returns step=0 for new org
 * - Returns step=N for org with progress
 * - Returns isComplete=true when completed_at set
 * - Returns isSkipped=true when onboarding_skipped=true
 * - Handles loading and error states
 *
 * Coverage Target: 80% (Standard)
 * Test Count: 5 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useOnboardingStatus } from '../useOnboardingStatus'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(),
  },
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabase,
}))

describe('useOnboardingStatus Hook - Story 01.3', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC-1: Wizard launches for new orgs (step=0)', () => {
    it('should return step=0 for new organization', async () => {
      // GIVEN new org with onboarding_step=0
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              onboarding_step: 0,
              onboarding_started_at: null,
              onboarding_completed_at: null,
              onboarding_skipped: false,
            },
            error: null,
          }),
        }),
      })

      // WHEN hook is called
      const { result } = renderHook(() => useOnboardingStatus())

      // THEN returns step=0 and isComplete=false
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current).toMatchObject({
        step: 0,
        isComplete: false,
        isSkipped: false,
        loading: false,
        error: null,
      })
    })
  })

  describe('AC-2: Wizard resumes at correct step', () => {
    it('should return step=3 for org with progress', async () => {
      // GIVEN org with onboarding_step=3
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              onboarding_step: 3,
              onboarding_started_at: '2025-12-15T10:00:00Z',
              onboarding_completed_at: null,
              onboarding_skipped: false,
            },
            error: null,
          }),
        }),
      })

      // WHEN hook is called
      const { result } = renderHook(() => useOnboardingStatus())

      // THEN returns step=3
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current).toMatchObject({
        step: 3,
        isComplete: false,
        isSkipped: false,
      })
    })
  })

  describe('AC-3: Completed orgs bypass wizard', () => {
    it('should return isComplete=true when completed_at is set', async () => {
      // GIVEN org with onboarding_completed_at set
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              onboarding_step: 6,
              onboarding_started_at: '2025-12-15T10:00:00Z',
              onboarding_completed_at: '2025-12-15T10:15:00Z',
              onboarding_skipped: false,
            },
            error: null,
          }),
        }),
      })

      // WHEN hook is called
      const { result } = renderHook(() => useOnboardingStatus())

      // THEN returns isComplete=true
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current).toMatchObject({
        step: 6,
        isComplete: true,
        isSkipped: false,
      })
    })
  })

  describe('AC-5: Skip wizard functionality', () => {
    it('should return isSkipped=true when onboarding_skipped=true', async () => {
      // GIVEN org with onboarding_skipped=true
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              onboarding_step: 0,
              onboarding_started_at: null,
              onboarding_completed_at: '2025-12-15T10:00:00Z',
              onboarding_skipped: true,
            },
            error: null,
          }),
        }),
      })

      // WHEN hook is called
      const { result } = renderHook(() => useOnboardingStatus())

      // THEN returns isSkipped=true
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current).toMatchObject({
        isSkipped: true,
        isComplete: true, // skipped = completed
      })
    })
  })

  describe('Error and Loading States', () => {
    it('should handle loading state correctly', async () => {
      // GIVEN initial loading state
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockImplementation(
            () =>
              new Promise((resolve) =>
                setTimeout(
                  () =>
                    resolve({
                      data: {
                        onboarding_step: 0,
                        onboarding_completed_at: null,
                      },
                      error: null,
                    }),
                  100
                )
              )
          ),
        }),
      })

      // WHEN hook is called
      const { result } = renderHook(() => useOnboardingStatus())

      // THEN initially shows loading=true
      expect(result.current.loading).toBe(true)
      expect(result.current.step).toBeNull()

      // THEN after data loads, loading=false
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.step).toBe(0)
    })

    it('should handle error state correctly', async () => {
      // GIVEN API error
      const errorMessage = 'Failed to fetch organization'
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: errorMessage },
          }),
        }),
      })

      // WHEN hook is called
      const { result } = renderHook(() => useOnboardingStatus())

      // THEN returns error
      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.error).toBeTruthy()
      expect(result.current.error?.message).toContain(errorMessage)
      expect(result.current.step).toBeNull()
    })

    it('should provide refresh function', async () => {
      // GIVEN successful data fetch
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              onboarding_step: 0,
              onboarding_completed_at: null,
              onboarding_skipped: false,
            },
            error: null,
          }),
        }),
      })

      // WHEN hook is called
      const { result } = renderHook(() => useOnboardingStatus())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // THEN refresh function is available
      expect(result.current.refresh).toBeDefined()
      expect(typeof result.current.refresh).toBe('function')
    })
  })

  describe('Edge Cases', () => {
    it('should handle null onboarding_step (default to 0)', async () => {
      // GIVEN org with null onboarding_step
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              onboarding_step: null,
              onboarding_completed_at: null,
              onboarding_skipped: false,
            },
            error: null,
          }),
        }),
      })

      // WHEN hook is called
      const { result } = renderHook(() => useOnboardingStatus())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // THEN defaults to step=0
      expect(result.current.step).toBe(0)
    })

    it('should handle missing organization data', async () => {
      // GIVEN no organization found
      mockSupabase.from.mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Organization not found', code: 'PGRST116' },
          }),
        }),
      })

      // WHEN hook is called
      const { result } = renderHook(() => useOnboardingStatus())

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      // THEN returns error
      expect(result.current.error).toBeTruthy()
      expect(result.current.step).toBeNull()
    })
  })
})

/**
 * Test Summary for useOnboardingStatus Hook
 * ==========================================
 *
 * Test Coverage:
 * - AC-1: Wizard launches for new orgs (step=0): 1 test
 * - AC-2: Wizard resumes at correct step: 1 test
 * - AC-3: Completed orgs bypass wizard: 1 test
 * - AC-5: Skip wizard functionality: 1 test
 * - Error and Loading States: 3 tests
 * - Edge Cases: 2 tests
 * - Total: 9 test cases
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * - useOnboardingStatus hook not implemented yet
 * - Hook should fetch org onboarding status from Supabase
 * - Returns { step, isComplete, isSkipped, loading, error, refresh }
 *
 * Next Steps for FRONTEND-DEV:
 * 1. Create lib/hooks/useOnboardingStatus.ts
 * 2. Use SWR or React Query for caching
 * 3. Fetch from organizations table via Supabase
 * 4. Return proper state object
 * 5. Handle all error cases
 * 6. Run tests - should transition from RED to GREEN
 *
 * Files to Create:
 * - apps/frontend/lib/hooks/useOnboardingStatus.ts
 *
 * Coverage Target: 80%
 */
