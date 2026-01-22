/**
 * AllergenValidationWarning Component Tests
 * Story: 07.6 - SO Allergen Validation
 * Phase: GREEN - Tests should pass with implemented components
 *
 * Tests the allergen validation UI components:
 * - AllergenAlert: Alert banner showing conflicts and override status
 * - AllergenOverrideModal: Manager override modal with reason capture
 * - CustomerOrderHistory: Paginated table of customer's order history
 *
 * Coverage Target: 80%+
 * Test Count: 75+ scenarios
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Components to test
import { AllergenAlert } from '../AllergenAlert'
import { AllergenOverrideModal } from '../AllergenOverrideModal'
import { CustomerOrderHistory } from '../CustomerOrderHistory'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock the hook
vi.mock('@/lib/hooks/use-customer-order-history', () => ({
  useCustomerOrderHistory: vi.fn(),
}))

import { useCustomerOrderHistory } from '@/lib/hooks/use-customer-order-history'

/**
 * Mock Data for Testing
 */
const mockAllergenConflict = {
  line_id: 'line-001',
  line_number: 1,
  product_id: 'prod-123',
  product_code: 'SKU-1234',
  product_name: 'Peanut Brittle',
  allergen_id: 'A05',
  allergen_code: 'PEANUT',
  allergen_name: 'Peanuts',
}

const mockMultipleConflicts = [
  mockAllergenConflict,
  {
    line_id: 'line-002',
    line_number: 2,
    product_id: 'prod-456',
    product_code: 'SKU-5678',
    product_name: 'Milk Chocolate',
    allergen_id: 'A07',
    allergen_code: 'MILK',
    allergen_name: 'Milk',
  },
]

const mockCustomerOrders = [
  {
    id: 'so-001',
    order_number: 'SO-2025-001',
    order_date: '2025-12-15T14:30:00Z',
    status: 'confirmed' as const,
    total_amount: 1234.56,
    currency: 'USD',
    line_count: 3,
  },
  {
    id: 'so-002',
    order_number: 'SO-2025-002',
    order_date: '2025-12-10T10:00:00Z',
    status: 'shipped' as const,
    total_amount: 567.89,
    currency: 'USD',
    line_count: 2,
  },
]

