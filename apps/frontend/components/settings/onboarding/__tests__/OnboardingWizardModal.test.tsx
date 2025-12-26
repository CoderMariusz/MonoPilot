/**
 * Story 01.3: OnboardingWizardModal - Component Tests (TD-102)
 * Epic: 01-settings
 * Type: Unit Tests - React Component
 *
 * Tests the OnboardingWizardModal component.
 * Covers modal rendering, user interactions, and accessibility.
 *
 * Coverage Target: 85%
 *
 * Related Wireframes:
 * - SET-001: Onboarding Wizard Launcher
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingWizardModal } from '../OnboardingWizardModal'

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

describe('Story 01.3: OnboardingWizardModal Component', () => {
  const mockOnClose = vi.fn()
  const mockOnSkip = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSkip.mockResolvedValue(undefined)
  })

  describe('Modal Rendering', () => {
    it('should render modal when open is true', () => {
      render(
        <OnboardingWizardModal
          open={true}
          onClose={mockOnClose}
          onSkip={mockOnSkip}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should not render modal when open is false', () => {
      render(
        <OnboardingWizardModal
          open={false}
          onClose={mockOnClose}
          onSkip={mockOnSkip}
        />
      )

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should display welcome title', () => {
      render(
        <OnboardingWizardModal
          open={true}
          onClose={mockOnClose}
          onSkip={mockOnSkip}
        />
      )

      expect(screen.getByText('Welcome to MonoPilot!')).toBeInTheDocument()
    })

    it('should display description text', () => {
      render(
        <OnboardingWizardModal
          open={true}
          onClose={mockOnClose}
          onSkip={mockOnSkip}
        />
      )

      expect(
        screen.getByText(/let's set up your organization in just a few steps/i)
      ).toBeInTheDocument()
    })

    it('should display feature list', () => {
      render(
        <OnboardingWizardModal
          open={true}
          onClose={mockOnClose}
          onSkip={mockOnSkip}
        />
      )

      expect(screen.getByText('Organization profile')).toBeInTheDocument()
      expect(screen.getByText('Warehouse configuration')).toBeInTheDocument()
      expect(screen.getByText('Production settings')).toBeInTheDocument()
      expect(screen.getByText('Team setup')).toBeInTheDocument()
    })

    it('should display time estimate', () => {
      render(
        <OnboardingWizardModal
          open={true}
          onClose={mockOnClose}
          onSkip={mockOnSkip}
        />
      )

      expect(screen.getByText(/takes about 5 minutes/i)).toBeInTheDocument()
    })

    it('should display both action buttons', () => {
      render(
        <OnboardingWizardModal
          open={true}
          onClose={mockOnClose}
          onSkip={mockOnSkip}
        />
      )

      expect(screen.getByText('Skip for now')).toBeInTheDocument()
      expect(screen.getByText('Start Setup')).toBeInTheDocument()
    })
  })

  describe('Start Setup Button', () => {
    it('should navigate to wizard page when clicked', async () => {
      const user = userEvent.setup()

      render(
        <OnboardingWizardModal
          open={true}
          onClose={mockOnClose}
          onSkip={mockOnSkip}
        />
      )

      const startButton = screen.getByText('Start Setup')
      await user.click(startButton)

      expect(mockPush).toHaveBeenCalledWith('/settings/wizard')
    })

    it('should call onClose after navigation', async () => {
      const user = userEvent.setup()

      render(
        <OnboardingWizardModal
          open={true}
          onClose={mockOnClose}
          onSkip={mockOnSkip}
        />
      )

      const startButton = screen.getByText('Start Setup')
      await user.click(startButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Skip Button', () => {
    it('should call onSkip when clicked', async () => {
      const user = userEvent.setup()

      render(
        <OnboardingWizardModal
          open={true}
          onClose={mockOnClose}
          onSkip={mockOnSkip}
        />
      )

      const skipButton = screen.getByText('Skip for now')
      await user.click(skipButton)

      await waitFor(() => {
        expect(mockOnSkip).toHaveBeenCalled()
      })
    })

    it('should call onClose after skip succeeds', async () => {
      const user = userEvent.setup()

      render(
        <OnboardingWizardModal
          open={true}
          onClose={mockOnClose}
          onSkip={mockOnSkip}
        />
      )

      const skipButton = screen.getByText('Skip for now')
      await user.click(skipButton)

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('should show loading state while skipping', async () => {
      const user = userEvent.setup()
      const slowSkip = vi.fn(
        () => new Promise((resolve) => setTimeout(resolve, 500))
      )

      render(
        <OnboardingWizardModal
          open={true}
          onClose={mockOnClose}
          onSkip={slowSkip}
        />
      )

      const skipButton = screen.getByText('Skip for now').closest('button')!
      await user.click(skipButton)

      // Button should be disabled during skip
      expect(skipButton).toBeDisabled()
    })

    it('should disable start button while skipping', async () => {
      const user = userEvent.setup()
      const slowSkip = vi.fn(
        () => new Promise((resolve) => setTimeout(resolve, 500))
      )

      render(
        <OnboardingWizardModal
          open={true}
          onClose={mockOnClose}
          onSkip={slowSkip}
        />
      )

      const skipButton = screen.getByText('Skip for now').closest('button')!
      await user.click(skipButton)

      const startButton = screen.getByText('Start Setup').closest('button')!
      expect(startButton).toBeDisabled()
    })

    it('should handle skip error gracefully', async () => {
      const user = userEvent.setup()
      const errorSkip = vi.fn().mockRejectedValue(new Error('Skip failed'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <OnboardingWizardModal
          open={true}
          onClose={mockOnClose}
          onSkip={errorSkip}
        />
      )

      const skipButton = screen.getByText('Skip for now').closest('button')!
      await user.click(skipButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      // Button should be re-enabled after error
      await waitFor(() => {
        expect(skipButton).not.toBeDisabled()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Modal Dismissal', () => {
    it('should call onClose when close button clicked', async () => {
      const user = userEvent.setup()

      render(
        <OnboardingWizardModal
          open={true}
          onClose={mockOnClose}
          onSkip={mockOnSkip}
        />
      )

      // Find close button by SR text "Close"
      const closeButton = screen.getByText('Close').closest('button')!
      await user.click(closeButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should call onClose when ESC key pressed', async () => {
      const user = userEvent.setup()

      render(
        <OnboardingWizardModal
          open={true}
          onClose={mockOnClose}
          onSkip={mockOnSkip}
        />
      )

      await user.keyboard('{Escape}')

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should not close modal while skip is in progress', async () => {
      const user = userEvent.setup()
      const slowSkip = vi.fn(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      )

      render(
        <OnboardingWizardModal
          open={true}
          onClose={mockOnClose}
          onSkip={slowSkip}
        />
      )

      // Start skip process
      const skipButton = screen.getByText('Skip for now').closest('button')!
      await user.click(skipButton)

      // Reset onClose to track only new calls
      mockOnClose.mockClear()

      // Try to close via ESC
      await user.keyboard('{Escape}')

      // Should not close while skipping
      expect(mockOnClose).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have proper dialog role', () => {
      render(
        <OnboardingWizardModal
          open={true}
          onClose={mockOnClose}
          onSkip={mockOnSkip}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should have aria-describedby for description', () => {
      render(
        <OnboardingWizardModal
          open={true}
          onClose={mockOnClose}
          onSkip={mockOnSkip}
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-describedby')
    })

    it('should have accessible feature list', () => {
      render(
        <OnboardingWizardModal
          open={true}
          onClose={mockOnClose}
          onSkip={mockOnSkip}
        />
      )

      const list = screen.getByRole('list')
      expect(list).toBeInTheDocument()
      expect(list).toHaveAttribute('aria-label', 'Setup wizard steps')
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * - Modal Rendering: 7 tests
 * - Start Setup Button: 2 tests
 * - Skip Button: 5 tests
 * - Modal Dismissal: 3 tests
 * - Accessibility: 3 tests
 *
 * Total: 20 test cases
 * Expected Coverage: 85%+
 */
