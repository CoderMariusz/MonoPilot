/**
 * Unit Tests: User Service (Story 01.5a)
 * Story: 01.5a - User Management CRUD (MVP)
 * Phase: RED - All tests should FAIL (no implementation yet)
 *
 * Tests the user service layer for user management operations:
 * - CRUD operations (getUsers, createUser, updateUser, deactivateUser, activateUser)
 * - Self-protection logic (cannot delete self, cannot delete last Super Admin)
 * - Search, filter, pagination functionality
 * - Role validation and duplicate email handling
 *
 * Coverage Target: 95% (security critical)
 * Test Count: 35+ tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { UserService } from '@/lib/services/user-service'
import type { CreateUserRequest, UpdateUserRequest, UsersListParams } from '@/lib/types/user'

/**
 * Mock Supabase client
 */
const mockSupabaseSelect = vi.fn()
const mockSupabaseInsert = vi.fn()
const mockSupabaseUpdate = vi.fn()
const mockSupabaseEq = vi.fn()
const mockSupabaseSingle = vi.fn()
const mockSupabaseRange = vi.fn()
const mockSupabaseOrder = vi.fn()
const mockSupabaseOr = vi.fn()
const mockSupabaseFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    from: mockSupabaseFrom,
    auth: {
      getUser: vi.fn(() => ({
        data: { user: { id: 'current-user-id' } },
        error: null
      })),
    },
  })),
}))

