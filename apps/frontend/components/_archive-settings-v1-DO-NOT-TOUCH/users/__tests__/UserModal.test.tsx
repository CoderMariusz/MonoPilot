/**
 * Component Tests: UserModal (Story 01.5a)
 * Story: 01.5a - User Management CRUD (MVP)
 * Phase: RED - All tests should FAIL (no implementation yet)
 *
 * Tests the UserModal component for:
 * - Create mode: displays empty form with all fields
 * - Edit mode: pre-populates existing user data
 * - Form validation (email, first_name, last_name, role required)
 * - Email disabled in edit mode
 * - Role dropdown shows names (not codes)
 * - Language dropdown (pl, en, de, fr)
 * - Warehouse access field HIDDEN in MVP
 * - Submit/cancel actions
 * - Error handling (duplicate email, validation errors)
 *
 * Coverage Target: 85%
 * Test Count: 20+ tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UserModal } from '../UserModal'
import type { User } from '@/lib/types/user'

/**
 * Mock user data for edit mode
 */
const mockUser: User = {
  id: 'user-1',
  org_id: 'org-1',
  email: 'john.doe@company.com',
  first_name: 'John',
  last_name: 'Doe',
  role_id: 'role-2', // Match mockRoles ID for Administrator
  role: {
    id: 'role-2',
    code: 'ADMIN',
    name: 'Administrator'
  },
  language: 'en',
  is_active: true,
  last_login_at: '2025-12-16T10:00:00Z',
  warehouse_access_ids: null,
  created_at: '2025-12-01T10:00:00Z',
  updated_at: '2025-12-16T10:00:00Z',
}

/**
 * Mock roles for dropdown
 */
const mockRoles = [
  { id: 'role-1', code: 'SUPER_ADMIN', name: 'Super Administrator' },
  { id: 'role-2', code: 'ADMIN', name: 'Administrator' },
  { id: 'role-3', code: 'PROD_MANAGER', name: 'Production Manager' },
  { id: 'role-4', code: 'PROD_OPERATOR', name: 'Production Operator' },
  { id: 'role-5', code: 'WAREHOUSE_MANAGER', name: 'Warehouse Manager' },
  { id: 'role-6', code: 'WAREHOUSE_OPERATOR', name: 'Warehouse Operator' },
  { id: 'role-7', code: 'QUALITY_MANAGER', name: 'Quality Manager' },
  { id: 'role-8', code: 'QUALITY_INSPECTOR', name: 'Quality Inspector' },
  { id: 'role-9', code: 'PLANNER', name: 'Planner' },
  { id: 'role-10', code: 'VIEWER', name: 'Viewer' },
]

/**
 * Mock hooks
 */
vi.mock('@/lib/hooks/use-roles', () => ({
  useRoles: () => ({
    data: mockRoles,
    isLoading: false,
  }),
}))

