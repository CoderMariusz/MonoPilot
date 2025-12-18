/**
 * Test Fixtures: Organizations
 * Story: 01.1 - Org Context + Base RLS
 *
 * Reusable test data for multi-tenant testing scenarios.
 * Includes 3 organizations with different states:
 * - Org A: Active, onboarding incomplete (step 0)
 * - Org B: Active, onboarding complete
 * - Org C: Inactive (for testing is_active checks)
 */

export const organizationFixtures = {
  /**
   * Organization A - Active, onboarding incomplete
   * Used for testing new organization flows
   */
  orgA: {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Test Organization A',
    slug: 'test-org-a',
    timezone: 'UTC',
    locale: 'en',
    currency: 'PLN',
    logo_url: null,
    onboarding_step: 0,
    onboarding_started_at: '2025-01-01T10:00:00Z',
    onboarding_completed_at: null,
    onboarding_skipped: false,
    is_active: true,
    created_at: '2025-01-01T10:00:00Z',
    updated_at: '2025-01-01T10:00:00Z',
  },

  /**
   * Organization B - Active, onboarding complete
   * Used for testing established organization flows
   */
  orgB: {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Test Organization B',
    slug: 'test-org-b',
    timezone: 'Europe/Warsaw',
    locale: 'pl',
    currency: 'PLN',
    logo_url: 'https://example.com/logo-b.png',
    onboarding_step: 6,
    onboarding_started_at: '2024-12-01T09:00:00Z',
    onboarding_completed_at: '2024-12-05T15:30:00Z',
    onboarding_skipped: false,
    is_active: true,
    created_at: '2024-12-01T09:00:00Z',
    updated_at: '2024-12-05T15:30:00Z',
  },

  /**
   * Organization C - Inactive
   * Used for testing is_active checks (AC-06)
   */
  orgC: {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Test Organization C (Inactive)',
    slug: 'test-org-c',
    timezone: 'UTC',
    locale: 'en',
    currency: 'EUR',
    logo_url: null,
    onboarding_step: 3,
    onboarding_started_at: '2024-11-15T08:00:00Z',
    onboarding_completed_at: null,
    onboarding_skipped: false,
    is_active: false, // INACTIVE
    created_at: '2024-11-15T08:00:00Z',
    updated_at: '2024-11-20T10:00:00Z',
  },

  /**
   * Organization D - Onboarding skipped
   * Used for testing skip onboarding flow
   */
  orgD: {
    id: '00000000-0000-0000-0000-000000000004',
    name: 'Test Organization D',
    slug: 'test-org-d',
    timezone: 'America/New_York',
    locale: 'en',
    currency: 'USD',
    logo_url: null,
    onboarding_step: 0,
    onboarding_started_at: '2025-01-10T12:00:00Z',
    onboarding_completed_at: null,
    onboarding_skipped: true, // SKIPPED
    is_active: true,
    created_at: '2025-01-10T12:00:00Z',
    updated_at: '2025-01-10T12:30:00Z',
  },
}

/**
 * Helper function to get organization by slug
 */
export function getOrgBySlug(slug: string) {
  const orgs = Object.values(organizationFixtures)
  return orgs.find((org) => org.slug === slug)
}

/**
 * Helper function to get active organizations only
 */
export function getActiveOrganizations() {
  return Object.values(organizationFixtures).filter((org) => org.is_active)
}

/**
 * Helper function to get organizations with incomplete onboarding
 */
export function getOrganizationsWithIncompleteOnboarding() {
  return Object.values(organizationFixtures).filter(
    (org) => !org.onboarding_completed_at && !org.onboarding_skipped
  )
}

/**
 * Helper function to create minimal organization for testing
 */
export function createMinimalOrg(overrides: Partial<typeof organizationFixtures.orgA> = {}) {
  return {
    id: '99999999-9999-9999-9999-999999999999',
    name: 'Test Org',
    slug: 'test-org',
    timezone: 'UTC',
    locale: 'en',
    currency: 'PLN',
    logo_url: null,
    onboarding_step: 0,
    onboarding_started_at: null,
    onboarding_completed_at: null,
    onboarding_skipped: false,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

/**
 * All organizations as array (for iteration in tests)
 */
export const allOrganizations = Object.values(organizationFixtures)

/**
 * Organization IDs only (for quick reference)
 */
export const orgIds = {
  orgA: organizationFixtures.orgA.id,
  orgB: organizationFixtures.orgB.id,
  orgC: organizationFixtures.orgC.id,
  orgD: organizationFixtures.orgD.id,
}

/**
 * Usage Example:
 *
 * ```typescript
 * import { organizationFixtures, orgIds } from './fixtures/organizations'
 *
 * it('should return org context for Org A', async () => {
 *   const context = await getOrgContext(orgIds.orgA)
 *   expect(context.organization.name).toBe(organizationFixtures.orgA.name)
 * })
 * ```
 */
