/**
 * Availability Traffic Light Component - Unit Tests (Story 03.13)
 * Tests visual indicator for material availability status
 *
 * Coverage Target: 90%
 * Test Count: 15 tests
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { AvailabilityTrafficLight } from '../AvailabilityTrafficLight'

describe('AvailabilityTrafficLight Component (Story 03.13)', () => {
  describe('Status Colors (AC-4)', () => {
    it('should render green indicator for sufficient status', () => {
      render(<AvailabilityTrafficLight status="sufficient" showTooltip={false} />)

      const indicator = screen.getByTestId('traffic-light-sufficient')
      expect(indicator).toHaveClass('bg-green-500')
    })

    it('should render yellow indicator for low_stock status', () => {
      render(<AvailabilityTrafficLight status="low_stock" showTooltip={false} />)

      const indicator = screen.getByTestId('traffic-light-low_stock')
      expect(indicator).toHaveClass('bg-yellow-500')
    })

    it('should render red indicator for shortage status', () => {
      render(<AvailabilityTrafficLight status="shortage" showTooltip={false} />)

      const indicator = screen.getByTestId('traffic-light-shortage')
      expect(indicator).toHaveClass('bg-red-500')
    })

    it('should render red outline for no_stock status', () => {
      render(<AvailabilityTrafficLight status="no_stock" showTooltip={false} />)

      const indicator = screen.getByTestId('traffic-light-no_stock')
      expect(indicator).toHaveClass('border-red-500')
      expect(indicator).toHaveClass('bg-transparent')
    })
  })

  describe('Size Variants', () => {
    it('should apply small size class', () => {
      render(<AvailabilityTrafficLight status="sufficient" size="sm" showTooltip={false} />)

      const indicator = screen.getByTestId('traffic-light-sufficient')
      expect(indicator).toHaveClass('h-4', 'w-4')
    })

    it('should apply medium size class', () => {
      render(<AvailabilityTrafficLight status="sufficient" size="md" showTooltip={false} />)

      const indicator = screen.getByTestId('traffic-light-sufficient')
      expect(indicator).toHaveClass('h-6', 'w-6')
    })

    it('should apply large size class', () => {
      render(<AvailabilityTrafficLight status="sufficient" size="lg" showTooltip={false} />)

      const indicator = screen.getByTestId('traffic-light-sufficient')
      expect(indicator).toHaveClass('h-8', 'w-8')
    })

    it('should default to small size', () => {
      render(<AvailabilityTrafficLight status="sufficient" showTooltip={false} />)

      const indicator = screen.getByTestId('traffic-light-sufficient')
      expect(indicator).toHaveClass('h-4', 'w-4')
    })
  })

  describe('Accessibility', () => {
    it('should have role="img" for accessibility', () => {
      render(<AvailabilityTrafficLight status="sufficient" showTooltip={false} />)

      const indicator = screen.getByRole('img')
      expect(indicator).toBeInTheDocument()
    })

    it('should have aria-label with status description', () => {
      render(<AvailabilityTrafficLight status="sufficient" showTooltip={false} />)

      const indicator = screen.getByRole('img')
      expect(indicator).toHaveAttribute('aria-label')
      expect(indicator.getAttribute('aria-label')).toContain('Sufficient')
    })

    it('should include coverage percent in aria-label when provided', () => {
      render(
        <AvailabilityTrafficLight
          status="low_stock"
          coveragePercent={75}
          showTooltip={false}
        />
      )

      const indicator = screen.getByRole('img')
      expect(indicator.getAttribute('aria-label')).toContain('75%')
    })
  })

  describe('Tooltip', () => {
    it('should render without tooltip when showTooltip=false', () => {
      render(<AvailabilityTrafficLight status="sufficient" showTooltip={false} />)

      // When tooltip is disabled, no wrapper with min-w-[48px] should exist
      const indicator = screen.getByTestId('traffic-light-sufficient')
      expect(indicator.parentElement).not.toHaveClass('min-w-[48px]')
    })

    it('should render with tooltip wrapper when showTooltip=true', () => {
      render(<AvailabilityTrafficLight status="sufficient" showTooltip={true} />)

      // The indicator should be wrapped in a tooltip container
      const indicator = screen.getByTestId('traffic-light-sufficient')
      // Check the wrapper has min-w for touch target
      expect(indicator.closest('.min-w-\\[48px\\]')).toBeInTheDocument()
    })
  })

  describe('Custom className', () => {
    it('should apply custom className', () => {
      render(
        <AvailabilityTrafficLight
          status="sufficient"
          showTooltip={false}
          className="custom-class"
        />
      )

      const indicator = screen.getByTestId('traffic-light-sufficient')
      expect(indicator).toHaveClass('custom-class')
    })
  })
})