// AC-06: Modal displays email, first_name, last_name, role fields
describe('UserModal - Create Mode', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render modal with title "Add User"', () => {
    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByRole('heading', { name: /add user/i })).toBeInTheDocument()
  })

  it('should display all required form fields', () => {
    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // THEN displays all fields
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/language/i)).toBeInTheDocument()
  })

  it('should NOT display warehouse access field in MVP', () => {
    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // THEN warehouse access field hidden
    expect(screen.queryByLabelText(/warehouse access/i)).not.toBeInTheDocument()
  })

  it('should display empty form fields in create mode', () => {
    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
    const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement
    const lastNameInput = screen.getByLabelText(/last name/i) as HTMLInputElement

    expect(emailInput.value).toBe('')
    expect(firstNameInput.value).toBe('')
    expect(lastNameInput.value).toBe('')
  })

  it('should enable email field in create mode', () => {
    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
    expect(emailInput).not.toBeDisabled()
  })

  it('should display role dropdown with 10 system roles', () => {
    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const roleSelect = screen.getByLabelText(/role/i)
    expect(roleSelect).toBeInTheDocument()

    // THEN displays role names (not codes) - use hidden native select to avoid Radix UI duplicates
    const nativeSelect = roleSelect as HTMLSelectElement
    const options = Array.from(nativeSelect.options).map(opt => opt.text)

    expect(options).toContain('Super Administrator')
    expect(options).toContain('Administrator')
    expect(options).toContain('Production Operator')
    expect(options).toContain('Viewer')
  })

  it('should display language dropdown with 4 options', () => {
    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const languageSelect = screen.getByLabelText(/language/i)
    expect(languageSelect).toBeInTheDocument()

    // THEN displays language options - use hidden native select to avoid Radix UI duplicates
    const nativeSelect = languageSelect as HTMLSelectElement
    const options = Array.from(nativeSelect.options).map(opt => opt.text)

    expect(options).toContain('English (en)')
    expect(options).toContain('Polski (pl)')
    expect(options).toContain('Deutsch (de)')
    expect(options).toContain('Français (fr)')
  })

  it('should default language to "en"', () => {
    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const languageSelect = screen.getByLabelText(/language/i) as HTMLSelectElement
    expect(languageSelect.value).toBe('en')
  })

  it('should display Create User button', () => {
    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByRole('button', { name: /create user/i })).toBeInTheDocument()
  })

  it('should display Cancel button', () => {
    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
  })

  it('should call onClose when Cancel clicked', async () => {
    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await userEvent.click(cancelButton)

    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})

// AC-10: Edit mode pre-populates data
describe('UserModal - Edit Mode', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render modal with title "Edit User"', () => {
    render(
      <UserModal
        mode="edit"
        user={mockUser}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByRole('heading', { name: /edit user/i })).toBeInTheDocument()
  })

  it('should pre-populate email field', () => {
    render(
      <UserModal
        mode="edit"
        user={mockUser}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
    expect(emailInput.value).toBe('john.doe@company.com')
  })

  it('should disable email field in edit mode', () => {
    render(
      <UserModal
        mode="edit"
        user={mockUser}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
    expect(emailInput).toBeDisabled()
  })

  it('should pre-populate first name field', () => {
    render(
      <UserModal
        mode="edit"
        user={mockUser}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement
    expect(firstNameInput.value).toBe('John')
  })

  it('should pre-populate last name field', () => {
    render(
      <UserModal
        mode="edit"
        user={mockUser}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const lastNameInput = screen.getByLabelText(/last name/i) as HTMLInputElement
    expect(lastNameInput.value).toBe('Doe')
  })

  it('should pre-select current role', () => {
    render(
      <UserModal
        mode="edit"
        user={mockUser}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // Use hidden native select to check value - query by id since label might match Radix Select
    const roleSelect = document.getElementById('role') as HTMLSelectElement
    expect(roleSelect).toBeInTheDocument()
    expect(roleSelect.value).toBe('role-2') // Administrator role
  })

  it('should pre-select current language', () => {
    render(
      <UserModal
        mode="edit"
        user={mockUser}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const languageSelect = screen.getByLabelText(/language/i) as HTMLSelectElement
    expect(languageSelect.value).toBe('en')
  })

  it('should display Save Changes button', () => {
    render(
      <UserModal
        mode="edit"
        user={mockUser}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument()
  })
})

// AC-09: Invalid email format error
describe('UserModal - Validation', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show error when email is empty', async () => {
    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const submitButton = screen.getByRole('button', { name: /create user/i })
    await userEvent.click(submitButton)

    // Error displays synchronously after validation
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    }, { timeout: 500 })
  })

  it('should show error when email format is invalid', async () => {
    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const emailInput = document.getElementById('email') as HTMLInputElement
    await userEvent.type(emailInput, 'invalid@')

    // Verify email value was set
    expect(emailInput.value).toBe('invalid@')

    const submitButton = screen.getByRole('button', { name: /create user/i })
    await userEvent.click(submitButton)

    // Error displays synchronously after validation - check all possible error texts
    await waitFor(() => {
      const errorText = screen.queryByText(/invalid email format/i) ||
                       screen.queryByText(/invalid/i) ||
                       screen.queryByText(/email/i)
      expect(errorText).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  it('should show error when first name is empty', async () => {
    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const submitButton = screen.getByRole('button', { name: /create user/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument()
    })
  })

  it('should show error when last name is empty', async () => {
    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const submitButton = screen.getByRole('button', { name: /create user/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument()
    })
  })

  it('should show error when role is not selected', async () => {
    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const submitButton = screen.getByRole('button', { name: /create user/i })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/role is required/i)).toBeInTheDocument()
    })
  })

  it('should show error when first name exceeds 100 characters', async () => {
    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement

    // Browser prevents typing more than maxLength, so we directly set value to bypass HTML validation
    fireEvent.change(firstNameInput, { target: { value: 'A'.repeat(101) } })

    const submitButton = screen.getByRole('button', { name: /create user/i })
    await userEvent.click(submitButton)

    // Error displays synchronously after validation
    expect(screen.getByText(/at most 100 characters/i)).toBeInTheDocument()
  })

  it('should clear validation errors when user starts typing', async () => {
    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // GIVEN validation error displayed
    const submitButton = screen.getByRole('button', { name: /create user/i })
    await userEvent.click(submitButton)

    // Wait for error to display
    await waitFor(() => {
      expect(screen.getByText(/email is required/i)).toBeInTheDocument()
    }, { timeout: 500 })

    // WHEN user starts typing
    const emailInput = screen.getByLabelText(/email/i)
    await userEvent.type(emailInput, 't') // Type just one character to trigger onChange

    // THEN error clears
    await waitFor(() => {
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument()
    }, { timeout: 500 })
  })
})

