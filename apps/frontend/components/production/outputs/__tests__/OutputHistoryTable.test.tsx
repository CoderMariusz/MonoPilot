/**
 * Unit Tests: OutputHistoryTable Component (Story 04.7a)
 *
 * Tests output history table with:
 * - Multiple outputs display (FR-PROD-015)
 * - Filtering by QA status and location
 * - Sorting by columns
 * - Summary section
 * - Empty state
 * - Actions (View, Print Label)
 */

import { render, screen, fireEvent, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { OutputHistoryTable } from '../OutputHistoryTable'
import type { OutputLP, OutputSummary } from '../OutputHistoryTable'

// Mock data
const mockOutputs: OutputLP[] = [
  {
    id: 'output-1',
    lp_id: 'lp-1',
    lp_number: 'LP-2025-05482',
    quantity: 500,
    uom: 'kg',
    batch_number: 'B-2025-0156',
    qa_status: 'approved',
    location_id: 'loc-1',
    location_name: 'WH-A / Zone 1',
    expiry_date: '2025-01-31',
    created_at: '2025-01-15T08:15:00Z',
    created_by_name: 'John Smith',
  },
  {
    id: 'output-2',
    lp_id: 'lp-2',
    lp_number: 'LP-2025-05479',
    quantity: 450,
    uom: 'kg',
    batch_number: 'B-2025-0156',
    qa_status: 'pending',
    location_id: 'loc-2',
    location_name: 'WH-B / Zone 2',
    expiry_date: '2025-01-31',
    created_at: '2025-01-15T06:50:00Z',
    created_by_name: 'Sarah Lee',
  },
  {
    id: 'output-3',
    lp_id: 'lp-3',
    lp_number: 'LP-2025-05475',
    quantity: 600,
    uom: 'kg',
    batch_number: 'B-2025-0156',
    qa_status: 'rejected',
    location_id: 'loc-1',
    location_name: 'WH-A / Zone 1',
    expiry_date: '2025-01-31',
    created_at: '2025-01-14T22:00:00Z',
    created_by_name: 'Mike Chen',
  },
]

const mockSummary: OutputSummary = {
  total_outputs: 3,
  total_qty: 1550,
  approved_count: 1,
  approved_qty: 500,
  pending_count: 1,
  pending_qty: 450,
  rejected_count: 1,
  rejected_qty: 600,
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
  // Basic Rendering Tests (FR-PROD-015)
  // ============================================================================
  describe('Basic Rendering', () => {
    it('AC: displays all outputs with individual quantities', () => {
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
    })

    it('AC: displays each output with unique LP number', () => {
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

      // All LP numbers should be unique and visible
      const lpNumbers = ['LP-2025-05482', 'LP-2025-05479', 'LP-2025-05475']
      lpNumbers.forEach((lp) => {
        expect(screen.getByText(lp)).toBeInTheDocument()
      })
    })

    it('displays quantity with UoM', () => {
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

      expect(screen.getByText('500 kg')).toBeInTheDocument()
      expect(screen.getByText('450 kg')).toBeInTheDocument()
      expect(screen.getByText('600 kg')).toBeInTheDocument()
    })

    it('displays batch numbers', () => {
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

      // All should have same batch
      const batchCells = screen.getAllByText('B-2025-0156')
      expect(batchCells.length).toBe(3)
    })
  })

  // ============================================================================
  // QA Status Badge Tests
  // ============================================================================
  describe('QA Status Badges', () => {
    it('displays approved badge', () => {
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

      expect(screen.getByText('Approved')).toBeInTheDocument()
    })

    it('displays pending badge', () => {
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

      expect(screen.getByText('Pending')).toBeInTheDocument()
    })

    it('displays rejected badge', () => {
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

      expect(screen.getByText('Rejected')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Summary Section Tests
  // ============================================================================
  describe('Summary Section', () => {
    it('displays total outputs count', () => {
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

      expect(screen.getByText('Total Outputs:')).toBeInTheDocument()
      expect(screen.getByText('3')).toBeInTheDocument()
    })

    it('displays total quantity', () => {
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

      expect(screen.getByText('Total Qty:')).toBeInTheDocument()
      expect(screen.getByText('1,550 kg')).toBeInTheDocument()
    })

    it('displays approved count and qty', () => {
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

      expect(screen.getByText('1 (500 kg)')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Empty State Tests
  // ============================================================================
  describe('Empty State', () => {
    it('displays empty state message when no outputs', () => {
      render(
        <OutputHistoryTable
          outputs={[]}
          summary={{
            total_outputs: 0,
            total_qty: 0,
            approved_count: 0,
            approved_qty: 0,
            pending_count: 0,
            pending_qty: 0,
            rejected_count: 0,
            rejected_qty: 0,
          }}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      expect(screen.getByText('No outputs registered')).toBeInTheDocument()
      expect(screen.getByText('Start by registering your first production output')).toBeInTheDocument()
    })

    it('displays Register First Output button in empty state', () => {
      render(
        <OutputHistoryTable
          outputs={[]}
          summary={{
            total_outputs: 0,
            total_qty: 0,
            approved_count: 0,
            approved_qty: 0,
            pending_count: 0,
            pending_qty: 0,
            rejected_count: 0,
            rejected_qty: 0,
          }}
          onRegisterOutput={mockOnRegisterOutput}
          onExportCSV={mockOnExportCSV}
          onViewLP={mockOnViewLP}
          onPrintLabel={mockOnPrintLabel}
        />
      )

      const button = screen.getByRole('button', { name: /register first output/i })
      expect(button).toBeInTheDocument()

      fireEvent.click(button)
      expect(mockOnRegisterOutput).toHaveBeenCalledTimes(1)
    })
  })

  // ============================================================================
  // Filtering Tests
  // ============================================================================
  describe('Filtering', () => {
    it('filters by QA status - Approved', async () => {
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

      // Click the QA filter dropdown
      const qaFilter = screen.getByLabelText(/qa status/i)
      fireEvent.click(qaFilter)

      // Select Approved
      const approvedOption = await screen.findByText('Approved', { selector: '[role="option"]' })
      fireEvent.click(approvedOption)

      // Should show only approved output
      expect(screen.getByText('LP-2025-05482')).toBeInTheDocument()
      expect(screen.queryByText('LP-2025-05479')).not.toBeInTheDocument()
      expect(screen.queryByText('LP-2025-05475')).not.toBeInTheDocument()
    })

    it('displays location filter dropdown', () => {
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
  })

  // ============================================================================
  // Sorting Tests
  // ============================================================================
  describe('Sorting', () => {
    it('sorts by LP Number when header clicked', () => {
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
      fireEvent.click(lpHeader)

      // Should sort ascending first
      const rows = screen.getAllByRole('row').slice(1) // Skip header
      expect(within(rows[0]).getByText('LP-2025-05475')).toBeInTheDocument()
    })

    it('sorts by quantity when header clicked', () => {
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

      const qtyHeader = screen.getByText('Qty')
      fireEvent.click(qtyHeader)

      // Should sort ascending (450 first)
      const rows = screen.getAllByRole('row').slice(1)
      expect(within(rows[0]).getByText('450 kg')).toBeInTheDocument()
    })

    it('toggles sort direction on second click', () => {
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

      const qtyHeader = screen.getByText('Qty')

      // First click - ascending
      fireEvent.click(qtyHeader)

      // Second click - descending
      fireEvent.click(qtyHeader)

      const rows = screen.getAllByRole('row').slice(1)
      expect(within(rows[0]).getByText('600 kg')).toBeInTheDocument()
    })
  })

  // ============================================================================
  // Action Button Tests
  // ============================================================================
  describe('Action Buttons', () => {
    it('calls onRegisterOutput when Register Output button clicked', () => {
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

      const button = screen.getByRole('button', { name: /register output/i })
      fireEvent.click(button)

      expect(mockOnRegisterOutput).toHaveBeenCalledTimes(1)
    })

    it('calls onExportCSV when Export CSV button clicked', () => {
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

      const button = screen.getByRole('button', { name: /export csv/i })
      fireEvent.click(button)

      expect(mockOnExportCSV).toHaveBeenCalledTimes(1)
    })

    it('calls onViewLP with correct LP ID when View clicked', () => {
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

      const viewButtons = screen.getAllByTitle('View LP')
      fireEvent.click(viewButtons[0])

      expect(mockOnViewLP).toHaveBeenCalledWith('lp-1')
    })

    it('calls onPrintLabel with correct LP ID when Print clicked', () => {
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

      const printButtons = screen.getAllByTitle('Print Label')
      fireEvent.click(printButtons[0])

      expect(mockOnPrintLabel).toHaveBeenCalledWith('lp-1')
    })
  })

  // ============================================================================
  // Pagination Info Tests
  // ============================================================================
  describe('Pagination Info', () => {
    it('displays showing count', () => {
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

      expect(screen.getByText('Showing 3 of 3 outputs')).toBeInTheDocument()
    })
  })
})

/**
 * Test Coverage Summary for OutputHistoryTable (Story 04.7a)
 * ==========================================================
 *
 * Basic Rendering: 4 tests
 *   - All outputs display
 *   - Unique LP numbers
 *   - Quantity with UoM
 *   - Batch numbers
 *
 * QA Status Badges: 3 tests
 *   - Approved badge
 *   - Pending badge
 *   - Rejected badge
 *
 * Summary Section: 3 tests
 *   - Total outputs count
 *   - Total quantity
 *   - Approved count/qty
 *
 * Empty State: 2 tests
 *   - Empty message
 *   - Register button
 *
 * Filtering: 2 tests
 *   - QA status filter
 *   - Location filter display
 *
 * Sorting: 3 tests
 *   - Sort by LP Number
 *   - Sort by quantity
 *   - Toggle direction
 *
 * Action Buttons: 4 tests
 *   - Register Output
 *   - Export CSV
 *   - View LP
 *   - Print Label
 *
 * Pagination Info: 1 test
 *   - Showing count
 *
 * Total: 22 tests
 */
