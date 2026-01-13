/**
 * Unit Tests: Settings Landing Page (SET-000)
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 * Phase: P2 (RED) - All tests should FAIL
 *
 * Tests the settings landing page/dashboard:
 * - Renders organization summary card with logo, name, location
 * - Displays 6 quick access cards with stats
 * - Shows recent activity feed (last 5 audit entries)
 * - Handles loading state with skeletons
 * - Shows empty state for new organizations (onboarding wizard CTA)
 * - Shows error state with retry option
 * - Permission-based card filtering
 *
 * Coverage Target: 80%
 * Test Count: 12 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import SettingsPage from '../page'
import { useOrgContext } from '@/lib/hooks/useOrgContext'
import { createMockOrgContextOrganization } from '@/lib/test/factories'

// Mock dependencies
vi.mock('@/lib/hooks/useOrgContext')
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}))

// Mock fetch for dashboard stats and audit logs
global.fetch = vi.fn()

describe('Settings Landing Page (SET-000)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Success State', () => {
    // AC-01: Organization summary card
    it('should render organization summary card with logo, name, and location', async () => {
      vi.mocked(useOrgContext).mockReturnValue({
        data: {
          org_id: 'org-123',
          user_id: 'user-123',
          role_code: 'admin',
          role_name: 'Administrator',
          permissions: { settings: 'CRUD' },
          organization: createMockOrgContextOrganization({
            id: 'org-123',
            name: 'Acme Food Manufacturing',
            slug: 'acme-food',
            timezone: 'Europe/Warsaw',
            locale: 'en',
            currency: 'PLN',
            onboarding_step: 6,
            onboarding_completed_at: new Date().toISOString(),
            is_active: true,
          }),
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: { total: 8, pending_invitations: 2 },
          infrastructure: { warehouses: 3, machines: 5, production_lines: 2 },
          master_data: { allergens: 14, tax_codes: 4 },
          integrations: { api_keys: 2, webhooks: 0 },
          system: { enabled_modules: 6, audit_log_entries: 348 },
          security: { last_login: '2026-01-04T12:30:00Z', session_status: 'active' },
        }),
      } as Response)

      render(<SettingsPage />)

      // Wait for org summary to load
      await waitFor(() => {
        expect(screen.getByText('Acme Food Manufacturing')).toBeInTheDocument()
      })

      expect(screen.getByText(/Warsaw, Poland/i)).toBeInTheDocument()
      expect(screen.getByText(/Europe\/Warsaw/i)).toBeInTheDocument()
      expect(screen.getByText('admin@acme.com')).toBeInTheDocument()
      expect(screen.getByText('+48 123 456 789')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: /edit organization profile/i })).toBeInTheDocument()
    })

    // AC-02: Quick access cards
    it('should display all 6 quick access cards with correct stats', async () => {
      vi.mocked(useOrgContext).mockReturnValue({
        data: {
          org_id: 'org-123',
          user_id: 'user-123',
          role_code: 'admin',
          role_name: 'Administrator',
          permissions: { settings: 'CRUD' },
          organization: createMockOrgContextOrganization({
            id: 'org-123',
            name: 'Test Org',
            slug: 'test-org',
            timezone: 'UTC',
            locale: 'en',
            currency: 'PLN',
            onboarding_step: 6,
            onboarding_completed_at: new Date().toISOString(),
            is_active: true,
          }),
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: { total: 8, pending_invitations: 2 },
          infrastructure: { warehouses: 3, machines: 5, production_lines: 2 },
          master_data: { allergens: 14, tax_codes: 4 },
          integrations: { api_keys: 2, webhooks: 0 },
          system: { enabled_modules: 6, audit_log_entries: 348 },
          security: { last_login: '2026-01-04T12:30:00Z', session_status: 'active' },
        }),
      } as Response)

      render(<SettingsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Users & Roles/i)).toBeInTheDocument()
      })

      // Check all 6 cards
      expect(screen.getByText(/Users & Roles/i)).toBeInTheDocument()
      expect(screen.getByText(/8 users/i)).toBeInTheDocument()
      expect(screen.getByText(/2 pending invites/i)).toBeInTheDocument()

      expect(screen.getByText(/Infrastructure/i)).toBeInTheDocument()
      expect(screen.getByText(/3 warehouses/i)).toBeInTheDocument()
      expect(screen.getByText(/5 machines/i)).toBeInTheDocument()

      expect(screen.getByText(/Master Data/i)).toBeInTheDocument()
      expect(screen.getByText(/14 allergens/i)).toBeInTheDocument()

      expect(screen.getByText(/Integrations/i)).toBeInTheDocument()
      expect(screen.getByText(/2 API keys/i)).toBeInTheDocument()

      expect(screen.getByText(/System/i)).toBeInTheDocument()
      expect(screen.getByText(/6 modules enabled/i)).toBeInTheDocument()

      expect(screen.getByText(/Security/i)).toBeInTheDocument()
      expect(screen.getByText(/Session: Active/i)).toBeInTheDocument()
    })

    // AC-03: Recent activity feed
    it('should display recent activity feed with last 5 audit entries', async () => {
      vi.mocked(useOrgContext).mockReturnValue({
        data: {
          org_id: 'org-123',
          user_id: 'user-123',
          role_code: 'admin',
          role_name: 'Administrator',
          permissions: { settings: 'CRUD' },
          organization: createMockOrgContextOrganization({
            id: 'org-123',
            name: 'Test Org',
            slug: 'test-org',
            timezone: 'UTC',
            locale: 'en',
            currency: 'PLN',
            onboarding_step: 6,
            onboarding_completed_at: new Date().toISOString(),
            is_active: true,
          }),
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            users: { total: 8 },
            infrastructure: { warehouses: 3 },
            master_data: { allergens: 14 },
            integrations: { api_keys: 2 },
            system: { enabled_modules: 6 },
            security: { last_login: '2026-01-04T12:30:00Z' },
          }),
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            logs: [
              { id: 'log-1', user_name: 'John Smith', action: 'updated organization profile', created_at: '2026-01-04T12:30:00Z' },
              { id: 'log-2', user_name: 'Alice Chen', action: 'invited new user (jane.doe@example.com)', created_at: '2026-01-03T15:20:00Z' },
              { id: 'log-3', user_name: 'Bob Wilson', action: 'added machine "Mixer #3"', created_at: '2026-01-02T10:15:00Z' },
              { id: 'log-4', user_name: 'Admin', action: 'enabled Quality module', created_at: '2026-01-01T09:00:00Z' },
              { id: 'log-5', user_name: 'System', action: 'auto-archived 50 old audit logs', created_at: '2025-12-28T08:00:00Z' },
            ],
          }),
        } as Response)

      render(<SettingsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/John Smith updated organization profile/i)).toBeInTheDocument()
      expect(screen.getByText(/Alice Chen invited new user/i)).toBeInTheDocument()
      expect(screen.getByText(/Bob Wilson added machine/i)).toBeInTheDocument()
      expect(screen.getByText(/Admin enabled Quality module/i)).toBeInTheDocument()
      expect(screen.getByText(/System auto-archived 50 old audit logs/i)).toBeInTheDocument()

      expect(screen.getByRole('link', { name: /view all audit logs/i })).toBeInTheDocument()
    })

    // AC-04: Card navigation
    it('should navigate to correct pages when clicking quick access cards', async () => {
      const user = userEvent.setup()

      vi.mocked(useOrgContext).mockReturnValue({
        data: {
          org_id: 'org-123',
          user_id: 'user-123',
          role_code: 'admin',
          role_name: 'Administrator',
          permissions: { settings: 'CRUD' },
          organization: createMockOrgContextOrganization({
            id: 'org-123',
            name: 'Test Org',
            slug: 'test-org',
            timezone: 'UTC',
            locale: 'en',
            currency: 'PLN',
            onboarding_step: 6,
            onboarding_completed_at: new Date().toISOString(),
            is_active: true,
          }),
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: { total: 8 },
          infrastructure: { warehouses: 3 },
          master_data: { allergens: 14 },
          integrations: { api_keys: 2 },
          system: { enabled_modules: 6 },
          security: { last_login: '2026-01-04T12:30:00Z' },
        }),
      } as Response)

      render(<SettingsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Users & Roles/i)).toBeInTheDocument()
      })

      // Check that cards have correct links
      const usersLink = screen.getByRole('link', { name: /manage users/i })
      expect(usersLink).toHaveAttribute('href', '/settings/users')

      const warehousesLink = screen.getByRole('link', { name: /manage warehouses/i })
      expect(warehousesLink).toHaveAttribute('href', '/settings/warehouses')

      const allergensLink = screen.getByRole('link', { name: /manage allergens/i })
      expect(allergensLink).toHaveAttribute('href', '/settings/allergens')
    })
  })

  describe('Loading State', () => {
    // AC-05: Loading skeletons
    it('should show skeleton loaders while data is loading', () => {
      vi.mocked(useOrgContext).mockReturnValue({
        data: {
          org_id: 'org-123',
          user_id: 'user-123',
          role_code: 'admin',
          role_name: 'Administrator',
          permissions: { settings: 'CRUD' },
          organization: createMockOrgContextOrganization({
            id: 'org-123',
            name: 'Test Org',
            slug: 'test-org',
            timezone: 'UTC',
            locale: 'en',
            currency: 'PLN',
            onboarding_step: 6,
            onboarding_completed_at: new Date().toISOString(),
            is_active: true,
          }),
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      // Mock fetch to never resolve (loading state)
      vi.mocked(fetch).mockImplementation(() => new Promise(() => {}))

      render(<SettingsPage />)

      // Should show loading state
      expect(screen.getByText(/loading settings/i)).toBeInTheDocument()
      expect(screen.getAllByTestId('skeleton').length).toBeGreaterThan(0)
    })
  })

  describe('Empty State', () => {
    // AC-06: Empty state for new organizations
    it('should show setup wizard CTA for new organizations', async () => {
      vi.mocked(useOrgContext).mockReturnValue({
        data: {
          org_id: 'org-123',
          user_id: 'user-123',
          role_code: 'admin',
          role_name: 'Administrator',
          permissions: { settings: 'CRUD' },
          organization: createMockOrgContextOrganization({
            id: 'org-123',
            name: 'Test Org',
            slug: 'test-org',
            timezone: 'UTC',
            locale: 'en',
            currency: 'PLN',
            onboarding_step: 0,
            onboarding_completed_at: undefined,
            is_active: true,
          }),
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      render(<SettingsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Welcome to MonoPilot!/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/Let's get your organization set up in 15 minutes/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /start setup wizard/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /skip and configure manually/i })).toBeInTheDocument()
    })

    // AC-07: Skip wizard shows minimal dashboard
    it('should show minimal dashboard when skipping wizard', async () => {
      const user = userEvent.setup()

      vi.mocked(useOrgContext).mockReturnValue({
        data: {
          org_id: 'org-123',
          user_id: 'user-123',
          role_code: 'admin',
          role_name: 'Administrator',
          permissions: { settings: 'CRUD' },
          organization: createMockOrgContextOrganization({
            id: 'org-123',
            name: 'Test Org',
            slug: 'test-org',
            timezone: 'UTC',
            locale: 'en',
            currency: 'PLN',
            onboarding_step: 0,
            onboarding_completed_at: undefined,
            is_active: true,
          }),
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: { total: 0 },
          infrastructure: { warehouses: 0 },
          master_data: { allergens: 14 },
          integrations: { api_keys: 0 },
          system: { enabled_modules: 0 },
          security: { last_login: null },
        }),
      } as Response)

      render(<SettingsPage />)

      const skipButton = await screen.findByRole('button', { name: /skip and configure manually/i })
      await user.click(skipButton)

      // Should show dashboard with 0 stats
      await waitFor(() => {
        expect(screen.getByText(/0 users/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error State', () => {
    // AC-08: Error with retry
    it('should show error state with retry button when API fails', async () => {
      const user = userEvent.setup()

      vi.mocked(useOrgContext).mockReturnValue({
        data: {
          org_id: 'org-123',
          user_id: 'user-123',
          role_code: 'admin',
          role_name: 'Administrator',
          permissions: { settings: 'CRUD' },
          organization: createMockOrgContextOrganization({
            id: 'org-123',
            name: 'Test Org',
            slug: 'test-org',
            timezone: 'UTC',
            locale: 'en',
            currency: 'PLN',
            onboarding_step: 6,
            onboarding_completed_at: new Date().toISOString(),
            is_active: true,
          }),
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      vi.mocked(fetch).mockRejectedValueOnce(new Error('ORG_CONTEXT_FETCH_FAILED'))

      render(<SettingsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Failed to Load Settings Dashboard/i)).toBeInTheDocument()
      })

      expect(screen.getByText(/ORG_CONTEXT_FETCH_FAILED/i)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /contact support/i })).toBeInTheDocument()
    })
  })

  describe('Permission Filtering', () => {
    // AC-09: Non-admin sees limited cards
    it('should filter quick access cards based on user role', async () => {
      vi.mocked(useOrgContext).mockReturnValue({
        data: {
          org_id: 'org-123',
          user_id: 'user-123',
          role_code: 'warehouse_manager',
          role_name: 'Warehouse Manager',
          permissions: { warehouse: 'CRUD' },
          organization: createMockOrgContextOrganization({
            id: 'org-123',
            name: 'Test Org',
            slug: 'test-org',
            timezone: 'UTC',
            locale: 'en',
            currency: 'PLN',
            onboarding_step: 6,
            onboarding_completed_at: new Date().toISOString(),
            is_active: true,
          }),
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          infrastructure: { warehouses: 3 },
        }),
      } as Response)

      render(<SettingsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Infrastructure/i)).toBeInTheDocument()
      })

      // Should see Infrastructure card
      expect(screen.getByText(/Infrastructure/i)).toBeInTheDocument()

      // Should NOT see admin-only cards
      expect(screen.queryByText(/Users & Roles/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/System/i)).not.toBeInTheDocument()
      expect(screen.queryByText(/Integrations/i)).not.toBeInTheDocument()
    })

    // AC-10: Redirect if no cards accessible
    it('should redirect to dashboard if user has no access to any cards', async () => {
      vi.mocked(useOrgContext).mockReturnValue({
        data: {
          org_id: 'org-123',
          user_id: 'user-123',
          role_code: 'viewer',
          role_name: 'Viewer',
          permissions: {},
          organization: createMockOrgContextOrganization({
            id: 'org-123',
            name: 'Test Org',
            slug: 'test-org',
            timezone: 'UTC',
            locale: 'en',
            currency: 'PLN',
            onboarding_step: 6,
            onboarding_completed_at: new Date().toISOString(),
            is_active: true,
          }),
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      const { container } = render(<SettingsPage />)

      // Should show "no access" message or redirect (check if component returns null)
      await waitFor(() => {
        expect(screen.queryByText(/Quick Access/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('Responsive Behavior', () => {
    // AC-11: Mobile layout
    it('should stack cards vertically on mobile', async () => {
      // Mock mobile viewport
      global.innerWidth = 375
      global.innerHeight = 667

      vi.mocked(useOrgContext).mockReturnValue({
        data: {
          org_id: 'org-123',
          user_id: 'user-123',
          role_code: 'admin',
          role_name: 'Administrator',
          permissions: { settings: 'CRUD' },
          organization: createMockOrgContextOrganization({
            id: 'org-123',
            name: 'Test Org',
            slug: 'test-org',
            timezone: 'UTC',
            locale: 'en',
            currency: 'PLN',
            onboarding_step: 6,
            onboarding_completed_at: new Date().toISOString(),
            is_active: true,
          }),
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: { total: 8 },
          infrastructure: { warehouses: 3 },
          master_data: { allergens: 14 },
          integrations: { api_keys: 2 },
          system: { enabled_modules: 6 },
          security: { last_login: '2026-01-04T12:30:00Z' },
        }),
      } as Response)

      render(<SettingsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Users & Roles/i)).toBeInTheDocument()
      })

      // Check that cards are in single column layout
      const cardsContainer = screen.getByTestId('quick-access-cards')
      expect(cardsContainer).toHaveClass(/grid-cols-1|flex-col/)
    })
  })

  describe('Accessibility', () => {
    // AC-12: Screen reader announcements
    it('should have proper semantic HTML and ARIA attributes', async () => {
      vi.mocked(useOrgContext).mockReturnValue({
        data: {
          org_id: 'org-123',
          user_id: 'user-123',
          role_code: 'admin',
          role_name: 'Administrator',
          permissions: { settings: 'CRUD' },
          organization: createMockOrgContextOrganization({
            id: 'org-123',
            name: 'Test Org',
            slug: 'test-org',
            timezone: 'UTC',
            locale: 'en',
            currency: 'PLN',
            onboarding_step: 6,
            onboarding_completed_at: new Date().toISOString(),
            is_active: true,
          }),
        },
        isLoading: false,
        error: null,
        refetch: vi.fn(),
      })

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          users: { total: 8 },
          infrastructure: { warehouses: 3 },
          master_data: { allergens: 14 },
          integrations: { api_keys: 2 },
          system: { enabled_modules: 6 },
          security: { last_login: '2026-01-04T12:30:00Z' },
        }),
      } as Response)

      const { container } = render(<SettingsPage />)

      await waitFor(() => {
        expect(screen.getByText(/Users & Roles/i)).toBeInTheDocument()
      })

      // Check semantic structure
      expect(container.querySelector('main')).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: /organization summary/i })).toBeInTheDocument()
      expect(screen.getByRole('heading', { level: 2, name: /quick access/i })).toBeInTheDocument()

      // Check cards have article elements
      const cards = container.querySelectorAll('article')
      expect(cards.length).toBeGreaterThan(0)
    })
  })
})

/**
 * Test Summary for Settings Landing Page
 * ========================================
 *
 * Test Coverage:
 * - Success state: Organization summary, 6 cards, recent activity, navigation
 * - Loading state: Skeletons
 * - Empty state: Setup wizard CTA, skip wizard
 * - Error state: Error message with retry
 * - Permission filtering: Role-based card visibility
 * - Responsive: Mobile layout
 * - Accessibility: Semantic HTML, ARIA
 *
 * Total: 12 test cases
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * - Settings landing page not fully implemented
 * - Dashboard stats API not implemented
 * - Audit logs API not implemented
 * - Permission filtering logic not implemented
 *
 * Next Steps for FRONTEND-DEV:
 * 1. Create apps/frontend/app/(authenticated)/settings/page.tsx
 * 2. Implement SettingsDashboard component
 * 3. Create QuickAccessCard component
 * 4. Create OrgSummaryCard component
 * 5. Create RecentActivityFeed component
 * 6. Implement GET /api/v1/settings/dashboard/stats endpoint
 * 7. Implement GET /api/v1/settings/audit-logs endpoint
 * 8. Add permission-based filtering logic
 * 9. Run tests - should transition from RED to GREEN
 *
 * Coverage Target: 80%
 */
