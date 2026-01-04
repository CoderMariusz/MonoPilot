/**
 * ReceiveModal Component Tests (Story 05.9)
 * Purpose: Test ASN receive modal UI behavior and user interactions
 * Phase: RED - Tests will fail until component is implemented
 *
 * Coverage Target: 85%+
 * Test Count: 20+ scenarios
 *
 * Acceptance Criteria Coverage:
 * - AC-9: Variance Indicators in UI
 * - AC-6: Variance Reason Tracking
 * - User interactions (input, submit, error handling)
 * - Loading states
 * - Success/error feedback
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@/test/test-utils'
import userEvent from '@testing-library/user-event'
import { ReceiveModal } from '../ReceiveModal'
import { VarianceBadge } from '../VarianceBadge'

// Mock fetch for API calls
global.fetch = vi.fn()

describe('ReceiveModal (Story 05.9)', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  const defaultProps = {
    asnId: 'asn-001',
    isOpen: true,
    onClose: mockOnClose,
    onSuccess: mockOnSuccess,
  }

  const mockPreviewData = {
    asn: {
      id: 'asn-001',
      asn_number: 'ASN-2025-00001',
      status: 'pending',
      expected_date: '2025-12-20',
      po_number: 'PO-2025-0001',
      supplier_name: 'Supplier A',
    },
    items: [
      {
        id: 'item-001',
        product_id: 'prod-001',
        product_name: 'Product A',
        product_sku: 'PROD-A',
        expected_qty: 100,
        received_qty: 0,
        remaining_qty: 100,
        uom: 'units',
        supplier_batch_number: 'SB-001',
        gtin: '01234567890128',
        expiry_date: '2026-12-31',
      },
      {
        id: 'item-002',
        product_name: 'Product B',
        expected_qty: 50,
        received_qty: 30,
        remaining_qty: 20,
        uom: 'units',
      },
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as any).mockReset()
  })

  /**
   * Loading State
   */
  describe('loading state', () => {
    it('should render loading skeleton while fetching preview', async () => {
      ;(global.fetch as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      )

      render(<ReceiveModal {...defaultProps} />)

      expect(screen.getByTestId('receive-modal-skeleton')).toBeInTheDocument()
      expect(screen.queryByText('ASN-2025-00001')).not.toBeInTheDocument()
    })
  })

  /**
   * ASN Header Display
   */
  describe('ASN header display', () => {
    it('should display ASN header info after loading', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreviewData,
      })

      render(<ReceiveModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('ASN-2025-00001')).toBeInTheDocument()
      })

      expect(screen.getByText('Supplier A')).toBeInTheDocument()
      expect(screen.getByText('PO-2025-0001')).toBeInTheDocument()
      expect(screen.getByText('2025-12-20')).toBeInTheDocument()
    })
  })

  /**
   * Items Table Display
   */
  describe('items table display', () => {
    it('should display items table with editable received_qty', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreviewData,
      })

      render(<ReceiveModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument()
      })

      // Check both items rendered
      expect(screen.getByText('Product A')).toBeInTheDocument()
      expect(screen.getByText('Product B')).toBeInTheDocument()

      // Check input fields exist
      const receivedQtyInputs = screen.getAllByRole('spinbutton', {
        name: /received quantity/i,
      })
      expect(receivedQtyInputs).toHaveLength(2)
    })

    it('should pre-fill received_qty with expected_qty by default', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreviewData,
      })

      render(<ReceiveModal {...defaultProps} />)

      await waitFor(() => {
        const input1 = screen.getByDisplayValue('100')
        const input2 = screen.getByDisplayValue('20') // remaining_qty for partial item
        expect(input1).toBeInTheDocument()
        expect(input2).toBeInTheDocument()
      })
    })

    it('should display pre-populated data from ASN', async () => {
      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreviewData,
      })

      render(<ReceiveModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('PROD-A')).toBeInTheDocument()
        expect(screen.getByDisplayValue('SB-001')).toBeInTheDocument()
        expect(screen.getByDisplayValue('01234567890128')).toBeInTheDocument()
        expect(screen.getByDisplayValue('2026-12-31')).toBeInTheDocument()
      })
    })
  })

  /**
   * AC-9: Variance Calculation and Display
   */
  describe('variance calculation and display', () => {
    it('should calculate and display variance badge when qty changes', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreviewData,
      })

      render(<ReceiveModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument()
      })

      // Find first received_qty input and change to 90 (under by 10)
      const input = screen.getAllByRole('spinbutton')[0]
      await user.clear(input)
      await user.type(input, '90')

      await waitFor(() => {
        expect(screen.getByText('-10 units')).toBeInTheDocument()
        expect(screen.getByTestId('variance-badge-under')).toBeInTheDocument()
      })
    })

    it('should show green badge for exact match', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreviewData,
      })

      render(<ReceiveModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument()
      })

      const input = screen.getAllByRole('spinbutton')[0]
      await user.clear(input)
      await user.type(input, '100')

      await waitFor(() => {
        const badges = screen.getAllByTestId('variance-badge-exact')
        expect(badges.length).toBeGreaterThan(0)
        expect(screen.getAllByText('Exact match').length).toBeGreaterThan(0)
      })
    })

    it('should show yellow badge for over-receipt', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreviewData,
      })

      render(<ReceiveModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument()
      })

      const input = screen.getAllByRole('spinbutton')[0]
      await user.clear(input)
      await user.type(input, '110')

      await waitFor(() => {
        expect(screen.getByText('+10 units')).toBeInTheDocument()
        expect(screen.getByTestId('variance-badge-over')).toBeInTheDocument()
      })
    })
  })

  /**
   * AC-6: Variance Reason Tracking
   */
  describe('variance reason tracking', () => {
    it('should show variance reason dropdown when variance exists', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreviewData,
      })

      render(<ReceiveModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument()
      })

      // Enter variance
      const input = screen.getAllByRole('spinbutton')[0]
      await user.clear(input)
      await user.type(input, '95')

      await waitFor(() => {
        expect(screen.getByLabelText(/variance reason/i)).toBeInTheDocument()
      })
    })

    it('should allow selecting variance reason from dropdown', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreviewData,
      })

      render(<ReceiveModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument()
      })

      // Enter variance
      const input = screen.getAllByRole('spinbutton')[0]
      await user.clear(input)
      await user.type(input, '95')

      // Wait for variance reason to appear
      await waitFor(() => {
        expect(screen.getByLabelText(/variance reason/i)).toBeInTheDocument()
      })

      // Click to open the select (Radix UI pattern)
      const reasonTrigger = screen.getByLabelText(/variance reason/i)
      await user.click(reasonTrigger)

      // Wait for dropdown and select 'Damaged' option
      await waitFor(async () => {
        const damagedOption = screen.getByRole('option', { name: /damaged/i })
        await user.click(damagedOption)
      })

      // Verify selection
      await waitFor(() => {
        expect(reasonTrigger).toHaveTextContent(/damaged/i)
      })
    })

    it('should allow entering variance notes', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreviewData,
      })

      render(<ReceiveModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument()
      })

      // Enter variance
      const input = screen.getAllByRole('spinbutton')[0]
      await user.clear(input)
      await user.type(input, '95')

      // Enter notes
      const notesInput = await screen.findByLabelText(/variance notes/i)
      await user.type(notesInput, '5 units damaged in transit')

      expect(notesInput).toHaveValue('5 units damaged in transit')
    })

    it('should hide variance reason when variance is zero', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreviewData,
      })

      render(<ReceiveModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument()
      })

      // Enter exact match
      const input = screen.getAllByRole('spinbutton')[0]
      await user.clear(input)
      await user.type(input, '100')

      await waitFor(() => {
        expect(screen.queryByLabelText(/variance reason/i)).not.toBeInTheDocument()
      })
    })
  })

  /**
   * Form Submission
   */
  describe('form submission', () => {
    it('should submit receive request on confirm', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPreviewData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            grn_id: 'grn-001',
            grn_number: 'GRN-2025-00001',
            status: 'completed',
            lps_created: 2,
            asn_status: 'received',
            variances: [],
          }),
        })

      render(<ReceiveModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument()
      })

      // Fill required fields using Radix UI Select pattern
      const warehouseTrigger = screen.getByLabelText(/warehouse/i)
      await user.click(warehouseTrigger)
      await waitFor(async () => {
        const option = screen.getByRole('option', { name: /warehouse 1/i })
        await user.click(option)
      })

      const locationTrigger = screen.getByLabelText(/location/i)
      await user.click(locationTrigger)
      await waitFor(async () => {
        const option = screen.getByRole('option', { name: /receiving dock a/i })
        await user.click(option)
      })

      // Submit
      const submitButton = screen.getByRole('button', { name: /confirm receive/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/warehouse/asns/asn-001/receive',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('wh-001'),
          })
        )
      })
    })

    it('should disable submit button when submitting', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPreviewData,
        })
        .mockImplementation(() => new Promise(() => {})) // Never resolves

      render(<ReceiveModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument()
      })

      // Fill required fields
      const warehouseTrigger = screen.getByLabelText(/warehouse/i)
      await user.click(warehouseTrigger)
      await waitFor(async () => {
        const option = screen.getByRole('option', { name: /warehouse 1/i })
        await user.click(option)
      })

      const locationTrigger = screen.getByLabelText(/location/i)
      await user.click(locationTrigger)
      await waitFor(async () => {
        const option = screen.getByRole('option', { name: /receiving dock a/i })
        await user.click(option)
      })

      const submitButton = screen.getByRole('button', { name: /confirm receive/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(submitButton).toBeDisabled()
        expect(screen.getByTestId('submit-spinner')).toBeInTheDocument()
      })
    })

    it('should validate required fields before submit', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreviewData,
      })

      render(<ReceiveModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument()
      })

      // Try to submit without selecting warehouse
      const submitButton = screen.getByRole('button', { name: /confirm receive/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/warehouse is required/i)).toBeInTheDocument()
      })
    })
  })

  /**
   * Success State
   */
  describe('success state', () => {
    it('should display success summary after receive completes', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPreviewData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            grn_id: 'grn-001',
            grn_number: 'GRN-2025-00001',
            status: 'completed',
            lps_created: 2,
            asn_status: 'received',
            variances: [],
          }),
        })

      render(<ReceiveModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument()
      })

      // Fill required fields
      const warehouseTrigger = screen.getByLabelText(/warehouse/i)
      await user.click(warehouseTrigger)
      await waitFor(async () => {
        const option = screen.getByRole('option', { name: /warehouse 1/i })
        await user.click(option)
      })

      const locationTrigger = screen.getByLabelText(/location/i)
      await user.click(locationTrigger)
      await waitFor(async () => {
        const option = screen.getByRole('option', { name: /receiving dock a/i })
        await user.click(option)
      })

      // Submit
      const submitButton = screen.getByRole('button', { name: /confirm receive/i })
      await user.click(submitButton)

      await waitFor(
        () => {
          expect(screen.getByText('GRN-2025-00001')).toBeInTheDocument()
          expect(screen.getByText(/2 license plates created/i)).toBeInTheDocument()
          expect(screen.getByTestId('receive-success-summary')).toBeInTheDocument()
        },
        { timeout: 3000 }
      )
    })

    it('should call onSuccess callback after completion', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPreviewData,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            grn_id: 'grn-001',
            grn_number: 'GRN-001',
            status: 'completed',
            lps_created: 2,
            asn_status: 'received',
            variances: [],
          }),
        })

      render(<ReceiveModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument()
      })

      // Fill required fields
      const warehouseTrigger = screen.getByLabelText(/warehouse/i)
      await user.click(warehouseTrigger)
      await waitFor(async () => {
        const option = screen.getByRole('option', { name: /warehouse 1/i })
        await user.click(option)
      })

      const locationTrigger = screen.getByLabelText(/location/i)
      await user.click(locationTrigger)
      await waitFor(async () => {
        const option = screen.getByRole('option', { name: /receiving dock a/i })
        await user.click(option)
      })

      const submitButton = screen.getByRole('button', { name: /confirm receive/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })
  })

  /**
   * Error Handling
   */
  describe('error handling', () => {
    it('should display error alert on API failure', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPreviewData,
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({
            error: 'Over-receipt exceeds tolerance (max: 110 units)',
          }),
        })

      render(<ReceiveModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument()
      })

      // Fill required fields
      const warehouseTrigger = screen.getByLabelText(/warehouse/i)
      await user.click(warehouseTrigger)
      await waitFor(async () => {
        const option = screen.getByRole('option', { name: /warehouse 1/i })
        await user.click(option)
      })

      const locationTrigger = screen.getByLabelText(/location/i)
      await user.click(locationTrigger)
      await waitFor(async () => {
        const option = screen.getByRole('option', { name: /receiving dock a/i })
        await user.click(option)
      })

      const submitButton = screen.getByRole('button', { name: /confirm receive/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(
          screen.getByText(/Over-receipt exceeds tolerance/i)
        ).toBeInTheDocument()
        expect(screen.getByTestId('error-alert')).toBeInTheDocument()
      })
    })

    it('should display error for missing batch when required', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPreviewData,
        })
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Batch number required' }),
        })

      render(<ReceiveModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument()
      })

      // Fill required fields
      const warehouseTrigger = screen.getByLabelText(/warehouse/i)
      await user.click(warehouseTrigger)
      await waitFor(async () => {
        const option = screen.getByRole('option', { name: /warehouse 1/i })
        await user.click(option)
      })

      const locationTrigger = screen.getByLabelText(/location/i)
      await user.click(locationTrigger)
      await waitFor(async () => {
        const option = screen.getByRole('option', { name: /receiving dock a/i })
        await user.click(option)
      })

      const submitButton = screen.getByRole('button', { name: /confirm receive/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Batch number required/i)).toBeInTheDocument()
      })
    })

    it('should handle network errors gracefully', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockPreviewData,
        })
        .mockRejectedValueOnce(new Error('Network error'))

      render(<ReceiveModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument()
      })

      // Fill required fields
      const warehouseTrigger = screen.getByLabelText(/warehouse/i)
      await user.click(warehouseTrigger)
      await waitFor(async () => {
        const option = screen.getByRole('option', { name: /warehouse 1/i })
        await user.click(option)
      })

      const locationTrigger = screen.getByLabelText(/location/i)
      await user.click(locationTrigger)
      await waitFor(async () => {
        const option = screen.getByRole('option', { name: /receiving dock a/i })
        await user.click(option)
      })

      const submitButton = screen.getByRole('button', { name: /confirm receive/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/Network error/i)).toBeInTheDocument()
      })
    })
  })

  /**
   * Modal Behavior
   */
  describe('modal behavior', () => {
    it('should close modal on cancel', async () => {
      const user = userEvent.setup()

      ;(global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockPreviewData,
      })

      render(<ReceiveModal {...defaultProps} />)

      await waitFor(() => {
        expect(screen.getByText('Product A')).toBeInTheDocument()
      })

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should not render when isOpen is false', () => {
      render(<ReceiveModal {...defaultProps} isOpen={false} />)

      expect(screen.queryByText('Receive ASN')).not.toBeInTheDocument()
    })
  })
})

