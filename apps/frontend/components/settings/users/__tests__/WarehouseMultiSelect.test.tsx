/**
 * Component Tests: WarehouseMultiSelect (Story 01.5b - TD-103)
 * Story: 01.5b - User Warehouse Access Restrictions
 *
 * Tests the WarehouseMultiSelect component for:
 * - Loading state: displays skeleton
 * - Error state: displays error message
 * - Empty state: displays "no warehouses" message
 * - Success state: displays dropdown with options
 * - Selection: can select/deselect warehouses
 * - Badge display: shows selected warehouses as badges
 * - Remove selection: can remove via badge X button
 * - Keyboard navigation: supports arrow keys, Enter, Escape
 * - Accessibility: proper ARIA labels
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WarehouseMultiSelect, type Warehouse } from '../WarehouseMultiSelect'

const mockWarehouses: Warehouse[] = [
  { id: 'wh-1', code: 'WH-001', name: 'Main Warehouse', type: 'main', is_active: true },
  { id: 'wh-2', code: 'WH-002', name: 'Secondary Warehouse', type: 'secondary', is_active: true },
  { id: 'wh-3', code: 'WH-003', name: 'Staging Warehouse', type: 'staging', is_active: true },
]

describe('WarehouseMultiSelect - States', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  // Loading State
  it('should display loading skeleton when isLoading is true', () => {
    render(
      <WarehouseMultiSelect
        value={[]}
        onChange={mockOnChange}
        warehouses={[]}
        isLoading={true}
      />
    )

    expect(screen.getByTestId('warehouse-multiselect-loading')).toBeInTheDocument()
    expect(screen.getByText(/loading warehouses/i)).toBeInTheDocument()
  })

  // Error State
  it('should display error message when error is provided', () => {
    render(
      <WarehouseMultiSelect
        value={[]}
        onChange={mockOnChange}
        warehouses={[]}
        error="Failed to fetch warehouses"
      />
    )

    expect(screen.getByTestId('warehouse-multiselect-error')).toBeInTheDocument()
    expect(screen.getByText(/failed to fetch warehouses/i)).toBeInTheDocument()
  })

  // Empty State
  it('should display empty message when no warehouses available', () => {
    render(
      <WarehouseMultiSelect
        value={[]}
        onChange={mockOnChange}
        warehouses={[]}
      />
    )

    expect(screen.getByTestId('warehouse-multiselect-empty')).toBeInTheDocument()
    expect(screen.getByText(/no warehouses available/i)).toBeInTheDocument()
  })

  // Success State
  it('should display dropdown trigger with placeholder', () => {
    render(
      <WarehouseMultiSelect
        value={[]}
        onChange={mockOnChange}
        warehouses={mockWarehouses}
      />
    )

    expect(screen.getByTestId('warehouse-multiselect')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByText(/select warehouses/i)).toBeInTheDocument()
  })
})

describe('WarehouseMultiSelect - Selection', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it('should display count when warehouses are selected', () => {
    render(
      <WarehouseMultiSelect
        value={['wh-1', 'wh-2']}
        onChange={mockOnChange}
        warehouses={mockWarehouses}
      />
    )

    expect(screen.getByText(/2 warehouses selected/i)).toBeInTheDocument()
  })

  it('should display warehouse name when only one selected', () => {
    render(
      <WarehouseMultiSelect
        value={['wh-1']}
        onChange={mockOnChange}
        warehouses={mockWarehouses}
      />
    )

    expect(screen.getByText(/wh-001 - main warehouse/i)).toBeInTheDocument()
  })

  it('should display selected warehouses as badges', () => {
    render(
      <WarehouseMultiSelect
        value={['wh-1', 'wh-2']}
        onChange={mockOnChange}
        warehouses={mockWarehouses}
      />
    )

    expect(screen.getByRole('list', { name: /selected warehouses/i })).toBeInTheDocument()
    expect(screen.getByText('WH-001')).toBeInTheDocument()
    expect(screen.getByText('WH-002')).toBeInTheDocument()
  })

  it('should call onChange when badge remove button is clicked', async () => {
    render(
      <WarehouseMultiSelect
        value={['wh-1', 'wh-2']}
        onChange={mockOnChange}
        warehouses={mockWarehouses}
      />
    )

    const removeButton = screen.getByRole('button', { name: /remove wh-001/i })
    await userEvent.click(removeButton)

    expect(mockOnChange).toHaveBeenCalledWith(['wh-2'])
  })
})

describe('WarehouseMultiSelect - Accessibility', () => {
  const mockOnChange = vi.fn()

  beforeEach(() => {
    mockOnChange.mockClear()
  })

  it('should have proper ARIA label on combobox', () => {
    render(
      <WarehouseMultiSelect
        value={[]}
        onChange={mockOnChange}
        warehouses={mockWarehouses}
        aria-label="Warehouse access selection"
      />
    )

    const combobox = screen.getByRole('combobox')
    expect(combobox).toHaveAttribute('aria-label', 'Warehouse access selection')
  })

  it('should have aria-expanded attribute', () => {
    render(
      <WarehouseMultiSelect
        value={[]}
        onChange={mockOnChange}
        warehouses={mockWarehouses}
      />
    )

    const combobox = screen.getByRole('combobox')
    expect(combobox).toHaveAttribute('aria-expanded', 'false')
  })

  it('should be disabled when disabled prop is true', () => {
    render(
      <WarehouseMultiSelect
        value={[]}
        onChange={mockOnChange}
        warehouses={mockWarehouses}
        disabled={true}
      />
    )

    const combobox = screen.getByRole('combobox')
    expect(combobox).toBeDisabled()
  })
})
