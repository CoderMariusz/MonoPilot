/**
 * WOPauseButton Component Tests
 * Story: 04.2b - WO Pause/Resume
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WOPauseButton } from '../WOPauseButton'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

describe('WOPauseButton Component', () => {
  const defaultProps = {
    workOrderId: 'wo-123',
    workOrderNumber: 'WO-2025-0001',
    workOrderStatus: 'in_progress' as const,
    isPauseEnabled: true,
  }

  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'pause-1' } }),
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Visibility', () => {
    it('should render when isPauseEnabled=true and status=in_progress', () => {
      render(<WOPauseButton {...defaultProps} />)

      expect(screen.getByRole('button', { name: /pause/i })).toBeInTheDocument()
    })

    it('should NOT render when isPauseEnabled=false', () => {
      render(<WOPauseButton {...defaultProps} isPauseEnabled={false} />)

      expect(screen.queryByRole('button')).not.toBeInTheDocument()
    })

    it('should render disabled when status is not in_progress', () => {
      render(<WOPauseButton {...defaultProps} workOrderStatus="released" />)

      const button = screen.getByRole('button', { name: /pause/i })
      expect(button).toBeDisabled()
    })
  })

  describe('Status-based Behavior', () => {
    it('should be enabled for in_progress status', () => {
      render(<WOPauseButton {...defaultProps} workOrderStatus="in_progress" />)

      expect(screen.getByRole('button')).not.toBeDisabled()
    })

    it('should be disabled for draft status', () => {
      render(<WOPauseButton {...defaultProps} workOrderStatus="draft" />)

      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('should be disabled for released status', () => {
      render(<WOPauseButton {...defaultProps} workOrderStatus="released" />)

      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('should be disabled for paused status', () => {
      render(<WOPauseButton {...defaultProps} workOrderStatus="paused" />)

      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('should be disabled for completed status', () => {
      render(<WOPauseButton {...defaultProps} workOrderStatus="completed" />)

      expect(screen.getByRole('button')).toBeDisabled()
    })

    it('should be disabled for cancelled status', () => {
      render(<WOPauseButton {...defaultProps} workOrderStatus="cancelled" />)

      expect(screen.getByRole('button')).toBeDisabled()
    })
  })

  describe('Modal Interaction', () => {
    it('should open modal when button clicked', async () => {
      const user = userEvent.setup()
      render(<WOPauseButton {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /pause/i }))

      expect(screen.getByRole('dialog')).toBeInTheDocument()
      // Modal title may appear in multiple places - use getAllBy
      expect(screen.getAllByText('Pause Work Order').length).toBeGreaterThan(0)
    })

    it('should show work order number in modal', async () => {
      const user = userEvent.setup()
      render(<WOPauseButton {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /pause/i }))

      // WO number appears in multiple places - use getAllBy
      expect(screen.getAllByText('WO-2025-0001').length).toBeGreaterThan(0)
    })

    it('should close modal on cancel', async () => {
      const user = userEvent.setup()
      render(<WOPauseButton {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /pause/i }))
      expect(screen.getByRole('dialog')).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
      })
    })
  })

  describe('Callbacks', () => {
    it('should call onPauseSuccess after successful pause', async () => {
      const user = userEvent.setup()
      const onPauseSuccess = vi.fn()

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { id: 'pause-1', wo_number: 'WO-2025-0001' } }),
      })

      render(<WOPauseButton {...defaultProps} onPauseSuccess={onPauseSuccess} />)

      // Open modal
      await user.click(screen.getByRole('button', { name: /pause/i }))

      // Select reason
      await user.click(screen.getByRole('combobox'))
      await user.click(screen.getByText('Machine Breakdown'))

      // Submit
      await user.click(screen.getByRole('button', { name: /pause work order/i }))

      await waitFor(() => {
        expect(onPauseSuccess).toHaveBeenCalled()
      })
    })

    it('should call onPauseError on API failure', async () => {
      const user = userEvent.setup()
      const onPauseError = vi.fn()

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: 'Failed to pause' }),
      })

      render(<WOPauseButton {...defaultProps} onPauseError={onPauseError} />)

      await user.click(screen.getByRole('button', { name: /pause/i }))
      await user.click(screen.getByRole('combobox'))
      await user.click(screen.getByText('Machine Breakdown'))
      await user.click(screen.getByRole('button', { name: /pause work order/i }))

      await waitFor(() => {
        expect(onPauseError).toHaveBeenCalled()
      })
    })
  })

  describe('Styling', () => {
    it('should have yellow/warning color scheme', () => {
      render(<WOPauseButton {...defaultProps} />)

      const button = screen.getByRole('button')
      expect(button).toHaveClass('border-yellow-600')
    })

    it('should have pause icon', () => {
      render(<WOPauseButton {...defaultProps} />)

      // The Pause icon from Lucide is rendered as SVG
      const button = screen.getByRole('button')
      expect(button.querySelector('svg')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have aria-label', () => {
      render(<WOPauseButton {...defaultProps} />)

      expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Pause work order')
    })

    it('should have aria-disabled when disabled', () => {
      render(<WOPauseButton {...defaultProps} workOrderStatus="draft" />)

      expect(screen.getByRole('button')).toHaveAttribute('aria-disabled', 'true')
    })
  })

  describe('Tooltip', () => {
    it('should show tooltip on disabled button hover', async () => {
      const user = userEvent.setup()
      render(<WOPauseButton {...defaultProps} workOrderStatus="draft" />)

      const button = screen.getByRole('button')
      await user.hover(button)

      await waitFor(() => {
        // Tooltip may render multiple elements - use getAllBy
        expect(screen.getAllByText('WO must be In Progress to pause').length).toBeGreaterThan(0)
      })
    })
  })
})
