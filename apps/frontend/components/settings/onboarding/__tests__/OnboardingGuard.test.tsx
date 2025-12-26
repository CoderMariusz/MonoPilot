/**
 * Story 01.3: OnboardingGuard - Component Tests (TD-102)
 * Epic: 01-settings
 * Type: Unit Tests - React Component
 *
 * Tests the OnboardingGuard component.
 * Covers onboarding status checks, modal display logic, and localStorage handling.
 *
 * Coverage Target: 85%
 *
 * Related Wireframes:
 * - SET-001: Onboarding Wizard Launcher
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OnboardingGuard } from '../OnboardingGuard'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock next/navigation
const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
}))

// Mock localStorage
const localStorageStore: Record<string, string> = {}
const mockLocalStorage = {
  getItem: vi.fn((key: string) => localStorageStore[key] || null),
  setItem: vi.fn((key: string, value: string) => {
    localStorageStore[key] = value
  }),
  removeItem: vi.fn((key: string) => {
    delete localStorageStore[key]
  }),
  clear: vi.fn(() => {
    Object.keys(localStorageStore).forEach(key => delete localStorageStore[key])
  }),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
})

describe('Story 01.3: OnboardingGuard Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockLocalStorage.clear()
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  const renderWithChildren = async () => {
    let result
    await act(async () => {
      result = render(
        <OnboardingGuard>
          <div data-testid="child-content">Page Content</div>
        </OnboardingGuard>
      )
    })
    return result!
  }

  describe('Children Rendering', () => {
    it('should always render children', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ role_code: 'admin' }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ step: 0, is_complete: false, skipped: false }),
      })

      await renderWithChildren()

      expect(screen.getByTestId('child-content')).toBeInTheDocument()
    })

    it('should render children even if context API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
      })

      await renderWithChildren()

      expect(screen.getByTestId('child-content')).toBeInTheDocument()
    })
  })

  describe('Admin Role Check', () => {
    it('should show modal for admin users with incomplete onboarding', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ role_code: 'admin' }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ step: 0, is_complete: false, skipped: false }),
      })

      await renderWithChildren()

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('should show modal for owner users with incomplete onboarding', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ role_code: 'owner' }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ step: 0, is_complete: false, skipped: false }),
      })

      await renderWithChildren()

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })
    })

    it('should NOT show modal for non-admin users', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ role_code: 'operator' }),
      })

      await renderWithChildren()

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should NOT show modal for user role', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ role_code: 'user' }),
      })

      await renderWithChildren()

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('Onboarding Status Check', () => {
    it('should NOT show modal if onboarding step > 0', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ role_code: 'admin' }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ step: 2, is_complete: false, skipped: false }),
      })

      await renderWithChildren()

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should NOT show modal if onboarding is complete', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ role_code: 'admin' }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ step: 6, is_complete: true, skipped: false }),
      })

      await renderWithChildren()

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should NOT show modal if onboarding was skipped', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ role_code: 'admin' }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ step: 0, is_complete: false, skipped: true }),
      })

      await renderWithChildren()

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })

  describe('LocalStorage Dismissal', () => {
    it('should NOT show modal if localStorage has dismissed flag', async () => {
      localStorageStore['onboarding_modal_dismissed'] = 'true'
      mockLocalStorage.getItem.mockReturnValue('true')

      await renderWithChildren()

      // Should not call APIs if dismissed
      expect(mockFetch).not.toHaveBeenCalled()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should set dismissed flag when modal is closed', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ role_code: 'admin' }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ step: 0, is_complete: false, skipped: false }),
      })

      await renderWithChildren()

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      // Close modal via ESC
      await user.keyboard('{Escape}')

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'onboarding_modal_dismissed',
        'true'
      )
    })

    it('should remove dismissed flag after successful skip', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ role_code: 'admin' }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ step: 0, is_complete: false, skipped: false }),
      })
      // Skip API call
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      await renderWithChildren()

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const skipButton = screen.getByText('Skip for now')
      await user.click(skipButton)

      await waitFor(() => {
        expect(mockLocalStorage.removeItem).toHaveBeenCalledWith(
          'onboarding_modal_dismissed'
        )
      })
    })
  })

  describe('API Error Handling', () => {
    it('should not show modal if context API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      await renderWithChildren()

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should not show modal if status API fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ role_code: 'admin' }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      })

      await renderWithChildren()

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      })

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should handle network errors gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockFetch.mockRejectedValueOnce(new Error('Network error'))

      await renderWithChildren()

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      // Children should still be rendered
      expect(screen.getByTestId('child-content')).toBeInTheDocument()
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

      consoleSpy.mockRestore()
    })
  })

  describe('Skip Functionality', () => {
    it('should call skip API when skip button clicked', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ role_code: 'admin' }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ step: 0, is_complete: false, skipped: false }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      await renderWithChildren()

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const skipButton = screen.getByText('Skip for now')
      await user.click(skipButton)

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/settings/onboarding/skip',
          expect.objectContaining({
            method: 'POST',
          })
        )
      })
    })

    it('should close modal after successful skip', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ role_code: 'admin' }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ step: 0, is_complete: false, skipped: false }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      })

      await renderWithChildren()

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const skipButton = screen.getByText('Skip for now')
      await user.click(skipButton)

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })

    it('should handle skip API error', async () => {
      const user = userEvent.setup()
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ role_code: 'admin' }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ step: 0, is_complete: false, skipped: false }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ message: 'Failed to skip' }),
      })

      await renderWithChildren()

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const skipButton = screen.getByText('Skip for now')
      await user.click(skipButton)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled()
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Start Wizard Navigation', () => {
    it('should navigate to wizard page when Start Setup clicked', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ role_code: 'admin' }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ step: 0, is_complete: false, skipped: false }),
      })

      await renderWithChildren()

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const startButton = screen.getByText('Start Setup')
      await user.click(startButton)

      expect(mockPush).toHaveBeenCalledWith('/settings/wizard')
    })

    it('should close modal after navigating to wizard', async () => {
      const user = userEvent.setup()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ role_code: 'admin' }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ step: 0, is_complete: false, skipped: false }),
      })

      await renderWithChildren()

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument()
      })

      const startButton = screen.getByText('Start Setup')
      await user.click(startButton)

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('API Calls', () => {
    it('should call context API first', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ role_code: 'admin' }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ step: 0, is_complete: false, skipped: false }),
      })

      await renderWithChildren()

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/v1/settings/context')
      })
    })

    it('should call status API for admin users', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ role_code: 'admin' }),
      })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({ step: 0, is_complete: false, skipped: false }),
      })

      await renderWithChildren()

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/v1/settings/onboarding/status'
        )
      })
    })

    it('should NOT call status API for non-admin users', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ role_code: 'operator' }),
      })

      await renderWithChildren()

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledTimes(1)
      })

      expect(mockFetch).not.toHaveBeenCalledWith(
        '/api/v1/settings/onboarding/status'
      )
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * - Children Rendering: 2 tests
 * - Admin Role Check: 4 tests
 * - Onboarding Status Check: 3 tests
 * - LocalStorage Dismissal: 3 tests
 * - API Error Handling: 3 tests
 * - Skip Functionality: 3 tests
 * - Start Wizard Navigation: 2 tests
 * - API Calls: 3 tests
 *
 * Total: 23 test cases
 * Expected Coverage: 85%+
 */
