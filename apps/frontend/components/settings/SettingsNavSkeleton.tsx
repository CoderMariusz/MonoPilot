/**
 * SettingsNavSkeleton Component
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 *
 * Loading skeleton for settings navigation sidebar.
 *
 * Displayed while organization context is loading.
 */

import { Skeleton } from '@/components/ui/skeleton'

/**
 * Skeleton loader for navigation sidebar
 *
 * Shows 3 sections with 2 items each to match expected layout.
 */
export function SettingsNavSkeleton() {
  return (
    <div
      className="w-64 border-r bg-muted/10 p-4 space-y-6"
      data-testid="settings-nav-skeleton"
    >
      {[1, 2, 3].map((section) => (
        <div key={section} className="space-y-2">
          {/* Section header */}
          <Skeleton className="h-4 w-24" />
          {/* Nav items */}
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  )
}