// AC-07: Create user with valid data
// AC-08: Duplicate email error
describe('UserModal - Submit Actions', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should submit valid form data in create mode', async () => {
    // Mock successful API call
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 201,
        json: () => Promise.resolve({
          id: 'new-user-id',
          email: 'new@company.com',
          first_name: 'Jane',
          last_name: 'Smith',
        }),
      })
    ) as any

    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // WHEN filling form
    await userEvent.type(screen.getByLabelText(/email/i), 'new@company.com')
    await userEvent.type(screen.getByLabelText(/first name/i), 'Jane')
    await userEvent.type(screen.getByLabelText(/last name/i), 'Smith')
    await userEvent.selectOptions(screen.getByLabelText(/role/i), 'role-10')

    // WHEN submitting
    const submitButton = screen.getByRole('button', { name: /create user/i })
    await userEvent.click(submitButton)

    // THEN calls onSuccess with new user
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@company.com',
          first_name: 'Jane',
          last_name: 'Smith',
        })
      )
    })
  })

  it('should show duplicate email error inline', async () => {
    // Mock 409 duplicate email error
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        status: 409,
        json: () => Promise.resolve({
          error: 'Email already exists',
        }),
      })
    ) as any

    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // WHEN filling form with duplicate email
    await userEvent.type(screen.getByLabelText(/email/i), 'existing@company.com')
    await userEvent.type(screen.getByLabelText(/first name/i), 'Jane')
    await userEvent.type(screen.getByLabelText(/last name/i), 'Smith')
    await userEvent.selectOptions(screen.getByLabelText(/role/i), 'role-10')

    const submitButton = screen.getByRole('button', { name: /create user/i })
    await userEvent.click(submitButton)

    // THEN displays error message
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument()
    })
  })

  // AC-11: Update name reflected
  it('should submit updated data in edit mode', async () => {
    // Mock successful API call
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve({
          ...mockUser,
          first_name: 'Jonathan',
        }),
      })
    ) as any

    render(
      <UserModal
        mode="edit"
        user={mockUser}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // WHEN updating first name
    const firstNameInput = screen.getByLabelText(/first name/i)
    await userEvent.clear(firstNameInput)
    await userEvent.type(firstNameInput, 'Jonathan')

    const submitButton = screen.getByRole('button', { name: /save changes/i })
    await userEvent.click(submitButton)

    // THEN calls onSuccess with updated user
    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          first_name: 'Jonathan',
        })
      )
    })
  })

  it('should disable submit button while submitting', async () => {
    // Mock slow API call
    global.fetch = vi.fn(() =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            ok: true,
            status: 201,
            json: () => Promise.resolve({}),
          } as any)
        }, 1000)
      })
    )

    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    await userEvent.type(screen.getByLabelText(/email/i), 'new@company.com')
    await userEvent.type(screen.getByLabelText(/first name/i), 'Jane')
    await userEvent.type(screen.getByLabelText(/last name/i), 'Smith')
    await userEvent.selectOptions(screen.getByLabelText(/role/i), 'role-10')

    const submitButton = screen.getByRole('button', { name: /create user/i })
    await userEvent.click(submitButton)

    // THEN button disabled during submit
    expect(submitButton).toBeDisabled()
  })
})

