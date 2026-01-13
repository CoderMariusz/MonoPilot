/**
 * Unit Tests: SettingsNav Component
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 * Phase: RED - All tests should FAIL (no implementation yet)
 *
 * Tests the settings navigation sidebar component:
 * - Renders all 6 sections for admin role
 * - Filters sections for non-admin roles
 * - Shows skeleton while loading
 * - Returns null when no context
 * - Highlights active navigation item
 * - Filters items based on enabled modules
 *
 * Coverage Target: 80%
 * Test Count: 6 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SettingsNav } from '../SettingsNav'
import { useOrgContext } from '@/lib/hooks/useOrgContext'
import { usePathname } from 'next/navigation'
import { createMockOrgContextOrganization } from '@/lib/test/factories'

// Mock dependencies
vi.mock('@/lib/hooks/useOrgContext')
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

describe('SettingsNav', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePathname).mockReturnValue('/settings')
  })

  // AC-01: Admin sees all sections
  it('should render all 6 sections for admin role', () => {
    vi.mocked(useOrgContext).mockReturnValue({
      data: {
        org_id: 'org-123',
        user_id: 'user-123',
        role_code: 'admin',
        role_name: 'Administrator',
        permissions: {
          settings: 'CRUD',
          technical: 'CRUD',
          warehouse: 'CRUD',
          production: 'CRUD',
          quality: 'CRUD',
        },
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

    render(<SettingsNav />)

    // Verify all 6 sections are visible
    expect(screen.getByText('Organization')).toBeInTheDocument()
    expect(screen.getByText('Users & Roles')).toBeInTheDocument()
    expect(screen.getByText('Infrastructure')).toBeInTheDocument()
    expect(screen.getByText('Master Data')).toBeInTheDocument()
    expect(screen.getByText('Integrations')).toBeInTheDocument()
    expect(screen.getByText('System')).toBeInTheDocument()
  })

  // AC-04: Non-admin sees filtered sections
  it('should hide restricted sections for warehouse_manager', () => {
    vi.mocked(useOrgContext).mockReturnValue({
      data: {
        org_id: 'org-123',
        user_id: 'user-123',
        role_code: 'warehouse_manager',
        role_name: 'Warehouse Manager',
        permissions: {
          settings: 'R',
          warehouse: 'CRUD',
        },
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

    render(<SettingsNav />)

    // Should NOT see admin-only sections
    expect(screen.queryByText('Organization')).not.toBeInTheDocument()
    expect(screen.queryByText('Users & Roles')).not.toBeInTheDocument()

    // Should see Infrastructure section (has Warehouses)
    expect(screen.getByText('Infrastructure')).toBeInTheDocument()
    expect(screen.getByText('Warehouses')).toBeInTheDocument()
  })

  // Loading state
  it('should render skeleton while context is loading', () => {
    vi.mocked(useOrgContext).mockReturnValue({
      data: null,
      isLoading: true,
      error: null,
      refetch: vi.fn(),
    })

    render(<SettingsNav />)

    // Should render skeleton (check for skeleton test-id)
    expect(screen.getByTestId('settings-nav-skeleton')).toBeInTheDocument()
  })

  // No context
  it('should return null when no context available', () => {
    vi.mocked(useOrgContext).mockReturnValue({
      data: null,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    })

    const { container } = render(<SettingsNav />)

    expect(container.firstChild).toBeNull()
  })

  // Active state
  it('should highlight active navigation item based on pathname', () => {
    vi.mocked(usePathname).mockReturnValue('/settings/users')
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

    render(<SettingsNav />)

    // Users link should have active styling
    const usersLink = screen.getByRole('link', { name: /users/i })
    expect(usersLink).toHaveClass('bg-primary')
  })

  // AC-06: Module filtering
  it('should hide navigation items for disabled modules', () => {
    vi.mocked(useOrgContext).mockReturnValue({
      data: {
        org_id: 'org-123',
        user_id: 'user-123',
        role_code: 'admin',
        role_name: 'Administrator',
        permissions: {
          settings: 'CRUD',
          technical: 'CRUD',
          // warehouse module disabled (no permission)
        },
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

    render(<SettingsNav />)

    // Warehouse item should not be visible (module disabled)
    expect(screen.queryByText('Warehouses')).not.toBeInTheDocument()
  })
})

/**
 * Test Summary for SettingsNav Component
 * =======================================
 *
 * Test Coverage:
 * - Admin sees all sections: 1 test
 * - Non-admin filtered sections: 1 test
 * - Loading skeleton: 1 test
 * - No context null return: 1 test
 * - Active state highlighting: 1 test
 * - Module filtering: 1 test
 * - Total: 6 test cases
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * - SettingsNav component not implemented
 * - buildSettingsNavigation service not implemented
 * - SettingsNavItem component not implemented
 *
 * Next Steps for FRONTEND-DEV:
 * 1. Create components/settings/SettingsNav.tsx
 * 2. Import buildSettingsNavigation service
 * 3. Render navigation sections with filtering
 * 4. Add skeleton state for loading
 * 5. Return null when no context
 * 6. Run tests - should transition from RED to GREEN
 *
 * Files to Create:
 * - apps/frontend/components/settings/SettingsNav.tsx
 * - apps/frontend/components/settings/SettingsNavSkeleton.tsx
 *
 * Coverage Target: 80%
 */
