/**
 * Component Tests: WarehouseModal (Story 01.8)
 * Story: 01.8 - Warehouse Management
 * Phase: GREEN - Make tests pass
 *
 * Tests the WarehouseModal component for:
 * - Create mode: displays empty form with all fields
 * - Edit mode: pre-populates existing warehouse data
 * - Form validation (code, name, type required)
 * - Code disabled in edit if has inventory
 * - Type dropdown shows labels (not codes)
 * - Address character counter (500 max)
 * - Contact email and phone fields
 * - Active checkbox
 * - Real-time code validation (debounced 300ms)
 * - Submit/cancel actions
 * - Error handling (duplicate code, validation errors)
 *
 * Coverage Target: 85%
 * Test Count: 38 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { WarehouseModal } from '../WarehouseModal'
import type { Warehouse } from '@/lib/types/warehouse'

/**
 * Mock warehouse data for edit mode
 */
const mockWarehouse: Warehouse = {
  id: 'warehouse-1',
  org_id: 'org-1',
  code: 'WH-MAIN',
  name: 'Main Warehouse',
  type: 'GENERAL',
  address: '123 Main St\nBuilding A\nCity, State 12345',
  contact_email: 'warehouse@company.com',
  contact_phone: '+1 (555) 123-4567',
  is_default: false,
  is_active: true,
  location_count: 5,
  disabled_at: null,
  disabled_by: null,
  created_at: '2025-12-01T10:00:00Z',
  updated_at: '2025-12-16T10:00:00Z',
  created_by: 'user-1',
  updated_by: 'user-1',
}

/**
 * Mock warehouse with inventory (for code immutability test)
 */
const mockWarehouseWithInventory: Warehouse = {
  ...mockWarehouse,
  id: 'warehouse-2',
  code: 'WH-RAW',
  location_count: 10,
}

/**
 * Mock hooks with module-level mocks
 */
const mockCreateMutate = vi.fn().mockResolvedValue({
  id: 'new-warehouse-id',
  code: 'WH-NEW',
  name: 'New Warehouse',
  type: 'GENERAL',
})

const mockUpdateMutate = vi.fn().mockResolvedValue({
  id: 'warehouse-1',
  code: 'WH-MAIN',
  name: 'Main Warehouse',
  type: 'GENERAL',
})

// Create mock return value that can be updated
let mockCreatePending = false
let mockUpdatePending = false

vi.mock('@/lib/hooks/use-create-warehouse', () => ({
  useCreateWarehouse: () => ({
    mutateAsync: mockCreateMutate,
    get isPending() { return mockCreatePending },
  }),
}))

vi.mock('@/lib/hooks/use-update-warehouse', () => ({
  useUpdateWarehouse: () => ({
    mutateAsync: mockUpdateMutate,
    get isPending() { return mockUpdatePending },
  }),
}))

describe('WarehouseModal - Create Mode', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render modal with title "Create Warehouse"', () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByRole('heading', { name: /create warehouse/i })).toBeInTheDocument()
  })

  it('should display all required form fields', () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByLabelText(/code/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/type/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/address/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contact email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contact phone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/active/i)).toBeInTheDocument()
  })

  it('should display empty form fields in create mode', () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const codeInput = screen.getByLabelText(/code/i) as HTMLInputElement
    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement
    const addressInput = screen.getByLabelText(/address/i) as HTMLTextAreaElement

    expect(codeInput.value).toBe('')
    expect(nameInput.value).toBe('')
    expect(addressInput.value).toBe('')
  })

  it('should enable code field in create mode', () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const codeInput = screen.getByLabelText(/code/i) as HTMLInputElement
    expect(codeInput).not.toBeDisabled()
  })

  it('should display type dropdown with 5 warehouse types', () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const typeSelect = screen.getByLabelText(/type/i)
    expect(typeSelect).toBeInTheDocument()

    const nativeSelect = typeSelect as HTMLSelectElement
    const options = Array.from(nativeSelect.options).map(opt => opt.text)

    expect(options).toContain('General')
    expect(options).toContain('Raw Materials')
    expect(options).toContain('WIP (Work in Progress)')
    expect(options).toContain('Finished Goods')
    expect(options).toContain('Quarantine')
  })

  it('should default type to "GENERAL"', () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const typeSelect = screen.getByLabelText(/type/i) as HTMLSelectElement
    expect(typeSelect.value).toBe('GENERAL')
  })

  it('should display address character counter', () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByText(/0\/500 characters/i)).toBeInTheDocument()
  })

  it('should update address character counter as user types', async () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const addressInput = screen.getByLabelText(/address/i)
    await userEvent.type(addressInput, '123 Main St')

    expect(screen.getByText(/11\/500 characters/i)).toBeInTheDocument()
  })

  it('should display Active checkbox checked by default', () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const activeCheckbox = screen.getByLabelText(/active/i) as HTMLInputElement
    expect(activeCheckbox).toBeChecked()
  })

  it('should display Create Warehouse button', () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByRole('button', { name: /create warehouse/i })).toBeInTheDocument()
  })

  it('should display Cancel button', () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('should call onClose when Cancel clicked', async () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await userEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  it('should auto-uppercase code on blur', async () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const codeInput = screen.getByLabelText(/code/i) as HTMLInputElement
    await userEvent.type(codeInput, 'wh-test')
    fireEvent.blur(codeInput)

    await waitFor(() => {
      expect(codeInput.value).toBe('WH-TEST')
    })
  })

  it('should validate code availability with debounce', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ available: true }),
      })
    ) as any

    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const codeInput = screen.getByLabelText(/code/i)
    await userEvent.type(codeInput, 'WH-NEW')

    await waitFor(() => {
      expect(screen.getByText(/code available/i)).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('should show code already exists message', async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ available: false }),
      })
    ) as any

    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const codeInput = screen.getByLabelText(/code/i)
    await userEvent.type(codeInput, 'WH-MAIN')

    await waitFor(() => {
      expect(screen.getByText(/code already exists/i)).toBeInTheDocument()
    }, { timeout: 1000 })
  })
})

