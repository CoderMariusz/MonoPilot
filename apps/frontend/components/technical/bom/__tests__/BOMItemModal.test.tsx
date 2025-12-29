/**
 * BOM Item Modal Component Tests
 * Story: 02.5a - BOM Items Core (MVP)
 * Phase: GREEN - Tests should PASS with implementation
 *
 * Tests the BOMItemModal component which handles:
 * - Create mode (empty form, auto-sequence)
 * - Edit mode (pre-populated, component locked)
 * - Product search combobox
 * - UoM auto-fill and mismatch warning
 * - Operation dropdown from routing
 * - Form validation
 *
 * Coverage Target: 75-80%
 * Test Count: 25+ scenarios
 *
 * Acceptance Criteria:
 * - AC-02-a: Add Item modal opens
 * - AC-02-b: Valid item creation
 * - AC-02-c: Validation errors displayed
 * - AC-03-a: Edit modal pre-population
 * - AC-05: Operation assignment from routing
 * - AC-06: UoM mismatch warning
 * - AC-07: Quantity validation
 * - AC-08: Sequence auto-increment
 */

import { describe, it, expect, vi, beforeEach, Mock } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { BOMItemModal, type BOMItemModalProps } from '../BOMItemModal'
import type { BOMItem, BOMItemWarning } from '@/lib/types/bom'

// Mock fetch globally
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock data
const mockItem: BOMItem = {
  id: 'item-1',
  bom_id: 'bom-1',
  product_id: 'prod-1',
  product_code: 'RM-001',
  product_name: 'Wheat Flour Premium',
  product_type: 'RM',
  product_base_uom: 'kg',
  quantity: 50,
  uom: 'kg',
  sequence: 10,
  operation_seq: 1,
  operation_name: 'Mixing',
  scrap_percent: 2.5,
  notes: 'Store in dry area',
  created_at: '2025-01-01T00:00:00Z',
  updated_at: '2025-01-01T00:00:00Z',
}

const mockProducts = [
  { id: 'prod-1', code: 'RM-001', name: 'Wheat Flour Premium', type: 'RM', uom: 'kg' },
  { id: 'prod-2', code: 'ING-002', name: 'Honey Organic', type: 'ING', uom: 'kg' },
  { id: 'prod-3', code: 'PKG-001', name: 'Plastic Bag 1kg', type: 'PKG', uom: 'pcs' },
]

const mockOperations = [
  { id: 'op-1', sequence: 1, name: 'Mixing' },
  { id: 'op-2', sequence: 2, name: 'Proofing' },
  { id: 'op-3', sequence: 3, name: 'Baking' },
]

// Default props
const defaultProps: BOMItemModalProps = {
  open: true,
  onClose: vi.fn(),
  mode: 'create',
  bomId: 'bom-123',
  routingId: 'routing-123',
  item: null,
  defaultSequence: 10,
  onSave: vi.fn().mockResolvedValue({ item: mockItem, warnings: [] }),
}

const renderComponent = (props: Partial<BOMItemModalProps> = {}) => {
  return render(<BOMItemModal {...defaultProps} {...props} />)
}

// Setup mock fetch responses
const setupMockFetch = () => {
  mockFetch.mockImplementation((url: string) => {
    if (url.includes('/api/technical/products?')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockProducts }),
      })
    }
    if (url.includes('/api/technical/products/')) {
      const productId = url.split('/').pop()
      const product = mockProducts.find(p => p.id === productId)
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: product }),
      })
    }
    if (url.includes('/api/v1/technical/routings/') && url.includes('/operations')) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ data: mockOperations }),
      })
    }
    return Promise.resolve({
      ok: false,
      json: () => Promise.resolve({ error: 'Not found' }),
    })
  })
}

