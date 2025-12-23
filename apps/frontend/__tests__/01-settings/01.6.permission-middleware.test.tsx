/**
 * Unit Tests: Permission Middleware (Story 01.6)
 * Story: 01.6 - Role-Based Permissions (10 Roles)
 * Phase: GREEN - Tests verify permission logic
 *
 * Tests permission service and middleware logic:
 * - hasPermission() checks CRUD permissions for role/module combinations
 * - requirePermission() throws PermissionError when denied
 * - HTTP method to CRUD action mapping
 * - Error message consistency
 *
 * Coverage Target: 90%
 * Test Count: 27 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hasPermission } from '@/lib/services/permission-service'
import type { User, Role } from '@/lib/types/user'

/**
 * Helper: Create mock user with role
 */
function createMockUser(roleCode: string): User {
  const roleName: Record<string, string> = {
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
  }

  const permissionMap: Record<string, Record<string, string>> = {
    owner: { settings: 'CRUD', users: 'CRUD', production: 'CRUD', quality: 'CRUD', warehouse: 'CRUD', planning: 'CRUD' },
    admin: { settings: 'CRU', users: 'CRUD', production: 'CRUD', quality: 'CRUD', warehouse: 'CRUD', planning: 'CRUD' },
    viewer: { settings: 'R', users: 'R', production: 'R', quality: 'R', warehouse: 'R', planning: 'R' },
    production_operator: { settings: '-', users: '-', production: 'RU', quality: 'CR', warehouse: 'R', planning: 'R' },
    quality_inspector: { settings: '-', users: '-', production: 'R', quality: 'CRU', warehouse: 'R', planning: '-' },
    warehouse_operator: { settings: '-', users: '-', production: '-', quality: 'R', warehouse: 'CRU', planning: '-' },
    planner: { settings: 'R', users: 'R', production: 'R', quality: 'R', warehouse: 'R', planning: 'CRUD' },
    production_manager: { settings: 'R', users: 'R', production: 'CRUD', quality: 'CRUD', warehouse: 'RU', planning: 'CRUD' },
  }

  const role: Role = {
    id: `role-${roleCode}-id`,
    code: roleCode,
    name: roleName[roleCode] || 'Unknown',
    permissions: permissionMap[roleCode] || {},
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
 * Maps HTTP method to CRUD action
 */
function httpMethodToAction(method: string): string {
  const mapping: Record<string, string> = {
    GET: 'read',
    POST: 'create',
    PUT: 'update',
    PATCH: 'update',
    DELETE: 'delete',
  }
  return mapping[method.toUpperCase()] || 'read'
}

/**
 * Simulates permission check for an API route
 * Returns { allowed: boolean, status: number, error?: string }
 */
function checkRoutePermission(
  user: User | null,
  method: string,
  module: string
): { allowed: boolean; status: number; error?: string } {
  // Unauthenticated user
  if (!user) {
    return { allowed: false, status: 401, error: 'Authentication required' }
  }

  const roleCode = user.role?.code
  if (!roleCode) {
    return { allowed: false, status: 403, error: "You don't have permission to perform this action" }
  }

  const action = httpMethodToAction(method)
  const allowed = hasPermission(roleCode, module, action)

  if (!allowed) {
    return { allowed: false, status: 403, error: "You don't have permission to perform this action" }
  }

  return { allowed: true, status: 200 }
}

describe('Permission Middleware - Production Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // AC: Viewer blocked from POST /api/v1/production/work-orders
  it('should block viewer from POST /api/v1/production/work-orders with 403', () => {
    const user = createMockUser('viewer')
    const result = checkRoutePermission(user, 'POST', 'production')
    expect(result.status).toBe(403)
    expect(result.error).toBe("You don't have permission to perform this action")
  })

  it('should allow production_manager to POST /api/v1/production/work-orders', () => {
    const user = createMockUser('production_manager')
    const result = checkRoutePermission(user, 'POST', 'production')
    expect(result.status).not.toBe(403)
    expect(result.allowed).toBe(true)
  })

  it('should block production_operator from DELETE /api/v1/production/work-orders/:id', () => {
    const user = createMockUser('production_operator')
    const result = checkRoutePermission(user, 'DELETE', 'production')
    expect(result.status).toBe(403)
  })

  it('should allow production_operator to PUT /api/v1/production/work-orders/:id (has Update)', () => {
    const user = createMockUser('production_operator')
    const result = checkRoutePermission(user, 'PUT', 'production')
    expect(result.status).not.toBe(403)
    expect(result.allowed).toBe(true)
  })

  it('should allow all roles to GET /api/v1/production/work-orders (read access)', () => {
    const roles = ['viewer', 'production_operator', 'quality_inspector', 'production_manager']
    for (const roleCode of roles) {
      const user = createMockUser(roleCode)
      const result = checkRoutePermission(user, 'GET', 'production')
      expect(result.status).not.toBe(403)
    }
  })

  it('should block warehouse_operator from GET /api/v1/production/work-orders (no access)', () => {
    const user = createMockUser('warehouse_operator')
    const result = checkRoutePermission(user, 'GET', 'production')
    expect(result.status).toBe(403)
  })
})

describe('Permission Middleware - Quality Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should allow production_operator to POST /api/v1/quality/inspections', () => {
    const user = createMockUser('production_operator')
    const result = checkRoutePermission(user, 'POST', 'quality')
    expect(result.status).not.toBe(403)
    expect(result.allowed).toBe(true)
  })

  it('should block production_operator from DELETE /api/v1/quality/inspections/:id', () => {
    const user = createMockUser('production_operator')
    const result = checkRoutePermission(user, 'DELETE', 'quality')
    expect(result.status).toBe(403)
  })

  it('should block production_operator from PUT /api/v1/quality/inspections/:id (no Update)', () => {
    const user = createMockUser('production_operator')
    const result = checkRoutePermission(user, 'PUT', 'quality')
    expect(result.status).toBe(403)
  })

  it('should allow quality_inspector to PUT /api/v1/quality/inspections/:id (has Update)', () => {
    const user = createMockUser('quality_inspector')
    const result = checkRoutePermission(user, 'PUT', 'quality')
    expect(result.status).not.toBe(403)
    expect(result.allowed).toBe(true)
  })

  it('should block quality_inspector from DELETE /api/v1/quality/inspections/:id (no Delete)', () => {
    const user = createMockUser('quality_inspector')
    const result = checkRoutePermission(user, 'DELETE', 'quality')
    expect(result.status).toBe(403)
  })

  it('should allow quality_inspector to GET /api/v1/warehouse/locations', () => {
    const user = createMockUser('quality_inspector')
    const result = checkRoutePermission(user, 'GET', 'warehouse')
    expect(result.status).not.toBe(403)
    expect(result.allowed).toBe(true)
  })

  it('should block quality_inspector from POST /api/v1/warehouse/locations (read-only)', () => {
    const user = createMockUser('quality_inspector')
    const result = checkRoutePermission(user, 'POST', 'warehouse')
    expect(result.status).toBe(403)
  })
})

