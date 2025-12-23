/**
 * Component Tests: UsersDataTable (Story 01.5a)
 * Story: 01.5a - User Management CRUD (MVP)
 * Phase: RED - All tests should FAIL (no implementation yet)
 *
 * Tests the UsersDataTable component with:
 * - Search functionality (debounced)
 * - Filter by role, status
 * - Pagination (25 per page)
 * - Sorting
 * - Row actions (Edit, Deactivate/Activate)
 * - Permission-based UI (VIEWER read-only)
 * - Loading, error, empty states
 *
 * Coverage Target: 85%
 * Test Count: 25+ tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { act } from 'react'
import userEvent from '@testing-library/user-event'
import { UsersDataTable } from '../UsersDataTable'
import type { User } from '@/lib/types/user'

/**
 * Mock user data
 */
const mockUsers: User[] = [
  {
    id: 'user-1',
    org_id: 'org-1',
    email: 'john.doe@company.com',
    first_name: 'John',
    last_name: 'Doe',
    role_id: 'role-2',
    role: {
      id: 'role-2',
      code: 'admin',
      name: 'Administrator'
    },
    language: 'en',
    is_active: true,
    last_login_at: '2025-12-16T10:00:00Z',
    warehouse_access_ids: null,
    created_at: '2025-12-01T10:00:00Z',
    updated_at: '2025-12-16T10:00:00Z',
  },
  {
    id: 'user-2',
    org_id: 'org-1',
    email: 'jane.smith@company.com',
    first_name: 'Jane',
    last_name: 'Smith',
    role_id: 'role-4',
    role: {
      id: 'role-4',
      code: 'production_operator',
      name: 'Production Operator'
    },
    language: 'en',
    is_active: false,
    last_login_at: null,
    warehouse_access_ids: null,
    created_at: '2025-12-02T10:00:00Z',
    updated_at: '2025-12-02T10:00:00Z',
  },
]

/**
 * Mock hooks
 */
vi.mock('@/lib/hooks/use-org-context', () => ({
  useOrgContext: () => ({
    data: {
      org_id: 'org-1',
      user_id: 'current-user-id',
      role_code: 'ADMIN',
    },
    isLoading: false,
  }),
}))

describe('UsersDataTable - Basic Rendering', () => {
  const mockOnPageChange = vi.fn()
  const mockOnSearch = vi.fn()
  const mockOnFilter = vi.fn()
  const mockOnEdit = vi.fn()
  const mockOnDeactivate = vi.fn()
  const mockOnActivate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  // AC-01: Table loads and displays users
  it('should render user list with correct columns', () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={2}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    // THEN displays column headers
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Last Login')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
  })

  it('should display user names correctly', () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={2}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    // THEN displays full names
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
  })

  // AC-05: Role name (not code) displays
  it('should display role name not role code', () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={2}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    // THEN displays role names (getAllByText because role name appears in both table and filter dropdown)
    expect(screen.getAllByText('Administrator').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Production Operator').length).toBeGreaterThan(0)
    // THEN does not display role codes in table cells (codes only in dropdown values)
    const tableCells = screen.getAllByRole('cell')
    const tableCellText = tableCells.map(cell => cell.textContent).join(' ')
    expect(tableCellText).not.toContain('admin')
    expect(tableCellText).not.toContain('production_operator')
  })

  it('should display email addresses', () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={2}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    expect(screen.getByText('john.doe@company.com')).toBeInTheDocument()
    expect(screen.getByText('jane.smith@company.com')).toBeInTheDocument()
  })

  it('should display status badges', () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={2}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    // THEN displays active/inactive status
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Inactive')).toBeInTheDocument()
  })
})

// AC-02: Search filters within 300ms
describe('UsersDataTable - Search Functionality', () => {
  const mockOnPageChange = vi.fn()
  const mockOnSearch = vi.fn()
  const mockOnFilter = vi.fn()
  const mockOnEdit = vi.fn()
  const mockOnDeactivate = vi.fn()
  const mockOnActivate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should render search input field', () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={2}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    const searchInput = screen.getByPlaceholderText(/search users/i)
    expect(searchInput).toBeInTheDocument()
  })

  it('should debounce search input (300ms)', async () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={2}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    const searchInput = screen.getByPlaceholderText(/search users/i)

    // WHEN typing in search (use fireEvent for fake timer compatibility)
    fireEvent.change(searchInput, { target: { value: 'john' } })

    // THEN callback not called immediately
    expect(mockOnSearch).not.toHaveBeenCalled()

    // WHEN waiting 300ms
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // THEN callback called once with search term
    expect(mockOnSearch).toHaveBeenCalledTimes(1)
    expect(mockOnSearch).toHaveBeenCalledWith('john')
  })

  it('should cancel previous search if typing continues', async () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={2}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    const searchInput = screen.getByPlaceholderText(/search users/i)

    // WHEN typing "jo"
    fireEvent.change(searchInput, { target: { value: 'jo' } })
    act(() => {
      vi.advanceTimersByTime(200)
    })

    // WHEN typing more before 300ms elapsed
    fireEvent.change(searchInput, { target: { value: 'john' } })
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // THEN only calls with final value
    expect(mockOnSearch).toHaveBeenCalledTimes(1)
    expect(mockOnSearch).toHaveBeenCalledWith('john')
  })

  it('should clear search when input is cleared', async () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={2}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    const searchInput = screen.getByPlaceholderText(/search users/i) as HTMLInputElement

    // WHEN typing and clearing
    fireEvent.change(searchInput, { target: { value: 'john' } })
    act(() => {
      vi.advanceTimersByTime(300)
    })

    fireEvent.change(searchInput, { target: { value: '' } })
    act(() => {
      vi.advanceTimersByTime(300)
    })

    // THEN calls with empty string
    expect(mockOnSearch).toHaveBeenLastCalledWith('')
  })
})