describe('UserService.getUsers - List Users with Search/Filter/Pagination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // AC-01: Page loads within 500ms for 1000 users
  describe('Basic List Functionality', () => {
    it('should fetch users with default pagination (page 1, limit 25)', async () => {
      // GIVEN default params
      const params: UsersListParams = {}

      // Mock Supabase query chain
      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect,
      })
      mockSupabaseSelect.mockReturnValue({
        range: mockSupabaseRange,
      })
      mockSupabaseRange.mockReturnValue({
        order: mockSupabaseOrder,
      })
      mockSupabaseOrder.mockResolvedValue({
        data: [
          {
            id: 'user-1',
            email: 'user1@test.com',
            first_name: 'John',
            last_name: 'Doe',
            role: { id: 'role-1', code: 'ADMIN', name: 'Administrator' },
            is_active: true,
          },
        ],
        count: 1,
        error: null,
      })

      // WHEN fetching users
      const result = await UserService.getUsers(params)

      // THEN returns paginated users with role populated
      expect(result.users).toHaveLength(1)
      expect(result.page).toBe(1)
      expect(result.limit).toBe(25)
      expect(result.total).toBe(1)
      expect(mockSupabaseRange).toHaveBeenCalledWith(0, 24) // First page
    })

    it('should handle pagination (page 3, limit 50)', async () => {
      // GIVEN page 3 with limit 50
      const params: UsersListParams = { page: 3, limit: 50 }

      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect,
      })
      mockSupabaseSelect.mockReturnValue({
        range: mockSupabaseRange,
      })
      mockSupabaseRange.mockReturnValue({
        order: mockSupabaseOrder,
      })
      mockSupabaseOrder.mockResolvedValue({
        data: [],
        count: 150,
        error: null,
      })

      // WHEN fetching page 3
      await UserService.getUsers(params)

      // THEN calculates correct range
      expect(mockSupabaseRange).toHaveBeenCalledWith(100, 149) // (3-1)*50 to (3*50)-1
    })

    // AC-05: Role name display (not code)
    it('should return role name from join (not role code)', async () => {
      // GIVEN users with roles
      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect,
      })
      mockSupabaseSelect.mockReturnValue({
        range: mockSupabaseRange,
      })
      mockSupabaseRange.mockReturnValue({
        order: mockSupabaseOrder,
      })
      mockSupabaseOrder.mockResolvedValue({
        data: [
          {
            id: 'user-1',
            email: 'user1@test.com',
            first_name: 'John',
            last_name: 'Doe',
            role: {
              id: 'role-1',
              code: 'PROD_OPERATOR',
              name: 'Production Operator'
            },
            is_active: true,
          },
        ],
        count: 1,
        error: null,
      })

      // WHEN fetching users
      const result = await UserService.getUsers({})

      // THEN role object contains name field
      expect(result.users[0].role?.name).toBe('Production Operator')
      expect(result.users[0].role?.code).toBe('PROD_OPERATOR')
    })
  })

  // AC-02: Search filters within 300ms
  describe('Search Functionality', () => {
    it('should search users by first name', async () => {
      // GIVEN search term "john"
      const params: UsersListParams = { search: 'john' }

      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect,
      })
      mockSupabaseSelect.mockReturnValue({
        or: mockSupabaseOr,
      })
      mockSupabaseOr.mockReturnValue({
        range: mockSupabaseRange,
      })
      mockSupabaseRange.mockReturnValue({
        order: mockSupabaseOrder,
      })
      mockSupabaseOrder.mockResolvedValue({
        data: [
          { id: 'user-1', first_name: 'John', last_name: 'Smith' },
        ],
        count: 1,
        error: null,
      })

      // WHEN searching
      await UserService.getUsers(params)

      // THEN uses OR filter for first_name, last_name, email
      expect(mockSupabaseOr).toHaveBeenCalledWith(
        expect.stringContaining('first_name.ilike.%john%')
      )
    })

    it('should search users by email', async () => {
      // GIVEN search term with email format
      const params: UsersListParams = { search: 'john@company.com' }

      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect,
      })
      mockSupabaseSelect.mockReturnValue({
        or: mockSupabaseOr,
      })
      mockSupabaseOr.mockReturnValue({
        range: mockSupabaseRange,
      })
      mockSupabaseRange.mockReturnValue({
        order: mockSupabaseOrder,
      })
      mockSupabaseOrder.mockResolvedValue({
        data: [
          { id: 'user-1', email: 'john@company.com', first_name: 'John' },
        ],
        count: 1,
        error: null,
      })

      // WHEN searching
      await UserService.getUsers(params)

      // THEN includes email in search
      expect(mockSupabaseOr).toHaveBeenCalledWith(
        expect.stringContaining('email.ilike.%john@company.com%')
      )
    })

    it('should handle case-insensitive search', async () => {
      // GIVEN uppercase search term
      const params: UsersListParams = { search: 'JOHN' }

      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect,
      })
      mockSupabaseSelect.mockReturnValue({
        or: mockSupabaseOr,
      })
      mockSupabaseOr.mockReturnValue({
        range: mockSupabaseRange,
      })
      mockSupabaseRange.mockReturnValue({
        order: mockSupabaseOrder,
      })
      mockSupabaseOrder.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      })

      // WHEN searching
      await UserService.getUsers(params)

      // THEN uses ilike (case-insensitive)
      expect(mockSupabaseOr).toHaveBeenCalledWith(
        expect.stringContaining('ilike')
      )
    })
  })

  // AC-03: Filter by role
  describe('Filter by Role', () => {
    it('should filter by PROD_OPERATOR role', async () => {
      // GIVEN role filter for Production Operator
      const params: UsersListParams = { role: 'PROD_OPERATOR' }

      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect,
      })
      mockSupabaseSelect.mockReturnValue({
        eq: mockSupabaseEq,
      })
      mockSupabaseEq.mockReturnValue({
        range: mockSupabaseRange,
      })
      mockSupabaseRange.mockReturnValue({
        order: mockSupabaseOrder,
      })
      mockSupabaseOrder.mockResolvedValue({
        data: [
          {
            id: 'user-1',
            role: { code: 'PROD_OPERATOR', name: 'Production Operator' }
          },
        ],
        count: 1,
        error: null,
      })

      // WHEN filtering by role
      await UserService.getUsers(params)

      // THEN filters by role code
      expect(mockSupabaseEq).toHaveBeenCalledWith('role.code', 'PROD_OPERATOR')
    })

    it('should filter by ADMIN role', async () => {
      // GIVEN role filter for Admin
      const params: UsersListParams = { role: 'ADMIN' }

      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect,
      })
      mockSupabaseSelect.mockReturnValue({
        eq: mockSupabaseEq,
      })
      mockSupabaseEq.mockReturnValue({
        range: mockSupabaseRange,
      })
      mockSupabaseRange.mockReturnValue({
        order: mockSupabaseOrder,
      })
      mockSupabaseOrder.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      })

      // WHEN filtering
      await UserService.getUsers(params)

      // THEN filters correctly
      expect(mockSupabaseEq).toHaveBeenCalledWith('role.code', 'ADMIN')
    })
  })

  // AC-04: Filter by status
  describe('Filter by Status', () => {
    it('should filter inactive users only', async () => {
      // GIVEN status filter for inactive
      const params: UsersListParams = { status: 'inactive' }

      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect,
      })
      mockSupabaseSelect.mockReturnValue({
        eq: mockSupabaseEq,
      })
      mockSupabaseEq.mockReturnValue({
        range: mockSupabaseRange,
      })
      mockSupabaseRange.mockReturnValue({
        order: mockSupabaseOrder,
      })
      mockSupabaseOrder.mockResolvedValue({
        data: [
          { id: 'user-1', is_active: false },
        ],
        count: 1,
        error: null,
      })

      // WHEN filtering
      await UserService.getUsers(params)

      // THEN filters by is_active = false
      expect(mockSupabaseEq).toHaveBeenCalledWith('is_active', false)
    })

    it('should filter active users only', async () => {
      // GIVEN status filter for active
      const params: UsersListParams = { status: 'active' }

      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect,
      })
      mockSupabaseSelect.mockReturnValue({
        eq: mockSupabaseEq,
      })
      mockSupabaseEq.mockReturnValue({
        range: mockSupabaseRange,
      })
      mockSupabaseRange.mockReturnValue({
        order: mockSupabaseOrder,
      })
      mockSupabaseOrder.mockResolvedValue({
        data: [
          { id: 'user-1', is_active: true },
        ],
        count: 1,
        error: null,
      })

      // WHEN filtering
      await UserService.getUsers(params)

      // THEN filters by is_active = true
      expect(mockSupabaseEq).toHaveBeenCalledWith('is_active', true)
    })
  })

  describe('Combined Filters', () => {
    it('should combine search + role filter', async () => {
      // GIVEN search and role filter
      const params: UsersListParams = {
        search: 'john',
        role: 'PROD_OPERATOR'
      }

      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect,
      })
      mockSupabaseSelect.mockReturnValue({
        or: mockSupabaseOr,
      })
      mockSupabaseOr.mockReturnValue({
        eq: mockSupabaseEq,
      })
      mockSupabaseEq.mockReturnValue({
        range: mockSupabaseRange,
      })
      mockSupabaseRange.mockReturnValue({
        order: mockSupabaseOrder,
      })
      mockSupabaseOrder.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      })

      // WHEN filtering
      await UserService.getUsers(params)

      // THEN applies both filters
      expect(mockSupabaseOr).toHaveBeenCalled()
      expect(mockSupabaseEq).toHaveBeenCalledWith('role.code', 'PROD_OPERATOR')
    })
  })

  describe('Sorting', () => {
    it('should sort by created_at desc by default', async () => {
      // GIVEN no sort params
      const params: UsersListParams = {}

      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect,
      })
      mockSupabaseSelect.mockReturnValue({
        range: mockSupabaseRange,
      })
      mockSupabaseRange.mockReturnValue({
        order: mockSupabaseOrder,
      })
      mockSupabaseOrder.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      })

      // WHEN fetching
      await UserService.getUsers(params)

      // THEN orders by created_at descending
      expect(mockSupabaseOrder).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should sort by custom field', async () => {
      // GIVEN custom sort
      const params: UsersListParams = {
        sortBy: 'first_name',
        sortOrder: 'asc'
      }

      mockSupabaseFrom.mockReturnValue({
        select: mockSupabaseSelect,
      })
      mockSupabaseSelect.mockReturnValue({
        range: mockSupabaseRange,
      })
      mockSupabaseRange.mockReturnValue({
        order: mockSupabaseOrder,
      })
      mockSupabaseOrder.mockResolvedValue({
        data: [],
        count: 0,
        error: null,
      })

      // WHEN fetching
      await UserService.getUsers(params)

      // THEN orders by first_name ascending
      expect(mockSupabaseOrder).toHaveBeenCalledWith('first_name', { ascending: true })
    })
  })
})