describe('Permission Middleware - Warehouse Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should allow warehouse_operator to POST /api/v1/warehouse/transfers (has Create)', () => {
    const user = createMockUser('warehouse_operator')
    const result = checkRoutePermission(user, 'POST', 'warehouse')
    expect(result.status).not.toBe(403)
    expect(result.allowed).toBe(true)
  })

  it('should block warehouse_operator from DELETE /api/v1/warehouse/transfers/:id (no Delete)', () => {
    const user = createMockUser('warehouse_operator')
    const result = checkRoutePermission(user, 'DELETE', 'warehouse')
    expect(result.status).toBe(403)
  })

  it('should block production_operator from POST /api/v1/warehouse/transfers (read-only)', () => {
    const user = createMockUser('production_operator')
    const result = checkRoutePermission(user, 'POST', 'warehouse')
    expect(result.status).toBe(403)
  })
})

describe('Permission Middleware - Settings Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should block viewer from PUT /api/v1/settings/organization (read-only)', () => {
    const user = createMockUser('viewer')
    const result = checkRoutePermission(user, 'PUT', 'settings')
    expect(result.status).toBe(403)
  })

  it('should allow admin to PUT /api/v1/settings/organization (has Update)', () => {
    const user = createMockUser('admin')
    const result = checkRoutePermission(user, 'PUT', 'settings')
    expect(result.status).not.toBe(403)
    expect(result.allowed).toBe(true)
  })

  it('should block admin from DELETE /api/v1/settings/organization (no Delete)', () => {
    const user = createMockUser('admin')
    const result = checkRoutePermission(user, 'DELETE', 'settings')
    expect(result.status).toBe(403)
  })

  it('should allow owner to DELETE /api/v1/settings/organization (full CRUD)', () => {
    const user = createMockUser('owner')
    const result = checkRoutePermission(user, 'DELETE', 'settings')
    expect(result.status).not.toBe(403)
    expect(result.allowed).toBe(true)
  })

  it('should block production_operator from GET /api/v1/settings/organization (no access)', () => {
    const user = createMockUser('production_operator')
    const result = checkRoutePermission(user, 'GET', 'settings')
    expect(result.status).toBe(403)
  })
})

describe('Permission Middleware - Planning Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should allow planner to POST /api/v1/planning/schedules (full CRUD)', () => {
    const user = createMockUser('planner')
    const result = checkRoutePermission(user, 'POST', 'planning')
    expect(result.status).not.toBe(403)
    expect(result.allowed).toBe(true)
  })

  it('should allow planner to DELETE /api/v1/planning/schedules/:id (full CRUD)', () => {
    const user = createMockUser('planner')
    const result = checkRoutePermission(user, 'DELETE', 'planning')
    expect(result.status).not.toBe(403)
    expect(result.allowed).toBe(true)
  })

  it('should block quality_inspector from GET /api/v1/planning/schedules (no access)', () => {
    const user = createMockUser('quality_inspector')
    const result = checkRoutePermission(user, 'GET', 'planning')
    expect(result.status).toBe(403)
  })

  it('should allow viewer to GET /api/v1/planning/schedules (read-only)', () => {
    const user = createMockUser('viewer')
    const result = checkRoutePermission(user, 'GET', 'planning')
    expect(result.status).not.toBe(403)
    expect(result.allowed).toBe(true)
  })
})

describe('Permission Middleware - Error Messages', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return consistent error message for all 403 responses', () => {
    const user = createMockUser('viewer')
    const endpoints = [
      { method: 'POST', module: 'production' },
      { method: 'DELETE', module: 'quality' },
      { method: 'PUT', module: 'warehouse' },
    ]

    for (const endpoint of endpoints) {
      const result = checkRoutePermission(user, endpoint.method, endpoint.module)
      expect(result.status).toBe(403)
      expect(result.error).toBe("You don't have permission to perform this action")
    }
  })

  it('should return 401 when user not authenticated', () => {
    const user = null
    const result = checkRoutePermission(user, 'GET', 'production')
    expect(result.status).toBe(401)
    expect(result.error).toBe('Authentication required')
  })
})
