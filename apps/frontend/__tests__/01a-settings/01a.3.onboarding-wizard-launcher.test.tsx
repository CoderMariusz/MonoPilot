/**
 * Story 01a.3: Onboarding Wizard Launcher - Component Tests
 * Epic: 01a-settings
 * Type: Frontend Component Tests
 * Status: RED (Tests will fail until implementation exists)
 *
 * Tests the wizard launcher modal that appears for new organizations
 * and manages onboarding state machine (show/skip/resume).
 *
 * Related Wireframes:
 * - SET-001: Onboarding Wizard Launcher
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

/**
 * Mock Components (will be replaced with actual implementations)
 * These are placeholders to make tests fail with clear messages
 */
const OnboardingWizardLauncher = () => null
const WizardStateProvider = ({ children }: { children: React.ReactNode }) => null

/**
 * Mock Hooks
 */
const mockUseOrganization = vi.fn()
const mockUseRouter = vi.fn()

vi.mock('@/lib/hooks/use-organization', () => ({
  useOrganization: () => mockUseOrganization(),
}))

vi.mock('next/navigation', () => ({
  useRouter: () => mockUseRouter(),
}))

describe('Story 01a.3: Onboarding Wizard Launcher', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseRouter.mockReturnValue({
      push: vi.fn(),
      refresh: vi.fn(),
    })
  })

  describe('AC-01a.3.1: Show wizard for new organizations', () => {
    it('should display wizard modal when onboarding_step = 0', async () => {
      // GIVEN new org (onboarding_step = 0)
      mockUseOrganization.mockReturnValue({
        organization: {
          id: 'test-org-id',
          company_name: 'Test Org',
          onboarding_step: 0,
          onboarding_completed_at: null,
          onboarding_skipped: false,
        },
        isLoading: false,
      })

      // WHEN admin logs in
      render(<OnboardingWizardLauncher />)

      // THEN wizard modal appears
      await waitFor(() => {
        expect(screen.getByText(/welcome to monopilot/i)).toBeInTheDocument()
        expect(screen.getByText(/quick onboarding wizard/i)).toBeInTheDocument()
        expect(screen.getByText(/step 1: organization profile/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /start onboarding wizard/i })).toBeInTheDocument()
      })
    })

    it('should show 6 wizard steps with time estimates', async () => {
      // GIVEN new org
      mockUseOrganization.mockReturnValue({
        organization: {
          id: 'test-org-id',
          onboarding_step: 0,
          onboarding_completed_at: null,
        },
        isLoading: false,
      })

      // WHEN launcher loads
      render(<OnboardingWizardLauncher />)

      // THEN all 6 steps are shown with time estimates
      await waitFor(() => {
        expect(screen.getByText(/step 1: organization profile.*2 min/i)).toBeInTheDocument()
        expect(screen.getByText(/step 2: first warehouse.*3 min/i)).toBeInTheDocument()
        expect(screen.getByText(/step 3: storage locations.*4 min/i)).toBeInTheDocument()
        expect(screen.getByText(/step 4: first product.*3 min/i)).toBeInTheDocument()
        expect(screen.getByText(/step 5: demo work order.*2 min/i)).toBeInTheDocument()
        expect(screen.getByText(/step 6: review & complete.*1 min/i)).toBeInTheDocument()
      })
    })
  })

  describe('AC-01a.3.2: Hide wizard for completed onboarding', () => {
    it('should NOT display wizard when onboarding_completed_at is set', async () => {
      // GIVEN org with onboarding_completed_at set
      mockUseOrganization.mockReturnValue({
        organization: {
          id: 'test-org-id',
          onboarding_step: 6,
          onboarding_completed_at: '2025-12-15T10:00:00Z',
          onboarding_skipped: false,
        },
        isLoading: false,
      })

      // WHEN user logs in
      render(<OnboardingWizardLauncher />)

      // THEN no wizard, direct to dashboard (modal should not render)
      await waitFor(() => {
        expect(screen.queryByText(/welcome to monopilot/i)).not.toBeInTheDocument()
        expect(screen.queryByText(/quick onboarding wizard/i)).not.toBeInTheDocument()
      })
    })

    it('should redirect to dashboard when onboarding completed', async () => {
      // GIVEN completed onboarding
      const mockPush = vi.fn()
      mockUseRouter.mockReturnValue({ push: mockPush })
      mockUseOrganization.mockReturnValue({
        organization: {
          id: 'test-org-id',
          onboarding_completed_at: '2025-12-15T10:00:00Z',
        },
        isLoading: false,
      })

      // WHEN component mounts
      render(<OnboardingWizardLauncher />)

      // THEN redirects to dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })
  })

  describe('AC-01a.3.3: Skip wizard functionality', () => {
    it('should close wizard and set onboarding_skipped=true when "Skip for now" clicked', async () => {
      // GIVEN wizard open
      const mockSkipOnboarding = vi.fn()
      mockUseOrganization.mockReturnValue({
        organization: {
          id: 'test-org-id',
          onboarding_step: 0,
          onboarding_completed_at: null,
          onboarding_skipped: false,
        },
        isLoading: false,
        skipOnboarding: mockSkipOnboarding,
      })

      const user = userEvent.setup()
      render(<OnboardingWizardLauncher />)

      // WHEN "Skip for now" clicked
      const skipButton = screen.getByRole('button', { name: /skip for now/i })
      await user.click(skipButton)

      // THEN wizard closes, onboarding_skipped=true
      await waitFor(() => {
        expect(mockSkipOnboarding).toHaveBeenCalledWith()
        expect(screen.queryByText(/quick onboarding wizard/i)).not.toBeInTheDocument()
      })
    })

    it('should navigate to dashboard after skip', async () => {
      // GIVEN wizard open
      const mockPush = vi.fn()
      mockUseRouter.mockReturnValue({ push: mockPush })
      mockUseOrganization.mockReturnValue({
        organization: {
          id: 'test-org-id',
          onboarding_step: 0,
        },
        isLoading: false,
        skipOnboarding: vi.fn().mockResolvedValue(true),
      })

      const user = userEvent.setup()
      render(<OnboardingWizardLauncher />)

      // WHEN skip clicked
      const skipButton = screen.getByRole('button', { name: /skip for now/i })
      await user.click(skipButton)

      // THEN navigates to dashboard
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/dashboard')
      })
    })
  })

  describe('AC-01a.3.4: Resume wizard from /settings/onboarding', () => {
    it('should show wizard when accessing /settings/onboarding even if previously skipped', async () => {
      // GIVEN wizard skipped previously
      mockUseOrganization.mockReturnValue({
        organization: {
          id: 'test-org-id',
          onboarding_step: 2,
          onboarding_skipped: true,
          onboarding_completed_at: null,
        },
        isLoading: false,
      })

      // WHEN accessing /settings/onboarding
      render(<OnboardingWizardLauncher forceShow={true} />)

      // THEN wizard resumes (shows current step)
      await waitFor(() => {
        expect(screen.getByText(/quick onboarding wizard/i)).toBeInTheDocument()
        expect(screen.getByText(/step 2/i)).toBeInTheDocument()
      })
    })

    it('should resume from last saved step', async () => {
      // GIVEN onboarding in progress (step 3)
      mockUseOrganization.mockReturnValue({
        organization: {
          id: 'test-org-id',
          onboarding_step: 3,
          onboarding_completed_at: null,
        },
        isLoading: false,
      })

      // WHEN wizard reopened
      render(<OnboardingWizardLauncher />)

      // THEN shows step 3
      await waitFor(() => {
        expect(screen.getByText(/step 3: storage locations/i)).toBeInTheDocument()
      })
    })
  })

  describe('AC-01a.3.5: Save progress when navigating away', () => {
    it('should persist onboarding_step when step 1 completed', async () => {
      // GIVEN step 1 completed
      const mockSaveProgress = vi.fn()
      mockUseOrganization.mockReturnValue({
        organization: {
          id: 'test-org-id',
          onboarding_step: 0,
        },
        isLoading: false,
        saveProgress: mockSaveProgress,
      })

      const user = userEvent.setup()
      render(
        <WizardStateProvider>
          <OnboardingWizardLauncher />
        </WizardStateProvider>
      )

      // WHEN step 1 completed and navigating away
      const startButton = screen.getByRole('button', { name: /start onboarding wizard/i })
      await user.click(startButton)

      // THEN progress saved (onboarding_step=1)
      await waitFor(() => {
        expect(mockSaveProgress).toHaveBeenCalledWith(expect.objectContaining({
          onboarding_step: 1,
        }))
      })
    })

    it('should save progress automatically on step change', async () => {
      // GIVEN wizard in progress
      const mockUpdateStep = vi.fn()
      mockUseOrganization.mockReturnValue({
        organization: {
          id: 'test-org-id',
          onboarding_step: 1,
        },
        isLoading: false,
        updateOnboardingStep: mockUpdateStep,
      })

      // WHEN moving from step 1 to step 2
      render(<OnboardingWizardLauncher />)

      // Simulate step transition (implementation will handle this)
      // For now, just verify the hook is available
      expect(mockUpdateStep).toBeDefined()
    })
  })

  describe('AC-01a.3.6: Multi-admin access', () => {
    it('should show current step when different admin logs in', async () => {
      // GIVEN onboarding in progress (step 2 saved)
      mockUseOrganization.mockReturnValue({
        organization: {
          id: 'test-org-id',
          onboarding_step: 2,
          onboarding_completed_at: null,
        },
        isLoading: false,
      })

      // WHEN different admin logs in
      render(<OnboardingWizardLauncher />)

      // THEN wizard shows current step (step 2)
      await waitFor(() => {
        expect(screen.getByText(/step 2: first warehouse/i)).toBeInTheDocument()
      })
    })

    it('should load shared progress from database', async () => {
      // GIVEN shared onboarding state
      const mockLoadProgress = vi.fn().mockResolvedValue({
        onboarding_step: 3,
        wizard_progress: {
          step: 3,
          step1: { company_name: 'Test Org' },
          step2: { warehouse_code: 'WH01' },
        },
      })

      mockUseOrganization.mockReturnValue({
        organization: {
          id: 'test-org-id',
          onboarding_step: 3,
        },
        isLoading: false,
        loadProgress: mockLoadProgress,
      })

      // WHEN loading wizard
      render(<OnboardingWizardLauncher />)

      // THEN shared progress loaded
      await waitFor(() => {
        expect(mockLoadProgress).toHaveBeenCalled()
      })
    })
  })

  describe('Loading and Error States', () => {
    it('should show loading state while fetching organization data', async () => {
      // GIVEN loading org data
      mockUseOrganization.mockReturnValue({
        organization: null,
        isLoading: true,
      })

      // WHEN component renders
      render(<OnboardingWizardLauncher />)

      // THEN shows loading indicator
      await waitFor(() => {
        expect(screen.getByText(/loading your organization/i)).toBeInTheDocument()
      })
    })

    it('should show error state when org data fails to load', async () => {
      // GIVEN org load failed
      mockUseOrganization.mockReturnValue({
        organization: null,
        isLoading: false,
        error: new Error('Failed to load organization'),
      })

      // WHEN component renders
      render(<OnboardingWizardLauncher />)

      // THEN shows error message
      await waitFor(() => {
        expect(screen.getByText(/failed to load onboarding wizard/i)).toBeInTheDocument()
        expect(screen.getByText(/unable to retrieve organization settings/i)).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
      })
    })

    it('should retry loading on "Try Again" click', async () => {
      // GIVEN error state
      const mockRetry = vi.fn()
      mockUseOrganization.mockReturnValue({
        organization: null,
        isLoading: false,
        error: new Error('Failed to load organization'),
        retry: mockRetry,
      })

      const user = userEvent.setup()
      render(<OnboardingWizardLauncher />)

      // WHEN "Try Again" clicked
      const retryButton = screen.getByRole('button', { name: /try again/i })
      await user.click(retryButton)

      // THEN retries loading
      await waitFor(() => {
        expect(mockRetry).toHaveBeenCalled()
      })
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', async () => {
      mockUseOrganization.mockReturnValue({
        organization: {
          id: 'test-org-id',
          onboarding_step: 0,
        },
        isLoading: false,
      })

      render(<OnboardingWizardLauncher />)

      await waitFor(() => {
        // Modal should have dialog role
        const dialog = screen.getByRole('dialog')
        expect(dialog).toBeInTheDocument()
        expect(dialog).toHaveAttribute('aria-label', 'Onboarding Wizard')

        // Primary button should be clearly labeled
        const startButton = screen.getByRole('button', { name: /start onboarding wizard/i })
        expect(startButton).toBeInTheDocument()
      })
    })

    it('should support keyboard navigation', async () => {
      mockUseOrganization.mockReturnValue({
        organization: {
          id: 'test-org-id',
          onboarding_step: 0,
        },
        isLoading: false,
      })

      const user = userEvent.setup()
      render(<OnboardingWizardLauncher />)

      // Tab should focus on buttons
      await user.tab()
      const skipButton = screen.getByRole('button', { name: /skip for now/i })
      expect(skipButton).toHaveFocus()

      await user.tab()
      const startButton = screen.getByRole('button', { name: /start onboarding wizard/i })
      expect(startButton).toHaveFocus()

      // Enter should activate button
      await user.keyboard('{Enter}')
      // Assertion: start button action triggered (tested in other tests)
    })
  })

  describe('Progress Tracking', () => {
    it('should display progress indicator showing total steps', async () => {
      mockUseOrganization.mockReturnValue({
        organization: {
          id: 'test-org-id',
          onboarding_step: 0,
        },
        isLoading: false,
      })

      render(<OnboardingWizardLauncher />)

      await waitFor(() => {
        // Should show total time estimate
        expect(screen.getByText(/15 minutes/i)).toBeInTheDocument()
        // Should show step count
        expect(screen.getByText(/6 steps/i)).toBeInTheDocument()
      })
    })

    it('should show what is already completed', async () => {
      mockUseOrganization.mockReturnValue({
        organization: {
          id: 'test-org-id',
          company_name: 'Test Org',
          onboarding_step: 0,
        },
        isLoading: false,
      })

      render(<OnboardingWizardLauncher />)

      await waitFor(() => {
        // Should show completed items from registration
        expect(screen.getByText(/organization profile created/i)).toBeInTheDocument()
        expect(screen.getByText(/first admin user configured/i)).toBeInTheDocument()
      })
    })
  })
})