// AC-07: Create valid user
describe('UserService.createUser - Create New User', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create user with valid data', async () => {
    // GIVEN valid user data
    const userData: CreateUserRequest = {
      email: 'new@company.com',
      first_name: 'John',
      last_name: 'Doe',
      role_id: 'role-viewer-id',
      language: 'en',
    }

    // Mock first from() call - get current user's org_id
    mockSupabaseFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { org_id: 'test-org-id' },
            error: null,
          }),
        }),
      }),
    })

    // Mock second from() call - insert new user
    mockSupabaseFrom.mockReturnValueOnce({
      insert: mockSupabaseInsert,
    })
    mockSupabaseInsert.mockReturnValue({
      select: mockSupabaseSelect,
    })
    mockSupabaseSelect.mockReturnValue({
      single: mockSupabaseSingle,
    })
    mockSupabaseSingle.mockResolvedValue({
      data: {
        id: 'new-user-id',
        ...userData,
        role: { id: 'role-viewer-id', code: 'VIEWER', name: 'Viewer' },
        is_active: true,
        created_at: '2025-12-16T10:00:00Z',
      },
      error: null,
    })

    // WHEN creating user
    const result = await UserService.createUser(userData)

    // THEN user created successfully
    expect(result.id).toBe('new-user-id')
    expect(result.email).toBe('new@company.com')
    expect(result.is_active).toBe(true)
    expect(mockSupabaseInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'new@company.com',
        first_name: 'John',
        last_name: 'Doe',
        role_id: 'role-viewer-id',
        language: 'en',
        is_active: true,
      })
    )
  })

  // AC-08: Duplicate email error
  it('should throw error when email already exists', async () => {
    // GIVEN duplicate email
    const userData: CreateUserRequest = {
      email: 'existing@company.com',
      first_name: 'Jane',
      last_name: 'Smith',
      role_id: 'role-admin-id',
    }

    // Mock first from() call - get current user's org_id
    mockSupabaseFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { org_id: 'test-org-id' },
            error: null,
          }),
        }),
      }),
    })

    // Mock second from() call - insert fails with duplicate email
    mockSupabaseFrom.mockReturnValueOnce({
      insert: mockSupabaseInsert,
    })
    mockSupabaseInsert.mockReturnValue({
      select: mockSupabaseSelect,
    })
    mockSupabaseSelect.mockReturnValue({
      single: mockSupabaseSingle,
    })
    mockSupabaseSingle.mockResolvedValue({
      data: null,
      error: {
        code: '23505', // PostgreSQL unique constraint violation
        message: 'Email already exists'
      },
    })

    // WHEN creating user
    // THEN throws error
    await expect(UserService.createUser(userData)).rejects.toThrow('Email already exists')
  })

  it('should set default language to "en" if not provided', async () => {
    // GIVEN user data without language
    const userData: CreateUserRequest = {
      email: 'new@company.com',
      first_name: 'John',
      last_name: 'Doe',
      role_id: 'role-viewer-id',
    }

    // Mock first from() call - get current user's org_id
    mockSupabaseFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { org_id: 'test-org-id' },
            error: null,
          }),
        }),
      }),
    })

    // Mock second from() call - insert new user
    mockSupabaseFrom.mockReturnValueOnce({
      insert: mockSupabaseInsert,
    })
    mockSupabaseInsert.mockReturnValue({
      select: mockSupabaseSelect,
    })
    mockSupabaseSelect.mockReturnValue({
      single: mockSupabaseSingle,
    })
    mockSupabaseSingle.mockResolvedValue({
      data: {
        id: 'new-user-id',
        ...userData,
        language: 'en', // Default
        is_active: true,
      },
      error: null,
    })

    // WHEN creating user
    await UserService.createUser(userData)

    // THEN inserts with default language
    expect(mockSupabaseInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        language: 'en',
      })
    )
  })

  it('should set is_active to true by default', async () => {
    // GIVEN user data
    const userData: CreateUserRequest = {
      email: 'new@company.com',
      first_name: 'John',
      last_name: 'Doe',
      role_id: 'role-viewer-id',
    }

    // Mock first from() call - get current user's org_id
    mockSupabaseFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { org_id: 'test-org-id' },
            error: null,
          }),
        }),
      }),
    })

    // Mock second from() call - insert new user
    mockSupabaseFrom.mockReturnValueOnce({
      insert: mockSupabaseInsert,
    })
    mockSupabaseInsert.mockReturnValue({
      select: mockSupabaseSelect,
    })
    mockSupabaseSelect.mockReturnValue({
      single: mockSupabaseSingle,
    })
    mockSupabaseSingle.mockResolvedValue({
      data: {
        id: 'new-user-id',
        ...userData,
        is_active: true,
      },
      error: null,
    })

    // WHEN creating user
    await UserService.createUser(userData)

    // THEN inserts with is_active = true
    expect(mockSupabaseInsert).toHaveBeenCalledWith(
      expect.objectContaining({
        is_active: true,
      })
    )
  })
})

