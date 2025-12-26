/**
 * Story TD-201: Skip Step Button - Component Tests
 * Track: A - Skip Step Button
 * Epic: 01-settings
 * Type: Unit Tests - React Component Enhancement
 * Status: RED (Tests will fail until implementation exists)
 *
 * Tests the Skip Step button functionality for OrganizationProfileStep component.
 * Covers button rendering, click behavior, validation bypass, button states, accessibility, and edge cases.
 *
 * Coverage Target: 90%
 *
 * Related Wireframes:
 * - SET-002: Onboarding Wizard - Organization Profile Step (Enhanced with Skip)
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrganizationProfileStep } from '../OrganizationProfileStep'
import type { OrganizationProfileStepData } from '@/lib/validation/organization-profile-step'

/**
 * Mock browser detection utilities
 */
vi.mock('@/lib/utils/browser-detection', () => ({
  getBrowserTimezone: vi.fn(() => 'Europe/Warsaw'),
  getBrowserLanguage: vi.fn(() => 'pl'),
}))

describe('TD-201: Skip Step Button Feature', () => {
  const mockOnComplete = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Group 1: Button Rendering', () => {
    it('TC-201.1: should render Skip Step button with correct styling', () => {
      // GIVEN wizard step 1 loads
      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // WHEN component mounts
      // THEN Skip Step button is visible with ghost variant
      const skipButton = screen.getByRole('button', { name: /skip step/i })
      expect(skipButton).toBeInTheDocument()
      expect(skipButton).toHaveClass('variant-ghost') // Ghost variant styling
    })

    it('TC-201.2: should display Skip Step button with info icon', () => {
      // GIVEN wizard step 1 loads
      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // WHEN component mounts
      // THEN Skip Step button has info icon (InfoCircle from lucide-react)
      const skipButton = screen.getByRole('button', { name: /skip step/i })
      const icon = skipButton.querySelector('svg')
      expect(icon).toBeInTheDocument()
      expect(icon).toHaveClass('lucide-info') // InfoCircle icon class
    })

    it('TC-201.3: should position Skip Step button to the left of Next button', () => {
      // GIVEN wizard step 1 loads
      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // WHEN component mounts
      // THEN Skip Step button is positioned before Next button in DOM
      const buttons = screen.getAllByRole('button')
      const skipButton = buttons.find(btn => btn.textContent?.includes('Skip Step'))
      const nextButton = buttons.find(btn => btn.textContent?.includes('Next'))

      expect(skipButton).toBeInTheDocument()
      expect(nextButton).toBeInTheDocument()

      // Skip button should appear before Next button in DOM order
      const skipIndex = buttons.indexOf(skipButton!)
      const nextIndex = buttons.indexOf(nextButton!)
      expect(skipIndex).toBeLessThan(nextIndex)
    })
  })

  describe('Group 2: Click Behavior - Bypass Validation', () => {
    it('TC-201.4: should bypass validation when Skip Step clicked with empty form', async () => {
      const user = userEvent.setup()

      // GIVEN wizard step 1 loads with empty form
      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // Verify form is empty
      const nameInput = screen.getByLabelText(/organization name/i) as HTMLInputElement
      expect(nameInput.value).toBe('')

      // WHEN Skip Step clicked
      const skipButton = screen.getByRole('button', { name: /skip step/i })
      await user.click(skipButton)

      // THEN onComplete called with default data (bypassing validation)
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'My Organization', // Default placeholder name
            timezone: 'Europe/Warsaw', // Auto-detected
            language: 'pl', // Auto-detected
            currency: 'EUR', // Default
            country: '', // Empty allowed
          })
        )
      })

      // AND no validation errors shown
      expect(screen.queryByText(/organization name is required/i)).not.toBeInTheDocument()
    })

    it('TC-201.5: should use default placeholder data when Skip Step clicked', async () => {
      const user = userEvent.setup()

      // GIVEN wizard step 1 loads with empty form
      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // WHEN Skip Step clicked
      const skipButton = screen.getByRole('button', { name: /skip step/i })
      await user.click(skipButton)

      // THEN onComplete called with complete default data structure
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith({
          name: 'My Organization', // Default placeholder
          timezone: 'Europe/Warsaw', // Auto-detected from browser
          language: 'pl', // Auto-detected from browser
          currency: 'EUR', // Default currency
          date_format: 'YYYY-MM-DD', // Default date format
          address_line1: '', // Empty optional field
          address_line2: '', // Empty optional field
          city: '', // Empty optional field
          postal_code: '', // Empty optional field
          country: '', // Empty allowed when skipped
          contact_email: '', // Empty optional field
          contact_phone: '', // Empty optional field
        })
      })
    })

    it('TC-201.6: should merge partial data with defaults when Skip Step clicked', async () => {
      const user = userEvent.setup()

      // GIVEN wizard step 1 loads with some user input
      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // User enters partial data
      const nameInput = screen.getByLabelText(/organization name/i)
      await user.type(nameInput, 'Test Bakery')

      const cityInput = screen.getByLabelText(/city/i)
      await user.type(cityInput, 'Warsaw')

      // WHEN Skip Step clicked
      const skipButton = screen.getByRole('button', { name: /skip step/i })
      await user.click(skipButton)

      // THEN onComplete called with merged data (user input + defaults)
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Test Bakery', // User input preserved
            city: 'Warsaw', // User input preserved
            timezone: 'Europe/Warsaw', // Auto-detected
            language: 'pl', // Auto-detected
            currency: 'EUR', // Default
            country: '', // Empty allowed
          })
        )
      })
    })

    it('TC-201.7: should handle Skip Step click with validation errors present', async () => {
      const user = userEvent.setup()

      // GIVEN wizard step 1 with validation errors shown
      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // Trigger validation by clicking Next with invalid data
      const nameInput = screen.getByLabelText(/organization name/i)
      await user.type(nameInput, 'A') // Too short (min 2 chars)

      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      // Verify error is shown
      await waitFor(() => {
        expect(screen.getByText(/organization name must be at least 2 characters/i)).toBeInTheDocument()
      })

      // WHEN Skip Step clicked
      const skipButton = screen.getByRole('button', { name: /skip step/i })
      await user.click(skipButton)

      // THEN validation errors are cleared and default data submitted
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'My Organization', // Default instead of invalid 'A'
          })
        )
      })

      // AND error message is removed
      expect(screen.queryByText(/organization name must be at least 2 characters/i)).not.toBeInTheDocument()
    })
  })

  describe('Group 3: Button States', () => {
    it('TC-201.8: should enable Skip Step button when form is pristine', () => {
      // GIVEN wizard step 1 loads with no user interaction
      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // WHEN component mounts
      // THEN Skip Step button is enabled
      const skipButton = screen.getByRole('button', { name: /skip step/i })
      expect(skipButton).not.toBeDisabled()
    })

    it('TC-201.9: should keep Skip Step button enabled when form has validation errors', async () => {
      const user = userEvent.setup()

      // GIVEN wizard step 1 with validation errors
      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // Trigger validation error
      const nextButton = screen.getByRole('button', { name: /next/i })
      await user.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText(/organization name is required/i)).toBeInTheDocument()
      })

      // WHEN validation error is present
      // THEN Skip Step button remains enabled (allows skipping invalid form)
      const skipButton = screen.getByRole('button', { name: /skip step/i })
      expect(skipButton).not.toBeDisabled()
    })

    it('TC-201.10: should disable Skip Step button during form submission', async () => {
      const user = userEvent.setup()
      const slowOnComplete = vi.fn(
        (_data: OrganizationProfileStepData) =>
          new Promise<void>((resolve) => setTimeout(resolve, 1000))
      )

      // GIVEN wizard step 1 loads
      render(<OrganizationProfileStep onComplete={slowOnComplete} />)

      // WHEN Skip Step clicked
      const skipButton = screen.getByRole('button', { name: /skip step/i })
      await user.click(skipButton)

      // THEN button is disabled during async submission
      expect(skipButton).toBeDisabled()

      // AND loading spinner is shown
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })

  describe('Group 4: Accessibility', () => {
    it('TC-201.11: should have proper ARIA label for Skip Step button', () => {
      // GIVEN wizard step 1 loads
      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // WHEN component mounts
      // THEN Skip Step button has descriptive ARIA label
      const skipButton = screen.getByRole('button', { name: /skip step/i })
      expect(skipButton).toHaveAttribute('aria-label', 'Skip Step - use default values')
    })

    it('TC-201.12: should support keyboard navigation to Skip Step button', async () => {
      const user = userEvent.setup()

      // GIVEN wizard step 1 loads
      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // WHEN user navigates with keyboard
      const nameInput = screen.getByLabelText(/organization name/i)
      nameInput.focus()

      // Tab through all form fields to reach buttons
      await user.tab() // Timezone
      await user.tab() // Language
      await user.tab() // Currency
      await user.tab() // Date format
      await user.tab() // Address line 1
      await user.tab() // Address line 2
      await user.tab() // City
      await user.tab() // Postal code
      await user.tab() // Country
      await user.tab() // Contact email
      await user.tab() // Contact phone
      await user.tab() // Should reach Skip Step button

      // THEN Skip Step button receives focus
      const skipButton = screen.getByRole('button', { name: /skip step/i })
      expect(skipButton).toHaveFocus()
    })

    it('TC-201.13: should announce skip action to screen readers', async () => {
      const user = userEvent.setup()

      // GIVEN wizard step 1 loads
      render(<OrganizationProfileStep onComplete={mockOnComplete} />)

      // WHEN Skip Step clicked
      const skipButton = screen.getByRole('button', { name: /skip step/i })
      await user.click(skipButton)

      // THEN skip action is announced via aria-live region
      await waitFor(() => {
        const announcement = screen.getByRole('status', { name: /skip-announcement/i })
        expect(announcement).toHaveTextContent(/step skipped/i)
      })
    })
  })

  describe('Group 5: Edge Cases', () => {
    it('TC-201.14: should prevent double-click on Skip Step button', async () => {
      const user = userEvent.setup()
      const slowOnComplete = vi.fn(
        (_data: OrganizationProfileStepData) =>
          new Promise<void>((resolve) => setTimeout(resolve, 500))
      )

      // GIVEN wizard step 1 loads
      render(<OrganizationProfileStep onComplete={slowOnComplete} />)

      const skipButton = screen.getByRole('button', { name: /skip step/i })

      // WHEN user rapidly clicks Skip Step twice
      await user.click(skipButton)
      await user.click(skipButton) // Second click should be ignored

      // THEN onComplete is called only once
      await waitFor(() => {
        expect(slowOnComplete).toHaveBeenCalledTimes(1)
      }, { timeout: 2000 })
    })

    it('TC-201.15: should handle Skip Step when initialData already provided', async () => {
      const user = userEvent.setup()

      // GIVEN wizard step 1 loads with initialData (e.g., editing existing org)
      const initialData: Partial<OrganizationProfileStepData> = {
        name: 'Existing Bakery',
        timezone: 'America/New_York',
        language: 'en',
        currency: 'USD',
        country: 'US',
      }

      render(
        <OrganizationProfileStep
          initialData={initialData}
          onComplete={mockOnComplete}
        />
      )

      // WHEN Skip Step clicked
      const skipButton = screen.getByRole('button', { name: /skip step/i })
      await user.click(skipButton)

      // THEN onComplete called with initialData (not defaults)
      await waitFor(() => {
        expect(mockOnComplete).toHaveBeenCalledWith(
          expect.objectContaining({
            name: 'Existing Bakery', // initialData preserved
            timezone: 'America/New_York', // initialData preserved
            language: 'en', // initialData preserved
            currency: 'USD', // initialData preserved
            country: 'US', // initialData preserved
          })
        )
      })
    })
  })
})

