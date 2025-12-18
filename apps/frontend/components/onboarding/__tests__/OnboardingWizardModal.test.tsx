/**
 * Unit Tests: OnboardingWizardModal Component
 * Story: 01.3 - Onboarding Wizard Launcher
 * Phase: RED - All tests should FAIL (no implementation yet)
 *
 * Tests the main wizard modal component:
 * - Displays launcher view for step 0
 * - Shows skip button on all steps
 * - Opens confirmation dialog on skip click
 * - Resumes at correct step
 * - Shows progress indicator (Step X of 6)
 *
 * Coverage Target: 80% (Standard)
 * Test Count: 5 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingWizardModal } from '../OnboardingWizardModal'
import { useOnboardingStatus } from '@/lib/hooks/useOnboardingStatus'
import { useRouter } from 'next/navigation'

// Mock hooks
vi.mock('@/lib/hooks/useOnboardingStatus')
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

// Mock fetch for API calls
global.fetch = vi.fn()

describe('OnboardingWizardModal Component - Story 01.3', () => {
  const mockRouter = {
    push: vi.fn(),
    refresh: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useRouter).mockReturnValue(mockRouter as any)
    vi.mocked(global.fetch).mockResolvedValue({
      ok: true,
      json: async () => ({ success: true }),
    } as Response)
  })

  describe('AC-1: Launcher view for step 0', () => {
    it('should display launcher view when step=0', async () => {
      // GIVEN step 0 (not started)
      vi.mocked(useOnboardingStatus).mockReturnValue({
        step: 0,
        isComplete: false,
        isSkipped: false,
        loading: false,
        error: null,
        refresh: vi.fn(),
      })

      // WHEN modal renders
      render(<OnboardingWizardModal open={true} />)

      // THEN shows launcher with welcome message
      await waitFor(() => {
        expect(
          screen.getByText(/welcome to monopilot/i)
        ).toBeInTheDocument()
        expect(
          screen.getByText(/quick onboarding wizard/i)
        ).toBeInTheDocument()
        expect(
          screen.getByRole('button', { name: /start onboarding wizard/i })
        ).toBeInTheDocument()
      })

      // AND shows all 6 steps with estimates
      expect(screen.getByText(/step 1: organization profile.*2 min/i)).toBeInTheDocument()
      expect(screen.getByText(/step 2: first warehouse.*3 min/i)).toBeInTheDocument()
      expect(screen.getByText(/step 3: storage locations.*4 min/i)).toBeInTheDocument()
      expect(screen.getByText(/step 4: first product.*3 min/i)).toBeInTheDocument()
      expect(screen.getByText(/step 5: demo work order.*2 min/i)).toBeInTheDocument()
      expect(screen.getByText(/step 6: review & complete.*1 min/i)).toBeInTheDocument()
    })
  })

  describe('AC-7: Skip button visible on all steps', () => {
    it('should show skip button on step 0 (launcher)', async () => {
      // GIVEN step 0
      vi.mocked(useOnboardingStatus).mockReturnValue({
        step: 0,
        isComplete: false,
        isSkipped: false,
        loading: false,
        error: null,
        refresh: vi.fn(),
      })

      // WHEN modal renders
      render(<OnboardingWizardModal open={true} />)

      // THEN skip button is visible
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /skip onboarding/i })
        ).toBeInTheDocument()
      })
    })

    it('should show skip button on step 3 (mid-wizard)', async () => {
      // GIVEN step 3
      vi.mocked(useOnboardingStatus).mockReturnValue({
        step: 3,
        isComplete: false,
        isSkipped: false,
        loading: false,
        error: null,
        refresh: vi.fn(),
      })

      // WHEN modal renders
      render(<OnboardingWizardModal open={true} />)

      // THEN skip button is visible
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /skip.*wizard/i })
        ).toBeInTheDocument()
      })
    })

    it('should show skip button on step 5 (near end)', async () => {
      // GIVEN step 5
      vi.mocked(useOnboardingStatus).mockReturnValue({
        step: 5,
        isComplete: false,
        isSkipped: false,
        loading: false,
        error: null,
        refresh: vi.fn(),
      })

      // WHEN modal renders
      render(<OnboardingWizardModal open={true} />)

      // THEN skip button is visible
      await waitFor(() => {
        expect(
          screen.getByRole('button', { name: /skip.*wizard/i })
        ).toBeInTheDocument()
      })
    })
  })

  describe('AC-6: Skip confirmation dialog', () => {
    it('should open confirmation dialog when skip clicked', async () => {
      // GIVEN step 0 with skip button
      vi.mocked(useOnboardingStatus).mockReturnValue({
        step: 0,
        isComplete: false,
        isSkipped: false,
        loading: false,
        error: null,
        refresh: vi.fn(),
      })

      const user = userEvent.setup()
      render(<OnboardingWizardModal open={true} />)

      // WHEN skip button clicked
      const skipButton = await screen.findByRole('button', {
        name: /skip onboarding/i,
      })
      await user.click(skipButton)

      // THEN confirmation dialog appears
      await waitFor(() => {
        expect(
          screen.getByText(/skip onboarding wizard\?/i)
        ).toBeInTheDocument()
        expect(
          screen.getByText(/we'll create a demo warehouse/i)
        ).toBeInTheDocument()
        expect(
          screen.getByRole('button', { name: /skip wizard/i })
        ).toBeInTheDocument()
        expect(
          screen.getByRole('button', { name: /continue setup/i })
        ).toBeInTheDocument()
      })
    })

    it('should cancel skip and return to wizard when "Continue Setup" clicked', async () => {
      // GIVEN skip confirmation dialog open
      vi.mocked(useOnboardingStatus).mockReturnValue({
        step: 0,
        isComplete: false,
        isSkipped: false,
        loading: false,
        error: null,
        refresh: vi.fn(),
      })

      const user = userEvent.setup()
      render(<OnboardingWizardModal open={true} />)

      // Open dialog
      const skipButton = await screen.findByRole('button', {
        name: /skip onboarding/i,
      })
      await user.click(skipButton)

      // WHEN "Continue Setup" clicked
      const continueButton = await screen.findByRole('button', {
        name: /continue setup/i,
      })
      await user.click(continueButton)

      // THEN dialog closes, wizard remains open
      await waitFor(() => {
        expect(
          screen.queryByText(/skip onboarding wizard\?/i)
        ).not.toBeInTheDocument()
        expect(
          screen.getByText(/quick onboarding wizard/i)
        ).toBeInTheDocument()
      })
    })
  })

  describe('AC-5: Skip creates demo data', () => {
    it('should call skip API and redirect to dashboard when confirmed', async () => {
      // GIVEN skip confirmation dialog open
      const mockRefresh = vi.fn()
      vi.mocked(useOnboardingStatus).mockReturnValue({
        step: 0,
        isComplete: false,
        isSkipped: false,
        loading: false,
        error: null,
        refresh: mockRefresh,
      })

      vi.mocked(global.fetch).mockResolvedValue({
        ok: true,
        json: async () => ({
          success: true,
          demo_data: {
            warehouse_id: 'warehouse-123',
            location_id: 'location-123',
            product_id: 'product-123',
          },
          redirect: '/dashboard',
        }),
      } as Response)

      const user = userEvent.setup()
      render(<OnboardingWizardModal open={true} />)

      // Open dialog
      const skipButton = await screen.findByRole('button', {
        name: /skip onboarding/i,
      })
      await user.click(skipButton)

      // WHEN "Skip Wizard" clicked in confirmation
      const confirmSkipButton = await screen.findByRole('button', {
        name: /skip wizard/i,
      })
      await user.click(confirmSkipButton)

      // THEN calls skip API
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/v1/settings/onboarding/skip',
          expect.objectContaining({
            method: 'POST',
          })
        )
      })

      // AND redirects to dashboard
      expect(mockRouter.push).toHaveBeenCalledWith('/dashboard')

      // AND refreshes onboarding status
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  describe('AC-2: Resume at correct step', () => {
    it('should resume at step 3 with previous steps shown as complete', async () => {
      // GIVEN step 3 in progress
      vi.mocked(useOnboardingStatus).mockReturnValue({
        step: 3,
        isComplete: false,
        isSkipped: false,
        loading: false,
        error: null,
        refresh: vi.fn(),
      })

      // WHEN modal renders
      render(<OnboardingWizardModal open={true} />)

      // THEN shows step 3 content
      await waitFor(() => {
        expect(screen.getByText(/step 3/i)).toBeInTheDocument()
        expect(screen.getByText(/storage locations/i)).toBeInTheDocument()
      })

      // AND shows progress indicator (Step 3 of 6)
      expect(screen.getByText(/step 3 of 6/i)).toBeInTheDocument()

      // AND shows checkmarks for completed steps 1-2
      const checkmarks = screen.getAllByTestId(/step-complete-/i)
      expect(checkmarks).toHaveLength(2) // steps 1 and 2
    })
  })

  describe('Progress Indicator', () => {
    it('should show "Step 1 of 6" on step 1', async () => {
      // GIVEN step 1
      vi.mocked(useOnboardingStatus).mockReturnValue({
        step: 1,
        isComplete: false,
        isSkipped: false,
        loading: false,
        error: null,
        refresh: vi.fn(),
      })

      // WHEN modal renders
      render(<OnboardingWizardModal open={true} />)

      // THEN shows progress
      await waitFor(() => {
        expect(screen.getByText(/step 1 of 6/i)).toBeInTheDocument()
      })
    })

    it('should show "Step 6 of 6" on final step', async () => {
      // GIVEN step 6
      vi.mocked(useOnboardingStatus).mockReturnValue({
        step: 6,
        isComplete: false,
        isSkipped: false,
        loading: false,
        error: null,
        refresh: vi.fn(),
      })

      // WHEN modal renders
      render(<OnboardingWizardModal open={true} />)

      // THEN shows progress
      await waitFor(() => {
        expect(screen.getByText(/step 6 of 6/i)).toBeInTheDocument()
      })
    })
  })

  describe('Navigation', () => {
    it('should disable Back button on step 1', async () => {
      // GIVEN step 1
      vi.mocked(useOnboardingStatus).mockReturnValue({
        step: 1,
        isComplete: false,
        isSkipped: false,
        loading: false,
        error: null,
        refresh: vi.fn(),
      })

      // WHEN modal renders
      render(<OnboardingWizardModal open={true} />)

      // THEN Back button is disabled
      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /back/i })
        expect(backButton).toBeDisabled()
      })
    })

    it('should enable Back button on step 3', async () => {
      // GIVEN step 3
      vi.mocked(useOnboardingStatus).mockReturnValue({
        step: 3,
        isComplete: false,
        isSkipped: false,
        loading: false,
        error: null,
        refresh: vi.fn(),
      })

      // WHEN modal renders
      render(<OnboardingWizardModal open={true} />)

      // THEN Back button is enabled
      await waitFor(() => {
        const backButton = screen.getByRole('button', { name: /back/i })
        expect(backButton).not.toBeDisabled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should show error when skip API fails', async () => {
      // GIVEN skip API fails
      vi.mocked(useOnboardingStatus).mockReturnValue({
        step: 0,
        isComplete: false,
        isSkipped: false,
        loading: false,
        error: null,
        refresh: vi.fn(),
      })

      vi.mocked(global.fetch).mockResolvedValue({
        ok: false,
        json: async () => ({ error: 'Failed to create demo data' }),
      } as Response)

      const user = userEvent.setup()
      render(<OnboardingWizardModal open={true} />)

      // Open dialog and confirm skip
      const skipButton = await screen.findByRole('button', {
        name: /skip onboarding/i,
      })
      await user.click(skipButton)

      const confirmSkipButton = await screen.findByRole('button', {
        name: /skip wizard/i,
      })
      await user.click(confirmSkipButton)

      // THEN shows error message
      await waitFor(() => {
        expect(
          screen.getByText(/failed to skip wizard/i)
        ).toBeInTheDocument()
      })
    })
  })
})

/**
 * Test Summary for OnboardingWizardModal Component
 * =================================================
 *
 * Test Coverage:
 * - AC-1: Launcher view for step 0: 1 test
 * - AC-7: Skip button visible on all steps: 3 tests
 * - AC-6: Skip confirmation dialog: 2 tests
 * - AC-5: Skip creates demo data: 1 test
 * - AC-2: Resume at correct step: 1 test
 * - Progress Indicator: 2 tests
 * - Navigation: 2 tests
 * - Error Handling: 1 test
 * - Total: 13 test cases
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * - OnboardingWizardModal component not implemented yet
 * - Component should show launcher or resume at current step
 * - Handle skip workflow with confirmation
 * - Show progress indicator
 * - Handle navigation between steps
 *
 * Next Steps for FRONTEND-DEV:
 * 1. Create components/onboarding/OnboardingWizardModal.tsx
 * 2. Create components/onboarding/OnboardingLauncher.tsx (step 0)
 * 3. Create components/onboarding/SkipConfirmationDialog.tsx
 * 4. Create components/onboarding/OnboardingStepIndicator.tsx
 * 5. Implement step navigation logic
 * 6. Call POST /api/v1/settings/onboarding/skip
 * 7. Run tests - should transition from RED to GREEN
 *
 * Files to Create:
 * - apps/frontend/components/onboarding/OnboardingWizardModal.tsx
 * - apps/frontend/components/onboarding/OnboardingLauncher.tsx
 * - apps/frontend/components/onboarding/SkipConfirmationDialog.tsx
 * - apps/frontend/components/onboarding/OnboardingStepIndicator.tsx
 *
 * Coverage Target: 80%
 */
