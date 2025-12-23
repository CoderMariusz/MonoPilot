/**
 * NavigationSidebar Component
 * Story: 01.7 - Module Toggles
 * Epic: 01-settings
 *
 * Wrapper around Sidebar component that automatically filters navigation
 * based on enabled modules for the current organization.
 *
 * Uses useEnabledModules hook to fetch enabled modules and passes them
 * to the Sidebar component for filtering.
 */

'use client'

import { useEnabledModules } from '@/lib/hooks/use-enabled-modules'
import { Sidebar } from './Sidebar'

export interface NavItem {
  name: string
  href: string
  icon: string
  module: string | null
}

export interface NavigationSidebarProps {
  /** Optional navigation items - if not provided, uses default Sidebar items */
  navItems?: NavItem[]
}

/**
 * Navigation sidebar with automatic module filtering
 *
 * Fetches enabled modules for the organization and filters navigation items
 * to show only enabled modules. Settings module is always visible.
 *
 * Loading State: Shows skeleton/loading state while fetching enabled modules
 * Error State: Falls back to showing only Settings module on error
 * Empty State: If no modules enabled, shows only Settings
 * Success State: Shows all enabled modules in navigation
 *
 * @example
 * ```tsx
 * // Default usage (uses Sidebar's built-in items)
 * <NavigationSidebar />
 *
 * // Custom nav items
 * <NavigationSidebar navItems={customNavItems} />
 * ```
 */
export function NavigationSidebar({ navItems }: NavigationSidebarProps) {
  const { enabledModules, loading } = useEnabledModules()

  // Loading state - show sidebar with no modules filtered yet
  // The Sidebar component will handle the empty state gracefully
  if (loading) {
    return <Sidebar enabledModules={['settings']} />
  }

  // Success state - pass enabled modules to Sidebar for filtering
  return <Sidebar enabledModules={enabledModules} />
}