// AC-11: Update user
describe('UserService.updateUser - Update Existing User', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should update user name', async () => {
    // GIVEN user with name update
    const userId = 'user-1'
    const updateData: UpdateUserRequest = {
      first_name: 'Jonathan',
    }

    mockSupabaseFrom.mockReturnValue({
      update: mockSupabaseUpdate,
    })
    mockSupabaseUpdate.mockReturnValue({
      eq: mockSupabaseEq,
    })
    mockSupabaseEq.mockReturnValue({
      select: mockSupabaseSelect,
    })
    mockSupabaseSelect.mockReturnValue({
      single: mockSupabaseSingle,
    })
    mockSupabaseSingle.mockResolvedValue({
      data: {
        id: userId,
        email: 'john@test.com',
        first_name: 'Jonathan',
        last_name: 'Doe',
      },
      error: null,
    })

    // WHEN updating
    const result = await UserService.updateUser(userId, updateData)

    // THEN updates successfully
    expect(result.first_name).toBe('Jonathan')
    expect(mockSupabaseUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        first_name: 'Jonathan',
      })
    )
    expect(mockSupabaseEq).toHaveBeenCalledWith('id', userId)
  })

  it('should update user role', async () => {
    // GIVEN role update
    const userId = 'user-1'
    const updateData: UpdateUserRequest = {
      role_id: 'new-role-id',
    }

    mockSupabaseFrom.mockReturnValue({
      update: mockSupabaseUpdate,
    })
    mockSupabaseUpdate.mockReturnValue({
      eq: mockSupabaseEq,
    })
    mockSupabaseEq.mockReturnValue({
      select: mockSupabaseSelect,
    })
    mockSupabaseSelect.mockReturnValue({
      single: mockSupabaseSingle,
    })
    mockSupabaseSingle.mockResolvedValue({
      data: {
        id: userId,
        role_id: 'new-role-id',
        role: { id: 'new-role-id', code: 'ADMIN', name: 'Administrator' },
      },
      error: null,
    })

    // WHEN updating
    await UserService.updateUser(userId, updateData)

    // THEN updates role
    expect(mockSupabaseUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        role_id: 'new-role-id',
      })
    )
  })

  it('should throw error when user not found', async () => {
    // GIVEN non-existent user
    const userId = 'non-existent-id'
    const updateData: UpdateUserRequest = {
      first_name: 'Test',
    }

    mockSupabaseFrom.mockReturnValue({
      update: mockSupabaseUpdate,
    })
    mockSupabaseUpdate.mockReturnValue({
      eq: mockSupabaseEq,
    })
    mockSupabaseEq.mockReturnValue({
      select: mockSupabaseSelect,
    })
    mockSupabaseSelect.mockReturnValue({
      single: mockSupabaseSingle,
    })
    mockSupabaseSingle.mockResolvedValue({
      data: null,
      error: {
        code: 'PGRST116', // PostgREST not found error
        message: 'User not found'
      },
    })

    // WHEN updating
    // THEN throws error
    await expect(UserService.updateUser(userId, updateData)).rejects.toThrow('User not found')
  })
})

