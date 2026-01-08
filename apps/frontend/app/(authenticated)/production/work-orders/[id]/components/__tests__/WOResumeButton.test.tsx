/**
 * WOResumeButton Component Tests
 * Story: 04.2b - WO Pause/Resume
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WOResumeButton } from '../WOResumeButton'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('WOResumeButton Component', () => {
  const mockPause = {
    id: 'pause-1',
    paused_at: new Date().toISOString(),
    pause_reason: 'machine_breakdown' as const,
    notes: 'Awaiting parts',
    paused_by_user: {
      id: 'user-1',
      full_name: 'John Doe',
    },
  }

  const defaultProps = {
    workOrderId: 'wo-123',
    workOrderNumber: 'WO-2025-0001',
    workOrderStatus: 'paused' as const,
    currentPause: mockPause,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'wo-123', status: 'in_progress' } }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Visibility', () => {
    it('should render when status=paused', () => {
      render(<WOResumeButton {...defaultProps} />)

      expect(screen.getByRole('button', { name: /resume/i })).toBeInTheDocument()
    })

    it('should NOT render when status=in_progress', () => {
      render(<WOResumeButton {...defaultProps} workOrderStatus="in_progress" />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('should NOT render when status=draft', () => {
      render(<WOResumeButton {...defaultProps} workOrderStatus="draft" />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('should NOT render when status=released', () => {
      render(<WOResumeButton {...defaultProps} workOrderStatus="released" />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('should NOT render when status=completed', () => {
      render(<WOResumeButton {...defaultProps} workOrderStatus="completed" />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('should NOT render when status=cancelled', () => {
      render(<WOResumeButton {...defaultProps} workOrderStatus="cancelled" />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })
  })

  describe('Modal Interaction', () => {
    it('should open modal when button clicked', async () => {
      const user = userEvent.setup()
      render(<WOResumeButton {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /resume/i }))

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      expect(screen.getByText('Resume Work Order')).toBeInTheDocument()
    })

    it('should show pause info in modal', async () => {
      const user = userEvent.setup()
      render(<WOResumeButton {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /resume/i }))

      expect(screen.getByText('WO-2025-0001')).toBeInTheDocument()
      expect(screen.getByText('Machine Breakdown')).toBeInTheDocument()
      expect(screen.getByText('John Doe')).toBeInTheDocument()
      expect(screen.getByText('Awaiting parts')).toBeInTheDocument()
    })

    it('should close modal on cancel', async () => {
      const user = userEvent.setup()
      render(<WOResumeButton {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /resume/i }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Resume Action', () => {
    it('should call API on resume', async () => {
      const user = userEvent.setup()
      render(<WOResumeButton {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /resume/i }))
      await user.click(screen.getByRole('button', { name: /resume production/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          '/api/production/work-orders/wo-123/resume',
          expect.objectContaining({
            method: 'POST',
          })
        )
      })
    })

    it('should call onResumeSuccess after successful resume', async () => {
      const user = userEvent.setup()
      const onResumeSuccess = vi.fn()

      render(<WOResumeButton {...defaultProps} onResumeSuccess={onResumeSuccess} />)

      await user.click(screen.getByRole('button', { name: /resume/i }))
      await user.click(screen.getByRole('button', { name: /resume production/i }))

      await waitFor(() => {
        expect(onResumeSuccess).toHaveBeenCalled()
      })
    })

    it('should call onResumeError on API failure', async () => {
      const user = userEvent.setup()
      const onResumeError = vi.fn()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to resume' }),
      })

      render(<WOResumeButton {...defaultProps} onResumeError={onResumeError} />)

      await user.click(screen.getByRole('button', { name: /resume/i }))
      await user.click(screen.getByRole('button', { name: /resume production/i }))

      await waitFor(() => {
        expect(onResumeError).toHaveBeenCalled()
      })
    })
  })

  describe('Styling', () => {
    it('should have green/success color scheme', () => {
      render(<WOResumeButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('bg-green-600')
    })

    it('should have play icon', () => {
      render(<WOResumeButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label', () => {
      render(<WOResumeButton {...defaultProps} />)

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Resume work order')
    })
  })

  describe('Disabled State', () => {
    it('should be disabled when disabled prop is true', () => {
      render(<WOResumeButton {...defaultProps} disabled={true} />)

      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('should not open modal when disabled', async () => {
      const user = userEvent.setup()
      render(<WOResumeButton {...defaultProps} disabled={true} />)

      await user.click(screen.getByRole('button'))

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
  })
})