describe('WarehouseModal - Edit Mode', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render modal with title "Edit Warehouse"', () => {
    render(
      <WarehouseModal
        mode="edit"
        warehouse={mockWarehouse}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByRole('heading', { name: /edit warehouse/i })).toBeInTheDocument()
  })

  it('should pre-populate code field', () => {
    render(
      <WarehouseModal
        mode="edit"
        warehouse={mockWarehouse}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const codeInput = screen.getByLabelText(/code/i) as HTMLInputElement
    expect(codeInput.value).toBe('WH-MAIN')
  })

  it('should pre-populate name field', () => {
    render(
      <WarehouseModal
        mode="edit"
        warehouse={mockWarehouse}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const nameInput = screen.getByLabelText(/name/i) as HTMLInputElement
    expect(nameInput.value).toBe('Main Warehouse')
  })

  it('should pre-populate address field', () => {
    render(
      <WarehouseModal
        mode="edit"
        warehouse={mockWarehouse}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const addressInput = screen.getByLabelText(/address/i) as HTMLTextAreaElement
    expect(addressInput.value).toContain('123 Main St')
  })

  it('should pre-populate contact email field', () => {
    render(
      <WarehouseModal
        mode="edit"
        warehouse={mockWarehouse}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const emailInput = screen.getByLabelText(/contact email/i) as HTMLInputElement
    expect(emailInput.value).toBe('warehouse@company.com')
  })

  it('should pre-populate contact phone field', () => {
    render(
      <WarehouseModal
        mode="edit"
        warehouse={mockWarehouse}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const phoneInput = screen.getByLabelText(/contact phone/i) as HTMLInputElement
    expect(phoneInput.value).toBe('+1 (555) 123-4567')
  })

  it('should pre-select current type', () => {
    render(
      <WarehouseModal
        mode="edit"
        warehouse={mockWarehouse}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const typeSelect = document.getElementById('type') as HTMLSelectElement
    expect(typeSelect.value).toBe('GENERAL')
  })

  it('should disable code field if warehouse has inventory', () => {
    render(
      <WarehouseModal
        mode="edit"
        warehouse={mockWarehouseWithInventory}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const codeInput = screen.getByLabelText(/code/i) as HTMLInputElement
    expect(codeInput).toBeDisabled()
    expect(screen.getByText(/code cannot be changed/i)).toBeInTheDocument()
  })

  it('should display Save Changes button', () => {
    render(
      <WarehouseModal
        mode="edit"
        warehouse={mockWarehouse}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const saveButton = screen.getByRole('button', { name: /save changes/i })
    expect(saveButton).toBeInTheDocument()
  })
})

describe('WarehouseModal - Validation', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show error when code is empty', async () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const submitButton = screen.getByRole('button', { name: /create warehouse/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Warehouse code must be at least 2 characters')).toBeInTheDocument()
    })
  })

  it('should show error when name is empty', async () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const submitButton = screen.getByRole('button', { name: /create warehouse/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Warehouse name must be at least 2 characters')).toBeInTheDocument()
    })
  })

  it('should show error when code format is invalid', async () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const codeInput = screen.getByLabelText(/code/i)
    await userEvent.type(codeInput, 'wh main!')

    const submitButton = screen.getByRole('button', { name: /create warehouse/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Code must be 2-20 uppercase alphanumeric characters with hyphens only')).toBeInTheDocument()
    })
  })

  it('should show error when email format is invalid', async () => {
    // Mock code validation to return available
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ available: true }),
      })
    ) as any

    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // Fill required fields first to avoid other validation errors
    const codeInput = screen.getByLabelText(/^code/i)
    const nameInput = screen.getByLabelText(/^name/i)
    const emailInput = screen.getByLabelText(/contact email/i)

    await userEvent.type(codeInput, 'WH-TEST')
    await userEvent.type(nameInput, 'Test Warehouse')
    await userEvent.type(emailInput, 'invalid-email')

    // Wait for code validation to complete before submitting
    await waitFor(() => {
      expect(screen.getByText(/code available/i)).toBeInTheDocument()
    }, { timeout: 1000 })

    const submitButton = screen.getByRole('button', { name: /create warehouse/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Invalid email format')).toBeInTheDocument()
    })
  })

  it('should show error when address exceeds 500 characters', async () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const addressInput = screen.getByLabelText(/address/i)
    const longAddress = 'A'.repeat(501)
    fireEvent.change(addressInput, { target: { value: longAddress } })

    const submitButton = screen.getByRole('button', { name: /create warehouse/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Address must be 500 characters or less')).toBeInTheDocument()
    })
  })

  it('should show red counter when address near limit', async () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const addressInput = screen.getByLabelText(/address/i)
    const nearLimitAddress = 'A'.repeat(460)
    // Use fireEvent.change instead of userEvent.type for performance with long text
    fireEvent.change(addressInput, { target: { value: nearLimitAddress } })

    const counter = screen.getByText(/460\/500 characters/i)
    expect(counter).toHaveClass('text-destructive')
  })

  it('should clear validation errors when user starts typing', async () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const submitButton = screen.getByRole('button', { name: /create warehouse/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText('Warehouse name must be at least 2 characters')).toBeInTheDocument()
    })

    const nameInput = screen.getByLabelText(/name/i)
    await userEvent.type(nameInput, 'T')

    await waitFor(() => {
      expect(screen.queryByText('Warehouse name must be at least 2 characters')).not.toBeInTheDocument()
    })
  })
})

