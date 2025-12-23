/**
 * Unit Tests: SettingsNavItem Component
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 * Phase: RED - All tests should FAIL (no implementation yet)
 *
 * Tests individual navigation item component:
 * - Renders icon and label
 * - Shows active state for current path
 * - Shows disabled state with "Soon" badge for unimplemented routes
 * - Is clickable when implemented
 *
 * Coverage Target: 80%
 * Test Count: 4 tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { SettingsNavItem } from '../SettingsNavItem'
import { Building2 } from 'lucide-react'
import { usePathname } from 'next/navigation'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  usePathname: vi.fn(),
}))

describe('SettingsNavItem', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(usePathname).mockReturnValue('/settings')
  })

  it('should render icon and label', () => {
    const item = {
      name: 'Warehouses',
      path: '/settings/warehouses',
      icon: Building2,
      implemented: true,
    }

    render(<SettingsNavItem item={item} />)

    // Verify label is rendered
    expect(screen.getByText('Warehouses')).toBeInTheDocument()

    // Verify icon exists (by checking link structure)
    const link = screen.getByRole('link')
    expect(link).toBeInTheDocument()
  })

  it('should show active state for current path', () => {
    // Mock usePathname to return '/settings/warehouses'
    vi.mocked(usePathname).mockReturnValue('/settings/warehouses')

    const item = {
      name: 'Warehouses',
      path: '/settings/warehouses',
      icon: Building2,
      implemented: true,
    }

    render(<SettingsNavItem item={item} />)

    // Should have active styling (bg-primary)
    const link = screen.getByRole('link')
    expect(link).toHaveClass('bg-primary')
  })

  // AC-05: Unimplemented routes
  it('should show disabled state with "Soon" badge for unimplemented routes', () => {
    const item = {
      name: 'Invitations',
      path: '/settings/invitations',
      icon: Building2,
      implemented: false,
    }

    render(<SettingsNavItem item={item} />)

    // Should show "Soon" badge
    expect(screen.getByText('Soon')).toBeInTheDocument()

    // Should NOT be a clickable link
    expect(screen.queryByRole('link')).not.toBeInTheDocument()

    // Should have disabled styling
    const container = screen.getByText('Invitations').closest('div')
    expect(container).toHaveClass('cursor-not-allowed')
    expect(container).toHaveClass('opacity-50')
  })

  it('should be clickable when implemented', () => {
    const item = {
      name: 'Users',
      path: '/settings/users',
      icon: Building2,
      implemented: true,
    }

    render(<SettingsNavItem item={item} />)

    const link = screen.getByRole('link', { name: /users/i })
    expect(link).toHaveAttribute('href', '/settings/users')
  })
})

/**
 * Test Summary for SettingsNavItem Component
 * ===========================================
 *
 * Test Coverage:
 * - Render icon and label: 1 test
 * - Active state: 1 test
 * - Disabled/unimplemented state: 1 test
 * - Clickable link: 1 test
 * - Total: 4 test cases
 *
 * Expected Status: ALL TESTS FAIL (RED phase)
 * - SettingsNavItem component not implemented
 *
 * Next Steps for FRONTEND-DEV:
 * 1. Create components/settings/SettingsNavItem.tsx
 * 2. Import usePathname from next/navigation
 * 3. Render Link for implemented items
 * 4. Render div with disabled styling for unimplemented items
 * 5. Apply active styling based on pathname
 * 6. Run tests - should transition from RED to GREEN
 *
 * Files to Create:
 * - apps/frontend/components/settings/SettingsNavItem.tsx
 *
 * Coverage Target: 80%
 */
