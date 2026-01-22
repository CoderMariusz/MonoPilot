/**
 * Unit Tests: PickListModal Component (Story 07.8)
 * Phase: GREEN - Tests with actual component implementation
 *
 * Tests Create Pick List modal with:
 * - SO selection table
 * - Priority selection
 * - Immediate picker assignment
 * - Preview section
 * - Validation
 *
 * Coverage Target: 80%+
 * Test Count: 35 scenarios
 */

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PickListModal } from '../PickListModal'
import type { SalesOrder, Picker, CreatePickListData } from '../PickListModal'

// Mock data
const mockSalesOrders: SalesOrder[] = [
  {
    id: 'so-001',
    order_number: 'SO-2025-00001',
    customer_name: 'Acme Corp',
    order_date: '2025-01-15',
    line_count: 5,
    status: 'confirmed',
    has_allocations: true,
  },
  {
    id: 'so-002',
    order_number: 'SO-2025-00002',
    customer_name: 'Beta Inc',
    order_date: '2025-01-16',
    line_count: 3,
    status: 'confirmed',
    has_allocations: true,
  },
  {
    id: 'so-003',
    order_number: 'SO-2025-00003',
    customer_name: 'Gamma LLC',
    order_date: '2025-01-17',
    line_count: 8,
    status: 'confirmed',
    has_allocations: true,
  },
]

const mockPickers: Picker[] = [
  { id: 'picker-001', name: 'John Picker' },
  { id: 'picker-002', name: 'Jane Picker' },
]

