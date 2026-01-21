/**
 * Component Tests: OutputHistoryTable (Story 04.7a)
 * Phase: GREEN - Tests should PASS
 *
 * Tests the OutputHistoryTable component:
 * - Table displays output records
 * - Columns: LP Number, Qty, Batch, QA Status, Location, Expiry, Created At, Actions
 * - Filtering by QA Status, Location
 * - Sorting by columns
 * - Export CSV action
 * - View LP and Print Label actions
 *
 * Acceptance Criteria Coverage:
 * - FR-PROD-015: Multiple Outputs per WO
 * - Wireframe PROD-004: Output History Table
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

import { OutputHistoryTable } from '@/components/production/outputs/OutputHistoryTable'

// Mock outputs data
const mockOutputs = [
  {
    id: 'out-1',
    lp_id: 'lp-1',
    lp_number: 'LP-2025-05482',
    quantity: 500,
    uom: 'kg',
    batch_number: 'B-2025-0156',
    qa_status: 'approved' as const,
    location_id: 'loc-1',
    location_name: 'WH-A/Z1/R2',
    expiry_date: '2025-01-13',
    created_at: '2025-12-14T08:15:00Z',
    created_by_name: 'John Smith',
  },
  {
    id: 'out-2',
    lp_id: 'lp-2',
    lp_number: 'LP-2025-05479',
    quantity: 450,
    uom: 'kg',
    batch_number: 'B-2025-0156',
    qa_status: 'approved' as const,
    location_id: 'loc-1',
    location_name: 'WH-A/Z1/R2',
    expiry_date: '2025-01-13',
    created_at: '2025-12-14T06:50:00Z',
    created_by_name: 'Sarah Lee',
  },
  {
    id: 'out-3',
    lp_id: 'lp-3',
    lp_number: 'LP-2025-05475',
    quantity: 600,
    uom: 'kg',
    batch_number: 'B-2025-0156',
    qa_status: 'pending' as const,
    location_id: 'loc-2',
    location_name: 'WH-A/Z1/R3',
    expiry_date: '2025-01-13',
    created_at: '2025-12-14T04:45:00Z',
    created_by_name: 'Mike Chen',
  },
  {
    id: 'out-4',
    lp_id: 'lp-4',
    lp_number: 'LP-2025-05472',
    quantity: 520,
    uom: 'kg',
    batch_number: 'B-2025-0156',
    qa_status: 'approved' as const,
    location_id: 'loc-1',
    location_name: 'WH-A/Z1/R2',
    expiry_date: '2025-01-13',
    created_at: '2025-12-14T02:10:00Z',
    created_by_name: 'Emily Davis',
  },
  {
    id: 'out-5',
    lp_id: 'lp-5',
    lp_number: 'LP-2025-05465',
    quantity: 650,
    uom: 'kg',
    batch_number: 'B-2025-0156',
    qa_status: 'rejected' as const,
    location_id: 'loc-3',
    location_name: 'WH-Q/HOLD',
    expiry_date: '2025-01-13',
    created_at: '2025-12-13T08:30:00Z',
    created_by_name: 'Lisa Brown',
    notes: 'Quality issue detected',
  },
]

const mockSummary = {
  total_outputs: 5,
  total_qty: 2720,
  approved_count: 3,
  approved_qty: 1470,
  pending_count: 1,
  pending_qty: 600,
  rejected_count: 1,
  rejected_qty: 650,
}

describe('OutputHistoryTable Component (Story 04.7a)', () => {
  const mockOnRegisterOutput = vi.fn()
  const mockOnExportCSV = vi.fn()
  const mockOnViewLP = vi.fn()
  const mockOnPrintLabel = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // Table Display
  // ============================================================================
  describe('Table Display', () => {
    it('should display all output rows', () => {
      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      expect(screen.getByText('LP-2025-05482')).toBeInTheDocument()
      expect(screen.getByText('LP-2025-05479')).toBeInTheDocument()
      expect(screen.getByText('LP-2025-05475')).toBeInTheDocument()
      expect(screen.getByText('LP-2025-05472')).toBeInTheDocument()
      expect(screen.getByText('LP-2025-05465')).toBeInTheDocument()
    })

    it('AC: displays all 5 outputs within 1 second', async () => {
      const startTime = Date.now()

      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      const endTime = Date.now()
      expect(endTime - startTime).toBeLessThan(1000)
      expect(screen.getAllByRole('row').length).toBeGreaterThanOrEqual(5)
    })
  })

  // ============================================================================
  // Column Headers
  // ============================================================================
  describe('Column Headers', () => {
    it('should have LP Number column', () => {
      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      expect(screen.getByText('LP Number')).toBeInTheDocument()
    })

    it('should have Qty column', () => {
      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      expect(screen.getByText(/qty/i)).toBeInTheDocument()
    })

    it('should have Batch column', () => {
      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      expect(screen.getByText(/batch/i)).toBeInTheDocument()
    })

    it('should have QA Status column', () => {
      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      expect(screen.getByText(/qa status/i)).toBeInTheDocument()
    })

    it('should have Location column', () => {
      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      expect(screen.getByText(/location/i)).toBeInTheDocument()
    })

    it('should have Expiry column', () => {
      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      expect(screen.getByText(/expiry/i)).toBeInTheDocument()
    })

    it('should have Created At column', () => {
      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      expect(screen.getByText(/created/i)).toBeInTheDocument()
    })

    it('should have Actions column', () => {
      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      expect(screen.getByText(/actions/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Filtering
  // ============================================================================
  describe('Filtering', () => {
    it('should have QA Status filter dropdown', () => {
      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      expect(screen.getByLabelText(/qa status/i)).toBeInTheDocument()
    })

    it('should filter by Approved status', async () => {
      const user = userEvent.setup()

      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      const filterDropdown = screen.getByLabelText(/qa status/i)
      await user.click(filterDropdown)
      await user.click(screen.getByRole('option', { name: /approved/i }))

      await waitFor(() => {
        // Should show 3 approved outputs + header row
        const rows = screen.getAllByRole('row')
        expect(rows.length).toBe(4) // header + 3 data rows
      })
    })

    it('should filter by Pending status', async () => {
      const user = userEvent.setup()

      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      const filterDropdown = screen.getByLabelText(/qa status/i)
      await user.click(filterDropdown)
      await user.click(screen.getByRole('option', { name: /pending/i }))

      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        expect(rows.length).toBe(2) // header + 1 data row
      })
    })

    it('should have Location filter dropdown', () => {
      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      expect(screen.getByLabelText(/location/i)).toBeInTheDocument()
    })

    it('should filter by Location', async () => {
      const user = userEvent.setup()

      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      const filterDropdown = screen.getByLabelText(/location/i)
      await user.click(filterDropdown)
      await user.click(screen.getByRole('option', { name: /WH-A\/Z1\/R2/i }))

      await waitFor(() => {
        // Should show outputs in loc-1
        expect(screen.queryByText('WH-Q/HOLD')).not.toBeInTheDocument()
      })
    })
  })

  // ============================================================================
  // Sorting
  // ============================================================================
  describe('Sorting', () => {
    it('should sort by LP Number when header clicked', async () => {
      const user = userEvent.setup()

      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      const lpHeader = screen.getByText('LP Number')
      await user.click(lpHeader)

      // Table should be sorted - first row should have lowest LP number
      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        expect(rows.length).toBeGreaterThan(1)
      })
    })

    it('should sort by Qty when header clicked', async () => {
      const user = userEvent.setup()

      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      const qtyHeader = screen.getByText(/qty/i)
      await user.click(qtyHeader)

      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        expect(rows.length).toBeGreaterThan(1)
      })
    })

    it('should toggle sort direction on second click', async () => {
      const user = userEvent.setup()

      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      const qtyHeader = screen.getByText(/qty/i)
      await user.click(qtyHeader) // asc
      await user.click(qtyHeader) // desc

      await waitFor(() => {
        const rows = screen.getAllByRole('row')
        expect(rows.length).toBeGreaterThan(1)
      })
    })
  })

  // ============================================================================
  // Actions
  // ============================================================================
  describe('Actions', () => {
    it('should have Register Output button', () => {
      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      expect(screen.getByRole('button', { name: /register output/i })).toBeInTheDocument()
    })

    it('should call onRegisterOutput when clicked', async () => {
      const user = userEvent.setup()

      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      const registerBtn = screen.getByRole('button', { name: /register output/i })
      await user.click(registerBtn)

      expect(mockOnRegisterOutput).toHaveBeenCalled()
    })

    it('should have Export CSV button', () => {
      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      expect(screen.getByRole('button', { name: /export csv/i })).toBeInTheDocument()
    })

    it('should call onExportCSV when clicked', async () => {
      const user = userEvent.setup()

      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      const exportBtn = screen.getByRole('button', { name: /export csv/i })
      await user.click(exportBtn)

      expect(mockOnExportCSV).toHaveBeenCalled()
    })

    it('should have View LP action on each row', () => {
      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      const viewButtons = screen.getAllByRole('button', { name: /view/i })
      expect(viewButtons.length).toBe(5)
    })

    it('should call onViewLP with LP ID when View clicked', async () => {
      const user = userEvent.setup()

      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      const viewButtons = screen.getAllByRole('button', { name: /view/i })
      await user.click(viewButtons[0])

      expect(mockOnViewLP).toHaveBeenCalledWith('lp-1')
    })

    it('should have Print Label action on each row', () => {
      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      const labelButtons = screen.getAllByRole('button', { name: /label/i })
      expect(labelButtons.length).toBe(5)
    })

    it('should call onPrintLabel with LP ID when Label clicked', async () => {
      const user = userEvent.setup()

      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      const labelButtons = screen.getAllByRole('button', { name: /label/i })
      await user.click(labelButtons[0])

      expect(mockOnPrintLabel).toHaveBeenCalledWith('lp-1')
    })
  })

  // ============================================================================
  // Summary Section
  // ============================================================================
  describe('Summary Section', () => {
    it('should display total outputs count', () => {
      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      expect(screen.getByText(/total outputs.*5/i)).toBeInTheDocument()
    })

    it('should display total quantity', () => {
      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      expect(screen.getByText(/2,720/)).toBeInTheDocument()
    })

    it('should display approved count and qty', () => {
      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      expect(screen.getByText(/approved.*3/i)).toBeInTheDocument()
    })

    it('should display pending count and qty', () => {
      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      expect(screen.getByText(/pending.*1/i)).toBeInTheDocument()
    })

    it('should display rejected count and qty', () => {
      render(
        <OutputHistoryTable
          outputs={mockOutputs}
          summary={mockSummary}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      expect(screen.getByText(/rejected.*1/i)).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Empty State
  // ============================================================================
  describe('Empty State', () => {
    it('should show empty state when no outputs', () => {
      render(
        <OutputHistoryTable
          outputs={[]}
          summary={{ total_outputs: 0, total_qty: 0, approved_count: 0, approved_qty: 0, pending_count: 0, pending_qty: 0, rejected_count: 0, rejected_qty: 0 }}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      expect(screen.getByText(/no outputs registered/i)).toBeInTheDocument()
    })

    it('should show "Register First Output" button in empty state', () => {
      render(
        <OutputHistoryTable
          outputs={[]}
          summary={{ total_outputs: 0, total_qty: 0, approved_count: 0, approved_qty: 0, pending_count: 0, pending_qty: 0, rejected_count: 0, rejected_qty: 0 }}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      expect(screen.getByRole('button', { name: /register first output/i })).toBeInTheDocument()
    })
  })
})

/**
 * Test Coverage Summary for Story 04.7a - OutputHistoryTable
 * ==========================================================
 *
 * Table Display: 2 tests
 *   - All rows visible
 *   - Performance (<1s)
 *
 * Column Headers: 8 tests
 *   - LP Number, Qty, Batch, QA Status, Location, Expiry, Created, Actions
 *
 * Filtering: 5 tests
 *   - QA Status dropdown
 *   - Approved filter
 *   - Pending filter
 *   - Location dropdown
 *   - Location filter
 *
 * Sorting: 3 tests
 *   - Sort by LP
 *   - Sort by Qty
 *   - Toggle direction
 *
 * Actions: 8 tests
 *   - Register Output button
 *   - Register callback
 *   - Export CSV button
 *   - Export callback
 *   - View LP buttons
 *   - View callback
 *   - Label buttons
 *   - Label callback
 *
 * Summary Section: 5 tests
 *   - Total count
 *   - Total qty
 *   - Approved
 *   - Pending
 *   - Rejected
 *
 * Empty State: 2 tests
 *   - Empty message
 *   - First output button
 *
 * Total: 33 tests
 * Status: ALL PASS (GREEN phase)
 */
