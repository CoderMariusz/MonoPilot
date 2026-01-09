/**
 * ReservationStatusBadge Component Tests
 * Story 03.11b: WO Material Reservations (LP Allocation)
 *
 * Tests coverage status display:
 * - Full coverage (100%)
 * - Partial coverage (1-99%)
 * - No coverage (0%)
 * - Over-reserved (>100%)
 * - Tooltip display
 * - Accessibility
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ReservationStatusBadge } from '../ReservationStatusBadge'

describe('ReservationStatusBadge (Story 03.11b)', () => {
  // ===========================================================================
  // Full Coverage (100%)
  // ===========================================================================
  describe('Full Coverage (100%)', () => {
    it('should display "Full 100%" for exact match', () => {
      render(
        <ReservationStatusBadge
          requiredQty={100}
          reservedQty={100}
          uom="KG"
        />
      )

      expect(screen.getByText('Full')).toBeInTheDocument()
      expect(screen.getByText('100%')).toBeInTheDocument()
    })

    it('should use green color for full coverage', () => {
      render(
        <ReservationStatusBadge
          requiredQty={100}
          reservedQty={100}
          uom="KG"
        />
      )

      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-green-100')
      expect(badge).toHaveClass('text-green-800')
    })

    it('should show check icon for full coverage', () => {
      render(
        <ReservationStatusBadge
          requiredQty={100}
          reservedQty={100}
          uom="KG"
        />
      )

      // CheckCircle2 icon should be present
      const badge = screen.getByRole('status')
      const svg = badge.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Partial Coverage (1-99%)
  // ===========================================================================
  describe('Partial Coverage (1-99%)', () => {
    it('should display "Partial 80%" for 80/100', () => {
      render(
        <ReservationStatusBadge
          requiredQty={100}
          reservedQty={80}
          uom="KG"
        />
      )

      expect(screen.getByText('Partial')).toBeInTheDocument()
      expect(screen.getByText('80%')).toBeInTheDocument()
    })

    it('should use yellow color for partial coverage', () => {
      render(
        <ReservationStatusBadge
          requiredQty={100}
          reservedQty={50}
          uom="KG"
        />
      )

      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-yellow-100')
      expect(badge).toHaveClass('text-yellow-800')
    })

    it('should show warning icon for partial coverage', () => {
      render(
        <ReservationStatusBadge
          requiredQty={100}
          reservedQty={50}
          uom="KG"
        />
      )

      const badge = screen.getByRole('status')
      const svg = badge.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })

    it('should round percentage correctly', () => {
      render(
        <ReservationStatusBadge
          requiredQty={100}
          reservedQty={33.33}
          uom="KG"
        />
      )

      expect(screen.getByText('33%')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // No Coverage (0%)
  // ===========================================================================
  describe('No Coverage (0%)', () => {
    it('should display "None 0%" when nothing reserved', () => {
      render(
        <ReservationStatusBadge
          requiredQty={100}
          reservedQty={0}
          uom="KG"
        />
      )

      expect(screen.getByText('None')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('should use gray color for no coverage', () => {
      render(
        <ReservationStatusBadge
          requiredQty={100}
          reservedQty={0}
          uom="KG"
        />
      )

      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-gray-100')
      expect(badge).toHaveClass('text-gray-800')
    })
  })

  // ===========================================================================
  // Over-Reserved (>100%)
  // ===========================================================================
  describe('Over-Reserved (>100%)', () => {
    it('should display "Over 120%" for over-reservation', () => {
      render(
        <ReservationStatusBadge
          requiredQty={100}
          reservedQty={120}
          uom="KG"
        />
      )

      expect(screen.getByText('Over')).toBeInTheDocument()
      expect(screen.getByText('120%')).toBeInTheDocument()
    })

    it('should use blue color for over-reservation', () => {
      render(
        <ReservationStatusBadge
          requiredQty={100}
          reservedQty={150}
          uom="KG"
        />
      )

      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('bg-blue-100')
      expect(badge).toHaveClass('text-blue-800')
    })
  })

  // ===========================================================================
  // Edge Cases
  // ===========================================================================
  describe('Edge Cases', () => {
    it('should handle zero required quantity', () => {
      render(
        <ReservationStatusBadge
          requiredQty={0}
          reservedQty={0}
          uom="KG"
        />
      )

      expect(screen.getByText('None')).toBeInTheDocument()
      expect(screen.getByText('0%')).toBeInTheDocument()
    })

    it('should handle very small quantities', () => {
      render(
        <ReservationStatusBadge
          requiredQty={0.001}
          reservedQty={0.001}
          uom="KG"
        />
      )

      expect(screen.getByText('Full')).toBeInTheDocument()
    })

    it('should handle large quantities', () => {
      render(
        <ReservationStatusBadge
          requiredQty={10000000}
          reservedQty={5000000}
          uom="KG"
        />
      )

      expect(screen.getByText('Partial')).toBeInTheDocument()
      expect(screen.getByText('50%')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Size Variants
  // ===========================================================================
  describe('Size Variants', () => {
    it('should render default size', () => {
      render(
        <ReservationStatusBadge
          requiredQty={100}
          reservedQty={100}
          uom="KG"
          size="default"
        />
      )

      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('text-xs')
    })

    it('should render large size', () => {
      render(
        <ReservationStatusBadge
          requiredQty={100}
          reservedQty={100}
          uom="KG"
          size="large"
        />
      )

      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('text-sm')
    })
  })

  // ===========================================================================
  // Accessibility
  // ===========================================================================
  describe('Accessibility', () => {
    it('should have role="status"', () => {
      render(
        <ReservationStatusBadge
          requiredQty={100}
          reservedQty={80}
          uom="KG"
        />
      )

      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should have descriptive aria-label', () => {
      render(
        <ReservationStatusBadge
          requiredQty={100}
          reservedQty={80}
          uom="KG"
        />
      )

      const badge = screen.getByRole('status')
      expect(badge).toHaveAttribute('aria-label', expect.stringContaining('Partial'))
      expect(badge).toHaveAttribute('aria-label', expect.stringContaining('80%'))
    })

    it('should hide icon from screen readers', () => {
      render(
        <ReservationStatusBadge
          requiredQty={100}
          reservedQty={80}
          uom="KG"
        />
      )

      const badge = screen.getByRole('status')
      const svg = badge.querySelector('svg')
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    })
  })

  // ===========================================================================
  // Tooltip
  // ===========================================================================
  describe('Tooltip', () => {
    it('should show tooltip by default', () => {
      render(
        <ReservationStatusBadge
          requiredQty={100}
          reservedQty={80}
          uom="KG"
          showTooltip={true}
        />
      )

      // Tooltip trigger should be present
      expect(screen.getByRole('status')).toBeInTheDocument()
    })

    it('should hide tooltip when showTooltip=false', () => {
      render(
        <ReservationStatusBadge
          requiredQty={100}
          reservedQty={80}
          uom="KG"
          showTooltip={false}
        />
      )

      // Badge should still render
      expect(screen.getByRole('status')).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // Custom className
  // ===========================================================================
  describe('Custom className', () => {
    it('should accept custom className', () => {
      render(
        <ReservationStatusBadge
          requiredQty={100}
          reservedQty={80}
          uom="KG"
          className="custom-class"
        />
      )

      const badge = screen.getByRole('status')
      expect(badge).toHaveClass('custom-class')
    })
  })
})
