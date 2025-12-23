/**
 * Unit Tests: usePermissions Hook (Story 01.6)
 * Story: 01.6 - Role-Based Permissions (10 Roles)
 * Phase: RED - All tests should FAIL (hook not implemented)
 *
 * Tests the usePermissions React hook for permission checks:
 * - can(module, action) returns correct boolean
 * - canAny(module) checks if user has any permission
 * - role returns user's role code
 * - Hook updates when user role changes
 *
 * Coverage Target: 90%
 * Test Count: ~20 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { usePermissions } from '@/lib/hooks/use-permissions'
import type { User, Role } from '@/lib/types/user'

/**
 * Mock Supabase client for auth
 */
const mockAuthGetUser = vi.fn()
const mockAuthOnAuthStateChange = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getUser: mockAuthGetUser,
      onAuthStateChange: mockAuthOnAuthStateChange,
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(() => Promise.resolve({
            data: null,
            error: null,
          })),
        })),
      })),
    })),
  })),
}))

/**
 * Helper: Create mock user with role
 */
function createMockUser(roleCode: string): User {
  const roleName = {
    owner: 'Owner',
    admin: 'Administrator',
    production_manager: 'Production Manager',
    quality_manager: 'Quality Manager',
    warehouse_manager: 'Warehouse Manager',
    production_operator: 'Production Operator',
    quality_inspector: 'Quality Inspector',
    warehouse_operator: 'Warehouse Operator',
    planner: 'Planner',
    viewer: 'Viewer',
  }[roleCode] || 'Unknown'

  const permissions: Record<string, string> = {
    owner: '{"settings":"CRUD","users":"CRUD","technical":"CRUD","planning":"CRUD","production":"CRUD","quality":"CRUD","warehouse":"CRUD","shipping":"CRUD","npd":"CRUD","finance":"CRUD","oee":"CRUD","integrations":"CRUD"}',
    admin: '{"settings":"CRU","users":"CRUD","technical":"CRUD","planning":"CRUD","production":"CRUD","quality":"CRUD","warehouse":"CRUD","shipping":"CRUD","npd":"CRUD","finance":"CRUD","oee":"CRUD","integrations":"CRUD"}',
    viewer: '{"settings":"R","users":"R","technical":"R","planning":"R","production":"R","quality":"R","warehouse":"R","shipping":"R","npd":"R","finance":"R","oee":"R","integrations":"R"}',
    production_operator: '{"settings":"-","users":"-","technical":"R","planning":"R","production":"RU","quality":"CR","warehouse":"R","shipping":"-","npd":"-","finance":"-","oee":"R","integrations":"-"}',
    quality_inspector: '{"settings":"-","users":"-","technical":"R","planning":"-","production":"R","quality":"CRU","warehouse":"R","shipping":"R","npd":"-","finance":"-","oee":"-","integrations":"-"}',
  }[roleCode] || '{}'

  const role: Role = {
    id: `role-${roleCode}-id`,
    code: roleCode,
    name: roleName,
    permissions: JSON.parse(permissions),
    is_system: true,
    created_at: '2025-12-19T00:00:00Z',
  }

  return {
    id: `user-${roleCode}`,
    org_id: 'test-org',
    email: `${roleCode}@test.com`,
    first_name: 'Test',
    last_name: 'User',
    role_id: role.id,
    role,
    language: 'en',
    is_active: true,
    created_at: '2025-12-19T00:00:00Z',
    updated_at: '2025-12-19T00:00:00Z',
  }
}

/**
 * Mock auth user in hook context
 */
function mockAuthUser(user: User | null) {
  mockAuthGetUser.mockResolvedValue({
    data: { user: user ? { id: user.id, email: user.email } : null },
    error: null,
  })
}

