/**
 * SetupInProgressMessage Component
 * Story: 01.3 - Onboarding Wizard Launcher (TD-102)
 *
 * Alert message shown to non-admin users when organization
 * setup is still in progress.
 *
 * Features:
 * - Informative alert with icon
 * - Explains that admin is setting up organization
 * - Indicates some features may be limited
 * - Accessible with proper ARIA role
 *
 * @see SET-001 wireframe specification
 */

'use client'

import { Info } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

interface SetupInProgressMessageProps {
  /** Custom class name for styling */
  className?: string
}

/**
 * SetupInProgressMessage
 *
 * Displays an informational alert for non-admin users
 * when organization onboarding is still in progress.
 *
 * @param className - Optional CSS class for styling
 *
 * @example
 * // Conditionally show on dashboard
 * {!isAdmin && isOnboardingInProgress && (
 *   <SetupInProgressMessage />
 * )}
 */
export function SetupInProgressMessage({ className }: SetupInProgressMessageProps) {
  return (
    <Alert className={className}>
      <Info className="h-4 w-4" aria-hidden="true" />
      <AlertTitle>Organization Setup in Progress</AlertTitle>
      <AlertDescription>
        Your administrator is currently setting up the organization.
        Some features may be limited until setup is complete.
      </AlertDescription>
    </Alert>
  )
}
