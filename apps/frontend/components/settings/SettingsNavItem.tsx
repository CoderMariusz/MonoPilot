/**
 * SettingsNavItem Component
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 *
 * Individual navigation item with:
 * - Active state based on current path
 * - Disabled state for unimplemented routes
 * - Icon + label layout
 *
 * Performance: Memoized to prevent unnecessary re-renders.
 */

'use client'

import React, { memo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import type { NavigationItem } from '@/lib/services/settings-navigation-service'

interface SettingsNavItemProps {
  item: NavigationItem
}

/**
 * Navigation item component
 *
 * Renders as Link if implemented, or disabled div if not.
 * Shows "Soon" badge for unimplemented routes.
 *
 * Wrapped with React.memo for performance optimization - prevents
 * unnecessary re-renders when navigation section re-renders.
 *
 * @example
 * ```typescript
 * <SettingsNavItem
 *   item={{
 *     name: 'Users',
 *     path: '/settings/users',
 *     icon: Users,
 *     implemented: true
 *   }}
 * />
 * ```
 */
export const SettingsNavItem = memo(function SettingsNavItem({
  item,
}: SettingsNavItemProps) {
  const pathname = usePathname()
  const isActive = pathname === item.path
  const Icon = item.icon

  // AC-05: Unimplemented routes show disabled state with "Soon" badge
  if (!item.implemented) {
    return (
      <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground cursor-not-allowed opacity-50" aria-disabled="true">
        <Icon className="h-4 w-4" />
        <span>{item.name}</span>
        <span className="ml-auto text-xs">Soon</span>
      </div>
    )
  }

  return (
    <Link
      href={item.path}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        'flex items-center gap-3 px-3 py-2 text-sm rounded-md transition-colors',
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className="h-4 w-4" />
      <span>{item.name}</span>
    </Link>
  )
})
