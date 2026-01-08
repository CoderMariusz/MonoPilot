/**
 * OperationCard Component Tests
 * Story: 04.3 - Operation Start/Complete
 *
 * Tests the operation card component with all states and actions.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OperationCard, type WOOperation } from '../OperationCard'

describe('OperationCard Component', () => {
  const mockPendingOperation: WOOperation = {
    id: 'op-1',
    sequence: 1,
    operation_name: 'Mixing',
    status: 'pending',
    started_at: null,
    completed_at: null,
    expected_duration_minutes: 30,
    actual_duration_minutes: null,
    actual_yield_percent: null,
    machine_name: 'Mixer A',
  }

  const mockInProgressOperation: WOOperation = {
    id: 'op-2',
    sequence: 2,
    operation_name: 'Baking',
    status: 'in_progress',
    started_at: '2025-01-08T09:00:00Z',
    completed_at: null,
    expected_duration_minutes: 60,
    actual_duration_minutes: 45,
    actual_yield_percent: null,
    started_by_user: {
      first_name: 'John',
      last_name: 'Smith',
    },
  }

  const mockCompletedOperation: WOOperation = {
    id: 'op-3',
    sequence: 3,
    operation_name: 'Cooling',
    status: 'completed',
    started_at: '2025-01-08T09:00:00Z',
    completed_at: '2025-01-08T10:00:00Z',
    expected_duration_minutes: 60,
    actual_duration_minutes: 65,
    actual_yield_percent: 95.5,
    completed_by_user: {
      first_name: 'Jane',
      last_name: 'Doe',
    },
  }

  const mockSkippedOperation: WOOperation = {
    ...mockPendingOperation,
    id: 'op-4',
    sequence: 4,
    operation_name: 'Packaging',
    status: 'skipped',
  }

  describe('Pending Operation', () => {
    it('should render operation name and sequence', () => {
      render(
        <OperationCard
          operation={mockPendingOperation}
          canStart={true}
          canComplete={false}
          onStart={() => {}}
          onComplete={() => {}}
        />
      )
      expect(screen.getByText('Mixing')).toBeInTheDocument()
      expect(screen.getByText('1')).toBeInTheDocument()
    })

    it('should show Pending status badge', () => {
      render(
        <OperationCard
          operation={mockPendingOperation}
          canStart={true}
          canComplete={false}
          onStart={() => {}}
          onComplete={() => {}}
        />
      )
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })

    it('should show Start button when canStart is true', () => {
      render(
        <OperationCard
          operation={mockPendingOperation}
          canStart={true}
          canComplete={false}
          onStart={() => {}}
          onComplete={() => {}}
        />
      )
      expect(screen.getByRole('button', { name: /Start/i })).toBeEnabled()
    })

    it('should disable Start button when canStart is false', () => {
      render(
        <OperationCard
          operation={mockPendingOperation}
          canStart={false}
          canComplete={false}
          onStart={() => {}}
          onComplete={() => {}}
        />
      )
      expect(screen.getByRole('button', { name: /Start/i })).toBeDisabled()
    })

    it('should call onStart when Start clicked', async () => {
      const onStart = vi.fn()
      render(
        <OperationCard
          operation={mockPendingOperation}
          canStart={true}
          canComplete={false}
          onStart={onStart}
          onComplete={() => {}}
        />
      )

      await userEvent.click(screen.getByRole('button', { name: /Start/i }))
      expect(onStart).toHaveBeenCalledTimes(1)
    })

    it('should show machine name if provided', () => {
      render(
        <OperationCard
          operation={mockPendingOperation}
          canStart={true}
          canComplete={false}
          onStart={() => {}}
          onComplete={() => {}}
        />
      )
      expect(screen.getByText(/Mixer A/)).toBeInTheDocument()
    })

    it('should show expected duration', () => {
      render(
        <OperationCard
          operation={mockPendingOperation}
          canStart={true}
          canComplete={false}
          onStart={() => {}}
          onComplete={() => {}}
        />
      )
      expect(screen.getByText(/30m/)).toBeInTheDocument()
    })
  })

  describe('In Progress Operation', () => {
    it('should show In Progress status badge', () => {
      render(
        <OperationCard
          operation={mockInProgressOperation}
          canStart={false}
          canComplete={true}
          onStart={() => {}}
          onComplete={() => {}}
        />
      )
      expect(screen.getByText('In Progress')).toBeInTheDocument()
    })

    it('should show Complete button when canComplete is true', () => {
      render(
        <OperationCard
          operation={mockInProgressOperation}
          canStart={false}
          canComplete={true}
          onStart={() => {}}
          onComplete={() => {}}
        />
      )
      expect(screen.getByRole('button', { name: /Complete/i })).toBeEnabled()
    })

    it('should call onComplete when Complete clicked', async () => {
      const onComplete = vi.fn()
      render(
        <OperationCard
          operation={mockInProgressOperation}
          canStart={false}
          canComplete={true}
          onStart={() => {}}
          onComplete={onComplete}
        />
      )

      await userEvent.click(screen.getByRole('button', { name: /Complete/i }))
      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it('should show started_by_user name', () => {
      render(
        <OperationCard
          operation={mockInProgressOperation}
          canStart={false}
          canComplete={true}
          onStart={() => {}}
          onComplete={() => {}}
        />
      )
      expect(screen.getByText(/John S\./)).toBeInTheDocument()
    })

    it('should show duration display', () => {
      render(
        <OperationCard
          operation={mockInProgressOperation}
          canStart={false}
          canComplete={true}
          onStart={() => {}}
          onComplete={() => {}}
        />
      )
      expect(screen.getByText(/Expected: 1h/)).toBeInTheDocument()
    })
  })

  describe('Completed Operation', () => {
    it('should show Completed status badge', () => {
      render(
        <OperationCard
          operation={mockCompletedOperation}
          canStart={false}
          canComplete={false}
          onStart={() => {}}
          onComplete={() => {}}
        />
      )
      expect(screen.getByText('Completed')).toBeInTheDocument()
    })

    it('should show yield percentage', () => {
      render(
        <OperationCard
          operation={mockCompletedOperation}
          canStart={false}
          canComplete={false}
          onStart={() => {}}
          onComplete={() => {}}
        />
      )
      expect(screen.getByText('95.5%')).toBeInTheDocument()
    })

    it('should show Details button when onClick provided', () => {
      render(
        <OperationCard
          operation={mockCompletedOperation}
          canStart={false}
          canComplete={false}
          onStart={() => {}}
          onComplete={() => {}}
          onClick={() => {}}
        />
      )
      expect(screen.getByRole('button', { name: /Details/i })).toBeInTheDocument()
    })

    it('should show duration with variance', () => {
      render(
        <OperationCard
          operation={mockCompletedOperation}
          canStart={false}
          canComplete={false}
          onStart={() => {}}
          onComplete={() => {}}
        />
      )
      expect(screen.getByText(/Actual: 1h 5m/)).toBeInTheDocument()
    })
  })

  describe('Skipped Operation', () => {
    it('should show Skipped status badge', () => {
      render(
        <OperationCard
          operation={mockSkippedOperation}
          canStart={false}
          canComplete={false}
          onStart={() => {}}
          onComplete={() => {}}
        />
      )
      expect(screen.getByText('Skipped')).toBeInTheDocument()
    })
  })

  describe('Sequence Blocked State', () => {
    it('should show sequence block reason', () => {
      render(
        <OperationCard
          operation={mockPendingOperation}
          canStart={false}
          canComplete={false}
          onStart={() => {}}
          onComplete={() => {}}
          sequenceBlocked={true}
          sequenceBlockReason="Complete Mixing first"
        />
      )
      expect(screen.getByText('Complete Mixing first')).toBeInTheDocument()
    })

    it('should show tooltip on disabled Start button', async () => {
      render(
        <OperationCard
          operation={mockPendingOperation}
          canStart={false}
          canComplete={false}
          onStart={() => {}}
          onComplete={() => {}}
          sequenceBlocked={true}
          sequenceBlockReason="Complete Mixing first"
        />
      )

      // Tooltip should have aria-describedby pointing to reason
      const button = screen.getByRole('button', { name: /Start/i })
      expect(button).toHaveAttribute('aria-describedby')
    })
  })

  describe('Card Interaction', () => {
    it('should call onClick when card body clicked', async () => {
      const onClick = vi.fn()
      render(
        <OperationCard
          operation={mockCompletedOperation}
          canStart={false}
          canComplete={false}
          onStart={() => {}}
          onComplete={() => {}}
          onClick={onClick}
        />
      )

      // Click on operation name (card body)
      await userEvent.click(screen.getByText('Cooling'))
      expect(onClick).toHaveBeenCalledTimes(1)
    })

    it('should not call onClick when button clicked', async () => {
      const onClick = vi.fn()
      const onComplete = vi.fn()
      render(
        <OperationCard
          operation={mockInProgressOperation}
          canStart={false}
          canComplete={true}
          onStart={() => {}}
          onComplete={onComplete}
          onClick={onClick}
        />
      )

      await userEvent.click(screen.getByRole('button', { name: /Complete/i }))
      expect(onComplete).toHaveBeenCalledTimes(1)
      expect(onClick).not.toHaveBeenCalled()
    })

    it('should be keyboard accessible when onClick provided', () => {
      const onClick = vi.fn()
      render(
        <OperationCard
          operation={mockCompletedOperation}
          canStart={false}
          canComplete={false}
          onStart={() => {}}
          onComplete={() => {}}
          onClick={onClick}
        />
      )

      const card = screen.getByRole('button', { name: /Operation 3/i })
      expect(card).toHaveAttribute('tabindex', '0')
    })
  })

  describe('Accessibility', () => {
    it('should have descriptive aria-label on card', () => {
      render(
        <OperationCard
          operation={mockPendingOperation}
          canStart={true}
          canComplete={false}
          onStart={() => {}}
          onComplete={() => {}}
          onClick={() => {}}
        />
      )
      expect(
        screen.getByLabelText(/Operation 1: Mixing, status pending/i)
      ).toBeInTheDocument()
    })
  })
})
