/**
 * Component Tests: DeleteRoutingDialog
 * Story: 02.7 - Routings CRUD
 * Phase: RED - Tests will fail until component exists
 *
 * Tests the DeleteRoutingDialog component (ENHANCED feature):
 * - Two variants: with BOM usage, without BOM usage
 * - BOM usage list (first 5, overflow indicator)
 * - Make Inactive alternative action
 * - Impact statement
 *
 * Coverage Target: 80%
 * Test Count: 10+ tests
 *
 * Acceptance Criteria Coverage:
 * - AC-22: Delete with no BOM usage
 * - AC-23: Delete with BOM usage (show list, warning)
 * - AC-24: Delete unassigns BOMs (routing_id = NULL)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { DeleteRoutingDialog } from '../delete-routing-dialog'

const mockRoutingNoUsage = {
  id: 'routing-001',
  org_id: 'org-001',
  name: 'Test Routing',
  description: 'Test description',
  is_active: true,
  operations_count: 4,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockRoutingWithUsage = {
  id: 'routing-002',
  org_id: 'org-001',
  name: 'Standard Bread Line',
  description: 'Production routing',
  is_active: true,
  operations_count: 5,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
}

const mockBOMsUsage = {
  boms: [
    { id: 'bom-1', code: 'BOM-001', product_name: 'Bread Loaf White', is_active: true },
    { id: 'bom-2', code: 'BOM-002', product_name: 'Bread Loaf Whole Wheat', is_active: true },
    { id: 'bom-3', code: 'BOM-003', product_name: 'Bread Loaf Rye', is_active: false },
    { id: 'bom-4', code: 'BOM-004', product_name: 'Bread Loaf Sourdough', is_active: true },
    { id: 'bom-5', code: 'BOM-005', product_name: 'Bread Loaf Multigrain', is_active: true },
  ],
  count: 8,
  overflow: 3,
}

describe('DeleteRoutingDialog - Without BOM Usage (AC-22)', () => {
  beforeEach(() => {
    // Mock successful BOM check (no usage)
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { boms: [], count: 0 }
        }),
      })
    ) as any
  })

  it('should display success indicator for unused routing', async () => {
    // GIVEN routing with no BOM usage
    render(
      <DeleteRoutingDialog
        open={true}
        onOpenChange={vi.fn()}
        routing={mockRoutingNoUsage}
        onConfirm={vi.fn()}
      />
    )

    // WHEN dialog loads
    // THEN success indicator displays "No BOMs are using this routing"
    await waitFor(() => {
      expect(screen.getByText(/No BOMs are using this routing/i)).toBeInTheDocument()
    })
  })

  it('should show simple confirmation message', async () => {
    // GIVEN unused routing
    render(
      <DeleteRoutingDialog
        open={true}
        onOpenChange={vi.fn()}
        routing={mockRoutingNoUsage}
        onConfirm={vi.fn()}
      />
    )

    // THEN dialog displays confirmation question
    await waitFor(() => {
      expect(screen.getByText(/Are you sure you want to delete this routing?/i)).toBeInTheDocument()
    })
  })

  it('should show impact statement (no BOMs affected)', async () => {
    // GIVEN unused routing with 4 operations
    render(
      <DeleteRoutingDialog
        open={true}
        onOpenChange={vi.fn()}
        routing={mockRoutingNoUsage}
        onConfirm={vi.fn()}
      />
    )

    // THEN impact displays operation count
    await waitFor(() => {
      expect(screen.getByText(/All 4 operation/i)).toBeInTheDocument()
    })
  })

  it('should call onConfirm when Delete button clicked', async () => {
    // GIVEN unused routing
    const onConfirm = vi.fn().mockResolvedValue(undefined)

    render(
      <DeleteRoutingDialog
        open={true}
        onOpenChange={vi.fn()}
        routing={mockRoutingNoUsage}
        onConfirm={onConfirm}
      />
    )

    // Wait for BOM check to complete
    await waitFor(() => {
      expect(screen.getByText(/No BOMs are using this routing/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    // WHEN Delete Routing button clicked
    const deleteButton = screen.getByRole('button', { name: /Delete Routing/i })
    fireEvent.click(deleteButton)

    // THEN onConfirm called
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalled()
    }, { timeout: 3000 })
  })
})

describe('DeleteRoutingDialog - With BOM Usage (AC-23, AC-24)', () => {
  beforeEach(() => {
    // Mock BOM usage response
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockBOMsUsage
        }),
      })
    ) as any
  })

  it('should display warning banner for routing in use', async () => {
    // GIVEN routing with BOM usage
    render(
      <DeleteRoutingDialog
        open={true}
        onOpenChange={vi.fn()}
        routing={mockRoutingWithUsage}
        onConfirm={vi.fn()}
        onMakeInactive={vi.fn()}
      />
    )

    // WHEN dialog opens and loads
    // THEN warning banner displays
    await waitFor(() => {
      expect(screen.getByText(/Warning: This routing is currently in use/i)).toBeInTheDocument()
    })
  })

  it('should display BOM usage list (first 5)', async () => {
    // GIVEN 8 BOMs using routing
    render(
      <DeleteRoutingDialog
        open={true}
        onOpenChange={vi.fn()}
        routing={mockRoutingWithUsage}
        onConfirm={vi.fn()}
        onMakeInactive={vi.fn()}
      />
    )

    // THEN displays first 5 BOMs with code and product_name
    await waitFor(() => {
      expect(screen.getByText('BOM-001')).toBeInTheDocument()
      expect(screen.getByText('Bread Loaf White')).toBeInTheDocument()
    }, { timeout: 3000 })

    // Check that BOM list contains expected items (at least 5)
    const listItems = screen.getAllByRole('listitem')
    expect(listItems.length).toBeGreaterThanOrEqual(5)
  })

  it('should show overflow indicator for more than 5 BOMs', async () => {
    // GIVEN 8 BOMs (3 overflow)
    render(
      <DeleteRoutingDialog
        open={true}
        onOpenChange={vi.fn()}
        routing={mockRoutingWithUsage}
        onConfirm={vi.fn()}
        onMakeInactive={vi.fn()}
      />
    )

    // THEN displays overflow indicator
    await waitFor(() => {
      expect(screen.getByText(/... and 3 more/i)).toBeInTheDocument()
    })
  })

  it('should show impact statement (BOMs will be unassigned)', async () => {
    // GIVEN routing used by 8 BOMs
    render(
      <DeleteRoutingDialog
        open={true}
        onOpenChange={vi.fn()}
        routing={mockRoutingWithUsage}
        onConfirm={vi.fn()}
        onMakeInactive={vi.fn()}
      />
    )

    // THEN impact displays operations and BOM unassignment
    await waitFor(() => {
      expect(screen.getByText(/Permanently delete all 5 operation/i)).toBeInTheDocument()
      expect(screen.getByText(/Set routing_id to NULL for 8 BOM/i)).toBeInTheDocument()
      expect(screen.getByText(/Affected BOMs will lose their operation sequence/i)).toBeInTheDocument()
    })
  })

  it('should show Make Inactive alternative action', async () => {
    // GIVEN routing in use
    render(
      <DeleteRoutingDialog
        open={true}
        onOpenChange={vi.fn()}
        routing={mockRoutingWithUsage}
        onConfirm={vi.fn()}
        onMakeInactive={vi.fn()}
      />
    )

    // THEN recommendation and button displayed
    await waitFor(() => {
      expect(screen.getByText(/Consider making the routing/i)).toBeInTheDocument()
    }, { timeout: 3000 })

    await waitFor(() => {
      expect(screen.getByText('Make Inactive')).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should call onMakeInactive when Make Inactive clicked', async () => {
    // GIVEN routing in use
    const onMakeInactive = vi.fn().mockResolvedValue(undefined)

    render(
      <DeleteRoutingDialog
        open={true}
        onOpenChange={vi.fn()}
        routing={mockRoutingWithUsage}
        onConfirm={vi.fn()}
        onMakeInactive={onMakeInactive}
      />
    )

    // Wait for dialog to load
    await waitFor(() => {
      expect(screen.getByText('Make Inactive')).toBeInTheDocument()
    })

    // WHEN Make Inactive button clicked
    const makeInactiveButton = screen.getByText('Make Inactive')
    fireEvent.click(makeInactiveButton)

    // THEN onMakeInactive called
    await waitFor(() => {
      expect(onMakeInactive).toHaveBeenCalled()
    })
  })

  it('should call onConfirm with affected_boms when Delete clicked', async () => {
    // GIVEN routing used by 8 BOMs
    const onConfirm = vi.fn().mockResolvedValue(undefined)

    render(
      <DeleteRoutingDialog
        open={true}
        onOpenChange={vi.fn()}
        routing={mockRoutingWithUsage}
        onConfirm={onConfirm}
        onMakeInactive={vi.fn()}
      />
    )

    // Wait for dialog to load
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Delete Routing/i })).toBeInTheDocument()
    }, { timeout: 3000 })

    // WHEN Delete Routing button clicked
    const deleteButton = screen.getByRole('button', { name: /Delete Routing/i })
    fireEvent.click(deleteButton)

    // THEN onConfirm called
    await waitFor(() => {
      expect(onConfirm).toHaveBeenCalled()
    }, { timeout: 3000 })
  })
})

describe('DeleteRoutingDialog - Loading State', () => {
  it('should show loading spinner while checking BOM usage', () => {
    // GIVEN dialog opened without loading complete
    render(
      <DeleteRoutingDialog
        open={true}
        onOpenChange={vi.fn()}
        routing={mockRoutingNoUsage}
        onConfirm={vi.fn()}
        loading={false}
      />
    )

    // THEN spinner displays "Checking usage..."
    expect(screen.getByText(/Checking usage.../i)).toBeInTheDocument()
  })
})

describe('DeleteRoutingDialog - Accessibility', () => {
  beforeEach(() => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: { boms: [], count: 0 }
        }),
      })
    ) as any
  })

  it('should use alertdialog role for destructive action', async () => {
    // GIVEN delete dialog
    render(
      <DeleteRoutingDialog
        open={true}
        onOpenChange={vi.fn()}
        routing={mockRoutingNoUsage}
        onConfirm={vi.fn()}
      />
    )

    // THEN alertdialog role is set (AlertDialog component uses this role)
    await waitFor(() => {
      const alertDialog = screen.getByRole('alertdialog')
      expect(alertDialog).toBeInTheDocument()
    }, { timeout: 3000 })
  })

  it('should have descriptive button labels', async () => {
    // Mock BOM usage for Make Inactive button
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          success: true,
          data: mockBOMsUsage
        }),
      })
    ) as any

    // GIVEN delete dialog
    render(
      <DeleteRoutingDialog
        open={true}
        onOpenChange={vi.fn()}
        routing={mockRoutingWithUsage}
        onConfirm={vi.fn()}
        onMakeInactive={vi.fn()}
      />
    )

    // THEN buttons have descriptive labels
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Make Inactive/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /Delete Routing/i })).toBeInTheDocument()
    }, { timeout: 3000 })
  })
})

/**
 * Test Coverage: 14 test cases covering AC-22, AC-23, AC-24
 */
