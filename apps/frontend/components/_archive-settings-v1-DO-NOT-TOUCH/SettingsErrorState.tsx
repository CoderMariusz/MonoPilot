/**
 * SettingsErrorState Component
 * Story: 01.2 - Settings Shell: Navigation + Role Guards
 *
 * Error state for settings navigation when context fails to load.
 *
 * Displays error message with retry button for recovery.
 */

import { AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SettingsErrorStateProps {
  error: Error
  onRetry?: () => void
}

/**
 * Error state component for settings navigation
 *
 * Shows when organization context fails to load.
 * Includes retry button for recovery.
 *
 * @example
 * ```typescript
 * <SettingsErrorState
 *   error={new Error('Failed to load')}
 *   onRetry={() => refetch()}
 * />
 * ```
 */
export function SettingsErrorState({
  error,
  onRetry,
}: SettingsErrorStateProps) {
  return (
    <div
      className="w-64 border-r bg-muted/10 p-4 flex flex-col items-center justify-center h-[300px] text-center"
      data-testid="settings-error-state"
    >
      <AlertCircle className="h-10 w-10 text-destructive mb-3" />
      <h3 className="text-sm font-semibold mb-1">Failed to Load Navigation</h3>
      <p className="text-xs text-muted-foreground mb-3 max-w-[200px]">
        {error.message || 'An unexpected error occurred'}
      </p>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  )
}
