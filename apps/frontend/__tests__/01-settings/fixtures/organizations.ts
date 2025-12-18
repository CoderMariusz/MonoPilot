/**
 * Test Fixtures: Organizations
 * Epic 01 - Settings Module
 *
 * Standard org fixtures for multi-tenant testing
 */

export const testOrganizations = {
  orgA: {
    id: '00000000-0000-0000-0000-000000000001',
    name: 'Test Organization A',
    slug: 'test-org-a',
    timezone: 'America/New_York',
    locale: 'en',
    currency: 'USD',
    onboarding_step: 0,
    onboarding_started_at: null,
    onboarding_completed_at: null,
    onboarding_skipped: false,
    is_active: true,
  },
  orgB: {
    id: '00000000-0000-0000-0000-000000000002',
    name: 'Test Organization B',
    slug: 'test-org-b',
    timezone: 'Europe/Warsaw',
    locale: 'pl',
    currency: 'PLN',
    onboarding_step: 7,
    onboarding_started_at: '2025-01-01T00:00:00Z',
    onboarding_completed_at: '2025-01-02T00:00:00Z',
    onboarding_skipped: false,
    is_active: true,
  },
  orgC: {
    id: '00000000-0000-0000-0000-000000000003',
    name: 'Test Organization C (Inactive)',
    slug: 'test-org-c',
    timezone: 'UTC',
    locale: 'en',
    currency: 'EUR',
    onboarding_step: 0,
    onboarding_started_at: null,
    onboarding_completed_at: null,
    onboarding_skipped: false,
    is_active: false,
  },
}

export type TestOrganization = typeof testOrganizations.orgA