describe('usePermissions Hook - Basic Permission Checks', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // AC: can() function returns correct boolean
  it('should return can() function that checks permissions correctly for admin', () => {
    // GIVEN user with admin role
    const user = createMockUser('admin')
    mockAuthUser(user)

    // Mock user data fetch
    vi.mock('@/lib/hooks/use-user', () => ({
      useUser: () => ({ user, loading: false }),
    }))

    // WHEN using hook
    const { result } = renderHook(() => usePermissions())

    // THEN can() returns correct values
    expect(result.current.can('users', 'C')).toBe(true)
    expect(result.current.can('users', 'R')).toBe(true)
    expect(result.current.can('users', 'U')).toBe(true)
    expect(result.current.can('users', 'D')).toBe(true)
    expect(result.current.can('settings', 'D')).toBe(false) // Admin has CRU not D on settings
  })

  it('should return can() function that denies create actions for viewer', () => {
    // GIVEN user with viewer role
    const user = createMockUser('viewer')
    mockAuthUser(user)

    vi.mock('@/lib/hooks/use-user', () => ({
      useUser: () => ({ user, loading: false }),
    }))

    // WHEN using hook
    const { result } = renderHook(() => usePermissions())

    // THEN can() returns false for all create/update/delete
    expect(result.current.can('production', 'C')).toBe(false)
    expect(result.current.can('production', 'U')).toBe(false)
    expect(result.current.can('production', 'D')).toBe(false)
    expect(result.current.can('quality', 'C')).toBe(false)
    expect(result.current.can('warehouse', 'U')).toBe(false)
  })

  it('should return true for viewer read permissions on all modules', () => {
    // GIVEN user with viewer role
    const user = createMockUser('viewer')
    mockAuthUser(user)

    vi.mock('@/lib/hooks/use-user', () => ({
      useUser: () => ({ user, loading: false }),
    }))

    // WHEN using hook
    const { result } = renderHook(() => usePermissions())

    // THEN can() returns true for all reads
    const modules = ['settings', 'users', 'technical', 'planning', 'production', 'quality', 'warehouse', 'shipping']
    modules.forEach(module => {
      expect(result.current.can(module, 'R')).toBe(true)
    })
  })

  it('should return correct permissions for production_operator', () => {
    // GIVEN user with production_operator role
    const user = createMockUser('production_operator')
    mockAuthUser(user)

    vi.mock('@/lib/hooks/use-user', () => ({
      useUser: () => ({ user, loading: false }),
    }))

    // WHEN using hook
    const { result } = renderHook(() => usePermissions())

    // THEN can() returns correct values based on matrix
    // Production: RU
    expect(result.current.can('production', 'R')).toBe(true)
    expect(result.current.can('production', 'U')).toBe(true)
    expect(result.current.can('production', 'C')).toBe(false)
    expect(result.current.can('production', 'D')).toBe(false)

    // Quality: CR
    expect(result.current.can('quality', 'C')).toBe(true)
    expect(result.current.can('quality', 'R')).toBe(true)
    expect(result.current.can('quality', 'U')).toBe(false)
    expect(result.current.can('quality', 'D')).toBe(false)

    // Settings: no access
    expect(result.current.can('settings', 'R')).toBe(false)
  })

  it('should return correct permissions for quality_inspector', () => {
    // GIVEN user with quality_inspector role
    const user = createMockUser('quality_inspector')
    mockAuthUser(user)

    vi.mock('@/lib/hooks/use-user', () => ({
      useUser: () => ({ user, loading: false }),
    }))

    // WHEN using hook
    const { result } = renderHook(() => usePermissions())

    // THEN can() returns correct values
    // Quality: CRU
    expect(result.current.can('quality', 'C')).toBe(true)
    expect(result.current.can('quality', 'R')).toBe(true)
    expect(result.current.can('quality', 'U')).toBe(true)
    expect(result.current.can('quality', 'D')).toBe(false)

    // Warehouse: R only
    expect(result.current.can('warehouse', 'R')).toBe(true)
    expect(result.current.can('warehouse', 'C')).toBe(false)

    // Settings: no access
    expect(result.current.can('settings', 'R')).toBe(false)
  })

  it('should return false when user is not loaded', () => {
    // GIVEN no user loaded
    mockAuthUser(null)

    vi.mock('@/lib/hooks/use-user', () => ({
      useUser: () => ({ user: null, loading: false }),
    }))

    // WHEN using hook
    const { result } = renderHook(() => usePermissions())

    // THEN can() returns false for all permissions
    expect(result.current.can('production', 'R')).toBe(false)
    expect(result.current.can('production', 'C')).toBe(false)
  })

  it('should return false for invalid module', () => {
    // GIVEN user with admin role
    const user = createMockUser('admin')
    mockAuthUser(user)

    vi.mock('@/lib/hooks/use-user', () => ({
      useUser: () => ({ user, loading: false }),
    }))

    // WHEN checking invalid module
    const { result } = renderHook(() => usePermissions())

    // THEN returns false
    expect(result.current.can('invalid_module', 'R')).toBe(false)
  })

  it('should return false for invalid action', () => {
    // GIVEN user with admin role
    const user = createMockUser('admin')
    mockAuthUser(user)

    vi.mock('@/lib/hooks/use-user', () => ({
      useUser: () => ({ user, loading: false }),
    }))

    // WHEN checking invalid action
    const { result } = renderHook(() => usePermissions())

    // THEN returns false
    expect(result.current.can('production', 'X' as any)).toBe(false)
  })
})