/**
 * Test Coverage Summary for TD-201: Skip Step Button
 *
 * ✅ Group 1: Button Rendering (3 tests)
 *   - TC-201.1: Correct styling (ghost variant)
 *   - TC-201.2: Info icon display
 *   - TC-201.3: Positioning (left of Next button)
 *
 * ✅ Group 2: Click Behavior - Bypass Validation (4 tests)
 *   - TC-201.4: Bypass validation with empty form
 *   - TC-201.5: Use default placeholder data
 *   - TC-201.6: Merge partial data with defaults
 *   - TC-201.7: Handle existing validation errors
 *
 * ✅ Group 3: Button States (3 tests)
 *   - TC-201.8: Enabled when pristine
 *   - TC-201.9: Enabled with validation errors
 *   - TC-201.10: Disabled during submission
 *
 * ✅ Group 4: Accessibility (3 tests)
 *   - TC-201.11: Proper ARIA label
 *   - TC-201.12: Keyboard navigation
 *   - TC-201.13: Screen reader announcements
 *
 * ✅ Group 5: Edge Cases (2 tests)
 *   - TC-201.14: Double-click prevention
 *   - TC-201.15: InitialData handling
 *
 * Total: 15 test cases
 * Expected Status: RED (All tests should fail - Skip button not implemented yet)
 * Expected Coverage: 90%+ (when GREEN)
 *
 * Expected Failure Messages:
 * - "Unable to find button with name /skip step/i"
 * - "Unable to find role status with name /skip-announcement/i"
 * - Expected handleSkip function does not exist
 * - Expected default data merging logic missing
 */
