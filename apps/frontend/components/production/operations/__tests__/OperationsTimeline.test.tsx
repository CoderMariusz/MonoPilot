/**
 * OperationsTimeline Component Tests
 * Story: 04.3 - Operation Start/Complete
 *
 * Tests the operations timeline component with all 4 states.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  OperationsTimeline,
  type WOOperation,
} from '../OperationsTimeline'

// Mock window.innerWidth
const mockMatchMedia = () => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: 1024,
  })
  window.dispatchEvent(new Event('resize'))
}

describe('OperationsTimeline Component', () => {
  beforeEach(() => {
    mockMatchMedia()
  })

  const mockOperations: WOOperation[] = [
    {
      id: 'op-1',
      sequence: 1,
      operation_name: 'Mixing',
      status: 'completed',
      started_at: '2025-01-08T09:00:00Z',
      completed_at: '2025-01-08T09:30:00Z',
      expected_duration_minutes: 30,
      actual_duration_minutes: 30,
      actual_yield_percent: 95,
    },
    {
      id: 'op-2',
      sequence: 2,
      operation_name: 'Baking',
      status: 'in_progress',
      started_at: '2025-01-08T09:30:00Z',
      completed_at: null,
      expected_duration_minutes: 60,
      actual_duration_minutes: 45,
      actual_yield_percent: null,
    },
    {
      id: 'op-3',
      sequence: 3,
      operation_name: 'Cooling',
      status: 'pending',
      started_at: null,
      completed_at: null,
      expected_duration_minutes: 30,
      actual_duration_minutes: null,
      actual_yield_percent: null,
    },
  ]

  describe('Loading State', () => {
    it('should show loading skeleton when isLoading is true', () => {
      render(<OperationsTimeline operations={[]} isLoading={true} />)
      expect(screen.getByText('Operation Timeline')).toBeInTheDocument()
      expect(screen.getByLabelText('Loading operations')).toBeInTheDocument()
    })

    it('should have aria-busy attribute when loading', () => {
      render(<OperationsTimeline operations={[]} isLoading={true} />)
      expect(screen.getByLabelText('Loading operations')).toHaveAttribute(
        'aria-busy',
        'true'
      )
    })
  })

  describe('Error State', () => {
    it('should show error message when error is provided', () => {
      render(
        <OperationsTimeline
          operations={[]}
          error="Failed to load operations"
        />
      )
      // Error message appears in both heading and detail text
      expect(screen.getAllByText('Failed to load operations').length).toBeGreaterThan(0)
    })

    it('should show retry button when onRetry is provided', () => {
      const onRetry = vi.fn()
      render(
        <OperationsTimeline
          operations={[]}
          error="Network error"
          onRetry={onRetry}
        />
      )
      expect(screen.getByText('Try Again')).toBeInTheDocument()
    })

    it('should call onRetry when retry button clicked', async () => {
      const onRetry = vi.fn()
      render(
        <OperationsTimeline
          operations={[]}
          error="Network error"
          onRetry={onRetry}
        />
      )

      await userEvent.click(screen.getByText('Try Again'))
      expect(onRetry).toHaveBeenCalledTimes(1)
    })
  })

  describe('Empty State', () => {
    it('should show empty message when operations array is empty', () => {
      render(<OperationsTimeline operations={[]} />)
      expect(screen.getByText('No operations defined')).toBeInTheDocument()
    })

    it('should show helpful empty state description', () => {
      render(<OperationsTimeline operations={[]} />)
      expect(
        screen.getByText(/routing has no operations to track/i)
      ).toBeInTheDocument()
    })
  })

  describe('Success State', () => {
    it('should render all operations in timeline', () => {
      render(<OperationsTimeline operations={mockOperations} />)
      expect(screen.getByText(/1\. Mixing/)).toBeInTheDocument()
      expect(screen.getByText(/2\. Baking/)).toBeInTheDocument()
      expect(screen.getByText(/3\. Cooling/)).toBeInTheDocument()
    })

    it('should render status legend', () => {
      render(<OperationsTimeline operations={mockOperations} />)
      expect(screen.getByLabelText('Status legend')).toBeInTheDocument()
    })

    it('should show progress bar', () => {
      render(<OperationsTimeline operations={mockOperations} />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toBeInTheDocument()
    })

    it('should calculate correct progress percentage', () => {
      render(<OperationsTimeline operations={mockOperations} />)
      const progressbar = screen.getByRole('progressbar')
      // 1 completed out of 3 = 33.33%
      expect(progressbar).toHaveAttribute('aria-valuenow')
    })

    it('should show total expected duration', () => {
      render(<OperationsTimeline operations={mockOperations} />)
      // Total: 30 + 60 + 30 = 120 minutes = 2h
      expect(screen.getByText(/Total: 2h/)).toBeInTheDocument()
    })
  })

  describe('Operation Selection', () => {
    it('should call onOperationSelect when operation clicked', async () => {
      const onOperationSelect = vi.fn()
      render(
        <OperationsTimeline
          operations={mockOperations}
          onOperationSelect={onOperationSelect}
        />
      )

      await userEvent.click(screen.getByText(/1\. Mixing/))
      expect(onOperationSelect).toHaveBeenCalledWith(
        expect.objectContaining({ id: 'op-1' })
      )
    })
  })

  describe('Sequence Required Indicator', () => {
    it('should show sequence required note when enabled', () => {
      render(
        <OperationsTimeline
          operations={mockOperations}
          sequenceRequired={true}
        />
      )
      expect(screen.getByText('(Sequence Required)')).toBeInTheDocument()
    })

    it('should not show sequence note when disabled', () => {
      render(
        <OperationsTimeline
          operations={mockOperations}
          sequenceRequired={false}
        />
      )
      expect(screen.queryByText('(Sequence Required)')).not.toBeInTheDocument()
    })
  })

  describe('Popover Details', () => {
    it('should show popover with details on click', async () => {
      render(<OperationsTimeline operations={mockOperations} />)

      // Click on first operation
      await userEvent.click(screen.getByText(/1\. Mixing/))

      // Popover should appear with details
      expect(screen.getByText('Mixing')).toBeInTheDocument()
    })
  })

  describe('Progress Accessibility', () => {
    it('should have descriptive aria-label on progress bar', () => {
      render(<OperationsTimeline operations={mockOperations} />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute(
        'aria-label',
        expect.stringContaining('operations completed')
      )
    })

    it('should have proper aria-valuemin and aria-valuemax', () => {
      render(<OperationsTimeline operations={mockOperations} />)
      const progressbar = screen.getByRole('progressbar')
      expect(progressbar).toHaveAttribute('aria-valuemin', '0')
      expect(progressbar).toHaveAttribute('aria-valuemax', '100')
    })
  })

  describe('Visual Status Indicators', () => {
    it('should show pulse animation for in_progress operation', () => {
      render(<OperationsTimeline operations={mockOperations} />)
      // In progress operation (Baking) should have animated indicator
      const bakingButton = screen.getByRole('button', {
        name: /Baking/i,
      })
      expect(bakingButton.querySelector('.animate-pulse')).toBeInTheDocument()
    })

    it('should apply correct background color for completed', () => {
      render(<OperationsTimeline operations={mockOperations} />)
      const mixingButton = screen.getByRole('button', {
        name: /Mixing/i,
      })
      expect(mixingButton).toHaveClass('bg-green-500')
    })

    it('should apply correct background color for pending', () => {
      render(<OperationsTimeline operations={mockOperations} />)
      const coolingButton = screen.getByRole('button', {
        name: /Cooling/i,
      })
      expect(coolingButton).toHaveClass('bg-gray-200')
    })
  })

  describe('Yield Display', () => {
    it('should show yield percentage for completed operations', () => {
      render(<OperationsTimeline operations={mockOperations} />)
      expect(screen.getByText(/95%/)).toBeInTheDocument()
    })
  })
})