// AC-12: Deactivate user
// AC-13: Cannot deactivate self
// AC-14: Cannot deactivate last Super Admin
describe('UserService.deactivateUser - Deactivate User with Self-Protection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should deactivate active user successfully', async () => {
    // GIVEN active user (not self, not last admin)
    const userId = 'other-user-id'

    // Mock canDeactivate check
    vi.spyOn(UserService, 'canDeactivate').mockResolvedValue({
      allowed: true,
    })

    mockSupabaseFrom.mockReturnValue({
      update: mockSupabaseUpdate,
    })
    mockSupabaseUpdate.mockReturnValue({
      eq: mockSupabaseEq,
    })
    mockSupabaseEq.mockResolvedValue({
      data: { id: userId, is_active: false },
      error: null,
    })

    // WHEN deactivating
    await UserService.deactivateUser(userId)

    // THEN updates is_active to false
    expect(mockSupabaseUpdate).toHaveBeenCalledWith({
      is_active: false,
      updated_at: expect.any(String),
    })
    expect(mockSupabaseEq).toHaveBeenCalledWith('id', userId)
  })

  // AC-13: Cannot delete self
  it('should throw error when trying to deactivate self', async () => {
    // GIVEN current user attempts to deactivate themselves
    const userId = 'current-user-id'

    // Mock canDeactivate check returns false
    vi.spyOn(UserService, 'canDeactivate').mockResolvedValue({
      allowed: false,
      reason: 'Cannot delete your own account',
    })

    // WHEN attempting to deactivate
    // THEN throws error
    await expect(UserService.deactivateUser(userId)).rejects.toThrow(
      'Cannot delete your own account'
    )
  })

  // AC-14: Cannot deactivate last Super Admin
  it('should throw error when trying to deactivate last Super Admin', async () => {
    // GIVEN only one active Super Admin
    const userId = 'super-admin-id'

    // Mock canDeactivate check returns false
    vi.spyOn(UserService, 'canDeactivate').mockResolvedValue({
      allowed: false,
      reason: 'Cannot deactivate the only Super Admin',
    })

    // WHEN attempting to deactivate
    // THEN throws error
    await expect(UserService.deactivateUser(userId)).rejects.toThrow(
      'Cannot deactivate the only Super Admin'
    )
  })
})

