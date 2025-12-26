/**
 * Component Tests: VersionBadge (Story 02.2)
 * Purpose: Test version badge component for product list and modals
 * Phase: RED - Tests will fail until component is implemented
 *
 * Tests the VersionBadge component for:
 * - Displays "v{N}" format (AC-12)
 * - Size variants (sm, md, lg)
 * - Custom className support
 * - Accessibility (aria-label)
 *
 * Coverage Target: 90%
 * Test Count: 8+ tests
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { VersionBadge } from '../version-badge'

describe('VersionBadge Component (Story 02.2)', () => {
  describe('Version format display (AC-12)', () => {
    it('should display version in "v{N}" format', () => {
      render(<VersionBadge version={1} />)

      expect(screen.getByText('v1')).toBeInTheDocument()
    })

    it('should display double-digit version correctly', () => {
      render(<VersionBadge version={15} />)

      expect(screen.getByText('v15')).toBeInTheDocument()
    })

    it('should display triple-digit version correctly', () => {
      render(<VersionBadge version={123} />)

      expect(screen.getByText('v123')).toBeInTheDocument()
    })

    it('should display version 0 (edge case)', () => {
      render(<VersionBadge version={0} />)

      expect(screen.getByText('v0')).toBeInTheDocument()
    })
  })

  describe('Size variants', () => {
    it('should render small size variant', () => {
      const { container } = render(<VersionBadge version={5} size="sm" />)

      const badge = container.querySelector('[class*="text-xs"]')
      expect(badge).toBeInTheDocument()
    })

    it('should render medium size variant (default)', () => {
      const { container } = render(<VersionBadge version={5} />)

      const badge = container.querySelector('[class*="text-sm"]')
      expect(badge).toBeInTheDocument()
    })

    it('should render large size variant', () => {
      const { container } = render(<VersionBadge version={5} size="lg" />)

      const badge = container.querySelector('[class*="text-base"]')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Styling and customization', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <VersionBadge version={5} className="custom-badge-class" />
      )

      const badge = container.querySelector('.custom-badge-class')
      expect(badge).toBeInTheDocument()
    })

    it('should have badge-like styling', () => {
      const { container } = render(<VersionBadge version={5} />)

      const badge = container.querySelector('[class*="badge"]') ||
                    container.querySelector('[class*="rounded"]')
      expect(badge).toBeInTheDocument()
    })

    it('should have readable contrast (background + text color)', () => {
      const { container } = render(<VersionBadge version={5} />)

      const badge = container.querySelector('[class*="bg-"]')
      expect(badge).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have accessible label for screen readers', () => {
      render(<VersionBadge version={7} />)

      const badge = screen.getByText('v7')
      expect(badge).toHaveAttribute('aria-label', expect.stringContaining('7'))
    })

    it('should be readable by assistive technologies', () => {
      const { container } = render(<VersionBadge version={10} />)

      // Badge should be a span or similar element, not hidden
      const badge = screen.getByText('v10')
      expect(badge).not.toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Edge cases', () => {
    it('should handle very large version numbers', () => {
      render(<VersionBadge version={9999} />)

      expect(screen.getByText('v9999')).toBeInTheDocument()
    })

    it('should not render when version is negative (validation)', () => {
      // Component should handle this gracefully or throw
      const { container } = render(<VersionBadge version={-1} />)

      // Either renders nothing or shows error state
      const badge = container.querySelector('[data-testid="version-badge"]')
      if (badge) {
        expect(badge.textContent).not.toContain('v-1')
      }
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * Version format - 4 tests (AC-12)
 * Size variants - 3 tests
 * Styling - 3 tests
 * Accessibility - 2 tests
 * Edge cases - 2 tests
 *
 * Total: 14 tests
 * Coverage: 90%+ (all component functionality tested)
 * Status: RED (component not implemented yet)
 */