/**
 * VarianceBadge Component Tests
 */
describe('VarianceBadge (Story 05.9)', () => {
  it('should display green badge for exact match', () => {
    render(<VarianceBadge variance={0} expectedQty={100} />)

    const badge = screen.getByTestId('variance-badge-exact')
    expect(badge).toHaveClass('bg-green-100')
    expect(screen.getByText('Exact match')).toBeInTheDocument()
  })

  it('should display red badge for under-receipt', () => {
    render(<VarianceBadge variance={-5} expectedQty={100} />)

    const badge = screen.getByTestId('variance-badge-under')
    expect(badge).toHaveClass('bg-red-100')
    expect(screen.getByText('-5 units')).toBeInTheDocument()
    expect(screen.getByText('(-5%)')).toBeInTheDocument()
  })

  it('should display yellow badge for over-receipt', () => {
    render(<VarianceBadge variance={10} expectedQty={100} />)

    const badge = screen.getByTestId('variance-badge-over')
    expect(badge).toHaveClass('bg-yellow-100')
    expect(screen.getByText('+10 units')).toBeInTheDocument()
    expect(screen.getByText('(+10%)')).toBeInTheDocument()
  })

  it('should format decimal variance correctly', () => {
    render(<VarianceBadge variance={-5.25} expectedQty={100.5} />)

    expect(screen.getByText('-5.25 units')).toBeInTheDocument()
    expect(screen.getByText('(-5.2%)')).toBeInTheDocument()
  })
})