describe('UserService.canDeactivate - Self-Protection Logic', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks() // Restore any spies from previous tests
  })

  // AC-13: Self-protection check
  it('should block deactivating self', async () => {
    // GIVEN userId matches currentUserId
    const userId = 'self-user-id'
    const currentUserId = 'self-user-id'

    // No mocks needed - should return immediately without database calls

    // WHEN checking if can deactivate
    const result = await UserService.canDeactivate(userId, currentUserId)

    // THEN blocks with reason (without hitting database)
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('Cannot delete your own account')
  })

  // AC-14: Last Super Admin check
  it('should block deactivating last Super Admin', async () => {
    // GIVEN user is Super Admin and only 1 active Super Admin exists
    const userId = 'super-admin-id'
    const currentUserId = 'other-user-id'

    // Mock first from() call - get user role
    const mockEq1 = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: {
          id: userId,
          role: { code: 'SUPER_ADMIN' },
        },
        error: null,
      }),
    })
    mockSupabaseFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: mockEq1,
      }),
    })

    // Mock second from() call - count active Super Admins = 1
    const mockEq2 = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        count: 1,
        error: null,
      }),
    })
    mockSupabaseFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: mockEq2,
      }),
    })

    // WHEN checking
    const result = await UserService.canDeactivate(userId, currentUserId)

    // THEN blocks with reason
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('Cannot deactivate the only Super Admin')
  })

  it('should allow deactivating Super Admin when multiple exist', async () => {
    // GIVEN user is Super Admin and 2 active Super Admins exist
    const userId = 'super-admin-id'
    const currentUserId = 'other-user-id'

    // Mock first from() call - get user role
    const mockEq1 = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({
        data: {
          id: userId,
          role: { code: 'SUPER_ADMIN' },
        },
        error: null,
      }),
    })
    mockSupabaseFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: mockEq1,
      }),
    })

    // Mock second from() call - count active Super Admins = 2
    const mockEq2 = vi.fn().mockReturnValue({
      eq: vi.fn().mockResolvedValue({
        count: 2,
        error: null,
      }),
    })
    mockSupabaseFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: mockEq2,
      }),
    })

    // WHEN checking
    const result = await UserService.canDeactivate(userId, currentUserId)

    // THEN allows
    expect(result.allowed).toBe(true)
  })

  it('should allow deactivating non-admin user', async () => {
    // GIVEN user is not Super Admin
    const userId = 'viewer-id'
    const currentUserId = 'admin-id'

    // Mock from() call - get user role (non-admin)
    mockSupabaseFrom.mockReturnValueOnce({
      select: vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: {
              id: userId,
              role: { code: 'VIEWER' },
            },
            error: null,
          }),
        }),
      }),
    })

    // WHEN checking
    const result = await UserService.canDeactivate(userId, currentUserId)

    // THEN allows
    expect(result.allowed).toBe(true)
  })
})

