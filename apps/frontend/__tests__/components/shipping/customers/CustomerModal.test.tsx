/**
 * Component Tests: CustomerModal (Story 07.1)
 * Phase: RED - All tests should FAIL (no implementation exists)
 *
 * Tests the CustomerModal component (CustomerForm in modal):
 * - Create mode: all fields editable
 * - Edit mode: customer_code readonly
 * - Form validation with Zod
 * - Allergen multi-select
 * - Tax ID encrypted hint
 * - Submit/Cancel actions
 * - Loading states
 *
 * Wireframe: SHIP-002
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// @ts-expect-error - Component does not exist yet
import { CustomerModal } from '@/components/shipping/customers/CustomerModal'

// Mock allergens data
const mockAllergens = [
  { id: 'allergen-milk', code: 'A07', name: 'Milk' },
  { id: 'allergen-peanuts', code: 'A05', name: 'Peanuts' },
  { id: 'allergen-fish', code: 'A04', name: 'Fish' },
  { id: 'allergen-gluten', code: 'A01', name: 'Gluten' },
]

// Mock existing customer for edit mode
const mockCustomer = {
  id: 'cust-1',
  customer_code: 'ACME001',
  name: 'ACME Corporation',
  category: 'wholesale',
  email: 'info@acme.com',
  phone: '+1-555-0100',
  tax_id: 'VAT123456',
  credit_limit: 50000,
  payment_terms_days: 30,
  allergen_restrictions: ['allergen-milk', 'allergen-peanuts'],
  is_active: true,
  notes: 'VIP customer',
  created_at: '2025-01-01T00:00:00Z',
  created_by: 'user-1',
}

describe('CustomerModal Component (Story 07.1)', () => {
  const mockOnSubmit = vi.fn()
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSubmit.mockResolvedValue(undefined)
  })

  // ===========================================================================
  // CREATE MODE
  // ===========================================================================

  describe('Create Mode', () => {
    it('should show "Create Customer" title', () => {
      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Create Customer')).toBeInTheDocument()
    })

    it('should have editable customer_code field', () => {
      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      const codeInput = screen.getByLabelText(/customer code/i)
      expect(codeInput).not.toBeDisabled()
    })

    it('should have empty form fields', () => {
      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByLabelText(/customer code/i)).toHaveValue('')
      expect(screen.getByLabelText(/name/i)).toHaveValue('')
    })

    it('should have "Create" submit button', () => {
      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByRole('button', { name: /create/i })).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // EDIT MODE
  // ===========================================================================

  describe('Edit Mode', () => {
    it('should show "Edit Customer" title', () => {
      render(
        <CustomerModal
          isOpen={true}
          customer={mockCustomer}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText('Edit Customer')).toBeInTheDocument()
    })

    it('should have readonly/disabled customer_code field', () => {
      render(
        <CustomerModal
          isOpen={true}
          customer={mockCustomer}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      const codeInput = screen.getByLabelText(/customer code/i)
      expect(codeInput).toBeDisabled()
    })

    it('should populate form with existing data', () => {
      render(
        <CustomerModal
          isOpen={true}
          customer={mockCustomer}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByLabelText(/customer code/i)).toHaveValue('ACME001')
      expect(screen.getByLabelText(/name/i)).toHaveValue('ACME Corporation')
      expect(screen.getByLabelText(/email/i)).toHaveValue('info@acme.com')
    })

    it('should show selected allergens as chips', () => {
      render(
        <CustomerModal
          isOpen={true}
          customer={mockCustomer}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByTestId('allergen-chip-milk')).toBeInTheDocument()
      expect(screen.getByTestId('allergen-chip-peanuts')).toBeInTheDocument()
    })

    it('should have "Save" submit button', () => {
      render(
        <CustomerModal
          isOpen={true}
          customer={mockCustomer}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    })

    it('should show metadata (created_at, created_by)', () => {
      render(
        <CustomerModal
          isOpen={true}
          customer={mockCustomer}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByText(/created/i)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // FORM FIELDS
  // ===========================================================================

  describe('Form Fields', () => {
    it('should have customer_code input', () => {
      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByLabelText(/customer code/i)).toBeInTheDocument()
    })

    it('should have name input', () => {
      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByLabelText(/^name$/i)).toBeInTheDocument()
    })

    it('should have category select', () => {
      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByLabelText(/category/i)).toBeInTheDocument()
    })

    it('should have email input', () => {
      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    })

    it('should have phone input', () => {
      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
    })

    it('should have tax_id input with encrypted hint', () => {
      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByLabelText(/tax id/i)).toBeInTheDocument()
      expect(screen.getByText(/encrypted/i)).toBeInTheDocument()
    })

    it('should have credit_limit input', () => {
      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByLabelText(/credit limit/i)).toBeInTheDocument()
    })

    it('should have payment_terms_days input', () => {
      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByLabelText(/payment terms/i)).toBeInTheDocument()
    })

    it('should have allergen multi-select', () => {
      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByTestId('allergen-select')).toBeInTheDocument()
    })

    it('should have notes textarea', () => {
      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      expect(screen.getByLabelText(/notes/i)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // VALIDATION
  // ===========================================================================

  describe('Validation', () => {
    it('should show error when customer_code is empty', async () => {
      const user = userEvent.setup()

      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      await user.click(screen.getByRole('button', { name: /create/i }))

      await waitFor(() => {
        expect(screen.getByText(/customer code is required/i)).toBeInTheDocument()
      })
    })

    it('should show error for invalid customer_code format', async () => {
      const user = userEvent.setup()

      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      await user.type(screen.getByLabelText(/customer code/i), 'invalid code!')
      await user.click(screen.getByRole('button', { name: /create/i }))

      await waitFor(() => {
        expect(screen.getByText(/invalid character/i)).toBeInTheDocument()
      })
    })

    it('should show error when name is empty', async () => {
      const user = userEvent.setup()

      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      await user.type(screen.getByLabelText(/customer code/i), 'TEST001')
      await user.click(screen.getByRole('button', { name: /create/i }))

      await waitFor(() => {
        expect(screen.getByText(/name is required/i)).toBeInTheDocument()
      })
    })

    it('should show error when category not selected', async () => {
      const user = userEvent.setup()

      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      await user.type(screen.getByLabelText(/customer code/i), 'TEST001')
      await user.type(screen.getByLabelText(/^name$/i), 'Test Customer')
      await user.click(screen.getByRole('button', { name: /create/i }))

      await waitFor(() => {
        expect(screen.getByText(/category is required/i)).toBeInTheDocument()
      })
    })

    it('should show error for invalid email format', async () => {
      const user = userEvent.setup()

      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      await user.type(screen.getByLabelText(/email/i), 'invalid-email')
      await user.click(screen.getByRole('button', { name: /create/i }))

      await waitFor(() => {
        expect(screen.getByText(/invalid email/i)).toBeInTheDocument()
      })
    })

    it('should show error for payment_terms > 365', async () => {
      const user = userEvent.setup()

      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      await user.clear(screen.getByLabelText(/payment terms/i))
      await user.type(screen.getByLabelText(/payment terms/i), '400')
      await user.click(screen.getByRole('button', { name: /create/i }))

      await waitFor(() => {
        expect(screen.getByText(/must be 1-365/i)).toBeInTheDocument()
      })
    })

    it('should show error for negative credit_limit', async () => {
      const user = userEvent.setup()

      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      await user.type(screen.getByLabelText(/credit limit/i), '-1000')
      await user.click(screen.getByRole('button', { name: /create/i }))

      await waitFor(() => {
        expect(screen.getByText(/must be positive/i)).toBeInTheDocument()
      })
    })
  })

  // ===========================================================================
  // ALLERGEN MULTI-SELECT
  // ===========================================================================

  describe('Allergen Multi-Select', () => {
    it('should open dropdown when clicked', async () => {
      const user = userEvent.setup()

      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      await user.click(screen.getByTestId('allergen-select'))

      await waitFor(() => {
        expect(screen.getByText('Milk')).toBeVisible()
        expect(screen.getByText('Peanuts')).toBeVisible()
      })
    })

    it('should add allergen chip when selected', async () => {
      const user = userEvent.setup()

      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      await user.click(screen.getByTestId('allergen-select'))
      await user.click(screen.getByTestId('allergen-option-milk'))

      expect(screen.getByTestId('allergen-chip-milk')).toBeInTheDocument()
    })

    it('should remove allergen chip when X clicked', async () => {
      const user = userEvent.setup()

      render(
        <CustomerModal
          isOpen={true}
          customer={mockCustomer}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      const milkChip = screen.getByTestId('allergen-chip-milk')
      await user.click(milkChip.querySelector('[data-testid="remove-allergen"]')!)

      expect(screen.queryByTestId('allergen-chip-milk')).not.toBeInTheDocument()
    })

    it('should show warning when allergens selected', async () => {
      const user = userEvent.setup()

      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      await user.click(screen.getByTestId('allergen-select'))
      await user.click(screen.getByTestId('allergen-option-milk'))

      expect(screen.getByText(/customer has allergen restrictions/i)).toBeInTheDocument()
    })
  })

  // ===========================================================================
  // SUBMIT/CANCEL ACTIONS
  // ===========================================================================

  describe('Submit/Cancel Actions', () => {
    it('should call onSubmit with form data', async () => {
      const user = userEvent.setup()

      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      await user.type(screen.getByLabelText(/customer code/i), 'NEW001')
      await user.type(screen.getByLabelText(/^name$/i), 'New Customer')
      await user.selectOptions(screen.getByLabelText(/category/i), 'retail')

      await user.click(screen.getByRole('button', { name: /create/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            customer_code: 'NEW001',
            name: 'New Customer',
            category: 'retail',
          })
        )
      })
    })

    it('should call onClose when Cancel clicked', async () => {
      const user = userEvent.setup()

      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should show loading state during submission', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      )

      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      await user.type(screen.getByLabelText(/customer code/i), 'LOAD001')
      await user.type(screen.getByLabelText(/^name$/i), 'Loading Test')
      await user.selectOptions(screen.getByLabelText(/category/i), 'retail')

      await user.click(screen.getByRole('button', { name: /create/i }))

      await waitFor(() => {
        expect(screen.getByText(/creating/i)).toBeInTheDocument()
      })
    })

    it('should disable submit button during submission', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 1000))
      )

      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      await user.type(screen.getByLabelText(/customer code/i), 'DISABLE')
      await user.type(screen.getByLabelText(/^name$/i), 'Disable Test')
      await user.selectOptions(screen.getByLabelText(/category/i), 'retail')

      await user.click(screen.getByRole('button', { name: /create/i }))

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /creating/i })).toBeDisabled()
      })
    })
  })

  // ===========================================================================
  // MODAL BEHAVIOR
  // ===========================================================================

  describe('Modal Behavior', () => {
    it('should not render when isOpen=false', () => {
      render(
        <CustomerModal
          isOpen={false}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      expect(screen.queryByText('Create Customer')).not.toBeInTheDocument()
    })

    it('should call onClose when clicking backdrop', async () => {
      const user = userEvent.setup()

      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      await user.click(screen.getByTestId('modal-backdrop'))

      expect(mockOnClose).toHaveBeenCalled()
    })

    it('should call onClose when pressing Escape', async () => {
      const user = userEvent.setup()

      render(
        <CustomerModal
          isOpen={true}
          customer={null}
          allergens={mockAllergens}
          onSubmit={mockOnSubmit}
          onClose={mockOnClose}
        />
      )

      await user.keyboard('{Escape}')

      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})

/**
 * Test Coverage Summary for Story 07.1 - CustomerModal
 * =====================================================
 *
 * Create Mode: 4 tests
 *   - Title
 *   - Editable code
 *   - Empty fields
 *   - Create button
 *
 * Edit Mode: 6 tests
 *   - Title
 *   - Readonly code
 *   - Populated data
 *   - Allergen chips
 *   - Save button
 *   - Metadata
 *
 * Form Fields: 10 tests
 *   - customer_code
 *   - name
 *   - category
 *   - email
 *   - phone
 *   - tax_id with hint
 *   - credit_limit
 *   - payment_terms
 *   - allergen select
 *   - notes
 *
 * Validation: 7 tests
 *   - Empty code
 *   - Invalid code format
 *   - Empty name
 *   - Missing category
 *   - Invalid email
 *   - Payment terms > 365
 *   - Negative credit
 *
 * Allergen Multi-Select: 4 tests
 *   - Open dropdown
 *   - Add chip
 *   - Remove chip
 *   - Warning message
 *
 * Submit/Cancel: 4 tests
 *   - onSubmit with data
 *   - onClose on cancel
 *   - Loading state
 *   - Disabled during submit
 *
 * Modal Behavior: 3 tests
 *   - Hidden when closed
 *   - Backdrop click
 *   - Escape key
 *
 * Total: 38 tests
 * Status: ALL FAIL (RED phase - no implementation)
 */