describe('usePermissions Hook - canAny() Helper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // AC: canAny() returns true if user has any permission on module
  it('should return true when quality_inspector has any access to quality module', () => {
    // GIVEN user with quality_inspector role
    const user = createMockUser('quality_inspector')
    mockAuthUser(user)

    vi.mock('@/lib/hooks/use-user', () => ({
      useUser: () => ({ user, loading: false }),
    }))

    // WHEN checking canAny for quality
    const { result } = renderHook(() => usePermissions())

    // THEN returns true (has CRU)
    expect(result.current.canAny('quality')).toBe(true)
  })

  it('should return false when quality_inspector has no access to settings', () => {
    // GIVEN user with quality_inspector role
    const user = createMockUser('quality_inspector')
    mockAuthUser(user)

    vi.mock('@/lib/hooks/use-user', () => ({
      useUser: () => ({ user, loading: false }),
    }))

    // WHEN checking canAny for settings
    const { result } = renderHook(() => usePermissions())

    // THEN returns false (no access)
    expect(result.current.canAny('settings')).toBe(false)
  })

  it('should return true when production_operator has read-only access to warehouse', () => {
    // GIVEN user with production_operator role
    const user = createMockUser('production_operator')
    mockAuthUser(user)

    vi.mock('@/lib/hooks/use-user', () => ({
      useUser: () => ({ user, loading: false }),
    }))

    // WHEN checking canAny for warehouse
    const { result } = renderHook(() => usePermissions())

    // THEN returns true (has R access)
    expect(result.current.canAny('warehouse')).toBe(true)
  })

  it('should return true for viewer on any module (has read access)', () => {
    // GIVEN user with viewer role
    const user = createMockUser('viewer')
    mockAuthUser(user)

    vi.mock('@/lib/hooks/use-user', () => ({
      useUser: () => ({ user, loading: false }),
    }))

    // WHEN checking canAny
    const { result } = renderHook(() => usePermissions())

    // THEN returns true for all modules
    expect(result.current.canAny('production')).toBe(true)
    expect(result.current.canAny('quality')).toBe(true)
    expect(result.current.canAny('warehouse')).toBe(true)
  })

  it('should return false when user has no access to module', () => {
    // GIVEN user with production_operator role (no access to settings)
    const user = createMockUser('production_operator')
    mockAuthUser(user)

    vi.mock('@/lib/hooks/use-user', () => ({
      useUser: () => ({ user, loading: false }),
    }))

    // WHEN checking canAny for settings
    const { result } = renderHook(() => usePermissions())

    // THEN returns false
    expect(result.current.canAny('settings')).toBe(false)
  })
})

describe('usePermissions Hook - Role Property', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // AC: role returns user's role code
  it('should return current user role code for planner', () => {
    // GIVEN user with planner role
    const user = createMockUser('planner')
    mockAuthUser(user)

    vi.mock('@/lib/hooks/use-user', () => ({
      useUser: () => ({ user, loading: false }),
    }))

    // WHEN using hook
    const { result } = renderHook(() => usePermissions())

    // THEN role property returns code
    expect(result.current.role).toBe('planner')
  })

  it('should return owner role code', () => {
    // GIVEN user with owner role
    const user = createMockUser('owner')
    mockAuthUser(user)

    vi.mock('@/lib/hooks/use-user', () => ({
      useUser: () => ({ user, loading: false }),
    }))

    // WHEN using hook
    const { result } = renderHook(() => usePermissions())

    // THEN role property returns owner
    expect(result.current.role).toBe('owner')
  })

  it('should return null when user not loaded', () => {
    // GIVEN no user
    mockAuthUser(null)

    vi.mock('@/lib/hooks/use-user', () => ({
      useUser: () => ({ user: null, loading: false }),
    }))

    // WHEN using hook
    const { result } = renderHook(() => usePermissions())

    // THEN role is null
    expect(result.current.role).toBe(null)
  })
})