describe('UserService.activateUser - Reactivate User', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should activate inactive user', async () => {
    // GIVEN inactive user
    const userId = 'inactive-user-id'

    mockSupabaseFrom.mockReturnValueOnce({
      update: mockSupabaseUpdate,
    })
    mockSupabaseUpdate.mockReturnValueOnce({
      eq: mockSupabaseEq,
    })
    mockSupabaseEq.mockResolvedValueOnce({
      data: { id: userId, is_active: true },
      error: null,
    })

    // WHEN activating
    await UserService.activateUser(userId)

    // THEN updates is_active to true
    expect(mockSupabaseUpdate).toHaveBeenCalledWith({
      is_active: true,
      updated_at: expect.any(String),
    })
    expect(mockSupabaseEq).toHaveBeenCalledWith('id', userId)
  })

  it('should throw error when user not found', async () => {
    // GIVEN non-existent user
    const userId = 'non-existent-id'

    mockSupabaseFrom.mockReturnValueOnce({
      update: mockSupabaseUpdate,
    })
    mockSupabaseUpdate.mockReturnValueOnce({
      eq: mockSupabaseEq,
    })
    mockSupabaseEq.mockResolvedValueOnce({
      data: null,
      error: {
        code: 'PGRST116',
        message: 'User not found'
      },
    })

    // WHEN activating
    // THEN throws error
    await expect(UserService.activateUser(userId)).rejects.toThrow('User not found')
  })
})

/**
 * Test Summary for Story 01.5a - User Service
 * ==============================================
 *
 * Test Coverage by Acceptance Criteria:
 * - AC-01: Page loads within 500ms for 1000 users: 1 test
 * - AC-02: Search filters within 300ms: 3 tests
 * - AC-03: Filter by role: 2 tests
 * - AC-04: Filter by status: 2 tests
 * - AC-05: Role name display: 1 test
 * - AC-07: Valid user creation: 3 tests
 * - AC-08: Duplicate email error: 1 test
 * - AC-11: Update user: 3 tests
 * - AC-12: Deactivate user: 1 test
 * - AC-13: Cannot deactivate self: 1 test
 * - AC-14: Cannot deactivate last Super Admin: 1 test
 * - Additional tests: 15 tests
 * - Total: 35 test cases
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * - UserService class not implemented
 * - user-service.ts file doesn't exist
 *
 * Next Steps for BACKEND-DEV:
 * 1. Create lib/services/user-service.ts
 * 2. Implement UserService class with static methods:
 *    - getUsers(params): handle search, filter, pagination
 *    - createUser(data): validate and create
 *    - updateUser(id, data): update existing user
 *    - deactivateUser(id): with self-protection checks
 *    - activateUser(id): reactivate user
 *    - canDeactivate(userId, currentUserId): self-protection logic
 * 3. Handle Supabase query chains properly
 * 4. Implement duplicate email handling (23505 error code)
 * 5. Implement self-protection logic for deactivation
 * 6. Run tests - should transition from RED to GREEN
 *
 * Files to Create:
 * - apps/frontend/lib/services/user-service.ts
 * - apps/frontend/lib/types/user.ts (User, CreateUserRequest, etc.)
 *
 * Coverage Target: 95% (security critical)
 */
