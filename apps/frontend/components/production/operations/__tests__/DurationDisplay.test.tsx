/**
 * DurationDisplay Component Tests
 * Story: 04.3 - Operation Start/Complete
 *
 * Tests the duration display component with variance calculations.
 */

import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DurationDisplay, formatDuration } from '../DurationDisplay'

describe('DurationDisplay Component', () => {
  describe('formatDuration', () => {
    it('should return "-" for null', () => {
      expect(formatDuration(null)).toBe('-')
    })

    it('should format minutes under 60', () => {
      expect(formatDuration(30)).toBe('30m')
      expect(formatDuration(45)).toBe('45m')
    })

    it('should format hours', () => {
      expect(formatDuration(60)).toBe('1h')
      expect(formatDuration(120)).toBe('2h')
    })

    it('should format hours and minutes', () => {
      expect(formatDuration(90)).toBe('1h 30m')
      expect(formatDuration(150)).toBe('2h 30m')
    })
  })

  describe('Duration Display Rendering', () => {
    it('should display expected and actual durations', () => {
      render(<DurationDisplay expected={30} actual={45} />)
      expect(screen.getByText(/Expected: 30m/)).toBeInTheDocument()
      expect(screen.getByText(/Actual: 45m/)).toBeInTheDocument()
    })

    it('should handle null expected duration', () => {
      render(<DurationDisplay expected={null} actual={45} />)
      expect(screen.getByText(/Expected: -/)).toBeInTheDocument()
    })

    it('should handle null actual duration', () => {
      render(<DurationDisplay expected={30} actual={null} />)
      expect(screen.getByText(/Actual: -/)).toBeInTheDocument()
    })
  })

  describe('Variance Indicator', () => {
    it('should show green for under expected', () => {
      render(<DurationDisplay expected={60} actual={50} />)
      // Under expected = green
      const container = screen.getByLabelText(/Expected.*Actual/i)
      expect(container.querySelector('.text-green-600')).toBeInTheDocument()
    })

    it('should show gray for slightly over (1-10%)', () => {
      render(<DurationDisplay expected={100} actual={105} />)
      const container = screen.getByLabelText(/Expected.*Actual/i)
      expect(container.querySelector('.text-gray-600')).toBeInTheDocument()
    })

    it('should show yellow for moderately over (11-25%)', () => {
      render(<DurationDisplay expected={100} actual={120} />)
      const container = screen.getByLabelText(/Expected.*Actual/i)
      expect(container.querySelector('.text-yellow-600')).toBeInTheDocument()
    })

    it('should show red for significantly over (>25%)', () => {
      render(<DurationDisplay expected={100} actual={150} />)
      const container = screen.getByLabelText(/Expected.*Actual/i)
      expect(container.querySelector('.text-red-600')).toBeInTheDocument()
    })

    it('should hide variance when showVariance is false', () => {
      render(<DurationDisplay expected={30} actual={45} showVariance={false} />)
      expect(screen.queryByText(/over/)).not.toBeInTheDocument()
    })
  })

  describe('Size Variants', () => {
    it('should apply small text size', () => {
      render(<DurationDisplay expected={30} actual={45} size="sm" />)
      const container = screen.getByLabelText(/Expected.*Actual/i)
      expect(container).toHaveClass('text-xs')
    })

    it('should apply medium text size (default)', () => {
      render(<DurationDisplay expected={30} actual={45} />)
      const container = screen.getByLabelText(/Expected.*Actual/i)
      expect(container).toHaveClass('text-sm')
    })

    it('should apply large text size', () => {
      render(<DurationDisplay expected={30} actual={45} size="lg" />)
      const container = screen.getByLabelText(/Expected.*Actual/i)
      expect(container).toHaveClass('text-base')
    })
  })

  describe('Accessibility', () => {
    it('should have descriptive aria-label', () => {
      render(<DurationDisplay expected={30} actual={45} />)
      expect(
        screen.getByLabelText(/Expected: 30m, Actual: 45m/i)
      ).toBeInTheDocument()
    })

    it('should include variance in aria-label', () => {
      render(<DurationDisplay expected={30} actual={45} />)
      const container = screen.getByLabelText(/\+50%/i)
      expect(container).toBeInTheDocument()
    })
  })
})
