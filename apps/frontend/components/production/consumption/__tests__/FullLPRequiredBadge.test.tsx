/**
 * FullLPRequiredBadge Component Tests (Story 04.6c)
 * Purpose: Test badge display for 1:1 consumption enforcement materials
 * Phase: GREEN - Tests should pass with component implementation
 *
 * Tests the FullLPRequiredBadge component which:
 * - Renders lock icon
 * - Uses correct colors for desktop variant (Yellow-900 bg, Yellow-300 text)
 * - Uses correct colors for scanner variant (Yellow-600 bg, Yellow-900 text)
 * - Has proper aria-label for accessibility
 *
 * Coverage Target: 90%+
 *
 * Acceptance Criteria Coverage:
 * - AC-04.6c.7: Full LP Required Badge display
 * - AC-04.6c.8: Badge color variants
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { FullLPRequiredBadge } from '../FullLPRequiredBadge'

describe('FullLPRequiredBadge Component (Story 04.6c)', () => {
  // ============================================================================
  // Basic Rendering
  // ============================================================================
  describe('Basic Rendering', () => {
    it('should render "Full LP Required" text', () => {
      render(<FullLPRequiredBadge />)
      expect(screen.getByText('Full LP Required')).toBeInTheDocument()
    })

    it('should render lock icon', () => {
      render(<FullLPRequiredBadge />)
      expect(screen.getByTestId('lock-icon')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Desktop Variant Colors (AC-04.6c.8)
  // ============================================================================
  describe('Desktop Variant', () => {
    it('should use Yellow-900 background for desktop variant', () => {
      render(<FullLPRequiredBadge variant="desktop" />)
      const badge = screen.getByText('Full LP Required').closest('div')
      expect(badge).toHaveClass('bg-yellow-900')
    })

    it('should use Yellow-300 text for desktop variant', () => {
      render(<FullLPRequiredBadge variant="desktop" />)
      const badge = screen.getByText('Full LP Required').closest('div')
      expect(badge).toHaveClass('text-yellow-300')
    })

    it('should use 12px font size for desktop variant', () => {
      render(<FullLPRequiredBadge variant="desktop" />)
      const badge = screen.getByText('Full LP Required').closest('div')
      expect(badge).toHaveClass('text-xs')
    })

    it('should render 16px lock icon for desktop', () => {
      render(<FullLPRequiredBadge variant="desktop" />)
      const icon = screen.getByTestId('lock-icon')
      expect(icon).toHaveClass('h-4', 'w-4')
    })

    it('should default to desktop variant when not specified', () => {
      render(<FullLPRequiredBadge />)
      const badge = screen.getByText('Full LP Required').closest('div')
      expect(badge).toHaveClass('bg-yellow-900')
      expect(badge).toHaveClass('text-yellow-300')
    })
  })

  // ============================================================================
  // Scanner Variant Colors (AC-04.6c.8)
  // ============================================================================
  describe('Scanner Variant', () => {
    it('should use Yellow-600 background for scanner variant', () => {
      render(<FullLPRequiredBadge variant="scanner" />)
      const badge = screen.getByText('Full LP Required').closest('div')
      expect(badge).toHaveClass('bg-yellow-600')
    })

    it('should use Yellow-900 text for scanner variant', () => {
      render(<FullLPRequiredBadge variant="scanner" />)
      const badge = screen.getByText('Full LP Required').closest('div')
      expect(badge).toHaveClass('text-yellow-900')
    })

    it('should use 14px font size for scanner variant', () => {
      render(<FullLPRequiredBadge variant="scanner" />)
      const badge = screen.getByText('Full LP Required').closest('div')
      expect(badge).toHaveClass('text-sm')
    })

    it('should render 20px lock icon for scanner', () => {
      render(<FullLPRequiredBadge variant="scanner" />)
      const icon = screen.getByTestId('lock-icon')
      expect(icon).toHaveClass('h-5', 'w-5')
    })
  })

  // ============================================================================
  // Size Variants
  // ============================================================================
  describe('Size Variants', () => {
    it('should render small size', () => {
      render(<FullLPRequiredBadge size="small" />)
      const badge = screen.getByText('Full LP Required').closest('div')
      expect(badge).toHaveClass('px-1.5', 'py-0.5')
    })

    it('should render medium size (default)', () => {
      render(<FullLPRequiredBadge size="medium" />)
      const badge = screen.getByText('Full LP Required').closest('div')
      expect(badge).toHaveClass('px-2', 'py-1')
    })
  })

  // ============================================================================
  // Accessibility (AC-04.6c.9)
  // ============================================================================
  describe('Accessibility', () => {
    it('should have aria-label="Full LP Required"', () => {
      render(<FullLPRequiredBadge />)
      expect(screen.getByLabelText('Full LP Required')).toBeInTheDocument()
    })

    it('should have lock icon with aria-hidden="true"', () => {
      render(<FullLPRequiredBadge />)
      const icon = screen.getByTestId('lock-icon')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })

    it('should be focusable for keyboard navigation', () => {
      render(<FullLPRequiredBadge />)
      const badge = screen.getByLabelText('Full LP Required')
      expect(badge).toHaveAttribute('tabIndex', '0')
    })
  })

  // ============================================================================
  // Integration with Materials Table
  // ============================================================================
  describe('Integration', () => {
    it('should render inline with material name', () => {
      render(
        <div>
          <span>Water</span>
          <FullLPRequiredBadge />
        </div>
      )
      expect(screen.getByText('Water')).toBeInTheDocument()
      expect(screen.getByText('Full LP Required')).toBeInTheDocument()
    })
  })
})
