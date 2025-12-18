/**
 * SettingsEmptyState Component
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 *
 * Coming soon state for unimplemented settings routes.
 *
 * Used when a navigation item is not yet implemented.
 */

import { Construction } from 'lucide-react'

interface SettingsEmptyStateProps {
  title: string
  description?: string
}

/**
 * Empty state component for unimplemented routes
 *
 * @example
 * ```typescript
 * <SettingsEmptyState
 *   title="Invitations"
 *   description="User invitation management is coming soon."
 * />
 * ```
 */
export function SettingsEmptyState({
  title,
  description,
}: SettingsEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] text-center">
      <Construction className="h-12 w-12 text-muted-foreground mb-4" />
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md">
        {description || 'This feature is coming soon. Check back later!'}
      </p>
    </div>
  )
}