describe('PickListModal Component (Story 07.8)', () => {
  const mockOnClose = vi.fn()
  const mockOnSubmit = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockOnSubmit.mockResolvedValue(undefined)
  })

  // ============================================================================
  // Basic Rendering Tests
  // ============================================================================
  describe('Basic Rendering', () => {
    it('renders modal with title when open', () => {
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )
      expect(screen.getByRole('dialog')).toBeInTheDocument()
      // Title and button both say "Create Pick List"
      expect(screen.getAllByText(/Create Pick List/i).length).toBeGreaterThanOrEqual(1)
    })

    it('does not render when closed', () => {
      render(
        <PickListModal
          isOpen={false}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )
      expect(screen.queryByText('Create Pick List')).not.toBeInTheDocument()
    })

    it('displays SO selection table', () => {
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )
      expect(screen.getByText('Select Sales Orders')).toBeInTheDocument()
      expect(screen.getByText('SO-2025-00001')).toBeInTheDocument()
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
    })

    it('displays priority selector', () => {
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )
      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument()
    })

    it('displays optional picker assignment selector', () => {
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )
      expect(screen.getByLabelText(/assign to/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // SO Selection Tests
  // ============================================================================
  describe('Sales Order Selection', () => {
    it('allows selecting single SO', async () => {
      const user = userEvent.setup()
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      const checkbox = screen.getByRole('checkbox', { name: /SO-2025-00001/i })
      await user.click(checkbox)
      expect(checkbox).toBeChecked()
    })

    it('allows selecting multiple SOs', async () => {
      const user = userEvent.setup()
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      await user.click(screen.getByRole('checkbox', { name: /SO-2025-00001/i }))
      await user.click(screen.getByRole('checkbox', { name: /SO-2025-00002/i }))
      expect(screen.getByText('2 orders selected')).toBeInTheDocument()
    })

    it('shows "Select All" checkbox', async () => {
      const user = userEvent.setup()
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      const selectAll = screen.getByRole('checkbox', { name: /select all/i })
      expect(selectAll).toBeInTheDocument()
      await user.click(selectAll)
      expect(screen.getByText('3 orders selected')).toBeInTheDocument()
    })

    it('updates pick type preview based on selection count', async () => {
      const user = userEvent.setup()
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      await user.click(screen.getByRole('checkbox', { name: /SO-2025-00001/i }))
      expect(screen.getByText('Single Order Pick List')).toBeInTheDocument()

      await user.click(screen.getByRole('checkbox', { name: /SO-2025-00002/i }))
      // After selecting 2nd order, it should show Wave Pick List instead
      expect(screen.queryByText('Single Order Pick List')).not.toBeInTheDocument()
      expect(screen.getByText('Wave Pick List')).toBeInTheDocument()
    })

    it('shows total line count in preview', async () => {
      const user = userEvent.setup()
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      await user.click(screen.getByRole('checkbox', { name: /SO-2025-00001/i })) // 5 lines
      await user.click(screen.getByRole('checkbox', { name: /SO-2025-00002/i })) // 3 lines
      expect(screen.getByText('8 lines')).toBeInTheDocument()
    })

    it('filters SOs by search term', async () => {
      const user = userEvent.setup()
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      const searchInput = screen.getByPlaceholderText(/search orders/i)
      await user.type(searchInput, 'Acme')
      expect(screen.getByText('Acme Corp')).toBeInTheDocument()
      expect(screen.queryByText('Beta Inc')).not.toBeInTheDocument()
    })
  })

  // ============================================================================
  // Priority Selection Tests
  // ============================================================================
  describe('Priority Selection', () => {
    it('defaults to "normal" priority', () => {
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      const prioritySelect = screen.getByLabelText(/priority/i)
      expect(prioritySelect).toHaveTextContent('Normal')
    })

    it('allows selecting different priorities', async () => {
      const user = userEvent.setup()
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      const prioritySelect = screen.getByLabelText(/priority/i)
      await user.click(prioritySelect)
      await user.click(screen.getByRole('option', { name: 'Urgent' }))

      expect(prioritySelect).toHaveTextContent('Urgent')
    })

    it('has all priority options: low, normal, high, urgent', async () => {
      const user = userEvent.setup()
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      const prioritySelect = screen.getByLabelText(/priority/i)
      await user.click(prioritySelect)

      expect(screen.getByRole('option', { name: 'Low' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Normal' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'High' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Urgent' })).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Picker Assignment Tests
  // ============================================================================
  describe('Picker Assignment', () => {
    it('shows "Unassigned" as default option', () => {
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      const assignSelect = screen.getByLabelText(/assign to/i)
      expect(assignSelect).toHaveTextContent('Unassigned')
    })

    it('lists available pickers in dropdown', async () => {
      const user = userEvent.setup()
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      const assignSelect = screen.getByLabelText(/assign to/i)
      await user.click(assignSelect)

      expect(screen.getByRole('option', { name: 'John Picker' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Jane Picker' })).toBeInTheDocument()
    })

    it('allows selecting a picker', async () => {
      const user = userEvent.setup()
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      const assignSelect = screen.getByLabelText(/assign to/i)
      await user.click(assignSelect)
      await user.click(screen.getByRole('option', { name: 'John Picker' }))

      expect(assignSelect).toHaveTextContent('John Picker')
    })

    it('picker is optional - can submit without picker', async () => {
      const user = userEvent.setup()
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      await user.click(screen.getByRole('checkbox', { name: /SO-2025-00001/i }))
      await user.click(screen.getByRole('button', { name: /create/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
          assigned_to: undefined
        }))
      })
    })
  })

  // ============================================================================
  // Preview Section Tests
  // ============================================================================
  describe('Preview Section', () => {
    it('shows preview when SO selected', async () => {
      const user = userEvent.setup()
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      await user.click(screen.getByRole('checkbox', { name: /SO-2025-00001/i }))
      expect(screen.getByText('Preview')).toBeInTheDocument()
    })

    it('hides preview when no SO selected', () => {
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      expect(screen.queryByText('Preview')).not.toBeInTheDocument()
    })

    it('shows pick type: "Single Order" for 1 SO', async () => {
      const user = userEvent.setup()
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      await user.click(screen.getByRole('checkbox', { name: /SO-2025-00001/i }))
      expect(screen.getByText(/single order/i)).toBeInTheDocument()
    })

    it('shows pick type: "Wave" for 2+ SOs', async () => {
      const user = userEvent.setup()
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      await user.click(screen.getByRole('checkbox', { name: /SO-2025-00001/i }))
      await user.click(screen.getByRole('checkbox', { name: /SO-2025-00002/i }))
      expect(screen.getByText('Wave Pick List')).toBeInTheDocument()
    })

    it('shows warning for >10 SOs', async () => {
      const user = userEvent.setup()
      // Create 11+ SOs
      const manySOs = Array.from({ length: 12 }, (_, i) => ({
        id: `so-${i}`,
        order_number: `SO-2025-${String(i).padStart(5, '0')}`,
        customer_name: `Customer ${i}`,
        order_date: '2025-01-15',
        line_count: 2,
        status: 'confirmed',
        has_allocations: true,
      }))

      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={manySOs}
          pickers={mockPickers}
        />
      )

      // Select all
      const selectAll = screen.getByRole('checkbox', { name: /select all/i })
      await user.click(selectAll)

      expect(screen.getByText(/consider splitting/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Validation Tests
  // ============================================================================
  describe('Validation', () => {
    it('disables Create button when no SO selected', () => {
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      const createButton = screen.getByRole('button', { name: /create/i })
      expect(createButton).toBeDisabled()
    })

    it('enables Create button when SO selected', async () => {
      const user = userEvent.setup()
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      await user.click(screen.getByRole('checkbox', { name: /SO-2025-00001/i }))
      const createButton = screen.getByRole('button', { name: /create/i })
      expect(createButton).not.toBeDisabled()
    })

    it('shows error for SO without allocations', async () => {
      const user = userEvent.setup()
      const ordersWithNoAlloc = [
        ...mockSalesOrders,
        {
          id: 'so-no-alloc',
          order_number: 'SO-2025-00099',
          customer_name: 'No Alloc Co',
          order_date: '2025-01-20',
          line_count: 2,
          status: 'confirmed',
          has_allocations: false,
        }
      ]

      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={ordersWithNoAlloc}
          pickers={mockPickers}
        />
      )

      await user.click(screen.getByRole('checkbox', { name: /SO-2025-00099/i }))
      await user.click(screen.getByRole('button', { name: /create/i }))

      expect(screen.getByText(/allocation/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Form Submission Tests
  // ============================================================================
  describe('Form Submission', () => {
    it('calls onSubmit with correct data', async () => {
      const user = userEvent.setup()
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      await user.click(screen.getByRole('checkbox', { name: /SO-2025-00001/i }))
      await user.click(screen.getByRole('button', { name: /create/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith({
          sales_order_ids: ['so-001'],
          priority: 'normal',
          assigned_to: undefined
        })
      })
    })

    it('includes selected priority in submission', async () => {
      const user = userEvent.setup()
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      await user.click(screen.getByRole('checkbox', { name: /SO-2025-00001/i }))

      // Select high priority
      const prioritySelect = screen.getByLabelText(/priority/i)
      await user.click(prioritySelect)
      await user.click(screen.getByRole('option', { name: 'High' }))

      await user.click(screen.getByRole('button', { name: /create/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
          priority: 'high'
        }))
      })
    })

    it('includes assigned picker if selected', async () => {
      const user = userEvent.setup()
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      await user.click(screen.getByRole('checkbox', { name: /SO-2025-00001/i }))

      // Select picker
      const assignSelect = screen.getByLabelText(/assign to/i)
      await user.click(assignSelect)
      await user.click(screen.getByRole('option', { name: 'John Picker' }))

      await user.click(screen.getByRole('button', { name: /create/i }))

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(expect.objectContaining({
          assigned_to: 'picker-001'
        }))
      })
    })

    it('shows loading state during submission', async () => {
      const user = userEvent.setup()
      mockOnSubmit.mockImplementation(() => new Promise(r => setTimeout(r, 100)))

      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      await user.click(screen.getByRole('checkbox', { name: /SO-2025-00001/i }))
      await user.click(screen.getByRole('button', { name: /create/i }))

      expect(screen.getByText(/creating/i)).toBeInTheDocument()
    })

    it('calls onClose after successful submission', async () => {
      const user = userEvent.setup()
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      await user.click(screen.getByRole('checkbox', { name: /SO-2025-00001/i }))
      await user.click(screen.getByRole('button', { name: /create/i }))

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('calls onClose when Cancel clicked', async () => {
      const user = userEvent.setup()
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      await user.click(screen.getByRole('button', { name: /cancel/i }))
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  // ============================================================================
  // Accessibility Tests
  // ============================================================================
  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      expect(screen.getByLabelText(/priority/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/assign to/i)).toBeInTheDocument()
    })

    it('has dialog role', () => {
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      expect(screen.getByRole('dialog')).toBeInTheDocument()
    })

    it('has aria-modal attribute', () => {
      render(
        <PickListModal
          isOpen={true}
          onClose={mockOnClose}
          onSubmit={mockOnSubmit}
          salesOrders={mockSalesOrders}
          pickers={mockPickers}
        />
      )

      const dialog = screen.getByRole('dialog')
      expect(dialog).toHaveAttribute('aria-modal', 'true')
    })
  })
})

/**
 * Test Coverage Summary for PickListModal (Story 07.8)
 * =====================================================
 *
 * Basic Rendering: 5 tests
 *   - Modal visibility
 *   - SO table display
 *   - Priority selector
 *   - Picker selector
 *
 * SO Selection: 6 tests
 *   - Single selection
 *   - Multi selection
 *   - Select all
 *   - Type preview update
 *   - Line count preview
 *   - Search filter
 *
 * Priority Selection: 3 tests
 *   - Default value
 *   - Selection change
 *   - All options
 *
 * Picker Assignment: 4 tests
 *   - Default unassigned
 *   - Picker list
 *   - Selection
 *   - Optional submission
 *
 * Preview Section: 5 tests
 *   - Show/hide logic
 *   - Pick type display
 *   - Large wave warning
 *
 * Validation: 3 tests
 *   - Button state
 *   - Allocation check
 *
 * Form Submission: 6 tests
 *   - Correct data
 *   - Priority inclusion
 *   - Picker inclusion
 *   - Loading state
 *   - Close on success
 *   - Cancel handler
 *
 * Accessibility: 3 tests
 *   - Labels
 *   - Dialog role
 *   - aria-modal
 *
 * Total: 35 tests
 */