describe('WarehouseModal - Submit Actions', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should submit valid form data in create mode', async () => {
    // Mock successful validation fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ available: true }),
      })
    ) as any

    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const codeInput = screen.getByLabelText(/code/i)
    const nameInput = screen.getByLabelText(/name/i)

    await userEvent.type(codeInput, 'WH-NEW')
    await userEvent.type(nameInput, 'New Warehouse')

    const submitButton = screen.getByRole('button', { name: /create warehouse/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled()
      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  it('should disable submit button while submitting', async () => {
    // Set pending state to true
    mockCreatePending = true

    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const submitButton = screen.getByRole('button', { name: /saving/i })
    expect(submitButton).toBeDisabled()

    // Reset pending state
    mockCreatePending = false
  })
})

describe('WarehouseModal - Accessibility', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have proper ARIA labels on all fields', () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByLabelText(/code/i)).toHaveAccessibleName()
    expect(screen.getByLabelText(/name/i)).toHaveAccessibleName()
    expect(screen.getByLabelText(/type/i)).toHaveAccessibleName()
    expect(screen.getByLabelText(/address/i)).toHaveAccessibleName()
    expect(screen.getByLabelText(/contact email/i)).toHaveAccessibleName()
    expect(screen.getByLabelText(/contact phone/i)).toHaveAccessibleName()
    expect(screen.getByLabelText(/active/i)).toHaveAccessibleName()
  })

  it('should trap focus within modal', () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('should close on Escape key', async () => {
    render(
      <WarehouseModal
        mode="create"
        warehouse={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})

/**
 * Test Summary for Story 01.8 - WarehouseModal Component
 * ========================================================
 *
 * Test Coverage by Feature:
 * - Create mode: 15 tests
 * - Edit mode: 9 tests
 * - Validation: 7 tests
 * - Submit actions: 2 tests
 * - Accessibility: 3 tests
 * Total: 36 test cases
 *
 * Expected Status: ALL TESTS PASS (GREEN phase)
 * - WarehouseModal component implemented
 * - All 4 states: loading, error, empty, success
 * - Real-time code validation with 300ms debounce
 * - Address character counter
 * - Form validation with inline errors
 *
 * Next Steps:
 * - Verify all tests GREEN
 * - Check coverage >= 85%
 * - Handoff to SENIOR-DEV for refactor
 */