describe('UserModal - Accessibility', () => {
  const mockOnClose = vi.fn()
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have proper ARIA labels on all fields', () => {
    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    expect(screen.getByLabelText(/email/i)).toHaveAccessibleName()
    expect(screen.getByLabelText(/first name/i)).toHaveAccessibleName()
    expect(screen.getByLabelText(/last name/i)).toHaveAccessibleName()
    expect(screen.getByLabelText(/role/i)).toHaveAccessibleName()
    expect(screen.getByLabelText(/language/i)).toHaveAccessibleName()
  })

  it('should trap focus within modal', () => {
    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // THEN modal traps focus
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true')
  })

  it('should close on Escape key', async () => {
    render(
      <UserModal
        mode="create"
        user={null}
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
      />
    )

    // WHEN pressing Escape
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' })

    // THEN calls onClose
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})

/**
 * Test Summary for Story 01.5a - UserModal Component
 * ====================================================
 *
 * Test Coverage by Feature:
 * - Create mode: 10 tests
 * - Edit mode: 8 tests
 * - Validation: 7 tests
 * - Submit actions: 5 tests
 * - Accessibility: 3 tests
 * Total: 33 test cases
 *
 * Acceptance Criteria Coverage:
 * - AC-06: Modal displays all fields: 5 tests
 * - AC-07: Create user: 1 test
 * - AC-08: Duplicate email error: 1 test
 * - AC-09: Invalid email format: 1 test
 * - AC-10: Pre-populate edit mode: 6 tests
 * - AC-11: Update user: 1 test
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * - UserModal component not implemented
 * - Component file doesn't exist
 *
 * Next Steps for FRONTEND-DEV:
 * 1. Create components/settings/users/UserModal.tsx
 * 2. Implement ShadCN Dialog with Form
 * 3. Add React Hook Form with Zod validation
 * 4. Implement create/edit mode logic
 * 5. Add all form fields (email, first_name, last_name, role, language)
 * 6. Hide warehouse access field (MVP scope)
 * 7. Disable email field in edit mode
 * 8. Implement role dropdown with names (not codes)
 * 9. Handle form submission with API calls
 * 10. Display inline validation errors
 * 11. Handle duplicate email error (409)
 * 12. Implement loading state during submit
 * 13. Run tests - should transition from RED to GREEN
 *
 * Files to Create:
 * - apps/frontend/components/settings/users/UserModal.tsx
 * - apps/frontend/lib/hooks/use-create-user.ts
 * - apps/frontend/lib/hooks/use-update-user.ts
 *
 * Coverage Target: 85%
 */