// =============================================================================
// AllergenAlert Component Tests
// =============================================================================
describe('AllergenAlert Component', () => {
  const defaultProps = {
    conflicts: [mockAllergenConflict],
    overrideApproved: false,
    canOverride: false,
    onOverride: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Conflict Blocking State', () => {
    it('should render red alert banner when conflicts exist', () => {
      render(<AllergenAlert {...defaultProps} />)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('bg-red-50')
      expect(alert).toHaveClass('border-red-500')
    })

    it('should display AlertTriangle icon', () => {
      render(<AllergenAlert {...defaultProps} />)
      expect(screen.getByTestId('alert-triangle-icon')).toBeInTheDocument()
    })

    it('should display "Allergen Conflict Detected" title', () => {
      render(<AllergenAlert {...defaultProps} />)
      expect(screen.getByText(/allergen conflict detected/i)).toBeInTheDocument()
    })

    it('should display conflict count in title', () => {
      render(<AllergenAlert {...defaultProps} conflicts={mockMultipleConflicts} />)
      expect(screen.getByText(/2 allergen conflicts/i)).toBeInTheDocument()
    })

    it('should display product name and allergen name for each conflict', () => {
      render(<AllergenAlert {...defaultProps} />)
      expect(screen.getByText('Peanut Brittle')).toBeInTheDocument()
      expect(screen.getByText('Peanuts')).toBeInTheDocument()
    })

    it('should display line number for each conflict', () => {
      render(<AllergenAlert {...defaultProps} />)
      expect(screen.getByText(/line 1/i)).toBeInTheDocument()
    })

    it('should display product code for each conflict', () => {
      render(<AllergenAlert {...defaultProps} />)
      expect(screen.getByText(/SKU-1234/i)).toBeInTheDocument()
    })

    it('should display allergen code badge', () => {
      render(<AllergenAlert {...defaultProps} />)
      expect(screen.getByText('PEANUT')).toBeInTheDocument()
    })
  })

  describe('Manager Override Button', () => {
    it('should display override button when canOverride is true', () => {
      render(<AllergenAlert {...defaultProps} canOverride={true} />)
      expect(screen.getByRole('button', { name: /override/i })).toBeInTheDocument()
    })

    it('should NOT display override button when canOverride is false', () => {
      render(<AllergenAlert {...defaultProps} canOverride={false} />)
      expect(screen.queryByRole('button', { name: /override/i })).not.toBeInTheDocument()
    })

    it('should display info text for non-managers', () => {
      render(<AllergenAlert {...defaultProps} canOverride={false} />)
      expect(screen.getByText(/contact manager to override/i)).toBeInTheDocument()
    })

    it('should call onOverride when override button clicked', async () => {
      const onOverride = vi.fn()
      render(<AllergenAlert {...defaultProps} canOverride={true} onOverride={onOverride} />)
      await userEvent.click(screen.getByRole('button', { name: /override/i }))
      expect(onOverride).toHaveBeenCalled()
    })
  })

  describe('Override Approved State', () => {
    const overrideApprovedProps = {
      ...defaultProps,
      overrideApproved: true,
      overrideReason: 'Customer confirmed they can accept milk products for this order per phone call',
      overriddenBy: 'Sarah Johnson',
      overriddenAt: '2025-12-18T14:35:00Z',
    }

    it('should render orange alert banner when override is approved', () => {
      render(<AllergenAlert {...overrideApprovedProps} />)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveClass('bg-orange-50')
      expect(alert).toHaveClass('border-orange-500')
    })

    it('should display Info icon instead of AlertTriangle', () => {
      render(<AllergenAlert {...overrideApprovedProps} />)
      expect(screen.getByTestId('info-icon')).toBeInTheDocument()
      expect(screen.queryByTestId('alert-triangle-icon')).not.toBeInTheDocument()
    })

    it('should display "Allergen Override Approved" title', () => {
      render(<AllergenAlert {...overrideApprovedProps} />)
      expect(screen.getByText(/allergen override approved/i)).toBeInTheDocument()
    })

    it('should display who approved the override', () => {
      render(<AllergenAlert {...overrideApprovedProps} />)
      expect(screen.getByText(/Sarah Johnson/i)).toBeInTheDocument()
    })

    it('should display when the override was approved', () => {
      render(<AllergenAlert {...overrideApprovedProps} />)
      expect(screen.getByText(/Dec 18, 2025/i)).toBeInTheDocument()
    })

    it('should display the override reason in gray box', () => {
      render(<AllergenAlert {...overrideApprovedProps} />)
      expect(screen.getByText(/customer confirmed/i)).toBeInTheDocument()
    })

    it('should NOT display override button when override is approved', () => {
      render(<AllergenAlert {...overrideApprovedProps} canOverride={true} />)
      expect(screen.queryByRole('button', { name: /override/i })).not.toBeInTheDocument()
    })
  })

  describe('Multiple Conflicts Display', () => {
    it('should display all conflicts in a list', () => {
      render(<AllergenAlert {...defaultProps} conflicts={mockMultipleConflicts} />)
      expect(screen.getByText('Peanut Brittle')).toBeInTheDocument()
      expect(screen.getByText('Milk Chocolate')).toBeInTheDocument()
    })

    it('should display correct line numbers for each conflict', () => {
      render(<AllergenAlert {...defaultProps} conflicts={mockMultipleConflicts} />)
      expect(screen.getByText(/line 1/i)).toBeInTheDocument()
      expect(screen.getByText(/line 2/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have role="alert"', () => {
      render(<AllergenAlert {...defaultProps} />)
      expect(screen.getByRole('alert')).toBeInTheDocument()
    })

    it('should have aria-live="assertive"', () => {
      render(<AllergenAlert {...defaultProps} />)
      const alert = screen.getByRole('alert')
      expect(alert).toHaveAttribute('aria-live', 'assertive')
    })

    it('should have descriptive aria-label on override button', () => {
      render(<AllergenAlert {...defaultProps} canOverride={true} />)
      const button = screen.getByRole('button', { name: /override allergen block/i })
      expect(button).toBeInTheDocument()
    })
  })
})

// =============================================================================
// AllergenOverrideModal Component Tests
// =============================================================================
describe('AllergenOverrideModal Component', () => {
  const defaultProps = {
    isOpen: true,
    conflicts: [mockAllergenConflict],
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    isLoading: false,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Modal Display', () => {
    it('should render modal when isOpen is true', () => {
      render(<AllergenOverrideModal {...defaultProps} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should not render modal when isOpen is false', () => {
      render(<AllergenOverrideModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })

    it('should display modal title', () => {
      render(<AllergenOverrideModal {...defaultProps} />)
      expect(screen.getByText(/override allergen block/i)).toBeInTheDocument()
    })

    it('should display warning text about food safety', () => {
      render(<AllergenOverrideModal {...defaultProps} />)
      expect(screen.getByText(/food safety/i)).toBeInTheDocument()
    })
  })

  describe('Conflict Summary', () => {
    it('should display conflict count', () => {
      render(<AllergenOverrideModal {...defaultProps} conflicts={mockMultipleConflicts} />)
      expect(screen.getByText(/2 allergen conflicts/i)).toBeInTheDocument()
    })

    it('should display product and allergen names', () => {
      render(<AllergenOverrideModal {...defaultProps} />)
      expect(screen.getByText('Peanut Brittle')).toBeInTheDocument()
      expect(screen.getByText('Peanuts')).toBeInTheDocument()
    })
  })

  describe('Reason Input Field', () => {
    it('should display reason textarea', () => {
      render(<AllergenOverrideModal {...defaultProps} />)
      expect(screen.getByLabelText(/override reason/i)).toBeInTheDocument()
    })

    it('should display placeholder text', () => {
      render(<AllergenOverrideModal {...defaultProps} />)
      const textarea = screen.getByLabelText(/override reason/i)
      expect(textarea).toHaveAttribute('placeholder', expect.stringContaining('why this allergen conflict is acceptable'))
    })

    it('should display character count', () => {
      render(<AllergenOverrideModal {...defaultProps} />)
      expect(screen.getByText(/0 \/ 500/i)).toBeInTheDocument()
    })

    it('should update character count as user types', async () => {
      render(<AllergenOverrideModal {...defaultProps} />)
      const textarea = screen.getByLabelText(/override reason/i)
      await userEvent.type(textarea, 'Test reason text here.')
      expect(screen.getByText(/22 \/ 500/i)).toBeInTheDocument()
    })
  })

  describe('Reason Validation', () => {
    it('should show error when reason is less than 20 characters after blur', async () => {
      render(<AllergenOverrideModal {...defaultProps} />)
      const textarea = screen.getByLabelText(/override reason/i)
      await userEvent.type(textarea, 'Too short')
      fireEvent.blur(textarea)
      expect(screen.getByText(/at least 20 characters/i)).toBeInTheDocument()
    })

    it('should show error when reason exceeds 500 characters', async () => {
      const user = userEvent.setup({ delay: null })
      render(<AllergenOverrideModal {...defaultProps} />)
      const textarea = screen.getByLabelText(/override reason/i)
      // Use paste to quickly add 501 characters
      await user.click(textarea)
      await user.paste('A'.repeat(501))
      await waitFor(() => {
        expect(screen.getByText(/must not exceed 500 characters/i)).toBeInTheDocument()
      })
    })

    it('should accept reason with exactly 20 characters', async () => {
      const onConfirm = vi.fn().mockResolvedValue(undefined)
      render(<AllergenOverrideModal {...defaultProps} onConfirm={onConfirm} />)
      const textarea = screen.getByLabelText(/override reason/i)
      // Use fireEvent.change for performance
      fireEvent.change(textarea, { target: { value: 'A'.repeat(20) } })
      await userEvent.click(screen.getByRole('checkbox'))
      await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
      expect(onConfirm).toHaveBeenCalled()
    })

    it('should not show error for valid reason', async () => {
      render(<AllergenOverrideModal {...defaultProps} />)
      const textarea = screen.getByLabelText(/override reason/i)
      // Use fireEvent.change for performance
      fireEvent.change(textarea, { target: { value: 'This is a valid reason with more than twenty characters' } })
      fireEvent.blur(textarea)
      expect(screen.queryByText(/at least 20 characters/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/must not exceed/i)).not.toBeInTheDocument()
    })
  })

  describe('Confirmation Checkbox', () => {
    it('should display confirmation checkbox', () => {
      render(<AllergenOverrideModal {...defaultProps} />)
      expect(screen.getByRole('checkbox')).toBeInTheDocument()
    })

    it('should display checkbox label', () => {
      render(<AllergenOverrideModal {...defaultProps} />)
      expect(screen.getByText(/I confirm this override is authorized and documented/i)).toBeInTheDocument()
    })

    it('should have submit button disabled when checkbox is not checked', () => {
      render(<AllergenOverrideModal {...defaultProps} />)
      // Even with valid reason, button disabled without checkbox
      expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled()
    })
  })

  describe('Submit Button', () => {
    it('should disable submit button until form is valid', () => {
      render(<AllergenOverrideModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: /confirm/i })).toBeDisabled()
    })

    it('should enable submit button when form is valid', async () => {
      render(<AllergenOverrideModal {...defaultProps} />)
      const textarea = screen.getByLabelText(/override reason/i)
      // Use fireEvent.change for performance
      fireEvent.change(textarea, { target: { value: 'Valid reason with more than 20 characters' } })
      await userEvent.click(screen.getByRole('checkbox'))
      expect(screen.getByRole('button', { name: /confirm/i })).not.toBeDisabled()
    })

    it('should call onConfirm with reason when submitted', async () => {
      const onConfirm = vi.fn().mockResolvedValue(undefined)
      const reason = 'Customer confirmed they can accept milk products for this order'
      render(<AllergenOverrideModal {...defaultProps} onConfirm={onConfirm} />)
      const textarea = screen.getByLabelText(/override reason/i)
      // Use fireEvent.change for performance to avoid character garbling
      fireEvent.change(textarea, { target: { value: reason } })
      await userEvent.click(screen.getByRole('checkbox'))
      await userEvent.click(screen.getByRole('button', { name: /confirm/i }))
      expect(onConfirm).toHaveBeenCalledWith(reason)
    })

    it('should show loading spinner while submitting', () => {
      render(<AllergenOverrideModal {...defaultProps} isLoading={true} />)
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })

    it('should disable submit button while loading', () => {
      render(<AllergenOverrideModal {...defaultProps} isLoading={true} />)
      expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled()
    })
  })

  describe('Cancel Button', () => {
    it('should display cancel button', () => {
      render(<AllergenOverrideModal {...defaultProps} />)
      expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    })

    it('should call onCancel when cancel button clicked', async () => {
      render(<AllergenOverrideModal {...defaultProps} />)
      await userEvent.click(screen.getByRole('button', { name: /cancel/i }))
      expect(defaultProps.onCancel).toHaveBeenCalled()
    })

    it('should disable cancel button while loading', () => {
      render(<AllergenOverrideModal {...defaultProps} isLoading={true} />)
      expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled()
    })
  })

  describe('Error Display', () => {
    it('should display error message when provided', () => {
      render(<AllergenOverrideModal {...defaultProps} error="Override failed: Server error" />)
      expect(screen.getByText(/override failed/i)).toBeInTheDocument()
    })

    it('should display error in alert', () => {
      render(<AllergenOverrideModal {...defaultProps} error="Error message" />)
      expect(screen.getByText(/Error message/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have role="dialog"', () => {
      render(<AllergenOverrideModal {...defaultProps} />)
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('should have aria-labelledby pointing to title', () => {
      render(<AllergenOverrideModal {...defaultProps} />)
      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-labelledby')
    })

    it('should have aria-label on confirmation checkbox', () => {
      render(<AllergenOverrideModal {...defaultProps} />)
      const checkbox = screen.getByRole('checkbox')
      expect(checkbox).toHaveAttribute('aria-label')
    })
  })
})

// =============================================================================
// CustomerOrderHistory Component Tests
// =============================================================================
describe('CustomerOrderHistory Component', () => {
  const defaultProps = {
    customerId: 'cust-001',
  }

  const mockUseCustomerOrderHistory = useCustomerOrderHistory as ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Loading State', () => {
    it('should display skeleton loaders while loading', () => {
      mockUseCustomerOrderHistory.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      })
      render(<CustomerOrderHistory {...defaultProps} />)
      expect(screen.getByTestId('skeleton-table')).toBeInTheDocument()
    })

    it('should display multiple skeleton rows', () => {
      mockUseCustomerOrderHistory.mockReturnValue({
        data: undefined,
        isLoading: true,
        error: null,
        refetch: vi.fn(),
      })
      render(<CustomerOrderHistory {...defaultProps} />)
      const skeletonRows = screen.getAllByTestId('skeleton-row')
      expect(skeletonRows.length).toBeGreaterThan(0)
    })
  })

  describe('Empty State', () => {
    it('should display empty state when no orders exist', () => {
      mockUseCustomerOrderHistory.mockReturnValue({
        data: { orders: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })
      render(<CustomerOrderHistory {...defaultProps} />)
      expect(screen.getByText(/no orders yet/i)).toBeInTheDocument()
    })

    it('should display ShoppingCart icon in empty state', () => {
      mockUseCustomerOrderHistory.mockReturnValue({
        data: { orders: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })
      render(<CustomerOrderHistory {...defaultProps} />)
      expect(screen.getByTestId('shopping-cart-icon')).toBeInTheDocument()
    })

    it('should display subtext in empty state', () => {
      mockUseCustomerOrderHistory.mockReturnValue({
        data: { orders: [], pagination: { page: 1, limit: 20, total: 0, total_pages: 0 } },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })
      render(<CustomerOrderHistory {...defaultProps} />)
      expect(screen.getByText(/orders for this customer will appear here/i)).toBeInTheDocument()
    })
  })

  describe('Error State', () => {
    it('should display error state when load fails', () => {
      mockUseCustomerOrderHistory.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed'),
        refetch: vi.fn(),
      })
      render(<CustomerOrderHistory {...defaultProps} />)
      expect(screen.getByText(/failed to load order history/i)).toBeInTheDocument()
    })

    it('should display AlertCircle icon in error state', () => {
      mockUseCustomerOrderHistory.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed'),
        refetch: vi.fn(),
      })
      render(<CustomerOrderHistory {...defaultProps} />)
      expect(screen.getByTestId('alert-circle-icon')).toBeInTheDocument()
    })

    it('should display Retry button in error state', () => {
      mockUseCustomerOrderHistory.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed'),
        refetch: vi.fn(),
      })
      render(<CustomerOrderHistory {...defaultProps} />)
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })

    it('should retry loading when Retry button clicked', async () => {
      const refetch = vi.fn()
      mockUseCustomerOrderHistory.mockReturnValue({
        data: undefined,
        isLoading: false,
        error: new Error('Failed'),
        refetch,
      })
      render(<CustomerOrderHistory {...defaultProps} />)
      await userEvent.click(screen.getByRole('button', { name: /retry/i }))
      expect(refetch).toHaveBeenCalled()
    })
  })

  describe('Data Table Display', () => {
    beforeEach(() => {
      mockUseCustomerOrderHistory.mockReturnValue({
        data: {
          orders: mockCustomerOrders,
          pagination: { page: 1, limit: 20, total: 2, total_pages: 1 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })
    })

    it('should display data table with orders', () => {
      render(<CustomerOrderHistory {...defaultProps} />)
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should display Order Number column', () => {
      render(<CustomerOrderHistory {...defaultProps} />)
      expect(screen.getByText('SO-2025-001')).toBeInTheDocument()
    })

    it('should display Date column with formatted date', () => {
      render(<CustomerOrderHistory {...defaultProps} />)
      expect(screen.getByText(/Dec 15, 2025/i)).toBeInTheDocument()
    })

    it('should display Status column with badge', () => {
      render(<CustomerOrderHistory {...defaultProps} />)
      expect(screen.getByTestId('status-badge-confirmed')).toBeInTheDocument()
    })

    it('should display Total Amount column with currency', () => {
      render(<CustomerOrderHistory {...defaultProps} />)
      expect(screen.getByText(/\$1,234\.56/)).toBeInTheDocument()
    })

    it('should display Lines column', () => {
      render(<CustomerOrderHistory {...defaultProps} />)
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('should display View button for each row', () => {
      render(<CustomerOrderHistory {...defaultProps} />)
      const viewButtons = screen.getAllByRole('button', { name: /view/i })
      expect(viewButtons.length).toBe(2) // 2 orders
    })
  })

  describe('Status Badge Colors', () => {
    it('should display draft status with orange badge', () => {
      mockUseCustomerOrderHistory.mockReturnValue({
        data: {
          orders: [{ ...mockCustomerOrders[0], status: 'draft' as const }],
          pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })
      render(<CustomerOrderHistory {...defaultProps} />)
      const draftBadge = screen.getByTestId('status-badge-draft')
      expect(draftBadge).toHaveClass('bg-orange-100')
    })

    it('should display confirmed status with green badge', () => {
      mockUseCustomerOrderHistory.mockReturnValue({
        data: {
          orders: mockCustomerOrders,
          pagination: { page: 1, limit: 20, total: 2, total_pages: 1 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })
      render(<CustomerOrderHistory {...defaultProps} />)
      const confirmedBadge = screen.getByTestId('status-badge-confirmed')
      expect(confirmedBadge).toHaveClass('bg-green-100')
    })

    it('should display shipped status with blue badge', () => {
      mockUseCustomerOrderHistory.mockReturnValue({
        data: {
          orders: mockCustomerOrders,
          pagination: { page: 1, limit: 20, total: 2, total_pages: 1 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })
      render(<CustomerOrderHistory {...defaultProps} />)
      const shippedBadge = screen.getByTestId('status-badge-shipped')
      expect(shippedBadge).toHaveClass('bg-blue-100')
    })

    it('should display cancelled status with red badge', () => {
      mockUseCustomerOrderHistory.mockReturnValue({
        data: {
          orders: [{ ...mockCustomerOrders[0], status: 'cancelled' as const }],
          pagination: { page: 1, limit: 20, total: 1, total_pages: 1 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })
      render(<CustomerOrderHistory {...defaultProps} />)
      const cancelledBadge = screen.getByTestId('status-badge-cancelled')
      expect(cancelledBadge).toHaveClass('bg-red-100')
    })
  })

  describe('Pagination', () => {
    it('should display pagination info', () => {
      mockUseCustomerOrderHistory.mockReturnValue({
        data: {
          orders: mockCustomerOrders,
          pagination: { page: 1, limit: 20, total: 45, total_pages: 3 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })
      render(<CustomerOrderHistory {...defaultProps} />)
      expect(screen.getByText(/showing 1-20 of 45 orders/i)).toBeInTheDocument()
    })

    it('should display Previous button', () => {
      mockUseCustomerOrderHistory.mockReturnValue({
        data: {
          orders: mockCustomerOrders,
          pagination: { page: 1, limit: 20, total: 45, total_pages: 3 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })
      render(<CustomerOrderHistory {...defaultProps} />)
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
    })

    it('should display Next button', () => {
      mockUseCustomerOrderHistory.mockReturnValue({
        data: {
          orders: mockCustomerOrders,
          pagination: { page: 1, limit: 20, total: 45, total_pages: 3 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })
      render(<CustomerOrderHistory {...defaultProps} />)
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
    })

    it('should disable Previous button on first page', () => {
      mockUseCustomerOrderHistory.mockReturnValue({
        data: {
          orders: mockCustomerOrders,
          pagination: { page: 1, limit: 20, total: 45, total_pages: 3 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })
      render(<CustomerOrderHistory {...defaultProps} />)
      expect(screen.getByRole('button', { name: /previous/i })).toBeDisabled()
    })

    it('should disable Next button on last page', () => {
      mockUseCustomerOrderHistory.mockReturnValue({
        data: {
          orders: mockCustomerOrders,
          pagination: { page: 1, limit: 20, total: 2, total_pages: 1 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })
      render(<CustomerOrderHistory {...defaultProps} />)
      expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
    })
  })

  describe('Sorting', () => {
    it('should display sortable column headers', () => {
      mockUseCustomerOrderHistory.mockReturnValue({
        data: {
          orders: mockCustomerOrders,
          pagination: { page: 1, limit: 20, total: 2, total_pages: 1 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })
      render(<CustomerOrderHistory {...defaultProps} />)
      const dateHeader = screen.getByRole('columnheader', { name: /date/i })
      expect(dateHeader).toHaveAttribute('aria-sort')
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      mockUseCustomerOrderHistory.mockReturnValue({
        data: {
          orders: mockCustomerOrders,
          pagination: { page: 1, limit: 20, total: 2, total_pages: 1 },
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })
    })

    it('should have role="table" on data table', () => {
      render(<CustomerOrderHistory {...defaultProps} />)
      expect(screen.getByRole('table')).toBeInTheDocument()
    })

    it('should have aria-label on table', () => {
      render(<CustomerOrderHistory {...defaultProps} />)
      const table = screen.getByRole('table')
      expect(table).toHaveAttribute('aria-label', 'Customer Order History')
    })

    it('should have aria-label on View buttons', () => {
      render(<CustomerOrderHistory {...defaultProps} />)
      const viewButton = screen.getAllByRole('button', { name: /view order so-/i })[0]
      expect(viewButton).toBeInTheDocument()
    })
  })
})

/**
 * Test Summary:
 *
 * AllergenAlert Component - 21 tests
 *   - Conflict blocking state (8)
 *   - Manager override button (4)
 *   - Override approved state (7)
 *   - Multiple conflicts (2)
 *   - Accessibility (3)
 *
 * AllergenOverrideModal Component - 26 tests
 *   - Modal display (4)
 *   - Conflict summary (2)
 *   - Reason input field (4)
 *   - Reason validation (4)
 *   - Confirmation checkbox (3)
 *   - Submit button (6)
 *   - Cancel button (3)
 *   - Error display (2)
 *   - Accessibility (3)
 *
 * CustomerOrderHistory Component - 26 tests
 *   - Loading state (2)
 *   - Empty state (3)
 *   - Error state (4)
 *   - Data table display (7)
 *   - Status badge colors (4)
 *   - Pagination (5)
 *   - Sorting (1)
 *   - Accessibility (3)
 *
 * Total: 73+ tests
 *
 * Status: GREEN - All tests should pass
 */
