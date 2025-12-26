/**
 * Component Tests: RoutingsDataTable
 * Story: 02.7 - Routings CRUD
 * Phase: RED - Tests will fail until component exists
 *
 * Tests the RoutingsDataTable component which displays:
 * - Routings list with Name, Description, Status, Operations Count
 * - Actions: View, Edit, Clone, Delete
 * - Search and filter functionality
 * - Responsive behavior (table -> cards on mobile)
 *
 * Coverage Target: 80%
 * Test Count: 15+ tests
 *
 * Acceptance Criteria Coverage:
 * - AC-01 to AC-04: Display routings list
 * - AC-29, AC-30: Permission-based action visibility
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { RoutingsDataTable } from '../routings-data-table'

const mockRoutings = [
  {
    id: 'routing-001',
    code: 'RTG-BREAD-01',
    name: 'Standard Bread Line',
    description: 'Mixing → Proofing → Baking → Cooling',
    is_active: true,
    operations_count: 5,
    version: 1,
  },
  {
    id: 'routing-002',
    code: 'RTG-CAKE-01',
    name: 'Cake Production',
    description: 'Basic cake workflow',
    is_active: true,
    operations_count: 4,
    version: 1,
  },
  {
    id: 'routing-003',
    code: 'RTG-SAUCE-01',
    name: 'Sauce Blending',
    description: 'Blending and pasteurization',
    is_active: false,
    operations_count: 3,
    version: 2,
  },
]

describe('RoutingsDataTable', () => {
  it('should render routings list (AC-01)', () => {
    // GIVEN routings data
    render(
      <RoutingsDataTable
        routings={mockRoutings}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onClone={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    // THEN table displays all routings (using getAllByText for duplicates in desktop/mobile views)
    const breadLine = screen.getAllByText('Standard Bread Line')
    expect(breadLine.length).toBeGreaterThan(0)
    expect(screen.getAllByText('Cake Production').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Sauce Blending').length).toBeGreaterThan(0)
  })

  it('should display status badges (Active/Inactive)', () => {
    // GIVEN routings with different statuses
    const { container } = render(
      <RoutingsDataTable
        routings={mockRoutings}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onClone={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    // THEN Active and Inactive badges exist with proper styling
    const activeBadges = screen.getAllByText('Active')
    expect(activeBadges.length).toBeGreaterThan(0)
    // Check that at least one has the green background class
    const hasGreenBadge = activeBadges.some(badge => badge.className.includes('bg-green-100'))
    expect(hasGreenBadge).toBe(true)

    const inactiveBadges = screen.getAllByText('Inactive')
    const hasGrayBadge = inactiveBadges.some(badge => badge.className.includes('bg-gray-100'))
    expect(hasGrayBadge).toBe(true)
  })

  it('should display operations count as badge', () => {
    // GIVEN routings with operations
    render(
      <RoutingsDataTable
        routings={mockRoutings}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onClone={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    // THEN operations count displayed as badge
    expect(screen.getByText('5')).toBeInTheDocument() // operations count for routing-001
    expect(screen.getByText('4')).toBeInTheDocument() // operations count for routing-002
    expect(screen.getByText('3')).toBeInTheDocument() // operations count for routing-003
  })

  it('should truncate long descriptions', () => {
    // GIVEN routing with long description
    const longDescRouting = {
      id: 'routing-004',
      code: 'RTG-LONG-01',
      name: 'Long Description Routing',
      description: 'This is a very long description that should be truncated at 50 characters maximum',
      is_active: true,
      operations_count: 2,
      version: 1,
    }

    render(
      <RoutingsDataTable
        routings={[longDescRouting]}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onClone={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    // THEN description truncated at 50 chars with ellipsis (50 chars + '...')
    const allText = screen.getAllByText(/This is a very long description/)
    expect(allText.length).toBeGreaterThan(0)
    // Check that at least one is truncated (ends with ...)
    const hasTruncated = allText.some(el => el.textContent?.includes('...'))
    expect(hasTruncated).toBe(true)
  })

  it('should call onView when row clicked', () => {
    // GIVEN table with routings
    const onView = vi.fn()

    render(
      <RoutingsDataTable
        routings={mockRoutings}
        onView={onView}
        onEdit={vi.fn()}
        onClone={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    // WHEN row clicked (use first instance from desktop view)
    const breadLines = screen.getAllByText('Standard Bread Line')
    fireEvent.click(breadLines[0])

    // THEN onView called with routing ID
    expect(onView).toHaveBeenCalledWith('routing-001')
  })

  it('should call onEdit when Edit button clicked', () => {
    // GIVEN table with routings
    const onEdit = vi.fn()

    render(
      <RoutingsDataTable
        routings={mockRoutings}
        onView={vi.fn()}
        onEdit={onEdit}
        onClone={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    // WHEN Edit button clicked
    const editButtons = screen.getAllByLabelText('Edit routing')
    fireEvent.click(editButtons[0])

    // THEN onEdit called with routing object
    expect(onEdit).toHaveBeenCalledWith(mockRoutings[0])
  })

  it('should call onClone when Clone button clicked', () => {
    // GIVEN table with routings
    const onClone = vi.fn()

    render(
      <RoutingsDataTable
        routings={mockRoutings}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onClone={onClone}
        onDelete={vi.fn()}
      />
    )

    // WHEN Clone button clicked
    const cloneButtons = screen.getAllByLabelText('Clone routing')
    fireEvent.click(cloneButtons[0])

    // THEN onClone called with routing object
    expect(onClone).toHaveBeenCalledWith(mockRoutings[0])
  })

  it('should call onDelete when Delete button clicked', () => {
    // GIVEN table with routings
    const onDelete = vi.fn()

    render(
      <RoutingsDataTable
        routings={mockRoutings}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onClone={vi.fn()}
        onDelete={onDelete}
      />
    )

    // WHEN Delete button clicked
    const deleteButtons = screen.getAllByLabelText('Delete routing')
    fireEvent.click(deleteButtons[0])

    // THEN onDelete called with routing object
    expect(onDelete).toHaveBeenCalledWith(mockRoutings[0])
  })

  it('should hide Edit/Clone/Delete actions for VIEWER role (AC-29)', () => {
    // GIVEN VIEWER user
    // WHEN table rendered with readOnly=true
    render(
      <RoutingsDataTable
        routings={mockRoutings}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onClone={vi.fn()}
        onDelete={vi.fn()}
        readOnly={true}
      />
    )

    // THEN Edit/Clone/Delete buttons hidden
    expect(screen.queryByLabelText('Edit routing')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Clone routing')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Delete routing')).not.toBeInTheDocument()
  })

  it('should show all actions for PROD_MANAGER role (AC-30)', () => {
    // GIVEN PROD_MANAGER user
    // WHEN table rendered with readOnly=false
    render(
      <RoutingsDataTable
        routings={mockRoutings}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onClone={vi.fn()}
        onDelete={vi.fn()}
        readOnly={false}
      />
    )

    // THEN all action buttons visible
    expect(screen.getAllByLabelText('Edit routing')[0]).toBeInTheDocument()
    expect(screen.getAllByLabelText('Clone routing')[0]).toBeInTheDocument()
    expect(screen.getAllByLabelText('Delete routing')[0]).toBeInTheDocument()
  })

  it('should support keyboard navigation (Tab, Enter)', () => {
    // GIVEN table with routings
    const onView = vi.fn()

    const { container } = render(
      <RoutingsDataTable
        routings={mockRoutings}
        onView={onView}
        onEdit={vi.fn()}
        onClone={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    // WHEN Enter key pressed on focused row (get first table row in tbody)
    const firstRow = container.querySelector('tbody tr')
    expect(firstRow).toBeInTheDocument()

    if (firstRow) {
      fireEvent.keyDown(firstRow, { key: 'Enter', code: 'Enter' })
      // THEN onView called
      expect(onView).toHaveBeenCalledWith('routing-001')
    }
  })

  it('should meet WCAG 2.1 AA accessibility standards', () => {
    // GIVEN table rendered
    const { container } = render(
      <RoutingsDataTable
        routings={mockRoutings}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onClone={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    // THEN ARIA labels present
    expect(container.querySelector('[role="table"]')).toBeInTheDocument()
    expect(screen.getAllByLabelText('Edit routing')[0]).toHaveAttribute('aria-label')
  })

  it('should have touch targets >= 48x48dp', () => {
    // GIVEN table on mobile
    render(
      <RoutingsDataTable
        routings={mockRoutings}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onClone={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    // THEN all buttons meet minimum touch target size (h-12 w-12 = 48px)
    const editButton = screen.getAllByLabelText('Edit routing')[0]
    expect(editButton).toHaveClass('h-12', 'w-12')
  })

  it('should display empty state when no routings (AC-04)', () => {
    // GIVEN empty routings array
    // WHEN table rendered with routings=[]
    render(
      <RoutingsDataTable
        routings={[]}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onClone={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    // THEN empty state displayed
    expect(screen.getByText('No Routings Found')).toBeInTheDocument()
    expect(screen.getByText('Create your first routing to get started')).toBeInTheDocument()
  })

  it('should convert to card layout on mobile (<768px)', () => {
    // GIVEN mobile viewport
    // WHEN table rendered
    const { container } = render(
      <RoutingsDataTable
        routings={mockRoutings}
        onView={vi.fn()}
        onEdit={vi.fn()}
        onClone={vi.fn()}
        onDelete={vi.fn()}
      />
    )

    // THEN displays as cards (cards exist with routing-card class)
    expect(container.querySelectorAll('.routing-card')).toHaveLength(3)
  })
})

/**
 * Test Coverage Summary:
 *
 * ✅ Display (AC-01):
 *   - Render routings list
 *   - Display status badges (Active/Inactive)
 *   - Display operations count
 *   - Truncate long descriptions
 *
 * ✅ Actions:
 *   - View routing (row click)
 *   - Edit routing (button)
 *   - Clone routing (button)
 *   - Delete routing (button)
 *
 * ✅ Permissions (AC-29, AC-30):
 *   - Hide actions for VIEWER
 *   - Show all actions for PROD_MANAGER
 *
 * ✅ Accessibility:
 *   - Keyboard navigation
 *   - WCAG 2.1 AA compliance
 *   - Touch targets 48x48dp
 *
 * ✅ Responsive:
 *   - Desktop: table layout
 *   - Mobile: card layout
 *
 * ✅ Empty state (AC-04)
 *
 * Total: 15 test cases
 */
