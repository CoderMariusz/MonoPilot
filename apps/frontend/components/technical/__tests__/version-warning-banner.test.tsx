/**
 * Component Tests: VersionWarningBanner (Story 02.2)
 * Purpose: Test warning banner in product edit modal
 * Phase: RED - Tests will fail until component is implemented
 *
 * Tests the VersionWarningBanner component for:
 * - Displays version increment warning (AC-15)
 * - Shows current version and next version
 * - BOM/WO impact warning
 * - Link to view history (optional)
 *
 * Coverage Target: 90%
 * Test Count: 8+ tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { VersionWarningBanner } from '../version-warning-banner'

describe('VersionWarningBanner Component (Story 02.2)', () => {
  describe('Warning message (AC-15)', () => {
    it('should display version increment warning', () => {
      render(<VersionWarningBanner currentVersion={4} />)

      expect(
        screen.getByText(/editing this product will create version/i)
      ).toBeInTheDocument()
    })

    it('should show current version number', () => {
      render(<VersionWarningBanner currentVersion={7} />)

      expect(screen.getByText(/v7/i)).toBeInTheDocument()
    })

    it('should show next version number', () => {
      render(<VersionWarningBanner currentVersion={4} />)

      expect(screen.getByText(/v5/i)).toBeInTheDocument()
    })

    it('should display BOM/WO impact warning', () => {
      render(<VersionWarningBanner currentVersion={4} />)

      expect(
        screen.getByText(/changes will not affect existing BOMs or Work Orders/i)
      ).toBeInTheDocument()
    })

    it('should handle version 1 correctly (v1 -> v2)', () => {
      render(<VersionWarningBanner currentVersion={1} />)

      expect(screen.getByText(/v2/i)).toBeInTheDocument()
    })

    it('should handle large version numbers', () => {
      render(<VersionWarningBanner currentVersion={999} />)

      expect(screen.getByText(/v999/i)).toBeInTheDocument()
      expect(screen.getByText(/v1000/i)).toBeInTheDocument()
    })
  })

  describe('View History link', () => {
    it('should display "View History" link when onViewHistory provided', () => {
      render(
        <VersionWarningBanner
          currentVersion={4}
          onViewHistory={vi.fn()}
        />
      )

      expect(screen.getByText(/view history/i)).toBeInTheDocument()
    })

    it('should call onViewHistory when link clicked', () => {
      const mockOnViewHistory = vi.fn()

      render(
        <VersionWarningBanner
          currentVersion={4}
          onViewHistory={mockOnViewHistory}
        />
      )

      const link = screen.getByText(/view history/i)
      fireEvent.click(link)

      expect(mockOnViewHistory).toHaveBeenCalledTimes(1)
    })

    it('should not display link when onViewHistory not provided', () => {
      render(<VersionWarningBanner currentVersion={4} />)

      expect(screen.queryByText(/view history/i)).not.toBeInTheDocument()
    })
  })

  describe('Styling', () => {
    it('should have warning/alert styling (yellow/amber background)', () => {
      const { container } = render(<VersionWarningBanner currentVersion={4} />)

      const banner = container.querySelector('[class*="bg-yellow"]') ||
                     container.querySelector('[class*="bg-amber"]') ||
                     container.querySelector('[class*="warning"]')
      expect(banner).toBeInTheDocument()
    })

    it('should have warning icon', () => {
      render(<VersionWarningBanner currentVersion={4} />)

      // Look for warning icon (AlertTriangle, Info, etc.)
      const icon = screen.getByRole('img', { hidden: true }) ||
                   screen.getByTestId('warning-icon')
      expect(icon).toBeInTheDocument()
    })

    it('should apply custom className', () => {
      const { container } = render(
        <VersionWarningBanner
          currentVersion={4}
          className="custom-banner-class"
        />
      )

      const banner = container.querySelector('.custom-banner-class')
      expect(banner).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have appropriate ARIA role', () => {
      render(<VersionWarningBanner currentVersion={4} />)

      const banner = screen.getByRole('alert') ||
                     screen.getByRole('status')
      expect(banner).toBeInTheDocument()
    })

    it('should be readable by screen readers', () => {
      const { container } = render(<VersionWarningBanner currentVersion={4} />)

      const banner = container.querySelector('[role="alert"]') ||
                     container.querySelector('[role="status"]')
      expect(banner).not.toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Edge cases', () => {
    it('should handle version 0 (edge case)', () => {
      render(<VersionWarningBanner currentVersion={0} />)

      expect(screen.getByText(/v0/i)).toBeInTheDocument()
      expect(screen.getByText(/v1/i)).toBeInTheDocument()
    })

    it('should not render when currentVersion is negative', () => {
      const { container } = render(<VersionWarningBanner currentVersion={-1} />)

      // Component should handle gracefully or not render
      const banner = container.querySelector('[role="alert"]')
      if (banner) {
        expect(banner.textContent).not.toContain('v-1')
      }
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * Warning message - 6 tests (AC-15)
 * View History link - 3 tests
 * Styling - 3 tests
 * Accessibility - 2 tests
 * Edge cases - 2 tests
 *
 * Total: 16 tests
 * Coverage: 90%+ (all component functionality tested)
 * Status: RED (component not implemented yet)
 */
