/**
 * Test Fixtures: Users
 * Story: 01.1 - Org Context + Base RLS
 *
 * Reusable test data for multi-tenant user testing.
 * Includes users from multiple organizations with different roles.
 *
 * User Distribution:
 * - Org A: 4 users (owner, admin, production_manager, viewer)
 * - Org B: 3 users (admin, quality_manager, viewer)
 * - Org C: 2 users (admin, viewer) - Inactive org
 */

import { orgIds } from './organizations'

/**
 * Role IDs from system roles (seeded in migration 044)
 */
export const roleIds = {
  owner: '10000000-0000-0000-0000-000000000001',
  admin: '10000000-0000-0000-0000-000000000002',
  production_manager: '10000000-0000-0000-0000-000000000003',
  quality_manager: '10000000-0000-0000-0000-000000000004',
  warehouse_manager: '10000000-0000-0000-0000-000000000005',
  production_operator: '10000000-0000-0000-0000-000000000006',
  warehouse_operator: '10000000-0000-0000-0000-000000000007',
  quality_inspector: '10000000-0000-0000-0000-000000000008',
  planner: '10000000-0000-0000-0000-000000000009',
  viewer: '10000000-0000-0000-0000-000000000010',
}

export const userFixtures = {
  /**
   * Organization A Users
   */
  ownerA: {
    id: '20000000-0000-0000-0000-000000000001',
    org_id: orgIds.orgA,
    email: 'owner@orga.test',
    first_name: 'Owner',
    last_name: 'A',
    role_id: roleIds.owner,
    language: 'en',
    is_active: true,
    last_login_at: '2025-01-15T10:00:00Z',
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-15T10:00:00Z',
  },

  adminA: {
    id: '20000000-0000-0000-0000-000000000002',
    org_id: orgIds.orgA,
    email: 'admin@orga.test',
    first_name: 'Admin',
    last_name: 'A',
    role_id: roleIds.admin,
    language: 'en',
    is_active: true,
    last_login_at: '2025-01-16T09:30:00Z',
    created_at: '2025-01-01T10:05:00Z',
    updated_at: '2025-01-16T09:30:00Z',
  },

  prodManagerA: {
    id: '20000000-0000-0000-0000-000000000003',
    org_id: orgIds.orgA,
    email: 'prod.manager@orga.test',
    first_name: 'Production',
    last_name: 'Manager A',
    role_id: roleIds.production_manager,
    language: 'en',
    is_active: true,
    last_login_at: '2025-01-16T08:00:00Z',
    created_at: '2025-01-02T11:00:00Z',
    updated_at: '2025-01-16T08:00:00Z',
  },

  viewerA: {
    id: '20000000-0000-0000-0000-000000000004',
    org_id: orgIds.orgA,
    email: 'viewer@orga.test',
    first_name: 'Viewer',
    last_name: 'A',
    role_id: roleIds.viewer,
    language: 'en',
    is_active: true,
    last_login_at: '2025-01-15T14:00:00Z',
    created_at: '2025-01-03T09:00:00Z',
    updated_at: '2025-01-15T14:00:00Z',
  },

  /**
   * Organization B Users
   */
  adminB: {
    id: '20000000-0000-0000-0000-000000000005',
    org_id: orgIds.orgB,
    email: 'admin@orgb.test',
    first_name: 'Admin',
    last_name: 'B',
    role_id: roleIds.admin,
    language: 'pl',
    is_active: true,
    last_login_at: '2025-01-16T10:00:00Z',
    created_at: '2024-12-01T09:00:00Z',
    updated_at: '2025-01-16T10:00:00Z',
  },

  qualManagerB: {
    id: '20000000-0000-0000-0000-000000000006',
    org_id: orgIds.orgB,
    email: 'quality.manager@orgb.test',
    first_name: 'Quality',
    last_name: 'Manager B',
    role_id: roleIds.quality_manager,
    language: 'pl',
    is_active: true,
    last_login_at: '2025-01-15T11:00:00Z',
    created_at: '2024-12-01T09:30:00Z',
    updated_at: '2025-01-15T11:00:00Z',
  },

  viewerB: {
    id: '20000000-0000-0000-0000-000000000007',
    org_id: orgIds.orgB,
    email: 'viewer@orgb.test',
    first_name: 'Viewer',
    last_name: 'B',
    role_id: roleIds.viewer,
    language: 'pl',
    is_active: true,
    last_login_at: '2025-01-14T16:00:00Z',
    created_at: '2024-12-02T10:00:00Z',
    updated_at: '2025-01-14T16:00:00Z',
  },

  /**
   * Organization C Users (Inactive Org)
   */
  adminC: {
    id: '20000000-0000-0000-0000-000000000008',
    org_id: orgIds.orgC,
    email: 'admin@orgc.test',
    first_name: 'Admin',
    last_name: 'C',
    role_id: roleIds.admin,
    language: 'en',
    is_active: true,
    last_login_at: '2024-11-20T10:00:00Z',
    created_at: '2024-11-15T08:00:00Z',
    updated_at: '2024-11-20T10:00:00Z',
  },

  viewerC: {
    id: '20000000-0000-0000-0000-000000000009',
    org_id: orgIds.orgC,
    email: 'viewer@orgc.test',
    first_name: 'Viewer',
    last_name: 'C',
    role_id: roleIds.viewer,
    language: 'en',
    is_active: true,
    last_login_at: '2024-11-19T14:00:00Z',
    created_at: '2024-11-15T08:30:00Z',
    updated_at: '2024-11-19T14:00:00Z',
  },

  /**
   * Special Test Users
   */
  inactiveUser: {
    id: '20000000-0000-0000-0000-000000000010',
    org_id: orgIds.orgA,
    email: 'inactive@orga.test',
    first_name: 'Inactive',
    last_name: 'User',
    role_id: roleIds.viewer,
    language: 'en',
    is_active: false, // INACTIVE USER
    last_login_at: '2024-12-20T10:00:00Z',
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-05T15:00:00Z',
  },
}