// AC-03: Filter by role
describe('UsersDataTable - Filter Functionality', () => {
  const mockOnPageChange = vi.fn()
  const mockOnSearch = vi.fn()
  const mockOnFilter = vi.fn()
  const mockOnEdit = vi.fn()
  const mockOnDeactivate = vi.fn()
  const mockOnActivate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render role filter dropdown', () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={2}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    expect(screen.getByLabelText(/filter by role/i)).toBeInTheDocument()
  })

  it('should render status filter dropdown', () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={2}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    expect(screen.getByLabelText(/filter by status/i)).toBeInTheDocument()
  })

  it('should call onFilter when role filter changes', async () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={2}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    const roleFilter = screen.getByLabelText(/filter by role/i)

    // WHEN selecting a role
    await userEvent.selectOptions(roleFilter, 'production_operator')

    // THEN calls onFilter with role
    expect(mockOnFilter).toHaveBeenCalledWith({
      role: 'production_operator',
    })
  })

  // AC-04: Filter by status
  it('should call onFilter when status filter changes', async () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={2}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    const statusFilter = screen.getByLabelText(/filter by status/i)

    // WHEN selecting inactive status
    await userEvent.selectOptions(statusFilter, 'inactive')

    // THEN calls onFilter with status
    expect(mockOnFilter).toHaveBeenCalledWith({
      status: 'inactive',
    })
  })

  it('should combine role and status filters', async () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={2}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    const roleFilter = screen.getByLabelText(/filter by role/i)
    const statusFilter = screen.getByLabelText(/filter by status/i)

    // WHEN applying both filters
    await userEvent.selectOptions(roleFilter, 'admin')
    await userEvent.selectOptions(statusFilter, 'active')

    // THEN calls onFilter with both
    expect(mockOnFilter).toHaveBeenLastCalledWith({
      role: 'admin',
      status: 'active',
    })
  })
})

// AC-05: Pagination (25 per page)
describe('UsersDataTable - Pagination', () => {
  const mockOnPageChange = vi.fn()
  const mockOnSearch = vi.fn()
  const mockOnFilter = vi.fn()
  const mockOnEdit = vi.fn()
  const mockOnDeactivate = vi.fn()
  const mockOnActivate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display pagination controls', () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={100}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    // THEN displays page info
    expect(screen.getByText(/page 1 of 4/i)).toBeInTheDocument()
  })

  it('should call onPageChange when next page clicked', async () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={100}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    const nextButton = screen.getByRole('button', { name: /next/i })

    // WHEN clicking next
    await userEvent.click(nextButton)

    // THEN calls onPageChange with page 2
    expect(mockOnPageChange).toHaveBeenCalledWith(2)
  })

  it('should disable previous button on first page', () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={100}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    const prevButton = screen.getByRole('button', { name: /previous/i })

    // THEN previous disabled
    expect(prevButton).toBeDisabled()
  })

  it('should disable next button on last page', () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={100}
        page={4}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    const nextButton = screen.getByRole('button', { name: /next/i })

    // THEN next disabled
    expect(nextButton).toBeDisabled()
  })
})

describe('UsersDataTable - Row Actions', () => {
  const mockOnPageChange = vi.fn()
  const mockOnSearch = vi.fn()
  const mockOnFilter = vi.fn()
  const mockOnEdit = vi.fn()
  const mockOnDeactivate = vi.fn()
  const mockOnActivate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render actions dropdown for each user', () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={2}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    // THEN displays action buttons
    const actionButtons = screen.getAllByRole('button', { name: /actions/i })
    expect(actionButtons).toHaveLength(2)
  })

  it('should call onEdit when Edit action clicked', async () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={2}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    // WHEN opening actions and clicking Edit
    const actionButton = screen.getAllByRole('button', { name: /actions/i })[0]
    await userEvent.click(actionButton)

    const editButton = screen.getByRole('menuitem', { name: /edit/i })
    await userEvent.click(editButton)

    // THEN calls onEdit with user
    expect(mockOnEdit).toHaveBeenCalledWith(mockUsers[0])
  })

  it('should show Deactivate for active users', async () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={2}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    // WHEN opening actions for active user
    const actionButton = screen.getAllByRole('button', { name: /actions/i })[0]
    await userEvent.click(actionButton)

    // THEN shows Deactivate
    expect(screen.getByRole('menuitem', { name: /deactivate/i })).toBeInTheDocument()
  })

  it('should show Activate for inactive users', async () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={2}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    // WHEN opening actions for inactive user
    const actionButton = screen.getAllByRole('button', { name: /actions/i })[1]
    await userEvent.click(actionButton)

    // THEN shows Activate
    expect(screen.getByRole('menuitem', { name: /activate/i })).toBeInTheDocument()
  })

  it('should call onDeactivate when Deactivate clicked', async () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={2}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    const actionButton = screen.getAllByRole('button', { name: /actions/i })[0]
    await userEvent.click(actionButton)

    const deactivateButton = screen.getByRole('menuitem', { name: /deactivate/i })
    await userEvent.click(deactivateButton)

    expect(mockOnDeactivate).toHaveBeenCalledWith(mockUsers[0])
  })
})

