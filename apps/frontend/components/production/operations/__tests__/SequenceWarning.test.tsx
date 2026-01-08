/**
 * SequenceWarning Component Tests
 * Story: 04.3 - Operation Start/Complete
 *
 * Tests the sequence warning alert component.
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SequenceWarning } from '../SequenceWarning'

describe('SequenceWarning Component', () => {
  const mockBlockedOperation = {
    id: 'op-2',
    sequence: 2,
    operation_name: 'Baking',
  }

  const mockBlockingOperations = [
    {
      id: 'op-1',
      sequence: 1,
      operation_name: 'Mixing',
      status: 'in_progress' as const,
    },
  ]

  describe('Rendering', () => {
    it('should display warning title', () => {
      render(
        <SequenceWarning
          blockedOperation={mockBlockedOperation}
          blockingOperations={mockBlockingOperations}
        />
      )
      expect(screen.getByText('Sequence Required')).toBeInTheDocument()
    })

    it('should display blocked operation name', () => {
      render(
        <SequenceWarning
          blockedOperation={mockBlockedOperation}
          blockingOperations={mockBlockingOperations}
        />
      )
      expect(screen.getByText(/Cannot start "Baking" yet/)).toBeInTheDocument()
    })

    it('should list blocking operations', () => {
      render(
        <SequenceWarning
          blockedOperation={mockBlockedOperation}
          blockingOperations={mockBlockingOperations}
        />
      )
      expect(screen.getByText(/1\. Mixing/)).toBeInTheDocument()
    })

    it('should show status badge for blocking operations', () => {
      render(
        <SequenceWarning
          blockedOperation={mockBlockedOperation}
          blockingOperations={mockBlockingOperations}
        />
      )
      expect(screen.getByText('In Progress')).toBeInTheDocument()
    })

    it('should display multiple blocking operations', () => {
      const multipleBlocking = [
        {
          id: 'op-1',
          sequence: 1,
          operation_name: 'Mixing',
          status: 'pending' as const,
        },
        {
          id: 'op-2',
          sequence: 2,
          operation_name: 'Heating',
          status: 'pending' as const,
        },
      ]

      render(
        <SequenceWarning
          blockedOperation={{ id: 'op-3', sequence: 3, operation_name: 'Cooling' }}
          blockingOperations={multipleBlocking}
        />
      )

      expect(screen.getByText(/1\. Mixing/)).toBeInTheDocument()
      expect(screen.getByText(/2\. Heating/)).toBeInTheDocument()
    })
  })

  describe('Dismiss Button', () => {
    it('should show dismiss button when onDismiss provided', () => {
      const onDismiss = vi.fn()
      render(
        <SequenceWarning
          blockedOperation={mockBlockedOperation}
          blockingOperations={mockBlockingOperations}
          onDismiss={onDismiss}
        />
      )
      expect(screen.getByText('OK, Got It')).toBeInTheDocument()
    })

    it('should not show dismiss button when onDismiss not provided', () => {
      render(
        <SequenceWarning
          blockedOperation={mockBlockedOperation}
          blockingOperations={mockBlockingOperations}
        />
      )
      expect(screen.queryByText('OK, Got It')).not.toBeInTheDocument()
    })

    it('should call onDismiss when button clicked', async () => {
      const onDismiss = vi.fn()
      render(
        <SequenceWarning
          blockedOperation={mockBlockedOperation}
          blockingOperations={mockBlockingOperations}
          onDismiss={onDismiss}
        />
      )

      await userEvent.click(screen.getByText('OK, Got It'))
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })
  })

  describe('Keyboard Interaction', () => {
    it('should dismiss on Escape key', () => {
      const onDismiss = vi.fn()
      render(
        <SequenceWarning
          blockedOperation={mockBlockedOperation}
          blockingOperations={mockBlockingOperations}
          onDismiss={onDismiss}
        />
      )

      fireEvent.keyDown(document, { key: 'Escape' })
      expect(onDismiss).toHaveBeenCalledTimes(1)
    })

    it('should not dismiss on other keys', () => {
      const onDismiss = vi.fn()
      render(
        <SequenceWarning
          blockedOperation={mockBlockedOperation}
          blockingOperations={mockBlockingOperations}
          onDismiss={onDismiss}
        />
      )

      fireEvent.keyDown(document, { key: 'Enter' })
      expect(onDismiss).not.toHaveBeenCalled()
    })
  })

  describe('Accessibility', () => {
    it('should have role="alert"', () => {
      render(
        <SequenceWarning
          blockedOperation={mockBlockedOperation}
          blockingOperations={mockBlockingOperations}
        />
      )
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should have aria-live="assertive"', () => {
      render(
        <SequenceWarning
          blockedOperation={mockBlockedOperation}
          blockingOperations={mockBlockingOperations}
        />
      )
      expect(screen.getByRole('alert')).toHaveAttribute(
        'aria-live',
        'assertive'
      )
    })

    it('should auto-focus dismiss button', () => {
      const onDismiss = vi.fn()
      render(
        <SequenceWarning
          blockedOperation={mockBlockedOperation}
          blockingOperations={mockBlockingOperations}
          onDismiss={onDismiss}
        />
      )

      // Button should receive focus
      expect(document.activeElement).toBe(screen.getByText('OK, Got It'))
    })
  })

  describe('Empty Blocking Operations', () => {
    it('should not show list header when no blocking operations', () => {
      render(
        <SequenceWarning
          blockedOperation={mockBlockedOperation}
          blockingOperations={[]}
        />
      )
      expect(
        screen.queryByText('Complete these operations first:')
      ).not.toBeInTheDocument()
    })
  })
})