/**
 * User IDs only (for quick reference)
 */
export const userIds = {
  ownerA: userFixtures.ownerA.id,
  adminA: userFixtures.adminA.id,
  prodManagerA: userFixtures.prodManagerA.id,
  viewerA: userFixtures.viewerA.id,
  adminB: userFixtures.adminB.id,
  qualManagerB: userFixtures.qualManagerB.id,
  viewerB: userFixtures.viewerB.id,
  adminC: userFixtures.adminC.id,
  viewerC: userFixtures.viewerC.id,
  inactiveUser: userFixtures.inactiveUser.id,
}

/**
 * Helper functions for test scenarios
 */

/**
 * Get all users for a specific organization
 */
export function getUsersByOrg(orgId: string) {
  return Object.values(userFixtures).filter((user) => user.org_id === orgId)
}

/**
 * Get all admin users (owner + admin roles)
 */
export function getAdminUsers() {
  return Object.values(userFixtures).filter(
    (user) => user.role_id === roleIds.owner || user.role_id === roleIds.admin
  )
}

/**
 * Get all active users
 */
export function getActiveUsers() {
  return Object.values(userFixtures).filter((user) => user.is_active)
}

/**
 * Get users by role
 */
export function getUsersByRole(roleId: string) {
  return Object.values(userFixtures).filter((user) => user.role_id === roleId)
}

/**
 * Create minimal user for testing
 */
export function createMinimalUser(
  overrides: Partial<typeof userFixtures.adminA> = {}
) {
  return {
    id: '99999999-9999-9999-9999-999999999999',
    org_id: orgIds.orgA,
    email: 'test@test.test',
    first_name: 'Test',
    last_name: 'User',
    role_id: roleIds.viewer,
    language: 'en',
    is_active: true,
    last_login_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * All users as array (for iteration in tests)
 */
export const allUsers = Object.values(userFixtures)

/**
 * Users grouped by organization for AC-07 testing
 */
export const usersByOrganization = {
  orgA: [
    userFixtures.ownerA,
    userFixtures.adminA,
    userFixtures.prodManagerA,
    userFixtures.viewerA,
    userFixtures.inactiveUser,
  ],
  orgB: [userFixtures.adminB, userFixtures.qualManagerB, userFixtures.viewerB],
  orgC: [userFixtures.adminC, userFixtures.viewerC],
}

/**
 * Cross-tenant test scenarios (for AC-02, AC-03)
 */
export const crossTenantScenarios = [
  {
    name: 'Org A user accessing Org B resource',
    requestingUser: userFixtures.adminA,
    targetOrgId: orgIds.orgB,
    expectedResult: '404',
  },
  {
    name: 'Org B user accessing Org A resource',
    requestingUser: userFixtures.adminB,
    targetOrgId: orgIds.orgA,
    expectedResult: '404',
  },
  {
    name: 'Org A viewer accessing Org B resource',
    requestingUser: userFixtures.viewerA,
    targetOrgId: orgIds.orgB,
    expectedResult: '404',
  },
]

/**
 * Usage Example:
 *
 * ```typescript
 * import { userFixtures, userIds, getUsersByOrg } from './fixtures/users'
 *
 * it('should return org context for admin user', async () => {
 *   const context = await getOrgContext(userIds.adminA)
 *   expect(context.user_id).toBe(userIds.adminA)
 *   expect(context.role_code).toBe('admin')
 * })
 *
 * it('should isolate Org A users from Org B', async () => {
 *   const orgAUsers = getUsersByOrg(orgIds.orgA)
 *   expect(orgAUsers).toHaveLength(5) // including inactive
 * })
 * ```
 */