// AC-16: VIEWER sees read-only
describe('UsersDataTable - Permission-Based UI', () => {
  const mockOnPageChange = vi.fn()
  const mockOnSearch = vi.fn()
  const mockOnFilter = vi.fn()
  const mockOnEdit = vi.fn()
  const mockOnDeactivate = vi.fn()
  const mockOnActivate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should hide actions for VIEWER role', () => {
    // Mock VIEWER role
    vi.mock('@/lib/hooks/use-org-context', () => ({
      useOrgContext: () => ({
        data: {
          org_id: 'org-1',
          user_id: 'viewer-id',
          role_code: 'VIEWER',
        },
        isLoading: false,
      }),
    }))

    render(
      <UsersDataTable
        users={mockUsers}
        total={2}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
        readOnly={true}
      />
    )

    // THEN no action buttons displayed
    expect(screen.queryByRole('button', { name: /actions/i })).not.toBeInTheDocument()
  })

  it('should show actions for ADMIN role', () => {
    render(
      <UsersDataTable
        users={mockUsers}
        total={2}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
        readOnly={false}
      />
    )

    // THEN action buttons displayed
    expect(screen.getAllByRole('button', { name: /actions/i })).toHaveLength(2)
  })
})

describe('UsersDataTable - UI States', () => {
  const mockOnPageChange = vi.fn()
  const mockOnSearch = vi.fn()
  const mockOnFilter = vi.fn()
  const mockOnEdit = vi.fn()
  const mockOnDeactivate = vi.fn()
  const mockOnActivate = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should display loading skeleton when loading', () => {
    render(
      <UsersDataTable
        users={[]}
        total={0}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
        isLoading={true}
      />
    )

    // THEN displays skeleton rows
    expect(screen.getByTestId('skeleton-loader')).toBeInTheDocument()
  })

  it('should display empty state when no users', () => {
    render(
      <UsersDataTable
        users={[]}
        total={0}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
      />
    )

    // THEN displays empty message
    expect(screen.getByText(/no users found/i)).toBeInTheDocument()
  })

  it('should display error state when error occurs', () => {
    render(
      <UsersDataTable
        users={[]}
        total={0}
        page={1}
        limit={25}
        onPageChange={mockOnPageChange}
        onSearch={mockOnSearch}
        onFilter={mockOnFilter}
        onEdit={mockOnEdit}
        onDeactivate={mockOnDeactivate}
        onActivate={mockOnActivate}
        error="Failed to load users"
      />
    )

    // THEN displays error message
    expect(screen.getByText(/failed to load users/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
  })
})

/**
 * Test Summary for Story 01.5a - UsersDataTable Component
 * =========================================================
 *
 * Test Coverage by Feature:
 * - Basic rendering: 5 tests
 * - Search functionality: 4 tests
 * - Filter functionality: 5 tests
 * - Pagination: 4 tests
 * - Row actions: 5 tests
 * - Permission-based UI: 2 tests
 * - UI states: 3 tests
 * Total: 28 test cases
 *
 * Acceptance Criteria Coverage:
 * - AC-01: Table loads and displays: 5 tests
 * - AC-02: Search debouncing: 4 tests
 * - AC-03: Filter by role: 2 tests
 * - AC-04: Filter by status: 1 test
 * - AC-05: Role name display: 1 test
 * - AC-16: VIEWER read-only: 2 tests
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * - UsersDataTable component not implemented
 * - Component file doesn't exist
 *
 * Next Steps for FRONTEND-DEV:
 * 1. Create components/settings/users/UsersDataTable.tsx
 * 2. Implement ShadCN DataTable pattern with TanStack Table
 * 3. Add search input with 300ms debounce
 * 4. Add role and status filter dropdowns
 * 5. Add pagination controls (25 per page)
 * 6. Add row actions dropdown (Edit, Deactivate/Activate)
 * 7. Implement permission-based UI (readOnly prop)
 * 8. Implement loading, empty, error states
 * 9. Run tests - should transition from RED to GREEN
 *
 * Files to Create:
 * - apps/frontend/components/settings/users/UsersDataTable.tsx
 * - apps/frontend/components/settings/users/UserRow.tsx
 * - apps/frontend/components/settings/users/UserStatusBadge.tsx
 *
 * Coverage Target: 85%
 */