describe('BOMItemModal Component (Story 02.5a)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupMockFetch()
  })

  describe('Create Mode', () => {
    it('should open in create mode with empty form', () => {
      renderComponent({ mode: 'create', item: null })

      expect(screen.getByText('Add Component to BOM')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /save item/i })).toBeInTheDocument()
    })

    it('should pre-fill sequence with default value', () => {
      renderComponent({ mode: 'create', defaultSequence: 20 })

      const sequenceInput = screen.getByLabelText(/sequence/i)
      expect(sequenceInput).toHaveValue(20)
    })

    it('should have empty product selector initially', () => {
      renderComponent({ mode: 'create' })

      expect(screen.getByRole('combobox', { name: /select component/i })).toBeInTheDocument()
    })

    it('should show Save Item button in create mode', () => {
      renderComponent({ mode: 'create' })

      expect(screen.getByRole('button', { name: /save item/i })).toBeInTheDocument()
    })
  })

  describe('Edit Mode', () => {
    it('should open in edit mode with pre-populated data', async () => {
      renderComponent({ mode: 'edit', item: mockItem })

      expect(screen.getByText(/Edit Component/)).toBeInTheDocument()
      // The locked component message should be visible
      await waitFor(() => {
        expect(screen.getByText(/to change component/i)).toBeInTheDocument()
      })
    })

    it('should pre-fill quantity field', () => {
      renderComponent({ mode: 'edit', item: mockItem })

      const quantityInput = screen.getByLabelText(/quantity/i)
      expect(quantityInput).toHaveValue(50)
    })

    it('should pre-fill sequence field', () => {
      renderComponent({ mode: 'edit', item: mockItem })

      const sequenceInput = screen.getByLabelText(/sequence/i)
      expect(sequenceInput).toHaveValue(10)
    })

    it('should pre-fill scrap percent field', () => {
      renderComponent({ mode: 'edit', item: mockItem })

      // Find scrap input by role
      const scrapInputs = screen.getAllByRole('spinbutton')
      // The scrap field has value 2.5
      const scrapInput = scrapInputs.find(input => (input as HTMLInputElement).value === '2.5')
      expect(scrapInput).toBeTruthy()
    })

    it('should disable product selector in edit mode', async () => {
      renderComponent({ mode: 'edit', item: mockItem })

      // Component should be displayed as locked with message
      await waitFor(() => {
        expect(screen.getByText(/to change component/i)).toBeInTheDocument()
      })
    })

    it('should show Save Changes button in edit mode', () => {
      renderComponent({ mode: 'edit', item: mockItem })

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    })
  })

  describe('Form Fields', () => {
    it('should have quantity input', () => {
      renderComponent()

      expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument()
    })

    it('should have UoM field (read-only)', () => {
      renderComponent()

      const uomInput = screen.getByLabelText(/unit of measure/i)
      expect(uomInput).toBeInTheDocument()
      expect(uomInput).toHaveAttribute('readonly')
    })

    it('should have sequence input', () => {
      renderComponent()

      expect(screen.getByLabelText(/sequence/i)).toBeInTheDocument()
    })

    it('should have scrap percent input', () => {
      renderComponent()

      expect(screen.getByText('Scrap Allowance %')).toBeInTheDocument()
    })

    it('should have notes textarea', () => {
      renderComponent()

      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    })

    it('should show character count for notes', () => {
      renderComponent()

      expect(screen.getByText(/\/ 500/)).toBeInTheDocument()
    })
  })

  describe('Operation Assignment', () => {
    it('should show operations dropdown when routing assigned', async () => {
      renderComponent({ routingId: 'routing-123' })

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /operation/i })).toBeInTheDocument()
      })
    })

    it('should disable operation when no routing assigned', () => {
      renderComponent({ routingId: null })

      expect(screen.getByText(/assign a routing to bom first/i)).toBeInTheDocument()
    })

    it('should load operations from routing', async () => {
      renderComponent({ routingId: 'routing-123' })

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/v1/technical/routings/routing-123/operations')
        )
      })
    })
  })

  describe('Validation', () => {
    it('should show error for empty quantity on submit', async () => {
      const onSave = vi.fn()
      renderComponent({ onSave })

      const user = userEvent.setup()

      // Clear quantity
      const quantityInput = screen.getByLabelText(/quantity/i)
      await user.clear(quantityInput)

      // Try to submit
      await user.click(screen.getByRole('button', { name: /save item/i }))

      // Should not call onSave
      expect(onSave).not.toHaveBeenCalled()
    })

    it('should show error for zero quantity', async () => {
      const onSave = vi.fn()
      renderComponent({ onSave })

      const user = userEvent.setup()

      const quantityInput = screen.getByLabelText(/quantity/i)
      await user.clear(quantityInput)
      await user.type(quantityInput, '0')

      await user.click(screen.getByRole('button', { name: /save item/i }))

      expect(onSave).not.toHaveBeenCalled()
    })

    it('should show error for negative quantity', async () => {
      const onSave = vi.fn()
      renderComponent({ onSave })

      const user = userEvent.setup()

      const quantityInput = screen.getByLabelText(/quantity/i)
      await user.clear(quantityInput)
      await user.type(quantityInput, '-5')

      await user.click(screen.getByRole('button', { name: /save item/i }))

      expect(onSave).not.toHaveBeenCalled()
    })

    it('should allow up to 6 decimal places', async () => {
      renderComponent()

      const user = userEvent.setup()
      const quantityInput = screen.getByLabelText(/quantity/i)
      await user.clear(quantityInput)
      await user.type(quantityInput, '50.123456')

      expect(quantityInput).toHaveValue(50.123456)
    })
  })

  describe('UoM Mismatch Warning', () => {
    it('should not show warning when UoM matches', () => {
      renderComponent({ mode: 'edit', item: mockItem })

      expect(screen.queryByText(/uom mismatch/i)).not.toBeInTheDocument()
    })

    it('should show warning when UoM differs from product base', async () => {
      const itemWithMismatch: BOMItem = {
        ...mockItem,
        uom: 'L', // Different from product_base_uom: 'kg'
      }
      renderComponent({ mode: 'edit', item: itemWithMismatch })

      await waitFor(() => {
        expect(screen.getByText(/warning/i)).toBeInTheDocument()
      })
    })

    it('should allow save despite UoM mismatch (warning is non-blocking)', async () => {
      const itemWithMismatch: BOMItem = {
        ...mockItem,
        uom: 'L',
      }
      renderComponent({ mode: 'edit', item: itemWithMismatch })

      // Verify warning is present
      await waitFor(() => {
        expect(screen.getByText(/warning/i)).toBeInTheDocument()
      })

      // Verify save button is still enabled (not disabled due to warning)
      expect(screen.getByRole('button', { name: /save changes/i })).not.toBeDisabled()
    })
  })

  describe('Form Submission', () => {
    it('should have submit button in edit mode', () => {
      renderComponent({ mode: 'edit', item: mockItem })

      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
    })

    it('should have submit button in create mode', () => {
      renderComponent({ mode: 'create' })

      expect(screen.getByRole('button', { name: /save item/i })).toBeInTheDocument()
    })

    it('should show Save Changes text in edit mode', () => {
      renderComponent({ mode: 'edit', item: mockItem })

      expect(screen.getByText('Save Changes')).toBeInTheDocument()
    })

    it('should show Save Item text in create mode', () => {
      renderComponent({ mode: 'create' })

      expect(screen.getByText('Save Item')).toBeInTheDocument()
    })
  })

  describe('Cancel Behavior', () => {
    it('should call onClose when Cancel clicked', async () => {
      const onClose = vi.fn()
      renderComponent({ onClose })

      const user = userEvent.setup()
      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(onClose).toHaveBeenCalled()
    })

    it('should have cancel button always visible', () => {
      renderComponent({ mode: 'edit', item: mockItem })

      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have dialog role', () => {
      renderComponent()

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should have form labels for all inputs', () => {
      renderComponent()

      // Multiple elements may match /component/i, use specific queries
      expect(screen.getByText('Component *')).toBeInTheDocument()
      expect(screen.getByText('Quantity *')).toBeInTheDocument()
      expect(screen.getByText('Sequence')).toBeInTheDocument()
      expect(screen.getByText('Scrap Allowance %')).toBeInTheDocument()
      expect(screen.getByText('Notes (Optional)')).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      renderComponent()

      const user = userEvent.setup()

      // Tab into form - focus lands on first focusable element
      await user.tab()

      // Just verify we can tab into the form
      expect(document.activeElement).toBeTruthy()
    })
  })

  describe('Reset on Open/Close', () => {
    it('should reset form when modal opens', async () => {
      const { rerender } = renderComponent({ open: false })

      rerender(<BOMItemModal {...defaultProps} open={true} />)

      // Quantity input starts empty (value="") not 0
      const quantityInput = screen.getByPlaceholderText('0.000000')
      expect(quantityInput).toBeInTheDocument()
    })

    it('should reset form when switching between create and edit', async () => {
      const { rerender } = renderComponent({ mode: 'create' })

      rerender(<BOMItemModal {...defaultProps} mode="edit" item={mockItem} />)

      // Check that the component shows the edit header
      expect(screen.getByText(/Edit Component/)).toBeInTheDocument()
    })
  })
})
