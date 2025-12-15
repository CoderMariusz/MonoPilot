/**
 * Test Fixtures: Users
 * Epic 01a - Settings Module
 *
 * Users for testing multi-tenant isolation and role-based access
 */

import { testOrganizations } from './organizations'
import { testRoles } from './roles'

export const testUsers = {
  // Org A users
  superAdminOrgA: {
    id: '20000000-0000-0000-0000-000000000001',
    org_id: testOrganizations.orgA.id,
    email: 'super@org-a.test',
    first_name: 'Super',
    last_name: 'Admin A',
    role_id: testRoles.superAdmin.id,
    language: 'en',
    is_active: true,
    last_login_at: '2025-12-15T10:00:00Z',
  },
  adminOrgA: {
    id: '20000000-0000-0000-0000-000000000002',
    org_id: testOrganizations.orgA.id,
    email: 'admin@org-a.test',
    first_name: 'Admin',
    last_name: 'User A',
    role_id: testRoles.admin.id,
    language: 'en',
    is_active: true,
    last_login_at: '2025-12-15T09:30:00Z',
  },
  viewerOrgA: {
    id: '20000000-0000-0000-0000-000000000003',
    org_id: testOrganizations.orgA.id,
    email: 'viewer@org-a.test',
    first_name: 'Viewer',
    last_name: 'User A',
    role_id: testRoles.viewer.id,
    language: 'en',
    is_active: true,
    last_login_at: '2025-12-15T08:00:00Z',
  },
  prodOperatorOrgA: {
    id: '20000000-0000-0000-0000-000000000004',
    org_id: testOrganizations.orgA.id,
    email: 'operator@org-a.test',
    first_name: 'Production',
    last_name: 'Operator A',
    role_id: testRoles.productionOperator.id,
    language: 'en',
    is_active: true,
    last_login_at: '2025-12-14T15:00:00Z',
  },

  // Org B users
  adminOrgB: {
    id: '20000000-0000-0000-0000-000000000005',
    org_id: testOrganizations.orgB.id,
    email: 'admin@org-b.test',
    first_name: 'Admin',
    last_name: 'User B',
    role_id: testRoles.admin.id,
    language: 'pl',
    is_active: true,
    last_login_at: '2025-12-15T11:00:00Z',
  },
  prodManagerOrgB: {
    id: '20000000-0000-0000-0000-000000000006',
    org_id: testOrganizations.orgB.id,
    email: 'prodmgr@org-b.test',
    first_name: 'Production',
    last_name: 'Manager B',
    role_id: testRoles.productionManager.id,
    language: 'pl',
    is_active: true,
    last_login_at: '2025-12-15T07:30:00Z',
  },
  viewerOrgB: {
    id: '20000000-0000-0000-0000-000000000007',
    org_id: testOrganizations.orgB.id,
    email: 'viewer@org-b.test',
    first_name: 'Viewer',
    last_name: 'User B',
    role_id: testRoles.viewer.id,
    language: 'pl',
    is_active: true,
    last_login_at: '2025-12-13T14:00:00Z',
  },

  // Inactive user
  inactiveOrgA: {
    id: '20000000-0000-0000-0000-000000000008',
    org_id: testOrganizations.orgA.id,
    email: 'inactive@org-a.test',
    first_name: 'Inactive',
    last_name: 'User',
    role_id: testRoles.viewer.id,
    language: 'en',
    is_active: false,
    last_login_at: null,
  },
}

export type TestUser = typeof testUsers.adminOrgA
