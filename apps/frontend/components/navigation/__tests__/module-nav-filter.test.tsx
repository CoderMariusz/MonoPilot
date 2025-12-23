/**
 * Module Navigation Filter Tests
 * Story: 01.7 Module Toggles
 * Epic: 01-settings
 * Type: Component Tests
 * Status: RED (Tests will fail until implementation exists)
 *
 * Tests navigation filtering based on enabled modules:
 * - useEnabledModules() hook returns correct list
 * - Navigation shows only enabled modules
 * - Settings always visible
 * - Disabled modules hidden from nav
 * - Navigation updates when module toggled
 *
 * Related Story: docs/2-MANAGEMENT/epics/current/01-settings/01.7.module-toggles.md
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { useEnabledModules } from '@/lib/hooks/use-enabled-modules'
import { NavigationSidebar } from '@/components/navigation/NavigationSidebar'
import { renderHook } from '@testing-library/react'

/**
 * Mock Supabase client
 */
const mockSupabaseClient = {
  from: vi.fn(),
  auth: {
    getUser: vi.fn(() =>
      Promise.resolve({
        data: { user: { id: 'user-123' } },
        error: null,
      })
    ),
  },
}

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => mockSupabaseClient,
}))

/**
 * Mock navigation items
 */
const mockNavItems = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: 'Home',
    module: null, // Always visible
  },
  {
    name: 'Settings',
    href: '/settings',
    icon: 'Settings',
    module: 'settings',
  },
  {
    name: 'Technical',
    href: '/technical',
    icon: 'Wrench',
    module: 'technical',
  },
  {
    name: 'Planning',
    href: '/planning',
    icon: 'Calendar',
    module: 'planning',
  },
  {
    name: 'Production',
    href: '/production',
    icon: 'Factory',
    module: 'production',
  },
  {
    name: 'Quality',
    href: '/quality',
    icon: 'CheckCircle',
    module: 'quality',
  },
  {
    name: 'Warehouse',
    href: '/warehouse',
    icon: 'Package',
    module: 'warehouse',
  },
  {
    name: 'Shipping',
    href: '/shipping',
    icon: 'Truck',
    module: 'shipping',
  },
]

describe('useEnabledModules() hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should return list of enabled modules for org', async () => {
    // GIVEN org has settings and technical enabled
    mockSupabaseClient.from = vi.fn((table) => {
      if (table === 'organization_modules') {
        return {
          select: vi.fn(() => ({
            eq: vi.fn(() => ({
              eq: vi.fn(() =>
                Promise.resolve({
                  data: [
                    { module_code: 'settings', enabled: true },
                    { module_code: 'technical', enabled: true },
                    { module_code: 'planning', enabled: false },
                    { module_code: 'production', enabled: false },
                    { module_code: 'quality', enabled: false },
                    { module_code: 'warehouse', enabled: false },
                    { module_code: 'shipping', enabled: false },
                  ],
                  error: null,
                })
              ),
            })),
          })),
        }
      }
    })

    // WHEN using hook
    const { result } = renderHook(() => useEnabledModules())

    // THEN enabled modules list is returned
    await waitFor(() => {
      expect(result.current.enabledModules).toContain('settings')
      expect(result.current.enabledModules).toContain('technical')
      expect(result.current.enabledModules).not.toContain('planning')
    })
  })

  it('should always include settings module in enabled list', async () => {
    mockSupabaseClient.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: [{ module_code: 'settings', enabled: true }],
              error: null,
            })
          ),
        })),
      })),
    }))

    const { result } = renderHook(() => useEnabledModules())

    await waitFor(() => {
      expect(result.current.enabledModules).toContain('settings')
    })
  })

  it('should return empty loading state initially', () => {
    mockSupabaseClient.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => new Promise(() => {})), // Never resolves
        })),
      })),
    }))

    const { result } = renderHook(() => useEnabledModules())

    expect(result.current.loading).toBe(true)
    expect(result.current.enabledModules).toEqual([])
  })

  it('should update when modules are toggled', async () => {
    let moduleData = [
      { module_code: 'settings', enabled: true },
      { module_code: 'technical', enabled: true },
      { module_code: 'planning', enabled: false },
    ]

    mockSupabaseClient.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: moduleData,
              error: null,
            })
          ),
        })),
      })),
    }))

    const { result, rerender } = renderHook(() => useEnabledModules())

    await waitFor(() => {
      expect(result.current.enabledModules).toHaveLength(2)
    })

    // Simulate enabling planning module
    moduleData = [
      { module_code: 'settings', enabled: true },
      { module_code: 'technical', enabled: true },
      { module_code: 'planning', enabled: true },
    ]

    rerender()

    await waitFor(() => {
      expect(result.current.enabledModules).toHaveLength(3)
      expect(result.current.enabledModules).toContain('planning')
    })
  })
})