describe('usePermissions Hook - Role Change Updates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // AC: Hook updates when user role changes
  it('should update permissions when user role changes from viewer to admin', async () => {
    // GIVEN user starts as viewer
    const viewerUser = createMockUser('viewer')
    mockAuthUser(viewerUser)

    const mockUseUser = vi.fn(() => ({ user: viewerUser, loading: false }))
    vi.mock('@/lib/hooks/use-user', () => ({
      useUser: mockUseUser,
    }))

    // WHEN rendering hook
    const { result, rerender } = renderHook(() => usePermissions())

    // THEN initially has viewer permissions
    expect(result.current.can('production', 'C')).toBe(false)
    expect(result.current.role).toBe('viewer')

    // WHEN user role changes to admin
    const adminUser = createMockUser('admin')
    mockAuthUser(adminUser)
    mockUseUser.mockReturnValue({ user: adminUser, loading: false })
    rerender()

    // THEN permissions update
    await waitFor(() => {
      expect(result.current.can('production', 'C')).toBe(true)
      expect(result.current.role).toBe('admin')
    })
  })

  it('should update permissions when user role changes from production_operator to production_manager', async () => {
    // GIVEN user starts as production_operator
    const operatorUser = createMockUser('production_operator')
    mockAuthUser(operatorUser)

    const mockUseUser = vi.fn(() => ({ user: operatorUser, loading: false }))
    vi.mock('@/lib/hooks/use-user', () => ({
      useUser: mockUseUser,
    }))

    // WHEN rendering hook
    const { result, rerender } = renderHook(() => usePermissions())

    // THEN initially has operator permissions (no delete on production)
    expect(result.current.can('production', 'D')).toBe(false)

    // WHEN user role changes to production_manager
    const managerUser = createMockUser('production_manager')
    managerUser.role!.permissions = {
      production: 'CRUD',
      // ... other permissions
    }
    mockAuthUser(managerUser)
    mockUseUser.mockReturnValue({ user: managerUser, loading: false })
    rerender()

    // THEN permissions update (now has delete)
    await waitFor(() => {
      expect(result.current.can('production', 'D')).toBe(true)
    })
  })
})

describe('usePermissions Hook - Loading State', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return loading true while user is loading', () => {
    // GIVEN user is loading
    mockAuthUser(null)

    vi.mock('@/lib/hooks/use-user', () => ({
      useUser: () => ({ user: null, loading: true }),
    }))

    // WHEN using hook
    const { result } = renderHook(() => usePermissions())

    // THEN loading is true
    expect(result.current.loading).toBe(true)
  })

  it('should return loading false when user loaded', () => {
    // GIVEN user loaded
    const user = createMockUser('admin')
    mockAuthUser(user)

    vi.mock('@/lib/hooks/use-user', () => ({
      useUser: () => ({ user, loading: false }),
    }))

    // WHEN using hook
    const { result } = renderHook(() => usePermissions())

    // THEN loading is false
    expect(result.current.loading).toBe(false)
  })
})

/**
 * Test Summary for Story 01.6 - usePermissions Hook
 * ===================================================
 *
 * Test Coverage:
 * - can() function: 9 tests (admin, viewer, production_operator, quality_inspector, edge cases)
 * - canAny() helper: 5 tests (various roles and access levels)
 * - role property: 3 tests (returns role code, null when not loaded)
 * - Role change updates: 2 tests (viewer→admin, operator→manager)
 * - Loading state: 2 tests
 *
 * Total: 21 test cases
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * - usePermissions hook not implemented
 * - lib/hooks/use-permissions.ts doesn't exist
 *
 * Next Steps for FRONTEND-DEV:
 * 1. Create lib/hooks/use-permissions.ts
 * 2. Implement hook that:
 *    - Uses useUser() to get current user
 *    - Returns can(module, action) function
 *    - Returns canAny(module) helper
 *    - Returns role code
 *    - Returns loading state
 * 3. Use hasPermission from permission-service
 * 4. Handle role changes (re-compute when user.role changes)
 * 5. Run tests - should transition from RED to GREEN
 *
 * Files to Create:
 * - apps/frontend/lib/hooks/use-permissions.ts
 *
 * Coverage Target: 90%
 */
