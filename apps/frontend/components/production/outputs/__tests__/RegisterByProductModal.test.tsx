/**
 * Unit Tests: RegisterByProductModal Component (Story 04.7a)
 *
 * Tests by-product registration modal with:
 * - Expected qty calculation (FR-PROD-013)
 * - Pre-filled quantity
 * - Auto-generated batch number
 * - Zero quantity warning
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { RegisterByProductModal } from '../RegisterByProductModal'
import type { ByProduct } from '../RegisterByProductModal'

// Mock fetch
global.fetch = vi.fn()

// Mock by-product data
const mockByProduct: ByProduct = {
  product_id: 'bp-3',
  product_name: 'Wheat Germ',
  product_code: 'SKU-BP-GERM',
  material_id: 'mat-3',
  yield_percent: 2,
  expected_qty: 100,
  actual_qty: 0,
  uom: 'kg',
  lp_count: 0,
  status: 'not_registered',
  last_registered_at: null,
}

const mockLocations = [
  { id: 'loc-1', name: 'WH-A / Zone 2 / Rack 5 (By-Products)' },
  { id: 'loc-2', name: 'WH-B / By-Products' },
]

describe('RegisterByProductModal Component (Story 04.7a)', () => {
  const mockOnSuccess = vi.fn()
  const mockOnOpenChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            output: {
              id: 'output-1',
              lp_number: 'LP-2025-05486',
            },
          },
        }),
    })
  })

  // ============================================================================
  // Basic Rendering Tests (FR-PROD-013)
  // ============================================================================
  describe('Basic Rendering', () => {
    it('renders modal with by-product name', () => {
      render(
        <RegisterByProductModal
          byProduct={mockByProduct}
          mainOutputLpId="lp-main"
          mainBatch="B-2025-0156"
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          locations={mockLocations}
        />
      )

      expect(screen.getByText(/Register By-Product: Wheat Germ/)).toBeInTheDocument()
    })

    it('displays by-product information', () => {
      render(
        <RegisterByProductModal
          byProduct={mockByProduct}
          mainOutputLpId="lp-main"
          mainBatch="B-2025-0156"
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          locations={mockLocations}
        />
      )

      expect(screen.getByTestId('product-name')).toHaveTextContent('Wheat Germ')
      expect(screen.getByTestId('product-code')).toHaveTextContent('SKU-BP-GERM')
    })

    it('AC: displays expected qty from yield percent', () => {
      render(
        <RegisterByProductModal
          byProduct={mockByProduct}
          mainOutputLpId="lp-main"
          mainBatch="B-2025-0156"
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          locations={mockLocations}
        />
      )

      const expectedQtyElement = screen.getByTestId('expected-qty')
      expect(expectedQtyElement).toHaveTextContent('100')
      expect(expectedQtyElement).toHaveTextContent('2%')
    })

    it('displays BOM configuration info', () => {
      render(
        <RegisterByProductModal
          byProduct={mockByProduct}
          mainOutputLpId="lp-main"
          mainBatch="B-2025-0156"
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          locations={mockLocations}
        />
      )

      expect(screen.getByText(/is_by_product: true/)).toBeInTheDocument()
      expect(screen.getByText(/yield_percent: 2%/)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Pre-filled Values Tests
  // ============================================================================
  describe('Pre-filled Values', () => {
    it('AC: pre-fills quantity with expected qty', () => {
      render(
        <RegisterByProductModal
          byProduct={mockByProduct}
          mainOutputLpId="lp-main"
          mainBatch="B-2025-0156"
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          locations={mockLocations}
        />
      )

      const qtyInput = screen.getByRole('spinbutton', { name: /quantity/i })
      expect(qtyInput).toHaveValue(100)
    })

    it('AC: auto-generates batch number from main batch', () => {
      render(
        <RegisterByProductModal
          byProduct={mockByProduct}
          mainOutputLpId="lp-main"
          mainBatch="B-2025-0156"
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          locations={mockLocations}
        />
      )

      const batchInput = screen.getByLabelText(/batch number/i)
      expect(batchInput).toHaveValue('B-2025-0156-BP-SKU-BP-GERM')
    })

    it('defaults QA status to pending', () => {
      render(
        <RegisterByProductModal
          byProduct={mockByProduct}
          mainOutputLpId="lp-main"
          mainBatch="B-2025-0156"
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          locations={mockLocations}
        />
      )

      // QA status select should show Pending
      expect(screen.getByText('Pending')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Editable Fields Tests
  // ============================================================================
  describe('Editable Fields', () => {
    it('allows editing quantity', async () => {
      const user = userEvent.setup()

      render(
        <RegisterByProductModal
          byProduct={mockByProduct}
          mainOutputLpId="lp-main"
          mainBatch="B-2025-0156"
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          locations={mockLocations}
        />
      )

      const qtyInput = screen.getByRole('spinbutton', { name: /quantity/i })
      await user.clear(qtyInput)
      await user.type(qtyInput, '64')

      expect(qtyInput).toHaveValue(64)
    })

    it('allows editing batch number', async () => {
      const user = userEvent.setup()

      render(
        <RegisterByProductModal
          byProduct={mockByProduct}
          mainOutputLpId="lp-main"
          mainBatch="B-2025-0156"
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          locations={mockLocations}
        />
      )

      const batchInput = screen.getByLabelText(/batch number/i)
      await user.clear(batchInput)
      await user.type(batchInput, 'CUSTOM-BATCH')

      expect(batchInput).toHaveValue('CUSTOM-BATCH')
    })

    it('allows selecting QA status', async () => {
      const user = userEvent.setup()

      render(
        <RegisterByProductModal
          byProduct={mockByProduct}
          mainOutputLpId="lp-main"
          mainBatch="B-2025-0156"
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          locations={mockLocations}
        />
      )

      // Open QA status dropdown
      const qaSelect = screen.getByLabelText(/qa status/i)
      await user.click(qaSelect)

      // Select Approved
      const approvedOption = await screen.findByText('Approved', { selector: '[role="option"]' })
      await user.click(approvedOption)

      // Verify selection - look in trigger, not option
      const trigger = screen.getByLabelText(/qa status/i)
      expect(trigger).toHaveTextContent('Approved')
    })

    it('allows selecting location', async () => {
      const user = userEvent.setup()

      render(
        <RegisterByProductModal
          byProduct={mockByProduct}
          mainOutputLpId="lp-main"
          mainBatch="B-2025-0156"
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          locations={mockLocations}
        />
      )

      // Open location dropdown
      const locationSelect = screen.getByLabelText(/location/i)
      await user.click(locationSelect)

      // Select location
      const locationOption = await screen.findByText(/WH-B/, { selector: '[role="option"]' })
      await user.click(locationOption)

      // Verify selection in trigger
      const trigger = screen.getByLabelText(/location/i)
      expect(trigger).toHaveTextContent(/WH-B/)
    })
  })

  // ============================================================================
  // Summary Preview Tests
  // ============================================================================
  describe('Summary Preview', () => {
    it('displays by-product summary when quantity > 0', () => {
      render(
        <RegisterByProductModal
          byProduct={mockByProduct}
          mainOutputLpId="lp-main"
          mainBatch="B-2025-0156"
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          locations={mockLocations}
        />
      )

      expect(screen.getByText('By-Product Summary')).toBeInTheDocument()
    })

    it('displays genealogy info in summary', () => {
      render(
        <RegisterByProductModal
          byProduct={mockByProduct}
          mainOutputLpId="lp-main"
          mainBatch="B-2025-0156"
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          locations={mockLocations}
        />
      )

      expect(screen.getByText(/Same parent materials as main output/)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Form Submission Tests
  // ============================================================================
  describe('Form Submission', () => {
    it('AC: creates LP with entered qty', async () => {
      const user = userEvent.setup()

      render(
        <RegisterByProductModal
          byProduct={mockByProduct}
          mainOutputLpId="lp-main"
          mainBatch="B-2025-0156"
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          locations={mockLocations}
        />
      )

      // Change quantity
      const qtyInput = screen.getByRole('spinbutton', { name: /quantity/i })
      await user.clear(qtyInput)
      await user.type(qtyInput, '45')

      // Submit
      const submitButton = screen.getByRole('button', { name: /register by-product/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/production/by-products',
          expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"quantity":45'),
          })
        )
      })
    })

    it('calls onSuccess after successful registration', async () => {
      const user = userEvent.setup()

      render(
        <RegisterByProductModal
          byProduct={mockByProduct}
          mainOutputLpId="lp-main"
          mainBatch="B-2025-0156"
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          locations={mockLocations}
        />
      )

      const submitButton = screen.getByRole('button', { name: /register by-product/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled()
      })
    })

    it('shows loading state during submission', async () => {
      const user = userEvent.setup()
      ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
        () => new Promise((resolve) => setTimeout(() => resolve({ ok: true, json: () => Promise.resolve({ data: {} }) }), 100))
      )

      render(
        <RegisterByProductModal
          byProduct={mockByProduct}
          mainOutputLpId="lp-main"
          mainBatch="B-2025-0156"
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          locations={mockLocations}
        />
      )

      const submitButton = screen.getByRole('button', { name: /register by-product/i })
      await user.click(submitButton)

      expect(submitButton).toBeDisabled()
    })

    it('shows error when registration fails', async () => {
      const user = userEvent.setup()
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Registration failed' }),
      })

      render(
        <RegisterByProductModal
          byProduct={mockByProduct}
          mainOutputLpId="lp-main"
          mainBatch="B-2025-0156"
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          locations={mockLocations}
        />
      )

      const submitButton = screen.getByRole('button', { name: /register by-product/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText('Registration failed')).toBeInTheDocument()
      })
    })
  })

  // ============================================================================
  // Cancel Tests
  // ============================================================================
  describe('Cancel', () => {
    it('calls onOpenChange(false) when Cancel clicked', async () => {
      const user = userEvent.setup()

      render(
        <RegisterByProductModal
          byProduct={mockByProduct}
          mainOutputLpId="lp-main"
          mainBatch="B-2025-0156"
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          locations={mockLocations}
        />
      )

      const cancelButton = screen.getByRole('button', { name: /cancel/i })
      await user.click(cancelButton)

      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  // ============================================================================
  // Accessibility Tests
  // ============================================================================
  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(
        <RegisterByProductModal
          byProduct={mockByProduct}
          mainOutputLpId="lp-main"
          mainBatch="B-2025-0156"
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          locations={mockLocations}
        />
      )

      expect(screen.getByLabelText(/actual quantity/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/batch number/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/qa status/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    })

    it('shows error with role="alert"', async () => {
      const user = userEvent.setup()
      ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
        ok: false,
        json: () => Promise.resolve({ error: 'Error message' }),
      })

      render(
        <RegisterByProductModal
          byProduct={mockByProduct}
          mainOutputLpId="lp-main"
          mainBatch="B-2025-0156"
          open={true}
          onOpenChange={mockOnOpenChange}
          onSuccess={mockOnSuccess}
          locations={mockLocations}
        />
      )

      const submitButton = screen.getByRole('button', { name: /register by-product/i })
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      })
    })
  })
})

/**
 * Test Coverage Summary for RegisterByProductModal (Story 04.7a)
 * ==============================================================
 *
 * Basic Rendering: 4 tests
 *   - Modal with name
 *   - By-product info
 *   - Expected qty with yield
 *   - BOM configuration
 *
 * Pre-filled Values: 3 tests
 *   - Quantity
 *   - Batch number
 *   - QA status
 *
 * Editable Fields: 4 tests
 *   - Edit quantity
 *   - Edit batch number
 *   - Select QA status
 *   - Select location
 *
 * Summary Preview: 2 tests
 *   - Summary display
 *   - Genealogy info
 *
 * Form Submission: 4 tests
 *   - Creates LP with qty
 *   - Calls onSuccess
 *   - Loading state
 *   - Error display
 *
 * Cancel: 1 test
 *   - Cancel handler
 *
 * Accessibility: 2 tests
 *   - Form labels
 *   - Alert role
 *
 * Total: 20 tests
 */
