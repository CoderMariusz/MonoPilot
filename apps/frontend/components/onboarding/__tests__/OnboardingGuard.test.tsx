/**
 * Unit Tests: OnboardingGuard Component
 * Story: 01.3 - Onboarding Wizard Launcher
 * Phase: RED - All tests should FAIL (no implementation yet)
 *
 * Tests the OnboardingGuard wrapper component:
 * - Shows wizard for admin when onboarding incomplete
 * - Shows "Setup in progress" for non-admin when incomplete
 * - Renders children when onboarding complete
 * - Handles loading state
 * - Handles error state
 *
 * Coverage Target: 80% (Standard)
 * Test Count: 5 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { OnboardingGuard } from '../OnboardingGuard'
import { useOnboardingStatus } from '@/lib/hooks/useOnboardingStatus'
import { useOrgContext } from '@/lib/hooks/useOrgContext'

// Mock hooks
vi.mock('@/lib/hooks/useOnboardingStatus')
vi.mock('@/lib/hooks/useOrgContext')

describe('OnboardingGuard Component - Story 01.3', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('AC-1: Wizard launches for admin when incomplete', () => {
    it('should show wizard modal for admin when step < 6', async () => {
      // GIVEN admin user with incomplete onboarding
      vi.mocked(useOrgContext).mockReturnValue({
        data: {
          org_id: 'org-123',
          user_id: 'user-123',
          role_code: 'admin',
          role_name: 'Administrator',
          permissions: { settings: 'CRUD' },
          organization: {
            id: 'org-123',
            name: 'Test Org',
            slug: 'test-org',
            timezone: 'UTC',
            locale: 'en',
            currency: 'PLN',
            onboarding_step: 2,
            onboarding_completed_at: undefined,
            onboarding_skipped: false,
            is_active: true,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      vi.mocked(useOnboardingStatus).mockReturnValue({
        step: 2,
        isComplete: false,
        isSkipped: false,
        loading: false,
        error: null,
        refresh: vi.fn(),
      })

      // WHEN component renders
      render(
        <OnboardingGuard>
          <div>Protected Content</div>
        </OnboardingGuard>
      )

      // THEN wizard modal is shown
      await waitFor(() => {
        expect(screen.getByText(/onboarding wizard/i)).toBeInTheDocument()
        expect(screen.getByText(/step 2/i)).toBeInTheDocument()
      })

      // AND children are not rendered
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  describe('AC-4: Non-admin sees setup message', () => {
    it('should show "Setup in progress" message for non-admin when incomplete', async () => {
      // GIVEN viewer user with incomplete onboarding
      vi.mocked(useOrgContext).mockReturnValue({
        data: {
          org_id: 'org-123',
          user_id: 'user-123',
          role_code: 'viewer',
          role_name: 'Viewer',
          permissions: { settings: 'R' },
          organization: {
            id: 'org-123',
            name: 'Test Org',
            slug: 'test-org',
            timezone: 'UTC',
            locale: 'en',
            currency: 'PLN',
            onboarding_step: 2,
            onboarding_completed_at: undefined,
            onboarding_skipped: false,
            is_active: true,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      vi.mocked(useOnboardingStatus).mockReturnValue({
        step: 2,
        isComplete: false,
        isSkipped: false,
        loading: false,
        error: null,
        refresh: vi.fn(),
      })

      // WHEN component renders
      render(
        <OnboardingGuard>
          <div>Protected Content</div>
        </OnboardingGuard>
      )

      // THEN setup in progress message is shown
      await waitFor(() => {
        expect(
          screen.getByText(/organization setup in progress/i)
        ).toBeInTheDocument()
        expect(
          screen.getByText(/contact your administrator/i)
        ).toBeInTheDocument()
      })

      // AND children are not rendered
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  describe('AC-3: Completed orgs bypass wizard', () => {
    it('should render children when onboarding complete', async () => {
      // GIVEN user in org with completed onboarding
      vi.mocked(useOrgContext).mockReturnValue({
        data: {
          org_id: 'org-123',
          user_id: 'user-123',
          role_code: 'admin',
          role_name: 'Administrator',
          permissions: { settings: 'CRUD' },
          organization: {
            id: 'org-123',
            name: 'Test Org',
            slug: 'test-org',
            timezone: 'UTC',
            locale: 'en',
            currency: 'PLN',
            onboarding_step: 6,
            onboarding_completed_at: '2025-12-15T10:15:00Z',
            onboarding_skipped: false,
            is_active: true,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      vi.mocked(useOnboardingStatus).mockReturnValue({
        step: 6,
        isComplete: true,
        isSkipped: false,
        loading: false,
        error: null,
        refresh: vi.fn(),
      })

      // WHEN component renders
      render(
        <OnboardingGuard>
          <div>Protected Content</div>
        </OnboardingGuard>
      )

      // THEN children are rendered
      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
      })

      // AND wizard is not shown
      expect(screen.queryByText(/onboarding wizard/i)).not.toBeInTheDocument()
    })

    it('should render children when onboarding skipped', async () => {
      // GIVEN user in org with skipped onboarding
      vi.mocked(useOrgContext).mockReturnValue({
        data: {
          org_id: 'org-123',
          user_id: 'user-123',
          role_code: 'admin',
          role_name: 'Administrator',
          permissions: { settings: 'CRUD' },
          organization: {
            id: 'org-123',
            name: 'Test Org',
            slug: 'test-org',
            timezone: 'UTC',
            locale: 'en',
            currency: 'PLN',
            onboarding_step: 0,
            onboarding_completed_at: '2025-12-15T10:00:00Z',
            onboarding_skipped: true,
            is_active: true,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      vi.mocked(useOnboardingStatus).mockReturnValue({
        step: 0,
        isComplete: true,
        isSkipped: true,
        loading: false,
        error: null,
        refresh: vi.fn(),
      })

      // WHEN component renders
      render(
        <OnboardingGuard>
          <div>Protected Content</div>
        </OnboardingGuard>
      )

      // THEN children are rendered
      await waitFor(() => {
        expect(screen.getByText('Protected Content')).toBeInTheDocument()
      })
    })
  })

  describe('Loading and Error States', () => {
    it('should handle loading state correctly', async () => {
      // GIVEN loading state
      vi.mocked(useOrgContext).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      })

      vi.mocked(useOnboardingStatus).mockReturnValue({
        step: null,
        isComplete: false,
        isSkipped: false,
        loading: true,
        error: null,
        refresh: vi.fn(),
      })

      // WHEN component renders
      render(
        <OnboardingGuard>
          <div>Protected Content</div>
        </OnboardingGuard>
      )

      // THEN loading indicator is shown
      expect(
        screen.getByText(/loading your organization/i)
      ).toBeInTheDocument()

      // AND children are not rendered
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })

    it('should handle error state correctly', async () => {
      // GIVEN error state
      vi.mocked(useOrgContext).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Failed to load organization'),
        refetch: vi.fn(),
      })

      vi.mocked(useOnboardingStatus).mockReturnValue({
        step: null,
        isComplete: false,
        isSkipped: false,
        loading: false,
        error: new Error('Failed to load onboarding status'),
        refresh: vi.fn(),
      })

      // WHEN component renders
      render(
        <OnboardingGuard>
          <div>Protected Content</div>
        </OnboardingGuard>
      )

      // THEN error message is shown
      expect(
        screen.getByText(/failed to load organization/i)
      ).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()

      // AND children are not rendered
      expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
    })
  })

  describe('Role-based Access', () => {
    it('should allow owner role to see wizard', async () => {
      // GIVEN owner user with incomplete onboarding
      vi.mocked(useOrgContext).mockReturnValue({
        data: {
          org_id: 'org-123',
          user_id: 'user-123',
          role_code: 'owner',
          role_name: 'Owner',
          permissions: { settings: 'CRUD' },
          organization: {
            id: 'org-123',
            name: 'Test Org',
            slug: 'test-org',
            timezone: 'UTC',
            locale: 'en',
            currency: 'PLN',
            onboarding_step: 0,
            onboarding_completed_at: undefined,
            onboarding_skipped: false,
            is_active: true,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      vi.mocked(useOnboardingStatus).mockReturnValue({
        step: 0,
        isComplete: false,
        isSkipped: false,
        loading: false,
        error: null,
        refresh: vi.fn(),
      })

      // WHEN component renders
      render(
        <OnboardingGuard>
          <div>Protected Content</div>
        </OnboardingGuard>
      )

      // THEN wizard is shown (owner can access)
      await waitFor(() => {
        expect(screen.getByText(/onboarding wizard/i)).toBeInTheDocument()
      })
    })

    it('should show setup message for production_manager role', async () => {
      // GIVEN production_manager user with incomplete onboarding
      vi.mocked(useOrgContext).mockReturnValue({
        data: {
          org_id: 'org-123',
          user_id: 'user-123',
          role_code: 'production_manager',
          role_name: 'Production Manager',
          permissions: { production: 'CRUD', settings: 'R' },
          organization: {
            id: 'org-123',
            name: 'Test Org',
            slug: 'test-org',
            timezone: 'UTC',
            locale: 'en',
            currency: 'PLN',
            onboarding_step: 1,
            onboarding_completed_at: undefined,
            onboarding_skipped: false,
            is_active: true,
          },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      vi.mocked(useOnboardingStatus).mockReturnValue({
        step: 1,
        isComplete: false,
        isSkipped: false,
        loading: false,
        error: null,
        refresh: vi.fn(),
      })

      // WHEN component renders
      render(
        <OnboardingGuard>
          <div>Protected Content</div>
        </OnboardingGuard>
      )

      // THEN setup message is shown (not admin/owner)
      await waitFor(() => {
        expect(
          screen.getByText(/organization setup in progress/i)
        ).toBeInTheDocument()
      })
    })
  })
})

/**
 * Test Summary for OnboardingGuard Component
 * ===========================================
 *
 * Test Coverage:
 * - AC-1: Wizard launches for admin when incomplete: 1 test
 * - AC-4: Non-admin sees setup message: 1 test
 * - AC-3: Completed orgs bypass wizard: 2 tests
 * - Loading and Error States: 2 tests
 * - Role-based Access: 2 tests
 * - Total: 8 test cases
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * - OnboardingGuard component not implemented yet
 * - Component should wrap authenticated routes
 * - Shows wizard for admin/owner, setup message for others
 * - Renders children only when onboarding complete
 *
 * Next Steps for FRONTEND-DEV:
 * 1. Create components/onboarding/OnboardingGuard.tsx
 * 2. Use useOnboardingStatus and useOrgContext hooks
 * 3. Implement role-based logic (admin/owner vs others)
 * 4. Show OnboardingWizardModal for admin when incomplete
 * 5. Show SetupInProgressMessage for non-admin
 * 6. Render children when onboarding complete
 * 7. Run tests - should transition from RED to GREEN
 *
 * Files to Create:
 * - apps/frontend/components/onboarding/OnboardingGuard.tsx
 * - apps/frontend/components/onboarding/SetupInProgressMessage.tsx
 *
 * Coverage Target: 80%
 */
