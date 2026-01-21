/**
 * OverConsumptionApprovalModal Component Tests
 * Story: 04.6e - Over-Consumption Control
 *
 * Tests the modal component for over-consumption approval workflow,
 * including operator view (pending status) and manager view (approve/reject).
 *
 * RED PHASE: All tests should FAIL until component is implemented.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OverConsumptionApprovalModal } from '../OverConsumptionApprovalModal'

// Mock data for over-consumption detection
const mockOverConsumptionData = {
  wo_id: 'wo-123',
  wo_number: 'WO-2025-001',
  wo_material_id: 'mat-456',
  product_code: 'RM-001',
  product_name: 'Raw Material A',
  lp_id: 'lp-789',
  lp_number: 'LP-2025-0001',
  required_qty: 100,
  current_consumed_qty: 100,
  requested_qty: 10,
  total_after_qty: 110,
  over_consumption_qty: 10,
  variance_percent: 10,
  uom: 'kg',
}

const mockPendingRequest = {
  request_id: 'req-001',
  status: 'pending' as const,
  requested_by: 'user-123',
  requested_by_name: 'John Doe',
  requested_at: '2025-01-20T10:00:00Z',
}

describe('OverConsumptionApprovalModal Component (Story 04.6e)', () => {
  const defaultProps = {
    overConsumptionData: mockOverConsumptionData,
    open: true,
    onOpenChange: vi.fn(),
    onApproved: vi.fn(),
    onRejected: vi.fn(),
    onRequestSubmitted: vi.fn(),
    isManager: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ==========================================================================
  // Modal Display
  // ==========================================================================
  describe('Modal Display', () => {
    it('should render modal when open is true', () => {
      render(<OverConsumptionApprovalModal {...defaultProps} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should not render modal when open is false', () => {
      render(<OverConsumptionApprovalModal {...defaultProps} open={false} />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should display modal title', () => {
      render(<OverConsumptionApprovalModal {...defaultProps} />)
      expect(screen.getByText(/over-consumption approval required/i)).toBeInTheDocument()
    })

    it('should display warning icon in header', () => {
      render(<OverConsumptionApprovalModal {...defaultProps} />)
      expect(screen.getByTestId('warning-icon')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Over-Consumption Summary Display
  // ==========================================================================
  describe('Over-Consumption Summary', () => {
    it('should display material code and name', () => {
      render(<OverConsumptionApprovalModal {...defaultProps} />)
      expect(screen.getByText('RM-001 - Raw Material A')).toBeInTheDocument()
    })

    it('should display WO number', () => {
      render(<OverConsumptionApprovalModal {...defaultProps} />)
      expect(screen.getByText('WO-2025-001')).toBeInTheDocument()
    })

    it('should display BOM requirement', () => {
      render(<OverConsumptionApprovalModal {...defaultProps} />)
      expect(screen.getByText('100 kg')).toBeInTheDocument()
      expect(screen.getByText(/bom requirement/i)).toBeInTheDocument()
    })

    it('should display already consumed quantity', () => {
      render(<OverConsumptionApprovalModal {...defaultProps} />)
      expect(screen.getByText(/already consumed/i)).toBeInTheDocument()
      expect(screen.getByText('100 kg')).toBeInTheDocument()
    })

    it('should display attempting quantity with + prefix', () => {
      render(<OverConsumptionApprovalModal {...defaultProps} />)
      expect(screen.getByText(/attempting/i)).toBeInTheDocument()
      expect(screen.getByText('+10 kg')).toBeInTheDocument()
    })

    it('should display total after quantity', () => {
      render(<OverConsumptionApprovalModal {...defaultProps} />)
      expect(screen.getByText(/total after/i)).toBeInTheDocument()
      expect(screen.getByText('110 kg')).toBeInTheDocument()
    })

    it('should display over-consumption quantity with variance', () => {
      render(<OverConsumptionApprovalModal {...defaultProps} />)
      expect(screen.getByText(/over-consumption/i)).toBeInTheDocument()
      expect(screen.getByText('+10 kg (+10%)')).toBeInTheDocument()
    })

    it('should display LP number', () => {
      render(<OverConsumptionApprovalModal {...defaultProps} />)
      expect(screen.getByText('LP-2025-0001')).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Operator View (AC: GIVEN user has role "Operator")
  // ==========================================================================
  describe('Operator View', () => {
    it('should show submit request button for operator without pending request', () => {
      render(<OverConsumptionApprovalModal {...defaultProps} isManager={false} />)
      expect(screen.getByRole('button', { name: /request approval/i })).toBeInTheDocument()
    })

    it('should not show approve/reject buttons for operator', () => {
      render(<OverConsumptionApprovalModal {...defaultProps} isManager={false} />)
      expect(screen.queryByRole('button', { name: /approve/i })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /reject/i })).not.toBeInTheDocument()
    })

    it('should show close button for operator', () => {
      render(<OverConsumptionApprovalModal {...defaultProps} isManager={false} />)
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })

    it('should call onRequestSubmitted when request submitted', async () => {
      const user = userEvent.setup()
      render(<OverConsumptionApprovalModal {...defaultProps} isManager={false} />)

      await user.click(screen.getByRole('button', { name: /request approval/i }))

      await waitFor(() => {
        expect(defaultProps.onRequestSubmitted).toHaveBeenCalled()
      })
    })
  })

  // ==========================================================================
  // Operator View - Pending Status
  // ==========================================================================
  describe('Operator View - Pending Status', () => {
    const pendingProps = {
      ...defaultProps,
      isManager: false,
      pendingRequest: mockPendingRequest,
    }

    it('should display "Awaiting Manager Approval" status', () => {
      render(<OverConsumptionApprovalModal {...pendingProps} />)
      expect(screen.getByText(/awaiting manager approval/i)).toBeInTheDocument()
    })

    it('should display clock icon for pending status', () => {
      render(<OverConsumptionApprovalModal {...pendingProps} />)
      expect(screen.getByTestId('clock-icon')).toBeInTheDocument()
    })

    it('should display request ID', () => {
      render(<OverConsumptionApprovalModal {...pendingProps} />)
      expect(screen.getByText(/req-001/i)).toBeInTheDocument()
    })

    it('should display requested by name', () => {
      render(<OverConsumptionApprovalModal {...pendingProps} />)
      expect(screen.getByText('John Doe')).toBeInTheDocument()
    })

    it('should show cancel request button for pending request', () => {
      render(<OverConsumptionApprovalModal {...pendingProps} />)
      expect(screen.getByRole('button', { name: /cancel request/i })).toBeInTheDocument()
    })

    it('should not show submit request button when pending', () => {
      render(<OverConsumptionApprovalModal {...pendingProps} />)
      expect(screen.queryByRole('button', { name: /request approval/i })).not.toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Manager View (AC: GIVEN user has role "Manager" or "Admin")
  // ==========================================================================
  describe('Manager View', () => {
    const managerProps = {
      ...defaultProps,
      isManager: true,
      pendingRequest: mockPendingRequest,
    }

    it('should show approve button for manager', () => {
      render(<OverConsumptionApprovalModal {...managerProps} />)
      expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument()
    })

    it('should show reject button for manager', () => {
      render(<OverConsumptionApprovalModal {...managerProps} />)
      expect(screen.getByRole('button', { name: /reject/i })).toBeInTheDocument()
    })

    it('should display requester information for manager', () => {
      render(<OverConsumptionApprovalModal {...managerProps} />)
      expect(screen.getByText(/requested by.*john doe/i)).toBeInTheDocument()
    })

    it('should show optional reason input for approval', () => {
      render(<OverConsumptionApprovalModal {...managerProps} />)
      expect(screen.getByLabelText(/reason for approval/i)).toBeInTheDocument()
      expect(screen.getByText(/optional/i)).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Manager Approve Flow (AC: Manager can approve with optional reason)
  // ==========================================================================
  describe('Manager Approve Flow', () => {
    const managerProps = {
      ...defaultProps,
      isManager: true,
      pendingRequest: mockPendingRequest,
    }

    it('should call onApproved when approve clicked without reason', async () => {
      const user = userEvent.setup()
      render(<OverConsumptionApprovalModal {...managerProps} />)

      await user.click(screen.getByRole('button', { name: /approve/i }))

      await waitFor(() => {
        expect(defaultProps.onApproved).toHaveBeenCalledWith({
          request_id: 'req-001',
          reason: undefined,
        })
      })
    })

    it('should call onApproved with reason when provided', async () => {
      const user = userEvent.setup()
      render(<OverConsumptionApprovalModal {...managerProps} />)

      const reasonInput = screen.getByLabelText(/reason for approval/i)
      await user.type(reasonInput, 'Additional material needed due to higher moisture content')
      await user.click(screen.getByRole('button', { name: /approve/i }))

      await waitFor(() => {
        expect(defaultProps.onApproved).toHaveBeenCalledWith({
          request_id: 'req-001',
          reason: 'Additional material needed due to higher moisture content',
        })
      })
    })

    it('should disable approve button while submitting', async () => {
      const user = userEvent.setup()
      const slowOnApproved = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 1000)))
      render(<OverConsumptionApprovalModal {...managerProps} onApproved={slowOnApproved} />)

      await user.click(screen.getByRole('button', { name: /approve/i }))

      expect(screen.getByRole('button', { name: /approve/i })).toBeDisabled()
    })

    it('should show loading state on approve button when submitting', async () => {
      const user = userEvent.setup()
      const slowOnApproved = vi.fn(() => new Promise((resolve) => setTimeout(resolve, 1000)))
      render(<OverConsumptionApprovalModal {...managerProps} onApproved={slowOnApproved} />)

      await user.click(screen.getByRole('button', { name: /approve/i }))

      expect(screen.getByText(/approving/i)).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Manager Reject Flow (AC: Manager can reject with required reason)
  // ==========================================================================
  describe('Manager Reject Flow', () => {
    const managerProps = {
      ...defaultProps,
      isManager: true,
      pendingRequest: mockPendingRequest,
    }

    it('should show rejection reason input when reject clicked', async () => {
      const user = userEvent.setup()
      render(<OverConsumptionApprovalModal {...managerProps} />)

      await user.click(screen.getByRole('button', { name: /reject/i }))

      expect(screen.getByLabelText(/rejection reason/i)).toBeInTheDocument()
    })

    it('should mark rejection reason as required', async () => {
      const user = userEvent.setup()
      render(<OverConsumptionApprovalModal {...managerProps} />)

      await user.click(screen.getByRole('button', { name: /reject/i }))

      const label = screen.getByText(/rejection reason/i)
      expect(label).toHaveClass('required')
    })

    it('should show validation error when rejecting without reason', async () => {
      const user = userEvent.setup()
      render(<OverConsumptionApprovalModal {...managerProps} />)

      await user.click(screen.getByRole('button', { name: /reject/i }))
      await user.click(screen.getByRole('button', { name: /confirm reject/i }))

      expect(screen.getByText(/rejection reason is required/i)).toBeInTheDocument()
    })

    it('should call onRejected with reason when provided', async () => {
      const user = userEvent.setup()
      render(<OverConsumptionApprovalModal {...managerProps} />)

      await user.click(screen.getByRole('button', { name: /reject/i }))
      const reasonInput = screen.getByLabelText(/rejection reason/i)
      await user.type(reasonInput, 'Investigate waste')
      await user.click(screen.getByRole('button', { name: /confirm reject/i }))

      await waitFor(() => {
        expect(defaultProps.onRejected).toHaveBeenCalledWith({
          request_id: 'req-001',
          reason: 'Investigate waste',
        })
      })
    })

    it('should not call onRejected when reason is empty', async () => {
      const user = userEvent.setup()
      render(<OverConsumptionApprovalModal {...managerProps} />)

      await user.click(screen.getByRole('button', { name: /reject/i }))
      await user.click(screen.getByRole('button', { name: /confirm reject/i }))

      expect(defaultProps.onRejected).not.toHaveBeenCalled()
    })

    it('should allow canceling rejection flow', async () => {
      const user = userEvent.setup()
      render(<OverConsumptionApprovalModal {...managerProps} />)

      await user.click(screen.getByRole('button', { name: /reject/i }))
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(screen.queryByLabelText(/rejection reason/i)).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: /approve/i })).toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Rejection Display (AC: Operator views rejection)
  // ==========================================================================
  describe('Rejection Display', () => {
    const rejectedProps = {
      ...defaultProps,
      isManager: false,
      pendingRequest: {
        ...mockPendingRequest,
        status: 'rejected' as const,
        decided_by: 'manager-456',
        decided_by_name: 'Sarah Lee',
        decided_at: '2025-01-20T11:00:00Z',
        rejection_reason: 'Investigate waste before proceeding',
      },
    }

    it('should display rejection status', () => {
      render(<OverConsumptionApprovalModal {...rejectedProps} />)
      expect(screen.getByText(/request rejected/i)).toBeInTheDocument()
    })

    it('should display rejection reason', () => {
      render(<OverConsumptionApprovalModal {...rejectedProps} />)
      expect(screen.getByText('Investigate waste before proceeding')).toBeInTheDocument()
    })

    it('should display who rejected', () => {
      render(<OverConsumptionApprovalModal {...rejectedProps} />)
      expect(screen.getByText(/rejected by.*sarah lee/i)).toBeInTheDocument()
    })

    it('should display rejection timestamp', () => {
      render(<OverConsumptionApprovalModal {...rejectedProps} />)
      // Check for formatted timestamp
      expect(screen.getByText(/jan 20, 2025/i)).toBeInTheDocument()
    })

    it('should show close button only for rejected request', () => {
      render(<OverConsumptionApprovalModal {...rejectedProps} />)
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /request approval/i })).not.toBeInTheDocument()
    })
  })

  // ==========================================================================
  // Modal Interactions
  // ==========================================================================
  describe('Modal Interactions', () => {
    it('should call onOpenChange when close button clicked', async () => {
      const user = userEvent.setup()
      render(<OverConsumptionApprovalModal {...defaultProps} />)

      await user.click(screen.getByRole('button', { name: /close/i }))

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
    })

    it('should call onOpenChange when clicking outside modal', async () => {
      const user = userEvent.setup()
      render(<OverConsumptionApprovalModal {...defaultProps} />)

      // Click on overlay/backdrop
      const backdrop = screen.getByTestId('modal-backdrop')
      await user.click(backdrop)

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
    })

    it('should call onOpenChange when pressing Escape', async () => {
      const user = userEvent.setup()
      render(<OverConsumptionApprovalModal {...defaultProps} />)

      await user.keyboard('{Escape}')

      expect(defaultProps.onOpenChange).toHaveBeenCalledWith(false)
    })
  })

  // ==========================================================================
  // Error Handling
  // ==========================================================================
  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      const user = userEvent.setup()
      const failingOnSubmit = vi.fn(() => Promise.reject(new Error('Network error')))
      render(
        <OverConsumptionApprovalModal
          {...defaultProps}
          isManager={false}
          onRequestSubmitted={failingOnSubmit}
        />
      )

      await user.click(screen.getByRole('button', { name: /request approval/i }))

      await waitFor(() => {
        expect(screen.getByText(/network error/i)).toBeInTheDocument()
      })
    })

    it('should allow retry after error', async () => {
      const user = userEvent.setup()
      const failingOnSubmit = vi.fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ request_id: 'req-001' })
      render(
        <OverConsumptionApprovalModal
          {...defaultProps}
          isManager={false}
          onRequestSubmitted={failingOnSubmit}
        />
      )

      await user.click(screen.getByRole('button', { name: /request approval/i }))
      await waitFor(() => expect(screen.getByText(/network error/i)).toBeInTheDocument())

      // Retry should work
      await user.click(screen.getByRole('button', { name: /request approval/i }))
      expect(failingOnSubmit).toHaveBeenCalledTimes(2)
    })
  })

  // ==========================================================================
  // Accessibility
  // ==========================================================================
  describe('Accessibility', () => {
    it('should have proper dialog role', () => {
      render(<OverConsumptionApprovalModal {...defaultProps} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should have aria-labelledby pointing to title', () => {
      render(<OverConsumptionApprovalModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby')
    })

    it('should trap focus within modal', async () => {
      const user = userEvent.setup()
      render(<OverConsumptionApprovalModal {...defaultProps} />)

      // Tab through all focusable elements
      await user.tab()
      expect(document.activeElement).toBeInTheDocument()

      // Should not leave modal
      const focusableElements = screen.getByRole('dialog').querySelectorAll('button, input, textarea')
      expect(Array.from(focusableElements).includes(document.activeElement as Element)).toBe(true)
    })

    it('should have descriptive button labels', () => {
      render(
        <OverConsumptionApprovalModal {...defaultProps} isManager={true} pendingRequest={mockPendingRequest} />
      )
      expect(screen.getByRole('button', { name: /approve over-consumption/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /reject over-consumption/i })).toBeInTheDocument()
    })
  })
})

/**
 * Test Coverage Summary:
 *
 * Modal Display (4 tests):
 *   - Open/closed state rendering
 *   - Title display
 *   - Warning icon
 *
 * Over-Consumption Summary (8 tests):
 *   - Material info display
 *   - WO number
 *   - Quantities (BOM, consumed, attempting, total, over-consumption)
 *   - LP number
 *
 * Operator View (4 tests):
 *   - Submit request button visible
 *   - No approve/reject buttons
 *   - Close button
 *   - Request submission callback
 *
 * Operator View - Pending (6 tests):
 *   - Awaiting status display
 *   - Clock icon
 *   - Request ID
 *   - Requester name
 *   - Cancel request button
 *   - No submit when pending
 *
 * Manager View (4 tests):
 *   - Approve button visible
 *   - Reject button visible
 *   - Requester info display
 *   - Optional reason input
 *
 * Manager Approve Flow (5 tests):
 *   - Approve without reason
 *   - Approve with reason
 *   - Disabled while submitting
 *   - Loading state
 *
 * Manager Reject Flow (6 tests):
 *   - Rejection reason input display
 *   - Required marking
 *   - Validation error
 *   - Reject with reason
 *   - No reject without reason
 *   - Cancel rejection flow
 *
 * Rejection Display (5 tests):
 *   - Rejection status
 *   - Rejection reason
 *   - Rejector name
 *   - Rejection timestamp
 *   - Close button only
 *
 * Modal Interactions (3 tests):
 *   - Close button
 *   - Click outside
 *   - Escape key
 *
 * Error Handling (2 tests):
 *   - Error display
 *   - Retry after error
 *
 * Accessibility (4 tests):
 *   - Dialog role
 *   - aria-labelledby
 *   - Focus trap
 *   - Descriptive labels
 *
 * Total: 51 tests
 */
