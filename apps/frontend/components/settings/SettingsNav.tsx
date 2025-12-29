/**
 * SettingsNav Component
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 *
 * Navigation sidebar with section groupings.
 *
 * Features:
 * - Vertical sidebar with icons and section headers
 * - Active state highlighting
 * - Permission-based filtering
 * - Module toggle filtering
 * - Loading skeleton state
 * - Error state with retry capability
 */

'use client'

import { useOrgContext } from '@/lib/hooks/useOrgContext'
import { buildSettingsNavigation } from '@/lib/services/settings-navigation-service'
import { SettingsNavItem } from './SettingsNavItem'
import { SettingsNavSkeleton } from './SettingsNavSkeleton'
import { SettingsErrorState } from './SettingsErrorState'

/**
 * Settings navigation sidebar component
 *
 * Automatically filters navigation based on:
 * - User's role (from org context)
 * - Enabled modules (from permissions)
 *
 * @example
 * ```typescript
 * // In settings layout
 * <div className="flex">
 *   <SettingsNav />
 *   <main>{children}</main>
 * </div>
 * ```
 */
export function SettingsNav() {
  const { data: context, isLoading, error, refetch } = useOrgContext()

  // Loading state
  if (isLoading) {
    return <SettingsNavSkeleton />
  }

  // Error state with retry capability
  if (error) {
    return <SettingsErrorState error={error} onRetry={refetch} />
  }

  // No context (edge case)
  if (!context) {
    return null
  }

  // Build navigation based on role and enabled modules
  const navigation = buildSettingsNavigation(context)

  return (
    <nav className="w-52 border-r bg-muted/10 p-4">
      {navigation.map((section) => (
        <div key={section.section} className="mb-6">
          <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">
            {section.section}
          </h3>
          <div className="space-y-1">
            {section.items.map((item) => (
              <SettingsNavItem key={item.path} item={item} />
            ))}
          </div>
        </div>
      ))}
    </nav>
  )
}