describe('NavigationSidebar - Module Filtering', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should show only enabled modules in navigation', async () => {
    // GIVEN settings and technical enabled
    mockSupabaseClient.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: [
                { module_code: 'settings', enabled: true },
                { module_code: 'technical', enabled: true },
                { module_code: 'planning', enabled: false },
              ],
              error: null,
            })
          ),
        })),
      })),
    }))

    // WHEN rendering navigation
    render(<NavigationSidebar navItems={mockNavItems} />)

    // THEN only enabled modules appear
    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Technical')).toBeInTheDocument()
      expect(screen.queryByText('Planning')).not.toBeInTheDocument()
    })
  })

  it('should always show settings module in navigation', async () => {
    mockSupabaseClient.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: [{ module_code: 'settings', enabled: true }],
              error: null,
            })
          ),
        })),
      })),
    }))

    render(<NavigationSidebar navItems={mockNavItems} />)

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
  })

  it('should always show non-module items (like Dashboard)', async () => {
    mockSupabaseClient.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: [{ module_code: 'settings', enabled: true }],
              error: null,
            })
          ),
        })),
      })),
    }))

    render(<NavigationSidebar navItems={mockNavItems} />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  it('should hide disabled modules from navigation', async () => {
    mockSupabaseClient.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: [
                { module_code: 'settings', enabled: true },
                { module_code: 'technical', enabled: true },
                { module_code: 'planning', enabled: false },
                { module_code: 'production', enabled: false },
                { module_code: 'quality', enabled: false },
                { module_code: 'warehouse', enabled: false },
                { module_code: 'shipping', enabled: false },
              ],
              error: null,
            })
          ),
        })),
      })),
    }))

    render(<NavigationSidebar navItems={mockNavItems} />)

    await waitFor(() => {
      expect(screen.queryByText('Planning')).not.toBeInTheDocument()
      expect(screen.queryByText('Production')).not.toBeInTheDocument()
      expect(screen.queryByText('Quality')).not.toBeInTheDocument()
      expect(screen.queryByText('Warehouse')).not.toBeInTheDocument()
      expect(screen.queryByText('Shipping')).not.toBeInTheDocument()
    })
  })

  it('should show all modules when all are enabled', async () => {
    mockSupabaseClient.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: [
                { module_code: 'settings', enabled: true },
                { module_code: 'technical', enabled: true },
                { module_code: 'planning', enabled: true },
                { module_code: 'production', enabled: true },
                { module_code: 'quality', enabled: true },
                { module_code: 'warehouse', enabled: true },
                { module_code: 'shipping', enabled: true },
              ],
              error: null,
            })
          ),
        })),
      })),
    }))

    render(<NavigationSidebar navItems={mockNavItems} />)

    await waitFor(() => {
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.getByText('Technical')).toBeInTheDocument()
      expect(screen.getByText('Planning')).toBeInTheDocument()
      expect(screen.getByText('Production')).toBeInTheDocument()
      expect(screen.getByText('Quality')).toBeInTheDocument()
      expect(screen.getByText('Warehouse')).toBeInTheDocument()
      expect(screen.getByText('Shipping')).toBeInTheDocument()
    })
  })

  it('should update navigation when module is enabled', async () => {
    let moduleData = [
      { module_code: 'settings', enabled: true },
      { module_code: 'technical', enabled: true },
      { module_code: 'planning', enabled: false },
    ]

    mockSupabaseClient.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: moduleData,
              error: null,
            })
          ),
        })),
      })),
    }))

    const { rerender } = render(<NavigationSidebar navItems={mockNavItems} />)

    await waitFor(() => {
      expect(screen.queryByText('Planning')).not.toBeInTheDocument()
    })

    // Simulate enabling planning
    moduleData = [
      { module_code: 'settings', enabled: true },
      { module_code: 'technical', enabled: true },
      { module_code: 'planning', enabled: true },
    ]

    rerender(<NavigationSidebar navItems={mockNavItems} />)

    await waitFor(() => {
      expect(screen.getByText('Planning')).toBeInTheDocument()
    })
  })

  it('should update navigation when module is disabled', async () => {
    let moduleData = [
      { module_code: 'settings', enabled: true },
      { module_code: 'technical', enabled: true },
      { module_code: 'warehouse', enabled: true },
    ]

    mockSupabaseClient.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: moduleData,
              error: null,
            })
          ),
        })),
      })),
    }))

    const { rerender } = render(<NavigationSidebar navItems={mockNavItems} />)

    await waitFor(() => {
      expect(screen.getByText('Warehouse')).toBeInTheDocument()
    })

    // Simulate disabling warehouse
    moduleData = [
      { module_code: 'settings', enabled: true },
      { module_code: 'technical', enabled: true },
      { module_code: 'warehouse', enabled: false },
    ]

    rerender(<NavigationSidebar navItems={mockNavItems} />)

    await waitFor(() => {
      expect(screen.queryByText('Warehouse')).not.toBeInTheDocument()
    })
  })
})

describe('Navigation Filtering - Edge Cases', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should handle case when no modules are enabled except settings', async () => {
    mockSupabaseClient.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: [
                { module_code: 'settings', enabled: true },
                { module_code: 'technical', enabled: false },
                { module_code: 'planning', enabled: false },
                { module_code: 'production', enabled: false },
                { module_code: 'quality', enabled: false },
                { module_code: 'warehouse', enabled: false },
                { module_code: 'shipping', enabled: false },
              ],
              error: null,
            })
          ),
        })),
      })),
    }))

    render(<NavigationSidebar navItems={mockNavItems} />)

    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
      expect(screen.queryByText('Technical')).not.toBeInTheDocument()
    })
  })

  it('should handle database error gracefully', async () => {
    mockSupabaseClient.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: null,
              error: { message: 'Database error' },
            })
          ),
        })),
      })),
    }))

    render(<NavigationSidebar navItems={mockNavItems} />)

    // Should show at least non-module items
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })
  })

  it('should handle missing organization_modules records', async () => {
    mockSupabaseClient.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() =>
            Promise.resolve({
              data: [], // No records
              error: null,
            })
          ),
        })),
      })),
    }))

    render(<NavigationSidebar navItems={mockNavItems} />)

    // Should show non-module items and settings by default
    await waitFor(() => {
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Settings')).toBeInTheDocument()
    })
  })
})
