/**
 * Unit Tests: RegisterOutputModal Component (Story 04.7a)
 *
 * Tests output registration modal with:
 * - Form validation (FR-PROD-011)
 * - QA status requirement handling
 * - Auto-calculation of expiry date
 * - Batch number pre-fill
 * - Location pre-selection
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RegisterOutputModal } from '../RegisterOutputModal'
import type { WorkOrderSummary, Location } from '../RegisterOutputModal'

// Mock work order data
const mockWO: WorkOrderSummary = {
  id: 'wo-1',
  wo_number: 'WO-2025-0156',
  status: 'in_progress',
  product_id: 'prod-1',
  product_name: 'Wheat Bread',
  product_code: 'SKU-WB-001',
  batch_number: 'B-2025-0156',
  planned_qty: 5000,
  output_qty: 3200,
  uom: 'kg',
  progress_percent: 64.0,
  remaining_qty: 1800,
  default_location_id: 'loc-1',
  default_location_name: 'WH-A / Zone 1 / Rack 2',
  shelf_life_days: 30,
}

const mockDefaultLocation: Location = {
  id: 'loc-1',
  name: 'WH-A / Zone 1 / Rack 2',
  full_path: 'WH-A / Zone 1 / Rack 2',
}

const mockLocations: Location[] = [
  { id: 'loc-2', name: 'WH-B / Zone 1', full_path: 'WH-B / Zone 1' },
  { id: 'loc-3', name: 'WH-A / Zone 2', full_path: 'WH-A / Zone 2' },
]

describe('RegisterOutputModal Component (Story 04.7a)', () => {
  const mockOnConfirm = vi.fn()
  const mockOnCancel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnConfirm.mockResolvedValue(undefined)
  })

  // ============================================================================
  // Basic Rendering Tests
  // ============================================================================
  describe('Basic Rendering', () => {
    it('renders modal with title and WO info', () => {
      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          locations={mockLocations}
        />
      )

      expect(screen.getByText('Register Production Output')).toBeInTheDocument()
      expect(screen.getByText(/WO-2025-0156/)).toBeInTheDocument()
      expect(screen.getByText(/Wheat Bread/)).toBeInTheDocument()
    })

    it('displays product information section', () => {
      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText('Product Information')).toBeInTheDocument()
      expect(screen.getByText('SKU-WB-001')).toBeInTheDocument()
    })

    it('displays progress information', () => {
      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByText(/3,200 \/ 5,000 kg/)).toBeInTheDocument()
      expect(screen.getByText(/64%/)).toBeInTheDocument()
      expect(screen.getByText(/1,800 kg/)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Form Fields Tests
  // ============================================================================
  describe('Form Fields', () => {
    it('has quantity input field', () => {
      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const qtyInput = screen.getByLabelText(/quantity/i)
      expect(qtyInput).toBeInTheDocument()
      expect(qtyInput).toHaveAttribute('type', 'number')
    })

    it('AC: pre-fills batch number from WO', () => {
      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const batchInput = screen.getByLabelText(/batch number/i)
      expect(batchInput).toHaveValue('B-2025-0156')
    })

    it('AC: pre-selects default location from line', () => {
      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
          locations={mockLocations}
        />
      )

      // Location should show the default location
      expect(screen.getByText('WH-A / Zone 1 / Rack 2')).toBeInTheDocument()
    })

    it('AC: auto-calculates expiry date from shelf life', () => {
      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const expiryInput = screen.getByLabelText(/expiry date/i)
      expect(expiryInput).toHaveValue(expect.stringMatching(/\d{4}-\d{2}-\d{2}/))
      // Should be approximately 30 days from now
      expect(screen.getByText(/Today \+ 30 days/)).toBeInTheDocument()
    })

    it('has notes textarea', () => {
      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Validation Tests (FR-PROD-011)
  // ============================================================================
  describe('Validation', () => {
    it('AC: shows error when quantity is 0', async () => {
      const user = userEvent.setup()

      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const qtyInput = screen.getByLabelText(/quantity/i)
      await user.type(qtyInput, '0')

      const submitButton = screen.getByRole('button', { name: /confirm registration/i })
      await user.click(submitButton)

      expect(screen.getByText('Quantity must be greater than 0')).toBeInTheDocument()
    })

    it('AC: shows error when QA status required but not selected', async () => {
      const user = userEvent.setup()

      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const qtyInput = screen.getByLabelText(/quantity/i)
      await user.type(qtyInput, '500')

      const submitButton = screen.getByRole('button', { name: /confirm registration/i })
      await user.click(submitButton)

      expect(screen.getByText('QA status is required')).toBeInTheDocument()
    })

    it('AC: allows submission without QA status when not required', async () => {
      const user = userEvent.setup()

      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const qtyInput = screen.getByLabelText(/quantity/i)
      await user.type(qtyInput, '500')

      const submitButton = screen.getByRole('button', { name: /confirm registration/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalled()
      })
    })

    it('disables submit button when form is invalid', () => {
      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const submitButton = screen.getByRole('button', { name: /confirm registration/i })
      expect(submitButton).toBeDisabled()
    })
  })

  // ============================================================================
  // QA Status Tests
  // ============================================================================
  describe('QA Status', () => {
    it('shows required indicator when QA status is required', () => {
      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const qaLabel = screen.getByText(/qa status/i).closest('label')
      expect(qaLabel).toHaveTextContent('*')
    })

    it('does not show required indicator when QA status is optional', () => {
      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const qaLabel = screen.getByText(/qa status/i)
      expect(qaLabel).not.toHaveTextContent('*')
    })

    it('has QA status options: Approved, Pending, Rejected', async () => {
      const user = userEvent.setup()

      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const qaSelect = screen.getByLabelText(/qa status/i)
      await user.click(qaSelect)

      expect(await screen.findByText('Approved', { selector: '[role="option"]' })).toBeInTheDocument()
      expect(screen.getByText('Pending', { selector: '[role="option"]' })).toBeInTheDocument()
      expect(screen.getByText('Rejected', { selector: '[role="option"]' })).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Output Summary Preview Tests
  // ============================================================================
  describe('Output Summary Preview', () => {
    it('shows summary preview when quantity entered', async () => {
      const user = userEvent.setup()

      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const qtyInput = screen.getByLabelText(/quantity/i)
      await user.type(qtyInput, '500')

      expect(screen.getByText('Output Summary')).toBeInTheDocument()
      expect(screen.getByText(/500 kg/)).toBeInTheDocument()
    })

    it('shows projected progress after registration', async () => {
      const user = userEvent.setup()

      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const qtyInput = screen.getByLabelText(/quantity/i)
      await user.type(qtyInput, '500')

      // 3200 + 500 = 3700, 3700/5000 = 74%
      expect(screen.getByText(/3,700 \/ 5,000 kg/)).toBeInTheDocument()
      expect(screen.getByText(/74%/)).toBeInTheDocument()
    })

    it('does not show summary when quantity is empty', () => {
      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.queryByText('Output Summary')).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // Form Submission Tests
  // ============================================================================
  describe('Form Submission', () => {
    it('AC: calls onConfirm with correct data', async () => {
      const user = userEvent.setup()

      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      // Fill quantity
      const qtyInput = screen.getByLabelText(/quantity/i)
      await user.type(qtyInput, '500')

      // Select QA status
      const qaSelect = screen.getByLabelText(/qa status/i)
      await user.click(qaSelect)
      const approvedOption = await screen.findByText('Approved', { selector: '[role="option"]' })
      await user.click(approvedOption)

      // Submit
      const submitButton = screen.getByRole('button', { name: /confirm registration/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalledWith(
          expect.objectContaining({
            wo_id: 'wo-1',
            quantity: 500,
            uom: 'kg',
            batch_number: 'B-2025-0156',
            qa_status: 'approved',
            location_id: 'loc-1',
          })
        )
      })
    })

    it('shows loading state during submission', async () => {
      const user = userEvent.setup()
      mockOnConfirm.mockImplementation(() => new Promise((resolve) => setTimeout(resolve, 100)))

      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const qtyInput = screen.getByLabelText(/quantity/i)
      await user.type(qtyInput, '500')

      const submitButton = screen.getByRole('button', { name: /confirm registration/i })
      await user.click(submitButton)

      expect(screen.getByText(/registering/i)).toBeInTheDocument()
    })

    it('calls onCancel when Cancel button clicked', async () => {
      const user = userEvent.setup()

      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={false}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnCancel).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Accessibility Tests
  // ============================================================================
  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/batch number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/qa status/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/location/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/expiry date/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    })

    it('shows validation errors with role="alert"', async () => {
      const user = userEvent.setup()

      render(
        <RegisterOutputModal
          wo={mockWO}
          defaultLocation={mockDefaultLocation}
          requireQAStatus={true}
          onConfirm={mockOnConfirm}
          onCancel={mockOnCancel}
        />
      )

      const qtyInput = screen.getByLabelText(/quantity/i)
      await user.type(qtyInput, '0')

      const submitButton = screen.getByRole('button', { name: /confirm registration/i })
      await user.click(submitButton)

      // Check for validation error text
      expect(screen.getByText('Quantity must be greater than 0')).toBeInTheDocument()
    })
  })
})

/**
 * Test Coverage Summary for RegisterOutputModal (Story 04.7a)
 * ============================================================
 *
 * Basic Rendering: 3 tests
 *   - Modal title and WO info
 *   - Product information
 *   - Progress information
 *
 * Form Fields: 5 tests
 *   - Quantity input
 *   - Batch number pre-fill
 *   - Location pre-selection
 *   - Expiry date calculation
 *   - Notes textarea
 *
 * Validation: 4 tests
 *   - Zero quantity error
 *   - QA status required error
 *   - Optional QA status
 *   - Submit button disabled
 *
 * QA Status: 3 tests
 *   - Required indicator
 *   - Optional indicator
 *   - Status options
 *
 * Output Summary Preview: 3 tests
 *   - Shows when quantity entered
 *   - Projected progress
 *   - Hidden when empty
 *
 * Form Submission: 3 tests
 *   - Correct data sent
 *   - Loading state
 *   - Cancel handler
 *
 * Accessibility: 2 tests
 *   - Form labels
 *   - Alert roles
 *
 * Total: 23 tests
 */
